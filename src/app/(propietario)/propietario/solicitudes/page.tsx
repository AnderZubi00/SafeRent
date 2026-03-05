import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, FileText, CheckCircle2, XCircle, GraduationCap, Briefcase, Eye, HelpCircle } from "lucide-react";

const SOLICITUDES = [
  {
    id: "1", nombre: "Ander Zubiaurre", email: "ander@univ.es", dni: "Verificado", motivo: "Estudios",
    doc: "Matrícula EHU 2026-27", vivienda: "Piso Parte Vieja", fecha: "20/08/2026", avatar: "AZ",
    estado: "PENDIENTE", descripcion: "Estudiante de Ingeniería en la UPV/EHU. Busco piso cerca del campus.",
  },
  {
    id: "2", nombre: "Laura Iriarte", email: "laura@empresa.com", dni: "Verificado", motivo: "Trabajo",
    doc: "Contrato laboral temporal", vivienda: "Estudio Gros", fecha: "19/08/2026", avatar: "LI",
    estado: "PENDIENTE", descripcion: "Trabajadora del Gobierno Vasco en proyecto de 8 meses.",
  },
  {
    id: "3", nombre: "Mikel Etxeberria", email: "mikel@gmail.com", dni: "Verificado", motivo: "Otros",
    doc: "Documento justificativo", vivienda: "Piso Parte Vieja", fecha: "18/08/2026", avatar: "ME",
    estado: "PENDIENTE", descripcion: "Necesito alojamiento 3 meses mientras reforman mi piso en Rentería.",
  },
];

const MOTIVO_CONFIG: Record<string, { label: string; class: string; icon: typeof GraduationCap }> = {
  Estudios: { label: "Estudiante", class: "bg-blue-100 text-blue-700", icon: GraduationCap },
  "Trabajo temporal": { label: "Trabajador", class: "bg-violet-100 text-violet-700", icon: Briefcase },
  Trabajo: { label: "Trabajador", class: "bg-violet-100 text-violet-700", icon: Briefcase },
  Otros: { label: "Otros", class: "bg-slate-100 text-slate-700", icon: HelpCircle },
};

export default function SolicitudesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes Pendientes</h1>
        <p className="text-slate-500 mt-1">Revisa el perfil de los inquilinos antes de aceptar</p>
      </div>

      <div className="space-y-4">
        {SOLICITUDES.map((s) => {
          const motivo = MOTIVO_CONFIG[s.motivo];
          const MotivoIcon = motivo.icon;
          return (
            <Card key={s.id} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-violet-100 text-violet-700 font-bold">{s.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{s.nombre}</h3>
                          <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            <Shield className="h-3 w-3" /> KYC Verificado
                          </span>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${motivo.class}`}>
                            <MotivoIcon className="h-3 w-3" /> {motivo.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{s.email}</p>
                      </div>
                      <p className="text-xs text-slate-400 shrink-0">{s.fecha}</p>
                    </div>

                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{s.descripcion}</p>

                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs text-slate-700 font-medium">{s.doc}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium ml-1">Verificado</span>
                      </div>
                      <span className="text-xs text-slate-500">Vivienda: <span className="font-medium text-slate-700">{s.vivienda}</span></span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <Eye className="h-3.5 w-3.5" /> Ver perfil completo
                      </Button>
                      <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aceptar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200">
                        <XCircle className="h-3.5 w-3.5" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
