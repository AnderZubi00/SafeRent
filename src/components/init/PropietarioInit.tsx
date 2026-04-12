"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePropietarioStore } from "@/store/propietarioStore";

/**
 * Dispara la carga de data del propietario cuando auth está listo.
 * Solo se monta dentro del route group (propietario), preservando el scoping por rol.
 */
export function PropietarioInit() {
  const usuario = useAuthStore((s) => s.usuario);
  const authCargando = useAuthStore((s) => s.cargando);
  const cargar = usePropietarioStore((s) => s.cargar);

  useEffect(() => {
    if (!authCargando && usuario) {
      cargar();
    }
  }, [authCargando, usuario, cargar]);

  return null;
}
