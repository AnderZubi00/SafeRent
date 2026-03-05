import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { TopBar } from "@/components/layout/TopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SidebarWrapper role="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Panel de administración"
          subtitle="Supervisión global de la plataforma"
          showSearch
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
