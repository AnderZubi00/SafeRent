import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PropietarioInit } from "@/components/init/PropietarioInit";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function PropietarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RoleGuard rolRequerido="PROPIETARIO" />
      <PropietarioInit />
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <SidebarWrapper role="propietario" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar
            title="Panel de propietario"
            subtitle="Gestiona tus viviendas y contratos"
            showSearch
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
