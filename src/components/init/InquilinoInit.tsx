"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useInquilinoStore } from "@/store/inquilinoStore";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Dispara la carga de data del inquilino cuando auth está listo y mantiene
 * el store sincronizado en tiempo real vía WebSocket mientras el usuario
 * permanece en el panel de inquilino.
 */
export function InquilinoInit() {
  const usuario = useAuthStore((s) => s.usuario);
  const authCargando = useAuthStore((s) => s.cargando);
  const cargar = useInquilinoStore((s) => s.cargar);
  const recargar = useInquilinoStore((s) => s.recargar);

  useEffect(() => {
    if (!authCargando && usuario && usuario.rol === "INQUILINO") {
      cargar();
    }
  }, [authCargando, usuario, cargar]);

  // Sincronización en tiempo real: cualquier cambio que afecte al inquilino
  // recarga el store automáticamente, sin importar en qué página esté.
  useNotifications(
    {
      "solicitud:updated": () => recargar(),
      "contrato:signed": () => recargar(),
      "pago:completed": () => recargar(),
    },
    !authCargando && !!usuario && usuario.rol === "INQUILINO"
  );

  return null;
}
