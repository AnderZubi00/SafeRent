"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useInquilinoStore } from "@/store/inquilinoStore";

/**
 * Dispara la carga de data del inquilino cuando auth está listo.
 * Solo se monta dentro del route group (inquilino), preservando el scoping por rol.
 */
export function InquilinoInit() {
  const usuario = useAuthStore((s) => s.usuario);
  const authCargando = useAuthStore((s) => s.cargando);
  const cargar = useInquilinoStore((s) => s.cargar);

  useEffect(() => {
    if (!authCargando && usuario && usuario.rol === "INQUILINO") {
      cargar();
    }
  }, [authCargando, usuario, cargar]);

  return null;
}
