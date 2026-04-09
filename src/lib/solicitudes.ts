import { api } from "@/lib/api";

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
  // Joined data from backend includes
  vivienda?: {
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
  // Backend uses "inquilino" instead of "usuarios"
  inquilino?: {
    id: string;
    nombre_completo: string;
    email: string;
    dni_nie: string | null;
  };
  // Alias for backward compatibility with frontend components
  viviendas?: Solicitud["vivienda"];
  usuarios?: Solicitud["inquilino"];
}

export interface CrearSolicitudInput {
  vivienda_id: string;
  propietario_id: string;
  motivo: string;
  motivo_detalle?: string;
  fecha_entrada: string;
  fecha_salida: string;
}

/**
 * Sube documentos vía signed URLs del backend, luego crea la solicitud.
 */
export async function crearSolicitud(
  input: CrearSolicitudInput,
  docIdentidad: File,
  docJustificativo: File
): Promise<{ data: Solicitud | null; error: string | null }> {
  try {
    // 1. Obtener URLs firmadas para subir documentos
    // Usamos un ID temporal para organizar las rutas
    const tempId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const uploadUrls = await api.post<{
      identidad: { signedUrl: string; publicUrl: string };
      justificativo: { signedUrl: string; publicUrl: string };
    }>(`/solicitudes/${tempId}/docs/upload-url`);

    // 2. Subir documentos directamente a Supabase Storage
    await Promise.all([
      fetch(uploadUrls.identidad.signedUrl, {
        method: "PUT",
        body: docIdentidad,
        headers: { "Content-Type": docIdentidad.type },
      }),
      fetch(uploadUrls.justificativo.signedUrl, {
        method: "PUT",
        body: docJustificativo,
        headers: { "Content-Type": docJustificativo.type },
      }),
    ]);

    // 3. Crear la solicitud en el backend con las URLs públicas
    const data = await api.post<Solicitud>("/solicitudes", {
      ...input,
      documento_identidad_url: uploadUrls.identidad.publicUrl,
      documento_justificativo_url: uploadUrls.justificativo.publicUrl,
    });

    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al crear solicitud",
    };
  }
}

export async function obtenerSolicitudesPropietario(): Promise<{
  data: Solicitud[];
  error: string | null;
}> {
  try {
    const res = await api.get<{ data: Solicitud[] }>("/solicitudes/propietario");
    // Map backend field names to frontend aliases for backward compatibility
    const mapped = res.data.map((s) => ({
      ...s,
      viviendas: s.vivienda,
      usuarios: s.inquilino,
    }));
    return { data: mapped, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Error" };
  }
}

export async function obtenerSolicitudById(id: string): Promise<{
  data: Solicitud | null;
  error: string | null;
}> {
  try {
    const data = await api.get<Solicitud>(`/solicitudes/${id}`);
    return {
      data: { ...data, viviendas: data.vivienda, usuarios: data.inquilino },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error" };
  }
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
  pagos_completados?: number;
  fecha_entrada?: string;
  fecha_salida?: string;
  error: string | null;
}> {
  try {
    const data = await api.get<{
      estado: string;
      motivo_rechazo: string | null;
      contrato: {
        id: string;
        firmado_propietario: boolean;
        firmado_inquilino: boolean;
        pdf_borrador_url: string | null;
      } | null;
      pagos_completados?: number;
      fecha_entrada?: string;
      fecha_salida?: string;
    }>(`/solicitudes/${solicitudId}/estado`);

    return { ...data, error: null };
  } catch (e) {
    return {
      estado: "ERROR",
      motivo_rechazo: null,
      error: e instanceof Error ? e.message : "Error",
    };
  }
}

export async function aceptarSolicitud(
  id: string
): Promise<{ error: string | null }> {
  try {
    await api.post(`/solicitudes/${id}/aceptar`);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error" };
  }
}

export async function rechazarSolicitud(
  id: string,
  motivo: string
): Promise<{ error: string | null }> {
  try {
    await api.post(`/solicitudes/${id}/rechazar`, { motivo_rechazo: motivo });
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error" };
  }
}

export async function obtenerSolicitudesInquilino(): Promise<{
  data: Solicitud[];
  error: string | null;
}> {
  try {
    const res = await api.get<{ data: Solicitud[] }>("/solicitudes/inquilino");
    const mapped = res.data.map((s) => ({ ...s, viviendas: s.vivienda }));
    return { data: mapped, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Error" };
  }
}

export async function contarSolicitudesPendientes(): Promise<number> {
  try {
    const count = await api.get<number>("/solicitudes/pendientes/count");
    return count;
  } catch {
    return 0;
  }
}
