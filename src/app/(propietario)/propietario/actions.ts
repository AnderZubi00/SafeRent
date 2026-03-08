"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleActivaVivienda(id: string, activa: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("viviendas")
    .update({ activa })
    .eq("id", id)
    .eq("propietario_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/propietario");
  return { error: null };
}

export async function aceptarSolicitudAction(solicitudId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Verify ownership
  const { data: solicitud } = await supabase
    .from("solicitudes")
    .select("propietario_id, inquilino_id, vivienda_id")
    .eq("id", solicitudId)
    .single();

  if (!solicitud || solicitud.propietario_id !== user.id)
    return { error: "No autorizado" };

  const { error } = await supabase
    .from("solicitudes")
    .update({ estado: "ACEPTADA" })
    .eq("id", solicitudId);

  if (error) return { error: error.message };

  revalidatePath("/propietario/solicitudes");
  return { error: null };
}

export async function rechazarSolicitudAction(
  solicitudId: string,
  motivo: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("solicitudes")
    .update({ estado: "RECHAZADA", motivo_rechazo: motivo })
    .eq("id", solicitudId)
    .eq("propietario_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/propietario/solicitudes");
  return { error: null };
}

export async function firmarContratoAction(
  contratoId: string,
  firmaBase64: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("contratos_digitales")
    .update({
      firmado_propietario: true,
      firma_propietario_img: firmaBase64,
    })
    .eq("id", contratoId);

  if (error) return { error: error.message };

  revalidatePath("/propietario/solicitudes");
  return { error: null };
}
