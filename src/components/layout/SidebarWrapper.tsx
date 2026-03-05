"use client";

import { Sidebar, type Rol } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";

interface SidebarWrapperProps {
  role: Rol;
}

export function SidebarWrapper({ role }: SidebarWrapperProps) {
  const { usuario } = useAuth();

  return (
    <Sidebar
      role={role}
      userName={usuario?.nombre_completo ?? ""}
      userEmail={usuario?.email ?? ""}
    />
  );
}
