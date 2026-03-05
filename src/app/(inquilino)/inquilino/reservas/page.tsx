import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, FileText, CreditCard, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const RESERVAS = [
  { id: "1", vivienda: "Piso luminoso en Parte Vieja", ciudad: "Donostia", emoji: "🏙️", entrada: "01/09/2026", salida: "30/06/2027", precio: 850, estado: "PAGO_RETENIDO", tab: "activa" },
  { id: "2", vivienda: "Estudio en Gros", ciudad: "Donostia", emoji: "🌊", entrada: "01/10/2025", salida: "28/02/2026", precio: 620, estado: "COMPLETADO", tab: "finalizada" },
];

const ESTADO_CONFIG: Record<string, { label: string; class: string }> = {
  PENDIENTE: { label: "Pendiente", class: "bg-slate-100 text-slate-600" },
  PAGO_RETENIDO: { label: "Pago retenido", class: "bg-amber-100 text-amber-700" },
  CONFIRMADO: { label: "Confirmada", class: "bg-emerald-100 text-emerald-700" },
  COMPLETADO: { label: "Finalizada", class: "bg-blue-100 text-blue-700" },
  CANCELADO: { label: "Cancelada", class: "bg-red-100 text-red-700" },
};

function ReservaCard({ r }: { r: (typeof RESERVAS)[0] }) {
  const estado = ESTADO_CONFIG[r.estado];
  return (
    <Card className="border-slate-200 hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-2xl shrink-0">{r.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{r.vivienda}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5" />{r.ciudad}</p>
              </div>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", estado.class)}>
                {estado.label}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{r.entrada} → {r.salida}</span>
              <span className="font-semibold text-slate-900">{r.precio}€/mes</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link href={`/inquilino/checkout`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" /> Ver contrato
                </Button>
              </Link>
              <Link href="/inquilino/pagos">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" /> Pagos
                </Button>
              </Link>
              {r.estado === "PAGO_RETENIDO" && (
                <Link href="/inquilino/checkout">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
                    Completar reserva <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReservasPage() {
  const activas = RESERVAS.filter((r) => r.tab === "activa");
  const finalizadas = RESERVAS.filter((r) => r.tab === "finalizada");

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Reservas</h1>
        <p className="text-slate-500 mt-1">Historial y estado de tus alquileres</p>
      </div>

      <Tabs defaultValue="activas">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="activas">Activas ({activas.length})</TabsTrigger>
          <TabsTrigger value="finalizadas">Finalizadas ({finalizadas.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="activas" className="mt-4 space-y-4">
          {activas.length ? activas.map((r) => <ReservaCard key={r.id} r={r} />) : (
            <div className="text-center py-16 text-slate-400">
              <Calendar className="h-10 w-10 mx-auto mb-3" />
              <p className="font-medium">No tienes reservas activas</p>
              <Link href="/buscar"><Button size="sm" className="mt-4 bg-blue-600 text-white">Buscar alojamiento</Button></Link>
            </div>
          )}
        </TabsContent>
        <TabsContent value="finalizadas" className="mt-4 space-y-4">
          {finalizadas.map((r) => <ReservaCard key={r.id} r={r} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
