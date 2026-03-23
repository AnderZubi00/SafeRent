"use client";

import { actualizarVivienda } from "@/lib/viviendas";
import { aceptarSolicitud, rechazarSolicitud } from "@/lib/solicitudes";
import { firmarContrato } from "@/lib/contratos";

export async function toggleActivaVivienda(id: string, activa: boolean) {
  const { error } = await actualizarVivienda(id, { activa });
  return { error };
}

export async function aceptarSolicitudAction(solicitudId: string) {
  return aceptarSolicitud(solicitudId);
}

export async function rechazarSolicitudAction(
  solicitudId: string,
  motivo: string
) {
  return rechazarSolicitud(solicitudId, motivo);
}

export async function firmarContratoAction(
  contratoId: string,
  firmaBase64: string
) {
  return firmarContrato(contratoId, "propietario", firmaBase64);
}
