import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { TopBar } from "@/components/layout/TopBar";
import { InquilinoProvider } from "@/context/InquilinoContext";

export default function InquilinoLayout({ children }: { children: React.ReactNode }) {
  return (
    <InquilinoProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <SidebarWrapper role="inquilino" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar
            title="Panel de inquilino"
            subtitle="Gestiona tus reservas y documentos"
            showSearch
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </InquilinoProvider>
  );
}
