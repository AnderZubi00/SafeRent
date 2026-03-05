import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGOS = [
  { mes: "Septiembre 2026", concepto: "Renta mensual", importe: 850, estado: "PENDIENTE", vence: "01/09/2026" },
  { mes: "Agosto 2026", concepto: "Fianza (reembolsable)", importe: 850, estado: "RETENIDO", vence: "15/08/2026" },
  { mes: "Octubre 2025", concepto: "Renta mensual", importe: 620, estado: "PAGADO", vence: "01/10/2025" },
  { mes: "Noviembre 2025", concepto: "Renta mensual", importe: 620, estado: "PAGADO", vence: "01/11/2025" },
  { mes: "Diciembre 2025", concepto: "Renta mensual", importe: 620, estado: "PAGADO", vence: "01/12/2025" },
];

const ESTADO: Record<string, { label: string; class: string }> = {
  PENDIENTE: { label: "Pendiente", class: "bg-amber-100 text-amber-700" },
  RETENIDO: { label: "En Escrow", class: "bg-orange-100 text-orange-700" },
  PAGADO: { label: "Pagado", class: "bg-emerald-100 text-emerald-700" },
  FALLIDO: { label: "Fallido", class: "bg-red-100 text-red-700" },
};

export default function PagosPage() {
  const totalPagado = PAGOS.filter((p) => p.estado === "PAGADO").reduce((s, p) => s + p.importe, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
        <p className="text-slate-500 mt-1">Historial y estado de tus pagos</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total pagado", value: `${totalPagado}€`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "En Escrow", value: "850€", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Próximo pago", value: "850€", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
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
          <CardTitle className="text-base">Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGOS.map((p, i) => {
                const conf = ESTADO[p.estado];
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{p.concepto}</p>
                      <p className="text-xs text-slate-500">{p.mes}</p>
                    </TableCell>
                    <TableCell className="text-slate-600">{p.vence}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{p.importe}€</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", conf.class)}>
                        {conf.label}
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
