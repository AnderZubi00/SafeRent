import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET_PDF = "contratos-pdf";

function getPublicPdfUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_PDF}/${path}`;
}

export interface ContratoDigital {
  id: string;
  solicitud_id: string;
  reserva_id: string | null;
  pdf_borrador_url: string | null;
  pdf_final_url: string | null;
  firmado_propietario: boolean;
  firmado_inquilino: boolean;
  firma_propietario_img: string | null;
  firma_inquilino_img: string | null;
  fecha_firma_completa: string | null;
}

export interface DatosContrato {
  solicitudId: string;
  vivienda: {
    titulo: string;
    direccion: string;
    ciudad: string;
    num_registro?: string;
    precio_mes: number;
    fianza_importe: number;
  };
  propietario: {
    nombre: string;
    email: string;
    dni?: string;
  };
  inquilino: {
    nombre: string;
    email: string;
    dni?: string;
  };
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
}

export async function crearContrato(
  solicitudId: string,
  pdfUrl: string
): Promise<{ data: ContratoDigital | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("contratos_digitales")
    .insert({
      solicitud_id: solicitudId,
      pdf_borrador_url: pdfUrl,
      firmado_propietario: false,
      firmado_inquilino: false,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ContratoDigital, error: null };
}

export async function firmarContrato(
  contratoId: string,
  rol: "propietario" | "inquilino",
  firmaBase64: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};
  if (rol === "propietario") {
    updates.firmado_propietario = true;
    updates.firma_propietario_img = firmaBase64;
  } else {
    updates.firmado_inquilino = true;
    updates.firma_inquilino_img = firmaBase64;
  }

  // Check if both will be signed
  const { data: current } = await supabase
    .from("contratos_digitales")
    .select("firmado_propietario, firmado_inquilino")
    .eq("id", contratoId)
    .single();

  if (current) {
    const bothSigned =
      (rol === "propietario" && current.firmado_inquilino) ||
      (rol === "inquilino" && current.firmado_propietario);
    if (bothSigned) {
      updates.fecha_firma_completa = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("contratos_digitales")
    .update(updates)
    .eq("id", contratoId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function obtenerContratoBySolicitud(
  solicitudId: string
): Promise<{ data: ContratoDigital | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("contratos_digitales")
    .select("*")
    .eq("solicitud_id", solicitudId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as ContratoDigital | null, error: null };
}

export { getPublicPdfUrl, BUCKET_PDF };
