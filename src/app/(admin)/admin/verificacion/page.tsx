import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Eye, CheckCircle2, XCircle, FileText, Building2, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const VIVIENDAS_PENDIENTES = [
  { id: "V-001", propietario: "Jon Etxea Arrizabalaga", vivienda: "Piso en Indautxu, Bilbao", registro: "VT-2026-BI-00891", notaSimple: "Subida", fecha: "22/08/2026" },
  { id: "V-002", propietario: "Amaia Lasa Uriarte", vivienda: "Estudio en Zurriola, Donostia", registro: "VT-2026-SS-00234", notaSimple: "Subida", fecha: "21/08/2026" },
  { id: "V-003", propietario: "Patxi Mendizabal", vivienda: "Apartamento en Centro, Vitoria", registro: "VT-2026-VI-00112", notaSimple: "Pendiente", fecha: "20/08/2026" },
];

const DOCS_PENDIENTES = [
  { id: "D-001", inquilino: "Iker Zabala", tipo: "Matrícula universitaria", motivo: "Estudios", fecha: "22/08/2026" },
  { id: "D-002", inquilino: "Nora Bengoetxea", tipo: "Contrato laboral temporal", motivo: "Trabajo", fecha: "21/08/2026" },
];

export default function VerificacionPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Verificación</h1>
          <p className="text-slate-500 mt-1">Cola de documentos pendientes de revisión</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full">
            <Clock className="h-4 w-4" /> 5 pendientes
          </span>
        </div>
      </div>

      <Tabs defaultValue="viviendas">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="viviendas" className="gap-2">
            <Building2 className="h-4 w-4" /> Viviendas ({VIVIENDAS_PENDIENTES.length})
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <User className="h-4 w-4" /> Documentos inquilinos ({DOCS_PENDIENTES.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viviendas" className="mt-4 space-y-4">
          {VIVIENDAS_PENDIENTES.map((v) => (
            <Card key={v.id} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{v.vivienda}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Propietario: {v.propietario}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{v.fecha}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-slate-600 font-medium">Registro:</span>
                        <span className="text-xs font-mono text-blue-600">{v.registro}</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                        v.notaSimple === "Subida" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        <FileText className="h-3.5 w-3.5" />
                        Nota Simple: {v.notaSimple}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <Eye className="h-3.5 w-3.5" /> Ver documentos
                      </Button>
                      <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar vivienda
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200">
                        <XCircle className="h-3.5 w-3.5" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4 space-y-4">
          {DOCS_PENDIENTES.map((d) => (
            <Card key={d.id} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{d.tipo}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Inquilino: {d.inquilino} · Motivo: {d.motivo}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{d.fecha}</span>
                    </div>
                    <div className="mt-3 bg-slate-50 rounded-xl h-24 flex items-center justify-center text-slate-400 text-sm border border-slate-200">
                      Previsualización del PDF
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" />Ver PDF completo</Button>
                      <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Validar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200">
                        <XCircle className="h-3.5 w-3.5" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
