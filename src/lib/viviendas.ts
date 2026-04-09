import { api } from "@/lib/api";

export type MotivoTemporalidad = "Estudios" | "Trabajo" | "Obras" | "Salud" | "Otros";

export interface Vivienda {
  id: string;
  propietario_id: string;
  titulo: string;
  descripcion: string | null;
  direccion: string;
  barrio: string | null;
  ciudad: string;
  provincia: string;
  precio_mes: number;
  fianza_importe: number;
  habitaciones: number;
  banos: number;
  m2: number;
  motivos: string[];
  num_registro_vivienda: string;
  nota_simple_url: string | null;
  verificada: boolean;
  activa: boolean;
  disponible_desde: string | null;
  duracion_minima: string;
  estancia_minima: number;
  estancia_maxima: number;
  fotos: string[];
  fecha_creacion: string;
  fase_actual: number;
  es_borrador: boolean;
}

export interface PublicarViviendaInput {
  titulo: string;
  descripcion?: string;
  direccion: string;
  barrio?: string;
  ciudad: string;
  provincia: string;
  precio_mes: number;
  fianza_importe: number;
  habitaciones: number;
  banos: number;
  m2: number;
  motivos: string[];
  num_registro_vivienda: string;
  disponible_desde?: string;
  estancia_minima: number;
  estancia_maxima: number;
  /** PATCH parcial (p. ej. toggle visible en listados) */
  activa?: boolean;
}

export interface FiltrosVivienda {
  provincia?: string;
  ciudad?: string;
  motivo?: string;
  precioMin?: number;
  precioMax?: number;
  habitaciones?: number;
  soloVerificadas?: boolean;
}

export function getPublicPhotoUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/viviendas-fotos/${path}`;
}

export async function publicarVivienda(
  input: PublicarViviendaInput,
  fotos?: File[]
): Promise<{ data: Vivienda | null; error: string | null }> {
  try {
    // 1. Crear la vivienda en el backend
    const vivienda = await api.post<Vivienda>("/viviendas", input);

    // 2. Subir fotos si las hay
    if (fotos && fotos.length > 0) {
      const urls: string[] = [];

      for (const foto of fotos) {
        try {
          const { signedUrl, publicUrl } = await api.post<{
            signedUrl: string;
            publicUrl: string;
          }>(`/viviendas/${vivienda.id}/fotos/upload-url`, {
            filename: foto.name,
          });

          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: foto,
            headers: { "Content-Type": foto.type },
          });

          if (uploadRes.ok) {
            urls.push(publicUrl);
          } else {
            console.error(`Error subiendo foto ${foto.name}:`, uploadRes.status);
          }
        } catch (uploadErr) {
          console.error(`Error subiendo foto ${foto.name}:`, uploadErr);
        }
      }

      // Actualizar vivienda con las URLs de fotos
      if (urls.length > 0) {
        try {
          const updated = await api.patch<Vivienda>(
            `/viviendas/${vivienda.id}`,
            { fotos: urls }
          );
          return { data: updated, error: null };
        } catch (patchErr) {
          console.error("Error guardando URLs de fotos en DB:", patchErr);
          // La vivienda se creó pero las fotos no se guardaron en DB
          return { data: vivienda, error: "Vivienda creada pero hubo un error al guardar las fotos. Editá la vivienda para subirlas de nuevo." };
        }
      }
    }

    return { data: vivienda, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al publicar vivienda",
    };
  }
}

export async function obtenerViviendas(
  filtros?: FiltrosVivienda
): Promise<{ data: Vivienda[]; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (filtros?.provincia && filtros.provincia !== "todas") params.set("provincia", filtros.provincia);
    if (filtros?.ciudad && filtros.ciudad !== "todas") params.set("ciudad", filtros.ciudad);
    if (filtros?.motivo && filtros.motivo !== "todos") params.set("motivo", filtros.motivo);
    if (filtros?.precioMin !== undefined) params.set("precioMin", String(filtros.precioMin));
    if (filtros?.precioMax !== undefined) params.set("precioMax", String(filtros.precioMax));
    if (filtros?.habitaciones !== undefined && filtros.habitaciones > 0)
      params.set("habitaciones", String(filtros.habitaciones));
    if (filtros?.soloVerificadas === true) params.set("soloVerificadas", "true");

    const query = params.toString();
    const res = await api.get<{ data: Vivienda[] }>(`/viviendas${query ? `?${query}` : ""}`);
    return { data: res.data, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Error al obtener viviendas" };
  }
}

export async function actualizarVivienda(
  id: string,
  input: Partial<PublicarViviendaInput>,
  fotosNuevas?: File[],
  fotosExistentes?: string[]
): Promise<{ data: Vivienda | null; error: string | null }> {
  try {
    // Only build fotos payload when caller explicitly manages photos
    const gestionaFotos = fotosNuevas !== undefined || fotosExistentes !== undefined;
    let fotosFinales = fotosExistentes ?? [];

    // Subir fotos nuevas si las hay
    if (fotosNuevas && fotosNuevas.length > 0) {
      for (const foto of fotosNuevas) {
        const { signedUrl, publicUrl } = await api.post<{
          signedUrl: string;
          publicUrl: string;
        }>(`/viviendas/${id}/fotos/upload-url`, { filename: foto.name });

        await fetch(signedUrl, {
          method: "PUT",
          body: foto,
          headers: { "Content-Type": foto.type },
        });

        fotosFinales = [...fotosFinales, publicUrl];
      }
    }

    const payload: Record<string, unknown> = { ...input };
    if (gestionaFotos) {
      payload.fotos = fotosFinales;
    }

    const data = await api.patch<Vivienda>(`/viviendas/${id}`, payload);

    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}

export async function obtenerViviendaById(
  id: string
): Promise<{ data: Vivienda | null; error: string | null }> {
  try {
    const data = await api.get<Vivienda>(`/viviendas/${id}`);
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function obtenerMisViviendas(): Promise<{
  data: Vivienda[];
  error: string | null;
}> {
  try {
    const res = await api.get<{ data: Vivienda[] }>("/viviendas/mis-viviendas");
    return { data: res.data, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : "Error" };
  }
}

// ---------------------------------------------------------------------------
// Borrador (draft) helpers — 5-phase wizard
// ---------------------------------------------------------------------------

/** Create a borrador with just the title */
export async function crearBorrador(titulo: string): Promise<Vivienda> {
  return api.post<Vivienda>("/viviendas/borrador", { titulo });
}

/** Save data for a specific phase */
export async function guardarFase(
  id: string,
  faseNum: number,
  data: Record<string, unknown>,
): Promise<Vivienda> {
  return api.patch<Vivienda>(`/viviendas/${id}/fase/${faseNum}`, data);
}

/** Get all user's borradores */
export async function obtenerBorradores(): Promise<Vivienda[]> {
  const res = await api.get<{ data: Vivienda[] }>("/viviendas/borradores");
  return res.data;
}

/** Publish a vivienda (validates all fields server-side) */
export async function publicarViviendaFinal(id: string): Promise<Vivienda> {
  return api.post<Vivienda>(`/viviendas/${id}/publicar`);
}

export async function verificarVivienda(id: string): Promise<Vivienda> {
  return api.post<Vivienda>(`/viviendas/${id}/verificar`);
}

/** Get signed URL for nota simple upload */
export async function obtenerUrlNotaSimple(
  id: string,
): Promise<{ signedUrl: string; publicUrl: string }> {
  return api.post<{ signedUrl: string; publicUrl: string }>(
    `/viviendas/${id}/nota-simple/upload-url`,
  );
}

/** Delete a borrador */
export async function eliminarBorrador(id: string): Promise<void> {
  await api.delete(`/viviendas/${id}/borrador`);
}
