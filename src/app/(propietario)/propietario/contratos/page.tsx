import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Eye, CheckCircle2, Clock, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTRATOS = [
  { inquilino: "Carlos López M.", vivienda: "Piso Parte Vieja", inicio: "01/09/2026", fin: "30/06/2027", renta: 850, estado: "FIRMADO", avatar: "CL" },
  { inquilino: "Ana Rodríguez P.", vivienda: "Estudio Gros", inicio: "01/10/2025", fin: "28/02/2026", renta: 620, estado: "COMPLETADO", avatar: "AR" },
];

const ESTADO: Record<string, { label: string; class: string }> = {
  PENDIENTE: { label: "Pend. firma", class: "bg-amber-100 text-amber-700" },
  FIRMADO: { label: "Activo", class: "bg-emerald-100 text-emerald-700" },
  COMPLETADO: { label: "Finalizado", class: "bg-blue-100 text-blue-700" },
};

export default function ContratosPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contratos Activos</h1>
        <p className="text-slate-500 mt-1">Contratos digitales firmados con tus inquilinos</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inquilino</TableHead>
                <TableHead>Vivienda</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Renta</TableHead>
                <TableHead className="text-right">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONTRATOS.map((c, i) => {
                const conf = ESTADO[c.estado];
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{c.avatar}</div>
                        <span className="font-medium text-slate-900 text-sm">{c.inquilino}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{c.vivienda}</TableCell>
                    <TableCell className="text-xs text-slate-500">{c.inicio} → {c.fin}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{c.renta}€/mes</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", conf.class)}>{conf.label}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                      </div>
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
