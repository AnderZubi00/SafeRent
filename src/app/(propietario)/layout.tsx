import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { PropietarioProvider } from "@/context/PropietarioContext";

export default function PropietarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <PropietarioProvider>
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
    </PropietarioProvider>
  );
}
