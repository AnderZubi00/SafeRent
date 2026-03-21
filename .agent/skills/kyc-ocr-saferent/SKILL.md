---
name: kyc-ocr-saferent
description: >
  Server-side KYC pipeline for SafeRent: /api/kyc/analizar route, GPT-4o OCR,
  TD1 MRZ parsing with ICAO 9303 check digits, scoring logic, and kyc_sesiones QR session flow.
  Trigger: KYC, verificación identidad, DNI, OCR, MRZ, kyc_sesiones, analizar, check digit, scoring, ICAO.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Adding or modifying `/api/kyc/analizar` or `/api/kyc/completar`
- Changing MRZ parsing, check digit validation, or scoring logic
- Touching `kyc_sesiones` table, the QR mobile flow, or Supabase Realtime polling
- Debugging OCR drift, BAC key mismatches, or incorrect identity rejections
- Any task involving `numero_soporte`, `cd_ok`, NFC bonus scoring

---

## Critical Patterns

### 1. Route modes — `/api/kyc/analizar`

| `?mode=` | FormData fields | Handler |
|----------|-----------------|---------|
| `completo` | `frente` (File) + `reverso` (File) | `analyzeCompleto()` — both sides in one GPT call, full ICAO validation |
| `mrz` | `documento` (File) + optional `?soporte=` hint | `analyzeMrz()` — fast path, checks soporte cross-validation |
| _(none, FormData)_ | `documento` (File) | `analyzeMobile()` — single-side mobile flow |
| _(none, JSON)_ | `imagen_url` OR `imagen_base64` | `analyzeWeb()` — legacy, uses `gpt-4o-mini`, returns legacy format |

**Always use `mode=completo` for new integrations.** `analyzeWeb()` is the legacy path and uses a weaker model.

### 2. `OcrResult` shape (completo / mobile response)

```typescript
{
  recomendacion: "APROBAR" | "REVISAR_MANUAL" | "RECHAZAR",
  safe_score: number,          // 0–75 from OCR; NFC client adds up to +20
  cd_ok: boolean,              // dobValid && expiryValid (ICAO check digits pass)
  mrz_debug: {
    linea1: string,            // cleaned line 1 (A-Z0-9< only)
    linea2: string,            // cleaned line 2
    dobValid: boolean,
    expiryValid: boolean,
    dobCd: number,
    expiryCd: number,
    dob: string,               // YYMMDD parsed from MRZ
    expiry: string,            // YYMMDD parsed from MRZ
    soporteValid: boolean,     // ICAO check digit on numero_soporte passes
  },
  datos_extraidos: {
    numero_soporte: string,    // 9-char MRZ doc number (CHxxxxxxx) — NOT numero_documento
    numero_documento: string,  // visible NIE/DNI (49577656Y)
    fecha_nacimiento: string,  // YYMMDD
    fecha_expiracion: string,  // YYMMDD
    nombre: string,
    apellidos: string,
  },
  tipo_documento: "DNI" | "NIE" | "Pasaporte" | "Desconocido",
}
```

### 3. MRZ parsing — ALWAYS parse in code, not from GPT fields

Ask GPT to transcribe `mrz_linea1` and `mrz_linea2` verbatim, then parse positions in code:

```typescript
// Line 1 — TD1 Spanish DNI structure:
// IDESP + numero_soporte(9) + CD + ...
const clean1 = line1.replace(/[^A-Z0-9<]/g, "").slice(0, 30);
const soporteFromLine1 = clean1.length >= 15 ? clean1.substring(5, 14) : "";
const soporteCd        = clean1.length >= 15 ? parseInt(clean1[14]) : -1;
const soporteValid     = soporteFromLine1.length === 9
  && !isNaN(soporteCd) && mrzCheckDigit(soporteFromLine1) === soporteCd;
// Code-parsed value wins when valid; fall back to GPT field extraction when not
const soporte = soporteValid ? soporteFromLine1 : (parsed.datos_extraidos?.numero_soporte ?? "");

// Line 2 — DOB at [0..5], CD at [6], sex at [7], expiry at [8..13], CD at [14]
const clean2 = line2.replace(/[^A-Z0-9<]/g, "").slice(0, 30);
const dobFromLine  = clean2.length >= 7  ? clean2.substring(0, 6)  : "";
const expFromLine  = clean2.length >= 15 ? clean2.substring(8, 14) : "";
const dobCd        = clean2.length >= 7  ? parseInt(clean2[6])  : -1;
const expiryCd     = clean2.length >= 15 ? parseInt(clean2[14]) : -1;
const dobValid     = dobFromLine.length === 6 && !isNaN(dobCd)    && mrzCheckDigit(dobFromLine) === dobCd;
const expiryValid  = expFromLine.length === 6 && !isNaN(expiryCd) && mrzCheckDigit(expFromLine) === expiryCd;
```

### 4. ICAO 9303 check digit (mandatory — do not skip)

```typescript
function mrzCheckDigit(str: string): number {
  const weights = [7, 3, 1];
  const val = (c: string): number => {
    if (c >= "0" && c <= "9") return parseInt(c);
    if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
    return 0; // '<' and everything else = 0
  };
  return str.split("").reduce((sum, c, i) => sum + val(c) * weights[i % 3], 0) % 10;
}
```

- Validated fields: `numero_soporte` (line 1, pos 5–13, CD at pos 14), DOB (line 2, pos 0–5, CD at 6), expiry (line 2, pos 8–13, CD at 14)
- `cd_ok = dobValid && expiryValid` — soporte validity is SEPARATE from `cd_ok`

### 5. Code-controlled scoring and recomendacion

**CODE determines `recomendacion` — not GPT's field**, to avoid GPT conservative defaults:

```typescript
const recomendacion = (() => {
  if (!parseOk && !hasDni) return "RECHAZAR";
  if (!hasDni) return "REVISAR_MANUAL";
  if (dobValid && expiryValid) return "APROBAR";
  return "REVISAR_MANUAL";
})();

const safe_score = (() => {
  if (recomendacion === "RECHAZAR")      return Math.min(parsed.safe_score ?? 0, 29);
  if (recomendacion === "REVISAR_MANUAL") return Math.min(parsed.safe_score ?? 40, 54);
  return Math.min(parsed.safe_score ?? 60, 75);  // APROBAR cap
})();
```

**Scoring thresholds:**

| Range | Meaning |
|-------|---------|
| 0–29 | RECHAZAR |
| 30–54 | REVISAR_MANUAL |
| 55–75 | APROBAR (OCR cap) |
| +20 | NFC bonus (added by mobile client when BAC handshake succeeds) |
| 95 | Absolute maximum |

`cd_ok = true` → score ≥ 50. `cd_ok = false` → score < 50 and should block NFC BAC attempt.

### 6. `kyc_sesiones` table — QR mobile flow

Triggered when tenant clicks "Continuar en Móvil" on web.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `usuario_id` | uuid | FK → auth.users |
| `token` | uuid | Sent via deep link to mobile |
| `estado` | text | `pending` → `completado` \| `expirado` |
| `resultado` | jsonb | `OcrResult` stored on completion |
| `expires_at` | timestamptz | Typically 15 min from creation |

**Web side:** Creates row, then subscribes via Supabase Realtime on that row's `estado` change.

**Mobile side:** Receives token in deep link → POSTs result to `/api/kyc/completar` → route updates `kyc_sesiones.estado = 'completado'` and writes `resultado`.

### 7. GPT prompt requirements (non-negotiable)

- Always ask GPT to transcribe `mrz_linea1` AND `mrz_linea2` verbatim — GPT will NOT include them unless explicitly asked
- `store: false` on every `openai.chat.completions.create` call — user documents must never be stored
- Use `detail: "high"` for DNI images — low detail misses MRZ characters
- Strip markdown fences before `JSON.parse`: `.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()`
- For `analyzeCompleto`: also strip stray leading/trailing chars with `raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1)` before parsing

---

## Common Pitfalls

| Pitfall | Consequence | Fix |
|---------|-------------|-----|
| Using `numero_documento` where `numero_soporte` is needed | SW=6300 error on NFC BAC | `numero_soporte` is the 9-char MRZ code (e.g. `CHD193049`); `numero_documento` is the visible NIE/DNI (e.g. `49577656Y`) |
| Trusting GPT field extraction for `fecha_expiracion` | Wrong expiry date, BAC failure | Always parse from `mrz_linea2` positions 8–13 in code |
| Skipping ICAO check digit | Silent OCR errors accepted | Always run `mrzCheckDigit` before trusting any MRZ value |
| `cd_ok` covers soporte | Wrong NFC pre-check | `cd_ok` = dobValid && expiryValid ONLY; check `mrz_debug.soporteValid` separately for BAC |
| GPT OCR drift across calls | Inconsistent MRZ transcription | Each GPT call may return slightly different chars — always re-validate with ICAO on every call |
| Logging signed document URLs | Privacy breach | Signed URLs must never appear in logs or be sent to client outside authenticated server context |

---

## Key Source Files

```
src/app/api/kyc/analizar/route.ts   — OCR pipeline (primary source of truth)
src/app/api/kyc/completar/route.ts  — QR session completion endpoint
```

---

## Security Constraints

- All AI (OpenAI) calls go through the enterprise API only — never consumer interfaces
- `store: false` is mandatory on every OpenAI call
- Signed storage URLs must never be logged or exposed outside server context
- Before touching this module: `mem_search("saferent:kyc")` to recover prior decisions
- After completing non-trivial changes: `mem_save` with `topic_key: "saferent:kyc"`
