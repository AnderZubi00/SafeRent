import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, CheckCircle2, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCS = [
  { nombre: "Contrato de arrendamiento temporal", tipo: "Contrato", fecha: "15/08/2026", estado: "FIRMADO", size: "245 KB" },
  { nombre: "DNI escaneado", tipo: "Identidad", fecha: "10/08/2026", estado: "VERIFICADO", size: "1.2 MB" },
  { nombre: "Matrícula universitaria 2026-27", tipo: "Temporalidad", fecha: "12/08/2026", estado: "VERIFICADO", size: "420 KB" },
  { nombre: "Contrato de arrendamiento — Gros 2025", tipo: "Contrato", fecha: "01/10/2025", estado: "FIRMADO", size: "230 KB" },
];

const ESTADO_CONFIG: Record<string, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  FIRMADO: { label: "Firmado", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  VERIFICADO: { label: "Verificado", class: "bg-blue-100 text-blue-700", icon: Shield },
  PENDIENTE: { label: "Pendiente", class: "bg-amber-100 text-amber-700", icon: Clock },
};

export default function DocumentosPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Documentos</h1>
        <p className="text-slate-500 mt-1">Repositorio de contratos y documentos verificados</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Contratos firmados", value: "2", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Documentos verificados", value: "2", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pendientes", value: "0", color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Todos los documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DOCS.map((doc, i) => {
              const conf = ESTADO_CONFIG[doc.estado];
              const Icon = conf.icon;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.tipo} · {doc.fecha} · {doc.size}</p>
                  </div>
                  <span className={cn("flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", conf.class)}>
                    <Icon className="h-3 w-3" />{conf.label}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
