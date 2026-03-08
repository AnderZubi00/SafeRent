import { createClient } from "@/lib/supabase/client";

export type MotivoTemporalidad = "Estudios" | "Trabajo" | "Obras" | "Salud" | "Otros";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "viviendas-fotos";

export function getPublicPhotoUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export interface Vivienda {
  id: string;
  propietario_id: string;
  titulo: string;
  descripcion: string | null;
  direccion: string;
  barrio: string | null;
  ciudad: string;
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
  duracion_minima: string; // legacy — se mantiene por compatibilidad
  estancia_minima: number;
  estancia_maxima: number;
  fotos: string[];
  fecha_creacion: string;
}

export interface PublicarViviendaInput {
  titulo: string;
  descripcion?: string;
  direccion: string;
  barrio?: string;
  ciudad: string;
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
}

export interface FiltrosVivienda {
  ciudad?: string;
  motivo?: string;
  precioMin?: number;
  precioMax?: number;
  habitaciones?: number;
}

async function subirFotos(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  viviendaId: string,
  fotos: File[]
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < fotos.length; i++) {
    const file = fotos[i];
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${viviendaId}/${i + 1}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (!error) {
      urls.push(getPublicPhotoUrl(path));
    }
  }

  return urls;
}

export async function publicarVivienda(
  input: PublicarViviendaInput,
  fotos?: File[]
): Promise<{ data: Vivienda | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No estás autenticado" };

  // 1. Insertar la vivienda para obtener el ID
  const { data, error } = await supabase
    .from("viviendas")
    .insert({
      propietario_id: user.id,
      ...input,
      activa: true,
      verificada: false,
      fotos: [],
    })
    .select()
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Error al guardar" };

  // 2. Subir fotos si las hay y actualizar la vivienda con las URLs
  if (fotos && fotos.length > 0) {
    const urls = await subirFotos(supabase, user.id, data.id, fotos);
    if (urls.length > 0) {
      await supabase
        .from("viviendas")
        .update({ fotos: urls })
        .eq("id", data.id);
      (data as Vivienda).fotos = urls;
    }
  }

  return { data: data as Vivienda, error: null };
}

export async function obtenerViviendas(
  filtros?: FiltrosVivienda
): Promise<{ data: Vivienda[]; error: string | null }> {
  const supabase = createClient();

  let query = supabase
    .from("viviendas")
    .select("*")
    .eq("activa", true)
    .order("fecha_creacion", { ascending: false });

  if (filtros?.ciudad && filtros.ciudad !== "todas") {
    query = query.ilike("ciudad", `%${filtros.ciudad}%`);
  }
  if (filtros?.motivo && filtros.motivo !== "todos") {
    query = query.contains("motivos", [filtros.motivo]);
  }
  if (filtros?.precioMin !== undefined) {
    query = query.gte("precio_mes", filtros.precioMin);
  }
  if (filtros?.precioMax !== undefined) {
    query = query.lte("precio_mes", filtros.precioMax);
  }
  if (filtros?.habitaciones !== undefined && filtros.habitaciones > 0) {
    query = query.gte("habitaciones", filtros.habitaciones);
  }

  const { data, error } = await query;

  if (error) return { data: [], error: error.message };
  return { data: (data as Vivienda[]) ?? [], error: null };
}

export async function actualizarVivienda(
  id: string,
  input: Partial<PublicarViviendaInput>,
  fotosNuevas?: File[],
  fotosExistentes?: string[]
): Promise<{ data: Vivienda | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No estás autenticado" };

  let fotosFinales = fotosExistentes ?? [];
  if (fotosNuevas && fotosNuevas.length > 0) {
    const nuevasUrls = await subirFotos(supabase, user.id, id, fotosNuevas);
    fotosFinales = [...fotosFinales, ...nuevasUrls];
  }

  const { data, error } = await supabase
    .from("viviendas")
    .update({ ...input, fotos: fotosFinales })
    .eq("id", id)
    .eq("propietario_id", user.id)
    .select()
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Error al actualizar" };
  return { data: data as Vivienda, error: null };
}

export async function obtenerViviendaById(
  id: string
): Promise<{ data: Vivienda | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("viviendas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Vivienda, error: null };
}

export async function obtenerMisViviendas(): Promise<{
  data: Vivienda[];
  error: string | null;
}> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No estás autenticado" };

  const { data, error } = await supabase
    .from("viviendas")
    .select("*")
    .eq("propietario_id", user.id)
    .order("fecha_creacion", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Vivienda[]) ?? [], error: null };
}
