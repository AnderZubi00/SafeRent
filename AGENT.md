# AGENT.md — SafeRent AI Orchestration Router

> This file is the single entry point for AI-assisted development on SafeRent.
> It routes tasks to the right skill modules and enforces project guardrails.
> For stack/architecture details, see **CLAUDE.md** (do not duplicate content here).

---

## 1. Skill Loading Rules (Triggers)

Read the linked skill file **before starting** when a task matches these triggers.

### UI / Visual Design
**Triggers:** UI components, visual design, layout, colors, typography, animations, Framer Motion wrappers, new pages/screens, design systems, component aesthetics.

```
→ READ FIRST: .agent/skills/frontend-design/SKILL.md
```

### Propietario / Viviendas / Location
**Triggers:** viviendas CRUD, publicar, editar propiedad, toggle visible/pausada, photo upload, location selector, provincia/ciudad, address validation, propietario dashboard, `actualizarViviendaLocal`.

```
→ READ FIRST: .agent/skills/saferent-architecture/SKILL.md (Location System section)
→ KEY FILES:
  - src/lib/viviendas.ts — CRUD + actualizarVivienda (careful with fotos param)
  - src/components/forms/LocationSelector.tsx — cascading provincia/ciudad
  - src/data/spain-locations.ts — static province/city data
  - src/lib/address-validation.ts — Nominatim geocoding
  - src/context/PropietarioContext.tsx — actualizarViviendaLocal for optimistic updates
  - src/app/(propietario)/propietario/actions.ts — server actions (toggle, accept, reject)
```

### Next.js / React / Performance / Deployment
**Triggers:** React components, Next.js pages, App Router patterns, Server Components, data fetching, bundle optimization, API routes, Vercel deployment, hydration, caching.

```
→ READ FIRST: .agent/skills/vercel-react-best-practices/SKILL.md
```

### Architecture / Route Structure / Context / Types
**Triggers:** nueva página, nuevo route group, nuevo context provider, path aliases, tipos compartidos, estructura de carpetas.

```
→ READ FIRST: .agent/skills/saferent-architecture/SKILL.md
```

### KYC / OCR / MRZ / Identity Verification
**Triggers:** KYC, verificación identidad, DNI, OCR, MRZ, kyc_sesiones, analizar, check digit, scoring, ICAO, numero_soporte, BAC, NFC.

```
→ READ FIRST: .agent/skills/kyc-ocr-saferent/SKILL.md
→ EXECUTE mem_search("saferent:kyc") before starting
→ EXECUTE mem_save after completing (see Section 3 for format)
```

### Architectural / Security-Sensitive Modules
**Triggers:** auth, Stripe Connect, Supabase schema changes, Signaturit integration, escrow logic, RLS policies, role-based access control.

```
→ EXECUTE mem_search("saferent:[topic]") before starting
→ EXECUTE mem_save after completing (see Section 3 for format)
```

> **Note:** `mem_save` / `mem_search` require the Engram MCP server to be configured.
> See Section 3 for setup instructions.

### Structural / Multi-file Changes
**Triggers:** new features, new route groups, schema migrations, refactors touching 3+ files, new context providers, new API endpoints.

```
→ ENTER Plan Mode. Define spec (SDD) before generating any code.
```

---

## 2. SafeRent Project Context

**PropTech 2026** — short-term rental platform for the Spanish market.

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) + Magic UI |
| Backend API | NestJS 11 (via src/lib/api.ts) |
| Auth & Storage | Supabase (Auth state + Storage URLs only) |
| Payments | Stripe Connect (escrow model) |
| Contracts | Signaturit (digital signature) + PDF generation |
| Animations | Framer Motion via `src/components/motion/` |
| Icons | Lucide React |
| Deployment | Vercel |

**Brand palette:**
- Primary: `indigo-600` (#4F46E5)
- Background dark: `slate-950` (#020617)
- Success / confirm: `emerald-500` (#10B981)

**User roles:** `INQUILINO` (tenant) · `PROPIETARIO` (landlord) · `ADMINISTRADOR`

**Core business flow:**
1. Tenant applies → uploads KYC + temporality docs → data flows through NestJS backend (files to `documentos-solicitud` bucket)
2. Landlord accepts/rejects via `/propietario/solicitudes`
3. Acceptance triggers PDF contract (in `$transaction` — atomic) → Signaturit signature flow
4. Payment via Stripe PaymentIntent + Elements → webhook confirms → pago COMPLETADO
5. Real-time updates via Socket.io WebSocket (`/notifications`) + polling fallback

→ Full architecture detail: **CLAUDE.md**

---

## 3. Engram Memory Protocol

Engram is used to persist cross-session knowledge about SafeRent's architectural decisions.

### Setup (required once)

Add to `~/.claude/settings.json` or project `.claude/settings.json`:

```json
{
  "mcpServers": {
    "engram": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/engram-mcp"]
    }
  }
}
```

Once configured, the tools `mem_save` and `mem_search` become available in MCP sessions.

### When to use

| Action | When |
|--------|------|
| `mem_search("saferent:[module]")` | Before starting any architectural or security-sensitive task |
| `mem_save(...)` | After completing such a task with a non-obvious decision |

### Search key convention

```
saferent:auth       — auth, session, middleware
saferent:kyc        — document upload, identity verification
saferent:stripe     — payments, escrow, Connect
saferent:contracts  — PDF generation, Signaturit
saferent:schema     — Supabase tables, RLS policies, migrations
saferent:roles      — INQUILINO / PROPIETARIO / ADMINISTRADOR access logic
saferent:viviendas  — property CRUD, photos, location, toggle active/paused
saferent:propietario — propietario dashboard, vivienda management, optimistic updates
```

### mem_save format

```json
{
  "what": "one-line description of what was done or decided",
  "why": "technical reason, constraint, or tradeoff",
  "where": ["src/lib/contratos.ts", "src/app/(inquilino)/checkout/"],
  "learned": "key insight for future sessions — what to avoid or repeat"
}
```

**Example:**
```json
{
  "what": "Added RLS policy on solicitudes to restrict tenant read to own rows",
  "why": "Supabase default allows any authenticated user to read all rows; role check not enough",
  "where": ["supabase/migrations/20260315_rls_solicitudes.sql"],
  "learned": "Always add RLS at migration time, not as an afterthought — retrofitting breaks existing queries"
}
```

---

## 4. SafeRent Guardrails

These are non-negotiable constraints for all AI-assisted work on this project.

### Privacy
- User documents (KYC scans, signed contracts) are **never** used for model training.
- All AI API calls go through the **enterprise API only** — no consumer Claude.ai uploads.
- Do not log or display raw document URLs outside of authenticated server contexts.

### SDD-First
- For any structural change (new feature, new route, schema migration), **enter Plan Mode** and define a spec before generating code.
- "Move fast" is not a justification for skipping the plan step on multi-file changes.

### No Hallucinated APIs
- Only use documented endpoints:
  - **Supabase:** official JS client (`@supabase/supabase-js`)
  - **Stripe:** official Node SDK (`stripe`)
  - **Signaturit:** documented REST API only
  - **Resend:** documented SDK only
- Do not invent method names. If unsure, check docs via `mcp__claude_ai_Context7__query-docs`.

### Role Isolation
- **Never** mix `INQUILINO` / `PROPIETARIO` / `ADMINISTRADOR` data in a single query.
- Each role's context (`InquilinoContext`, `PropietarioContext`) must only expose data for that role.
- RLS policies in Supabase are the enforcement layer — always verify they exist before shipping.

### Component Conventions
- Animations → `src/components/motion/` wrappers (`MotionFadeInUp`, `MotionStagger`, `MotionCard`)
- UI primitives → `src/components/ui/` (shadcn/ui only — do not add raw Radix imports elsewhere)
- Layout → `Sidebar`, `TopBar`, `SidebarWrapper` from `src/components/layout/`

---

## 5. Quick Reference

### Skill files
```
.agent/skills/saferent-architecture/SKILL.md        — route groups, contexts, types, path aliases
.agent/skills/frontend-design/SKILL.md              — UI, shadcn, Magic UI, animaciones
.agent/skills/vercel-react-best-practices/SKILL.md  — Next.js, React, data fetching, performance
.agent/skills/supabase-saferent/SKILL.md            — queries, RLS, storage, auth, realtime
.agent/skills/stripe-connect-saferent/SKILL.md      — pagos, escrow, webhooks
.agent/skills/saferent-business-rules/SKILL.md      — lifecycle solicitud→contrato→pago
.agent/skills/kyc-ocr-saferent/SKILL.md             — KYC pipeline, GPT-4o OCR, MRZ/ICAO, scoring, kyc_sesiones
```

### Key source locations
```
src/lib/auth.ts                    — auth helpers
src/lib/solicitudes.ts             — application logic
src/lib/viviendas.ts               — property logic
src/lib/contratos.ts               — contract generation
src/lib/pagos.ts                   — payment logic + crearPaymentIntent (Stripe)
src/lib/api.ts                     — HTTP client to NestJS backend (JWT auto-injection)
src/lib/supabase/client.ts         — browser Supabase client
src/lib/supabase/server.ts         — server Supabase client
src/hooks/useNotifications.ts      — Socket.io WebSocket hook (real-time events)
src/data/spain-locations.ts        — static Spanish province/city data (50 provinces)
src/components/forms/LocationSelector.tsx — cascading provincia→ciudad selector + address validation
src/lib/address-validation.ts      — Nominatim geocoding utility
src/context/PropietarioContext.tsx  — propietario state: viviendas, solicitudes, pagos, actualizarViviendaLocal()
src/app/(propietario)/propietario/actions.ts — server actions: toggleActiva, aceptar/rechazar solicitud
src/types/index.ts                 — shared TS types
src/components/motion/             — Framer Motion wrappers
src/components/layout/             — Sidebar, TopBar
```

### Decision checklist (before starting any task)

- [ ] Does this touch a new page / route / context / type? → Load `saferent-architecture` skill
- [ ] Does this touch UI? → Load `frontend-design` skill
- [ ] Does this touch Next.js / data fetching / performance? → Load `vercel-react-best-practices` skill
- [ ] Does this touch Supabase / RLS / storage / auth? → Load `supabase-saferent` skill
- [ ] Does this touch solicitudes / contratos / pagos lifecycle? → Load `saferent-business-rules` skill
- [ ] Does this touch Stripe / escrow / webhooks? → Load `stripe-connect-saferent` skill
- [ ] Does this touch KYC / OCR / MRZ / kyc_sesiones? → Load `kyc-ocr-saferent` skill + `mem_search("saferent:kyc")`
- [ ] Does this touch auth / Stripe / schema (architectural)? → `mem_search` first
- [ ] Does this touch 3+ files or introduce a new feature? → Plan Mode first
- [ ] Does this touch viviendas / propietario dashboard / location? → Check `src/lib/viviendas.ts` actualizarVivienda fotos handling
- [ ] Am I mixing role data? → Stop and isolate
- [ ] Am I using an undocumented API? → Verify via Context7 docs
