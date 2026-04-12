"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Wallet, TrendingUp, CheckCircle2, Clock,
  Loader2, Inbox, Building2, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropietario } from "@/store/propietarioStore";

const COMISION_RATE = 0.03;

export default function LiquidacionesPage() {
  const { pagos, cargando } = usePropietario();

  const stats = useMemo(() => {
    const completados = pagos.filter((p) => p.estado === "COMPLETADO");
    const totalRecibido = completados.reduce((s, p) => s + p.importe, 0);
    const comisionTotal = totalRecibido * COMISION_RATE;

    const ahora = new Date();
    const mes = ahora.getMonth();
    const anio = ahora.getFullYear();
    const ingresosMes = completados
      .filter((p) => {
        const f = new Date(p.fecha_pago);
        return f.getMonth() === mes && f.getFullYear() === anio;
      })
      .reduce((s, p) => s + p.importe, 0);

    return { totalRecibido, comisionTotal, ingresosMes };
  }, [pagos]);

  const pagosPorVivienda = useMemo(() => {
    const mapa = new Map<string, { titulo: string; ciudad: string; pagos: typeof pagos }>();
    for (const p of pagos) {
      const key = p.vivienda_id;
      if (!mapa.has(key)) {
        mapa.set(key, {
          titulo: p.vivienda?.titulo ?? "Vivienda",
          ciudad: p.vivienda?.ciudad ?? "",
          pagos: [],
        });
      }
      mapa.get(key)!.pagos.push(p);
    }
    return Array.from(mapa.entries());
  }, [pagos]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Liquidaciones</h1>
        <p className="text-sm text-slate-500 mt-1">
          Historial de pagos recibidos de tus inquilinos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total recibido",
            value: `${stats.totalRecibido.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€`,
            icon: Wallet,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Ingresos este mes",
            value: `${stats.ingresosMes.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€`,
            icon: TrendingUp,
            color: "text-indigo-600",
            bg: "bg-indigo-500/10",
          },
          {
            label: "Comisión SafeRent (3%)",
            value: `${stats.comisionTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€`,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
        ].map((s) => (
          <Card key={s.label} className="ring-1 ring-slate-200 shadow-sm border-0">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
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

      {pagos.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Sin liquidaciones</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Cuando un inquilino realice un pago por alguna de tus viviendas, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pagosPorVivienda.map(([viviendaId, grupo]) => (
            <Card key={viviendaId} className="ring-1 ring-slate-200 shadow-sm border-0 overflow-hidden">
              <CardHeader className="pb-3 bg-slate-50/80 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  {grupo.titulo}
                  <span className="text-xs font-normal text-slate-400">
                    · {grupo.ciudad.split("-")[0]}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/40">
                      <TableHead className="text-xs font-semibold text-slate-500">Concepto</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">Inquilino</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 text-right">Bruto</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 text-right">Comisión (3%)</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 text-right">Neto</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.pagos.map((p) => {
                      const comision = p.importe * COMISION_RATE;
                      const neto = p.importe - comision;
                      const inquilinoNombre =
                        p.solicitud?.inquilino?.nombre_completo ?? null;

                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/60">
                          <TableCell>
                            <p className="font-medium text-slate-900 text-sm capitalize">
                              {p.concepto.replace(/_/g, " ")}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                {inquilinoNombre ?? "Inquilino"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(p.fecha_pago).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-600">
                            {p.importe.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                          </TableCell>
                          <TableCell className="text-right text-sm text-rose-500">
                            -{comision.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900 text-sm">
                            {neto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                                p.estado === "COMPLETADO"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {p.estado === "COMPLETADO" ? (
                                <><CheckCircle2 className="h-3 w-3" /> Recibido</>
                              ) : (
                                <><Clock className="h-3 w-3" /> Pendiente</>
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
