import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "documentos-solicitud";

function getPublicDocUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export interface Solicitud {
  id: string;
  vivienda_id: string;
  inquilino_id: string;
  propietario_id: string;
  motivo: string;
  motivo_detalle: string | null;
  documento_identidad_url: string;
  documento_justificativo_url: string;
  fecha_entrada: string;
  fecha_salida: string;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA";
  motivo_rechazo: string | null;
  fecha_creacion: string;
  // Joined data
  viviendas?: {
    id: string;
    titulo: string;
    ciudad: string;
    barrio: string | null;
    direccion: string;
    precio_mes: number;
    fianza_importe: number;
    fotos: string[];
    estancia_minima: number;
    estancia_maxima: number;
    propietario_id: string;
  };
  usuarios?: {
    id: string;
    nombre_completo: string;
    email: string;
    dni_nie: string | null;
  };
}

export interface CrearSolicitudInput {
  vivienda_id: string;
  propietario_id: string;
  motivo: string;
  motivo_detalle?: string;
  fecha_entrada: string;
  fecha_salida: string;
}

async function subirDocumento(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  solicitudId: string,
  tipo: "identidad" | "justificativo",
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userId}/${solicitudId}/${tipo}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Error al subir ${tipo}: ${error.message}`);
  return getPublicDocUrl(path);
}

export async function crearSolicitud(
  input: CrearSolicitudInput,
  docIdentidad: File,
  docJustificativo: File
): Promise<{ data: Solicitud | null; error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No estás autenticado" };

  // 1. Generar un UUID en cliente para usar como ruta de Storage antes de insertar
  const solicitudId = crypto.randomUUID();

  // 2. Subir documentos primero usando el ID generado
  let identidadUrl: string;
  let justificativoUrl: string;
  try {
    [identidadUrl, justificativoUrl] = await Promise.all([
      subirDocumento(supabase, user.id, solicitudId, "identidad", docIdentidad),
      subirDocumento(supabase, user.id, solicitudId, "justificativo", docJustificativo),
    ]);
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al subir documentos",
    };
  }

  // 3. Insertar la solicitud con las URLs reales en un solo paso
  const { data, error } = await supabase
    .from("solicitudes")
    .insert({
      id: solicitudId,
      vivienda_id: input.vivienda_id,
      inquilino_id: user.id,
      propietario_id: input.propietario_id,
      motivo: input.motivo,
      motivo_detalle: input.motivo_detalle || null,
      documento_identidad_url: identidadUrl,
      documento_justificativo_url: justificativoUrl,
      fecha_entrada: input.fecha_entrada,
      fecha_salida: input.fecha_salida,
      estado: "PENDIENTE",
    })
    .select()
    .single();

  if (error || !data)
    return { data: null, error: error?.message ?? "Error al crear solicitud" };

  return { data: data as Solicitud, error: null };
}

export async function obtenerSolicitudesPropietario(): Promise<{
  data: Solicitud[];
  error: string | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  const { data, error } = await supabase
    .from("solicitudes")
    .select(
      "*, viviendas(id, titulo, ciudad, barrio, direccion, precio_mes, fianza_importe, fotos, estancia_minima, estancia_maxima, propietario_id), usuarios!solicitudes_inquilino_id_fkey(id, nombre_completo, email, dni_nie)"
    )
    .eq("propietario_id", user.id)
    .order("fecha_creacion", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Solicitud[]) ?? [], error: null };
}

export async function obtenerSolicitudById(id: string): Promise<{
  data: Solicitud | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("solicitudes")
    .select(
      "*, viviendas(id, titulo, ciudad, barrio, direccion, precio_mes, fianza_importe, fotos, estancia_minima, estancia_maxima, propietario_id), usuarios!solicitudes_inquilino_id_fkey(id, nombre_completo, email, dni_nie)"
    )
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Solicitud, error: null };
}

export async function obtenerEstadoSolicitud(solicitudId: string): Promise<{
  estado: string;
  motivo_rechazo: string | null;
  contrato?: {
    id: string;
    firmado_propietario: boolean;
    firmado_inquilino: boolean;
    pdf_borrador_url: string | null;
  } | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: solicitud, error } = await supabase
    .from("solicitudes")
    .select("estado, motivo_rechazo")
    .eq("id", solicitudId)
    .single();

  if (error)
    return {
      estado: "ERROR",
      motivo_rechazo: null,
      error: error.message,
    };

  let contrato = null;
  if (solicitud.estado === "ACEPTADA") {
    const { data: rows, error: contratoErr } = await supabase
      .rpc("get_contrato_by_solicitud", { p_solicitud_id: solicitudId });

    if (contratoErr) {
      console.error("Error fetching contrato for solicitud", solicitudId, contratoErr);
    }
    contrato = rows && rows.length > 0 ? rows[0] : null;
  }

  return {
    estado: solicitud.estado,
    motivo_rechazo: solicitud.motivo_rechazo,
    contrato,
    error: null,
  };
}

export async function aceptarSolicitud(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("solicitudes")
    .update({ estado: "ACEPTADA" })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function rechazarSolicitud(
  id: string,
  motivo: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("solicitudes")
    .update({ estado: "RECHAZADA", motivo_rechazo: motivo })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function obtenerSolicitudesInquilino(): Promise<{
  data: Solicitud[];
  error: string | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  const { data, error } = await supabase
    .from("solicitudes")
    .select(
      "*, viviendas(id, titulo, ciudad, barrio, direccion, precio_mes, fianza_importe, fotos, estancia_minima, estancia_maxima, propietario_id)"
    )
    .eq("inquilino_id", user.id)
    .order("fecha_creacion", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Solicitud[]) ?? [], error: null };
}

export async function contarSolicitudesPendientes(): Promise<number> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("solicitudes")
    .select("*", { count: "exact", head: true })
    .eq("propietario_id", user.id)
    .eq("estado", "PENDIENTE");

  if (error) return 0;
  return count ?? 0;
}
