"use client";

import { useState, useEffect } from "react";
import { Sidebar, type Rol } from "@/components/layout/Sidebar";
import { useAuth } from "@/store/authStore";
import { contarSolicitudesPendientes } from "@/lib/solicitudes";

interface SidebarWrapperProps {
  role: Rol;
}

export function SidebarWrapper({ role }: SidebarWrapperProps) {
  const { usuario } = useAuth();
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  useEffect(() => {
    if (role !== "propietario" || !usuario || usuario.rol !== "PROPIETARIO") return;

    async function cargar() {
      const count = await contarSolicitudesPendientes();
      setSolicitudesPendientes(count);
    }

    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [role, usuario]);

  return (
    <Sidebar
      role={role}
      userName={usuario?.nombre_completo ?? ""}
      userEmail={usuario?.email ?? ""}
      solicitudesPendientes={role === "propietario" ? solicitudesPendientes : undefined}
    />
  );
}
