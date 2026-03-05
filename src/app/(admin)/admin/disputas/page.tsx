import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, Unlock, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const DISPUTAS = [
  {
    id: "DS-001",
    reserva: "SR-003",
    inquilino: "Mikel Etxeberria",
    propietario: "Amaia Lasa",
    vivienda: "Piso Amara, Donostia",
    importe: 950,
    motivo: "El propietario no entregó la vivienda en las condiciones pactadas",
    fechaApertura: "18/08/2026",
    estado: "ABIERTA",
    escrow: "BLOQUEADO",
    mensajes: 4,
  },
  {
    id: "DS-002",
    reserva: "SR-007",
    inquilino: "Leire Aizpurua",
    propietario: "Unai Irizar",
    vivienda: "Estudio en Bolueta, Bilbao",
    importe: 680,
    motivo: "Inquilino no se presentó y solicita devolución de la fianza",
    fechaApertura: "15/08/2026",
    estado: "ABIERTA",
    escrow: "BLOQUEADO",
    mensajes: 7,
  },
];

export default function DisputasPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputas Activas</h1>
          <p className="text-slate-500 mt-1">Gestiona los conflictos y libera o bloquea pagos en Escrow</p>
        </div>
        <span className="flex items-center gap-1.5 bg-red-100 text-red-700 text-sm font-semibold px-3 py-1.5 rounded-full">
          <AlertTriangle className="h-4 w-4" /> {DISPUTAS.length} disputas abiertas
        </span>
      </div>

      <div className="space-y-5">
        {DISPUTAS.map((d) => (
          <Card key={d.id} className="border-red-200 bg-red-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base text-red-700">Disputa {d.id}</CardTitle>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Abierta</span>
                </div>
                <span className="text-xs text-slate-400">{d.fechaApertura}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div><span className="text-slate-500">Reserva:</span> <span className="font-mono font-medium">{d.reserva}</span></div>
                  <div><span className="text-slate-500">Inquilino:</span> <span className="font-medium">{d.inquilino}</span></div>
                  <div><span className="text-slate-500">Propietario:</span> <span className="font-medium">{d.propietario}</span></div>
                </div>
                <div className="space-y-2">
                  <div><span className="text-slate-500">Vivienda:</span> <span className="font-medium">{d.vivienda}</span></div>
                  <div><span className="text-slate-500">Importe en Escrow:</span> <span className="font-bold text-slate-900">{d.importe}€</span></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Estado Escrow:</span>
                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" /> {d.escrow}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Motivo de la disputa</p>
                <p className="text-sm text-slate-800">{d.motivo}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" /> Mensajes ({d.mensajes})
                </Button>
                <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Unlock className="h-3.5 w-3.5" /> Liberar pago al propietario
                </Button>
                <Button size="sm" className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  <Unlock className="h-3.5 w-3.5" /> Devolver al inquilino
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-orange-700 border-orange-200 hover:bg-orange-50">
                  <Lock className="h-3.5 w-3.5" /> Mantener bloqueado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
