import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const LIQUIDACIONES = [
  { mes: "Agosto 2026", vivienda: "Piso Parte Vieja", bruto: 850, comision: 25.5, neto: 824.5, estado: "PAGADO", fecha: "05/09/2026" },
  { mes: "Julio 2026", vivienda: "Piso Parte Vieja", bruto: 850, comision: 25.5, neto: 824.5, estado: "PAGADO", fecha: "05/08/2026" },
  { mes: "Junio 2026", vivienda: "Piso Parte Vieja", bruto: 850, comision: 25.5, neto: 824.5, estado: "PAGADO", fecha: "05/07/2026" },
  { mes: "Septiembre 2026", vivienda: "Piso Parte Vieja", bruto: 850, comision: 25.5, neto: 824.5, estado: "PENDIENTE", fecha: "05/10/2026" },
];

const ESTADO: Record<string, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  PAGADO: { label: "Transferido", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  PENDIENTE: { label: "Pendiente", class: "bg-amber-100 text-amber-700", icon: Clock },
};

export default function LiquidacionesPage() {
  const total = LIQUIDACIONES.filter((l) => l.estado === "PAGADO").reduce((s, l) => s + l.neto, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Liquidaciones</h1>
        <p className="text-slate-500 mt-1">Historial de pagos recibidos via Stripe Connect</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total recibido", value: `${total.toFixed(2)}€`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Este mes", value: "0€", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Comisión plataforma (3%)", value: `${(total * 0.03 / 0.97).toFixed(2)}€`, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-50" },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historial de transferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Vivienda</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIQUIDACIONES.map((l, i) => {
                const conf = ESTADO[l.estado];
                const Icon = conf.icon;
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{l.mes}</p>
                      <p className="text-xs text-slate-500">{l.fecha}</p>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{l.vivienda}</TableCell>
                    <TableCell className="text-right text-slate-600">{l.bruto}€</TableCell>
                    <TableCell className="text-right text-red-500">-{l.comision}€</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{l.neto}€</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("flex items-center justify-end gap-1 text-xs font-semibold px-2.5 py-1 rounded-full", conf.class)}>
                        <Icon className="h-3 w-3" /> {conf.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
