"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Eye, CheckCircle2, Clock, Pen,
  Loader2, Inbox, Building2, ExternalLink,
  ShieldCheck, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropietario, type SolicitudConContrato } from "@/store/propietarioStore";

function estadoContrato(s: SolicitudConContrato) {
  if (!s.contrato) return { label: "Sin contrato", cls: "bg-slate-100 text-slate-500", key: "none" };
  const { firmado_propietario, firmado_inquilino } = s.contrato;
  if (firmado_propietario && firmado_inquilino)
    return { label: "Firmado", cls: "bg-emerald-100 text-emerald-700", key: "firmado" };
  if (firmado_propietario && !firmado_inquilino)
    return { label: "Pend. firma inquilino", cls: "bg-amber-100 text-amber-700", key: "pend_inq" };
  if (!firmado_propietario)
    return { label: "Pend. firma propietario", cls: "bg-indigo-100 text-indigo-700", key: "pend_prop" };
  return { label: "Pendiente", cls: "bg-amber-100 text-amber-700", key: "pend" };
}

export default function ContratosPage() {
  const { solicitudes, cargando } = usePropietario();

  const contratosData = useMemo(
    () => solicitudes.filter((s) => s.estado === "ACEPTADA" && s.contrato),
    [solicitudes]
  );

  const totalContratos = contratosData.length;
  const firmados = contratosData.filter(
    (s) => s.contrato?.firmado_propietario && s.contrato?.firmado_inquilino
  ).length;
  const pendientesFirma = totalContratos - firmados;

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
        <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Contratos digitales generados con tus inquilinos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total contratos",
            value: String(totalContratos),
            icon: FileText,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-600",
          },
          {
            label: "Firmados",
            value: String(firmados),
            icon: ShieldCheck,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
          },
          {
            label: "Pendientes de firma",
            value: String(pendientesFirma),
            icon: Clock,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-600",
          },
        ].map((s) => (
          <Card key={s.label} className="ring-1 ring-slate-200 shadow-sm border-0">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.iconBg)}>
                <s.icon className={cn("h-5 w-5", s.iconColor)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contratosData.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Sin contratos</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Cuando aceptes una solicitud y se genere un contrato, aparecerá aquí.
          </p>
        </div>
      ) : (
        <Card className="ring-1 ring-slate-200 shadow-sm border-0 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs font-semibold text-slate-500">Inquilino</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Vivienda</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Período</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Renta</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratosData.map((s) => {
                  const est = estadoContrato(s);
                  const initials = (s.usuarios?.nombre_completo ?? "??")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const pdfUrl =
                    s.contrato?.pdf_final_url || s.contrato?.pdf_borrador_url;

                  return (
                    <TableRow key={s.id} className="hover:bg-slate-50/60">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {s.usuarios?.nombre_completo ?? "Inquilino"}
                            </p>
                            <p className="text-[11px] text-slate-400">{s.usuarios?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {s.vivienda?.titulo ?? "Vivienda"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 ml-5">
                          {s.vivienda?.ciudad?.split("-")[0]}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(s.fecha_entrada).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        →{" "}
                        {new Date(s.fecha_salida).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900">
                          {s.vivienda?.precio_mes ?? 0}€
                        </span>
                        <span className="text-xs text-slate-400">/mes</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1",
                            est.cls
                          )}
                        >
                          {est.key === "firmado" && <CheckCircle2 className="h-3 w-3" />}
                          {est.key.startsWith("pend") && <Clock className="h-3 w-3" />}
                          {est.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {pdfUrl ? (
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs ring-1 ring-indigo-200 border-0 text-indigo-600 hover:bg-indigo-50 gap-1"
                            >
                              <Eye className="h-3 w-3" /> Ver PDF
                            </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
