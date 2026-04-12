"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Inicializa la suscripción de Supabase Auth al montar.
 * Renderiza null — reemplaza al antiguo AuthProvider.
 */
export function AuthInit() {
  const init = useAuthStore((s) => s._init);

  useEffect(() => {
    return init();
  }, [init]);

  return null;
}
