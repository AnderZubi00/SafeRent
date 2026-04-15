"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePropietarioStore } from "@/store/propietarioStore";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Dispara la carga de data del propietario cuando auth está listo y mantiene
 * el store sincronizado en tiempo real vía WebSocket mientras el usuario
 * permanece en el panel de propietario.
 */
export function PropietarioInit() {
  const usuario = useAuthStore((s) => s.usuario);
  const authCargando = useAuthStore((s) => s.cargando);
  const cargar = usePropietarioStore((s) => s.cargar);
  const recargar = usePropietarioStore((s) => s.recargar);

  useEffect(() => {
    if (!authCargando && usuario && usuario.rol === "PROPIETARIO") {
      cargar();
    }
  }, [authCargando, usuario, cargar]);

  // Sincronización en tiempo real: el propietario ve nuevas solicitudes,
  // cambios de contrato y pagos sin necesidad de refrescar manualmente.
  useNotifications(
    {
      "solicitud:created": () => recargar(),
      "contrato:signed": () => recargar(),
      "pago:completed": () => recargar(),
    },
    !authCargando && !!usuario && usuario.rol === "PROPIETARIO"
  );

  return null;
}
