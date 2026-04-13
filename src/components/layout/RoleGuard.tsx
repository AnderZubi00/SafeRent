"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { rutaSegunRol, type Rol } from "@/lib/auth";

interface RoleGuardProps {
  rolRequerido: Rol;
}

/**
 * Guard client-side que redirige al dashboard correcto si el usuario autenticado
 * no tiene el rol requerido por el route group actual.
 *
 * Segunda línea de defensa tras el middleware (que usa la cookie saferent_role).
 * Necesario para navegación client-side (router.push) que no pasa por middleware.
 */
export function RoleGuard({ rolRequerido }: RoleGuardProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const cargando = useAuthStore((s) => s.cargando);
  const router = useRouter();

  useEffect(() => {
    if (cargando || !usuario) return;
    if (usuario.rol !== rolRequerido) {
      router.replace(rutaSegunRol(usuario.rol));
    }
  }, [usuario, cargando, rolRequerido, router]);

  return null;
}
