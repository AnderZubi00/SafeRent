import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode");

    // Mode: both sides in one shot
    if (mode === "completo") {
      const formData = await request.formData();
      const frente = formData.get("frente") as File | null;
      const reverso = formData.get("reverso") as File | null;
      if (!frente || !reverso) {
        return NextResponse.json({ error: "Se requieren frente y reverso" }, { status: 400 });
      }
      const toBase64 = async (f: File) => Buffer.from(await f.arrayBuffer()).toString("base64");
      const frenteB64 = await toBase64(frente);
      const reversoB64 = await toBase64(reverso);
      return analyzeCompleto(frenteB64, reversoB64);
    }

    // Check for MRZ-only scan mode
    if (mode === "mrz") {
      // MRZ-only fast path — expects FormData with "documento" field
      const soporteHint = request.nextUrl.searchParams.get("soporte") ?? "";
      const formData = await request.formData();
      const file = formData.get("documento") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mrzImageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage = {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" },
      };
      return analyzeMrz(mrzImageContent, soporteHint);
    }

    const contentType = request.headers.get("content-type") ?? "";
    const isFormData = contentType.includes("multipart/form-data");

    let imageBase64: string;

    if (isFormData) {
      // Mobile path: FormData with "documento" field
      const formData = await request.formData();
      const file = formData.get("documento");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "Se requiere el campo 'documento' con la imagen" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString("base64");
    } else {
      // Web path: JSON with imagen_url or imagen_base64
      const body = await request.json();
      const { imagen_url, imagen_base64 } = body;

      if (!imagen_url && !imagen_base64) {
        return NextResponse.json(
          { error: "Se requiere imagen_url o imagen_base64" },
          { status: 400 }
        );
      }

      if (imagen_base64) {
        imageBase64 = imagen_base64;
      } else {
        // For URL-based images, pass directly to OpenAI
        return await analyzeWithUrl(imagen_url);
      }
    }

    // Analyze with base64
    const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage =
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
          detail: "high",
        },
      };

    if (isFormData) {
      return await analyzeMobile(imageContent);
    } else {
      // Web response: legacy format
      return await analyzeWeb(imageContent);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[KYC Analizar] Error:", msg);
    return NextResponse.json(
      { error: `Error interno: ${msg}` },
      { status: 500 }
    );
  }
}

async function analyzeMobile(
  imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    store: false,
    messages: [
      {
        role: "system",
        content:
          "Eres un sistema OCR especializado en leer la zona MRZ (Machine Readable Zone) de documentos de identidad españoles. Tu tarea principal es transcribir con precisión absoluta los caracteres de la zona MRZ. Responde SOLO con JSON válido, sin markdown ni texto adicional.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analiza esta imagen de DNI español. Localiza la zona MRZ (las 3 líneas de caracteres en la franja inferior del reverso del documento, con letras y números en tipografía OCR-B).

PASO 1 — Lee la MRZ carácter por carácter. El DNI español tiene formato TD1:
- Línea 1 (30 chars): empieza con "IDESP" luego el número de soporte
- Línea 2 (30 chars): YYMMDD + dígito + M/F/< + YYMMDD + dígito + ESP + ...
  - Posiciones 1-6: fecha nacimiento (YYMMDD)
  - Posición 7: dígito verificador nacimiento
  - Posición 8: sexo (M/F/<)
  - Posiciones 9-14: fecha expiración (YYMMDD)  ← CRÍTICO
  - Posición 15: dígito verificador expiración
- Línea 3 (30 chars): apellidos<<nombre

PASO 2 — Extrae exactamente los campos pedidos.

Responde con este JSON exacto:
{
  "recomendacion": "APROBAR" | "RECHAZAR" | "REVISAR_MANUAL",
  "safe_score": 0-75,
  "mrz_linea1": "transcripción exacta línea 1 MRZ (30 chars)",
  "mrz_linea2": "transcripción exacta línea 2 MRZ (30 chars)",
  "datos_extraidos": {
    "nombre": "nombre(s) de pila del titular (de línea 3 MRZ o zona visual)",
    "apellidos": "apellidos completos (de línea 3 MRZ o zona visual)",
    "numero_documento": "número DNI/NIE de la zona visual (ej: 49577656Y)",
    "numero_soporte": "número de soporte de línea 1 MRZ, posiciones 6-14 (ej: CHD193049) — NO es el DNI, es alfanumérico",
    "fecha_nacimiento": "6 dígitos YYMMDD de posiciones 1-6 línea 2 MRZ",
    "fecha_expiracion": "6 dígitos YYMMDD de posiciones 9-14 línea 2 MRZ — leer DIRECTAMENTE de la MRZ, NO de la zona visual"
  },
  "tipo_documento": "DNI" | "NIE" | "Pasaporte" | "Desconocido"
}

Criterios safe_score (máximo 75):
- 55-75: MRZ legible, datos claros, documento auténtico → APROBAR
- 30-54: MRZ parcialmente legible o algún dato dudoso → REVISAR_MANUAL
- 0-29: No es documento válido, ilegible o fraudulento → RECHAZAR

REGLAS CRÍTICAS:
1. fecha_expiracion SIEMPRE debe venir de la MRZ (línea 2, posiciones 9-14), nunca de "VÁLIDO HASTA" visual
2. Los dígitos 0 y la letra O pueden confundirse en OCR — en MRZ las fechas son siempre dígitos
3. Si la MRZ no es visible (solo se ve el anverso), extrae lo que puedas de la zona visual y usa REVISAR_MANUAL

Si no puedes leer algún campo, déjalo como cadena vacía.`,
          },
          imageContent,
        ],
      },
    ],
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "No se recibió respuesta del modelo" },
      { status: 500 }
    );
  }

  let parsed;
  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      {
        recomendacion: "RECHAZAR",
        safe_score: 0,
        datos_extraidos: {
          nombre: "",
          apellidos: "",
          numero_documento: "",
          numero_soporte: "",
          fecha_nacimiento: "",
          fecha_expiracion: "",
        },
        tipo_documento: "Desconocido",
        error: "No se pudo interpretar la respuesta del análisis",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    recomendacion: parsed.recomendacion ?? "RECHAZAR",
    safe_score: Math.min(parsed.safe_score ?? 0, 75),
    mrz_debug: {
      linea1: parsed.mrz_linea1 ?? "",
      linea2: parsed.mrz_linea2 ?? "",
    },
    datos_extraidos: {
      nombre: parsed.datos_extraidos?.nombre ?? "",
      apellidos: parsed.datos_extraidos?.apellidos ?? "",
      numero_documento: parsed.datos_extraidos?.numero_documento ?? "",
      numero_soporte: parsed.datos_extraidos?.numero_soporte ?? "",
      fecha_nacimiento: parsed.datos_extraidos?.fecha_nacimiento ?? "",
      fecha_expiracion: parsed.datos_extraidos?.fecha_expiracion ?? "",
    },
    tipo_documento: parsed.tipo_documento ?? "Desconocido",
  });
}

async function analyzeMrz(
  imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage,
  soporteHint: string = ""
) {
  const soporteContext = soporteHint
    ? `\n\nCONTEXTO CRÍTICO: El número de soporte del documento es "${soporteHint}". La línea 1 de la MRZ DEBE contener "${soporteHint}" en posiciones 6-14. Si no ves "${soporteHint}" en la imagen, devuelve ok:false — NO inventes datos.`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    store: false,
    messages: [
      {
        role: "system",
        content:
          "Eres un OCR especializado en leer la zona MRZ de documentos de identidad españoles (formato TD1, 3 líneas). Tu única tarea es transcribir con precisión EXACTA los caracteres que ves. NUNCA inventes datos. Si no ves la MRZ claramente, devuelve ok:false. Responde SOLO con JSON válido.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Localiza la zona MRZ en el reverso del documento (3 líneas de caracteres OCR-B en la franja inferior).

El DNI español tiene formato TD1:
- Línea 1 (30 chars): "IDESP" + número_soporte (posiciones 6-14)
- Línea 2 (30 chars): YYMMDD(DOB) + cd + M/F + YYMMDD(expiry) + cd + ESP...
  - Posiciones 1-6: fecha_nacimiento en YYMMDD
  - Posiciones 9-14: fecha_expiracion en YYMMDD  ← CRÍTICO: leer LITERALMENTE de la imagen
- Línea 3 (30 chars): APELLIDOS<<NOMBRE

Responde con este JSON exacto:
{
  "ok": true/false,
  "numero_soporte": "alfanumérico 9 chars de línea 1 posiciones 6-14",
  "fecha_nacimiento": "6 dígitos YYMMDD de posiciones 1-6 línea 2",
  "fecha_expiracion": "6 dígitos YYMMDD de posiciones 9-14 línea 2",
  "mrz_linea1": "transcripción completa línea 1",
  "mrz_linea2": "transcripción completa línea 2"
}

REGLAS ABSOLUTAS:
1. Si la MRZ no es claramente visible → ok:false, todos los campos vacíos
2. NUNCA completes ni adivines caracteres borrosos → ok:false
3. En fechas: 0 y O son siempre dígitos — leer literalmente
4. numero_soporte son exactamente 9 caracteres alfanuméricos${soporteContext}`,
          },
          imageContent,
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content ?? "";
  let parsed: { ok?: boolean; numero_soporte?: string; fecha_nacimiento?: string; fecha_expiracion?: string; mrz_linea1?: string; mrz_linea2?: string } = {};
  try {
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // ignore parse error
  }

  // Cross-validate numero_soporte if hint provided
  const soporte = parsed.numero_soporte ?? "";
  const soporteValid = !soporteHint || soporte === soporteHint;

  const dob = parsed.fecha_nacimiento ?? "";
  const expiry = parsed.fecha_expiracion ?? "";
  const line2 = parsed.mrz_linea2 ?? "";

  // ICAO 9303 check digit validation — free, deterministic, catches OCR errors
  const dobCd = line2.length >= 7 ? parseInt(line2[6]) : -1;
  const expiryCd = line2.length >= 15 ? parseInt(line2[14]) : -1;
  const dobValid = dob.length === 6 && !isNaN(dobCd) && mrzCheckDigit(dob) === dobCd;
  const expiryValid = expiry.length === 6 && !isNaN(expiryCd) && mrzCheckDigit(expiry) === expiryCd;

  const allValid = soporteValid && !!soporte && dobValid && expiryValid;

  return NextResponse.json({
    ok: allValid,
    numero_soporte: soporte,
    fecha_nacimiento: allValid ? dob : "",
    fecha_expiracion: allValid ? expiry : "",
    mrz_linea1: parsed.mrz_linea1 ?? "",
    mrz_linea2: line2,
    // Debug: expose check digit results
    cd_debug: { dobCd, expiryCd, dobValid, expiryValid, soporteValid },
  });
}

/** ICAO 9303 check digit algorithm */
function mrzCheckDigit(str: string): number {
  const weights = [7, 3, 1];
  const val = (c: string): number => {
    if (c >= "0" && c <= "9") return parseInt(c);
    if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
    return 0; // '<' = 0
  };
  return str.split("").reduce((sum, c, i) => sum + val(c) * weights[i % 3], 0) % 10;
}

async function analyzeCompleto(frenteB64: string, reversoB64: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    store: false,
    messages: [
      {
        role: "system",
        content:
          "Eres un sistema OCR especializado en documentos de identidad españoles. Recibirás el ANVERSO y el REVERSO del mismo DNI. Extrae datos del anverso y transcribe la MRZ del reverso con precisión exacta. NUNCA inventes datos. Responde SOLO con JSON válido, sin markdown.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analiza AMBAS imágenes del DNI español:
- IMAGEN 1: anverso (cara con foto y datos visuales)
- IMAGEN 2: reverso (cara con zona MRZ — 3 líneas de caracteres OCR-B en la franja inferior)

PASO 1 — Del ANVERSO extrae:
- nombre(s) de pila
- apellidos completos
- número de DNI (8 dígitos + letra, ej: 49577656Y)
- numero_soporte: 9 chars alfanuméricos de línea 1 MRZ (posiciones 6-14, NO es el DNI)

PASO 2 — Del REVERSO transcribí AMBAS líneas de la MRZ EXACTAMENTE:
- mrz_linea1: los 30 chars de la línea 1 (empieza con IDESP seguido del número de soporte)
- mrz_linea2: los 30 chars de la línea 2 (empieza con la fecha de nacimiento YYMMDD)
Solo dígitos (0-9), letras (A-Z) y el signo <. NUNCA letra O donde corresponde un cero.

PASO 3 — De la línea 2 MRZ extraé también:
- fecha_nacimiento: posiciones 0-5 (YYMMDD)
- fecha_expiracion: posiciones 8-13 (YYMMDD)

Criterios de calidad (para safe_score y recomendacion):
- 55-75 → APROBAR: MRZ visible, datos del anverso claros, documento auténtico
- 30-54 → REVISAR_MANUAL: MRZ parcialmente legible, algún dato dudoso
- 0-29  → RECHAZAR: No es un DNI/NIE válido, imagen borrosa/incompleta, documento ilegible

Responde con este JSON:
{
  "recomendacion": "APROBAR" | "RECHAZAR" | "REVISAR_MANUAL",
  "safe_score": número entre 0 y 75,
  "datos_extraidos": {
    "nombre": "nombre(s) de pila del anverso",
    "apellidos": "apellidos completos del anverso",
    "numero_documento": "DNI/NIE del anverso (ej: 49577656Y)",
    "numero_soporte": "9 chars alfanuméricos de línea 1 MRZ posiciones 6-14",
    "fecha_nacimiento": "6 dígitos YYMMDD de posiciones 0-5 línea 2 MRZ",
    "fecha_expiracion": "6 dígitos YYMMDD de posiciones 8-13 línea 2 MRZ"
  },
  "mrz_linea1": "transcripción EXACTA de los 30 chars de la línea 1 MRZ",
  "mrz_linea2": "transcripción EXACTA de los 30 chars de la línea 2 MRZ",
  "tipo_documento": "DNI" | "NIE" | "Pasaporte" | "Desconocido"
}`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${frenteB64}`, detail: "high" },
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${reversoB64}`, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content ?? "";
  let parsed: {
    recomendacion?: string;
    safe_score?: number;
    datos_extraidos?: {
      nombre?: string; apellidos?: string; numero_documento?: string;
      numero_soporte?: string; fecha_nacimiento?: string; fecha_expiracion?: string;
    };
    mrz_linea2?: string;
    tipo_documento?: string;
  } = {};
  let parseOk = false;
  try {
    // Strip markdown fences, then find the JSON object boundaries
    let raw = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start >= 0 && end > start) raw = raw.substring(start, end + 1);
    parsed = JSON.parse(raw);
    parseOk = true;
  } catch {
    console.error("[KYC analyzeCompleto] JSON parse failed. GPT raw:", content.substring(0, 500));
  }

  // --- Line 2 (DOB + expiry) ---
  const line2 = parsed.mrz_linea2 ?? "";
  const clean2 = line2.replace(/[^A-Z0-9<]/g, "").slice(0, 30);

  const dobFromLine  = clean2.length >= 7  ? clean2.substring(0, 6) : "";
  const expFromLine  = clean2.length >= 15 ? clean2.substring(8, 14) : "";
  const dobCd        = clean2.length >= 7  ? parseInt(clean2[6])  : -1;
  const expiryCd     = clean2.length >= 15 ? parseInt(clean2[14]) : -1;
  const dobValid     = dobFromLine.length === 6 && !isNaN(dobCd) && mrzCheckDigit(dobFromLine) === dobCd;
  const expiryValid  = expFromLine.length === 6 && !isNaN(expiryCd) && mrzCheckDigit(expFromLine) === expiryCd;

  const dob    = dobValid    ? dobFromLine : (parsed.datos_extraidos?.fecha_nacimiento ?? "");
  const expiry = expiryValid ? expFromLine : (parsed.datos_extraidos?.fecha_expiracion ?? "");

  // --- Line 1 (soporte) — TD1: positions 5-13 = document number, position 14 = check digit ---
  const line1 = parsed.mrz_linea1 ?? "";
  const clean1 = line1.replace(/[^A-Z0-9<]/g, "").slice(0, 30);

  const soporteFromLine1 = clean1.length >= 15 ? clean1.substring(5, 14) : "";
  const soporteCd        = clean1.length >= 15 ? parseInt(clean1[14]) : -1;
  const soporteFromLine1Valid = soporteFromLine1.length === 9 && !isNaN(soporteCd) &&
    mrzCheckDigit(soporteFromLine1) === soporteCd;

  // Code-parsed soporte from line 1 takes precedence when check digit passes
  const soporte = soporteFromLine1Valid
    ? soporteFromLine1
    : (parsed.datos_extraidos?.numero_soporte ?? "");

  const nombre    = parsed.datos_extraidos?.nombre ?? "";
  const apellidos = parsed.datos_extraidos?.apellidos ?? "";
  const numeroDni = parsed.datos_extraidos?.numero_documento ?? "";

  // CODE determines recomendacion — not GPT, to avoid conservative defaults
  const hasDni = !!numeroDni;
  const recomendacion = (() => {
    if (!parseOk && !hasDni) return "RECHAZAR";
    if (!hasDni) return "REVISAR_MANUAL";
    if (dobValid && expiryValid) return "APROBAR";
    return "REVISAR_MANUAL";
  })();

  const safe_score = (() => {
    if (recomendacion === "RECHAZAR") return Math.min(parsed.safe_score ?? 0, 29);
    if (recomendacion === "REVISAR_MANUAL") return Math.min(parsed.safe_score ?? 40, 54);
    return Math.min(parsed.safe_score ?? 60, 75);
  })();

  console.log("[KYC analyzeCompleto]", {
    clean1, clean2, dobValid, expiryValid, dob, expiry,
    soporteFromLine1, soporteFromLine1Valid, soporte,
    hasDni, parseOk, recomendacion, safe_score,
  });

  return NextResponse.json({
    recomendacion,
    safe_score,
    mrz_debug: {
      linea1: clean1, linea2: clean2,
      dobValid, expiryValid, dobCd, expiryCd, dob, expiry,
      soporteValid: soporteFromLine1Valid,
    },
    datos_extraidos: {
      nombre,
      apellidos,
      numero_documento: numeroDni,
      numero_soporte: soporte,
      fecha_nacimiento: dob,
      fecha_expiracion: expiry,
    },
    tipo_documento: parsed.tipo_documento ?? "Desconocido",
    cd_ok: dobValid && expiryValid,
  });
}

async function analyzeWeb(
  imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    store: false,
    messages: [
      {
        role: "system",
        content:
          "Eres un sistema de verificación KYC. Analiza la imagen del documento de identidad y extrae los datos. Responde SOLO con JSON válido, sin markdown ni texto adicional.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analiza esta imagen de documento de identidad y extrae los siguientes datos en formato JSON:

{
  "valido": true/false (si es un documento de identidad legible),
  "tipo_documento": "DNI" | "NIE" | "Pasaporte" | "Desconocido",
  "datos": {
    "nombre": "nombre(s) de pila",
    "apellidos": "apellidos completos",
    "numero_documento": "número del documento",
    "fecha_nacimiento": "DD/MM/YYYY",
    "fecha_expiracion": "DD/MM/YYYY",
    "nacionalidad": "nacionalidad"
  },
  "confianza": 0-100 (porcentaje de confianza en la extracción)
}

Si no puedes leer algún campo, déjalo como cadena vacía.
Si la imagen no es un documento de identidad, responde con valido: false y confianza: 0.`,
          },
          imageContent,
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "No se recibió respuesta del modelo" },
      { status: 500 }
    );
  }

  let parsed;
  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      {
        valido: false,
        tipo_documento: "Desconocido",
        datos: {
          nombre: "",
          apellidos: "",
          numero_documento: "",
          fecha_nacimiento: "",
          fecha_expiracion: "",
          nacionalidad: "",
        },
        confianza: 0,
        error: "No se pudo interpretar la respuesta del análisis",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    valido: parsed.valido ?? false,
    tipo_documento: parsed.tipo_documento ?? "Desconocido",
    datos: {
      nombre: parsed.datos?.nombre ?? "",
      apellidos: parsed.datos?.apellidos ?? "",
      numero_documento: parsed.datos?.numero_documento ?? "",
      fecha_nacimiento: parsed.datos?.fecha_nacimiento ?? "",
      fecha_expiracion: parsed.datos?.fecha_expiracion ?? "",
      nacionalidad: parsed.datos?.nacionalidad ?? "",
    },
    confianza: parsed.confianza ?? 0,
  });
}

async function analyzeWithUrl(imageUrl: string) {
  const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage = {
    type: "image_url",
    image_url: { url: imageUrl, detail: "high" },
  };
  return await analyzeWeb(imageContent);
}
