import { createClient } from "@/lib/supabase/client";

export interface Pago {
  id: string;
  solicitud_id: string;
  inquilino_id: string;
  vivienda_id: string;
  concepto: string;
  importe: number;
  estado: string;
  fecha_pago: string;
  metodo: string;
  viviendas?: {
    titulo: string;
    ciudad: string;
  };
}

export interface RegistrarPagoInput {
  solicitud_id: string;
  vivienda_id: string;
  concepto: string;
  importe: number;
  metodo?: string;
}

export async function registrarPago(
  input: RegistrarPagoInput
): Promise<{ data: Pago | null; error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  const { data, error } = await supabase
    .from("pagos")
    .insert({
      solicitud_id: input.solicitud_id,
      inquilino_id: user.id,
      vivienda_id: input.vivienda_id,
      concepto: input.concepto,
      importe: input.importe,
      estado: "COMPLETADO",
      metodo: input.metodo ?? "tarjeta",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Pago, error: null };
}

export async function obtenerPagosInquilino(): Promise<{
  data: Pago[];
  error: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  const { data, error } = await supabase
    .from("pagos")
    .select("*, viviendas(titulo, ciudad)")
    .eq("inquilino_id", user.id)
    .order("fecha_pago", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Pago[]) ?? [], error: null };
}

export interface PagoPropietario extends Pago {
  solicitudes?: {
    inquilino_id: string;
    motivo: string;
    fecha_entrada: string;
    fecha_salida: string;
    usuarios?: {
      nombre_completo: string;
      email: string;
    };
  };
}

export async function obtenerPagosPropietario(): Promise<{
  data: PagoPropietario[];
  error: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  const { data, error } = await supabase
    .from("pagos")
    .select(
      "*, viviendas!inner(titulo, ciudad, propietario_id), solicitudes(inquilino_id, motivo, fecha_entrada, fecha_salida, usuarios!solicitudes_inquilino_id_fkey(nombre_completo, email))"
    )
    .eq("viviendas.propietario_id", user.id)
    .order("fecha_pago", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as PagoPropietario[]) ?? [], error: null };
}
