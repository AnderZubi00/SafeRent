"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  Calendar,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Send,
  User,
  FileText,
  ExternalLink,
  PenTool,
  Loader2,
  Inbox,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropietario, type SolicitudConContrato } from "@/store/propietarioStore";
import ToggleActivaButton from "../../_components/ToggleActivaButton";
import type { PagoPropietario } from "@/lib/pagos";

const COMISION_RATE = 0.03;

function formatCurrency(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function useViviendaDetail(id: string) {
  const { viviendas, solicitudes, pagos, cargando } = usePropietario();

  return useMemo(() => {
    const vivienda = viviendas.find((v) => v.id === id) ?? null;
    const sols = solicitudes.filter((s) => s.vivienda_id === id);
    const pays = pagos.filter((p) => p.vivienda_id === id);
    const completados = pays.filter((p) => p.estado === "COMPLETADO");
    const totalEarned = completados.reduce((s, p) => s + Number(p.importe), 0);
    const totalPending = pays.filter((p) => p.estado === "PENDIENTE").reduce((s, p) => s + Number(p.importe), 0);
    const commission = totalEarned * COMISION_RATE;
    const netEarned = totalEarned - commission;
    const activeContract = sols.find((s) => s.estado === "ACEPTADA" && s.contrato) ?? null;

    return { vivienda, sols, pays, totalEarned, totalPending, commission, netEarned, activeContract, cargando };
  }, [id, viviendas, solicitudes, pagos, cargando]);
}

function getEstadoBadge(estado: string) {
  switch (estado) {
    case "ACEPTADA":
      return { label: "Aceptada", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0", icon: CheckCircle2 };
    case "PENDIENTE":
      return { label: "Pendiente", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0", icon: Send };
    default:
      return { label: "Rechazada", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 border-0", icon: X };
  }
}

/* ─── Photo Gallery ─── */
function PhotoGallery({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  if (fotos.length === 0) {
    return (
      <div className="h-64 bg-linear-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center">
        <Building2 className="h-12 w-12 text-white/60" />
      </div>
    );
  }

  if (fotos.length === 1) {
    return (
      <div className="h-64 sm:h-80 rounded-xl overflow-hidden">
        <img src={fotos[0]} alt={titulo} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 h-64 sm:h-80 overflow-hidden">
      <div className="col-span-2 rounded-xl overflow-hidden">
        <img src={fotos[0]} alt={titulo} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </div>
      <div className="flex flex-col gap-2 min-h-0">
        {fotos.slice(1, 3).map((f, i) => (
          <div key={i} className="flex-1 rounded-xl overflow-hidden relative min-h-0">
            <img src={f} alt={`${titulo} ${i + 2}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            {i === 1 && fotos.length > 3 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-sm font-bold">+{fotos.length - 3}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Solicitud Card ─── */
function SolicitudMiniCard({ sol }: { sol: SolicitudConContrato }) {
  const badge = getEstadoBadge(sol.estado);
  const BadgeIcon = badge.icon;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl ring-1 ring-slate-200 bg-white hover:shadow-sm transition-shadow">
      <div className="h-9 w-9 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center shrink-0">
        <User className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {sol.usuarios?.nombre_completo ?? sol.inquilino?.nombre_completo ?? "Inquilino"}
          </p>
          <Badge className={cn("text-[10px] shrink-0", badge.className)}>
            <BadgeIcon className="h-3 w-3 mr-1" />
            {badge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateShort(sol.fecha_entrada)} – {formatDateShort(sol.fecha_salida)}
          </span>
          <span className="capitalize">{sol.motivo}</span>
        </div>
        {sol.estado === "RECHAZADA" && sol.motivo_rechazo && (
          <p className="text-xs text-rose-600 mt-1">Motivo: {sol.motivo_rechazo}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Occupancy Timeline ─── */
function OccupancyTimeline({ solicitudes }: { solicitudes: SolicitudConContrato[] }) {
  const aceptadas = solicitudes.filter((s) => s.estado === "ACEPTADA");

  if (aceptadas.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-7 w-7 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Sin reservas registradas</p>
      </div>
    );
  }

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 6, 0);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  const nowPct = ((now.getTime() - rangeStart.getTime()) / totalMs) * 100;

  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1);
    months.push(d.toLocaleDateString("es-ES", { month: "short" }));
  }

  return (
    <div className="space-y-3">
      {/* Month labels */}
      <div className="flex text-[10px] text-slate-400 font-medium">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-center">{m}</div>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
        {/* Now marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 z-20"
          style={{ left: `${Math.min(Math.max(nowPct, 0), 100)}%` }}
        />

        {/* Booking bars */}
        {aceptadas.map((s) => {
          const start = new Date(s.fecha_entrada);
          const end = new Date(s.fecha_salida);
          const leftPct = Math.max(0, ((start.getTime() - rangeStart.getTime()) / totalMs) * 100);
          const widthPct = Math.min(100 - leftPct, ((end.getTime() - start.getTime()) / totalMs) * 100);
          const isPast = end < now;

          return (
            <div
              key={s.id}
              className={cn(
                "absolute top-1 bottom-1 rounded-md z-10",
                isPast ? "bg-slate-300" : "bg-emerald-400"
              )}
              style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
              title={`${s.usuarios?.nombre_completo ?? "Inquilino"}: ${formatDateShort(s.fecha_entrada)} – ${formatDateShort(s.fecha_salida)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-400" /> Activa</span>
        <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-300" /> Pasada</span>
        <span className="flex items-center gap-1"><div className="h-2 w-0.5 bg-indigo-600" /> Hoy</span>
      </div>
    </div>
  );
}

/* ─── Payment Table ─── */
function PaymentTable({ pagos }: { pagos: PagoPropietario[] }) {
  if (pagos.length === 0) {
    return (
      <div className="text-center py-8">
        <Wallet className="h-7 w-7 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Sin pagos registrados para esta vivienda</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/40">
          <TableHead className="text-xs font-semibold text-slate-500">Concepto</TableHead>
          <TableHead className="text-xs font-semibold text-slate-500">Inquilino</TableHead>
          <TableHead className="text-xs font-semibold text-slate-500">Fecha</TableHead>
          <TableHead className="text-xs font-semibold text-slate-500 text-right">Bruto</TableHead>
          <TableHead className="text-xs font-semibold text-slate-500 text-right">Comisión</TableHead>
          <TableHead className="text-xs font-semibold text-slate-500 text-right">Neto</TableHead>
          <TableHead className="text-xs font-semibold text-slate-500 text-right">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagos.map((p) => {
          const comision = Number(p.importe) * COMISION_RATE;
          const neto = Number(p.importe) - comision;
          return (
            <TableRow key={p.id} className="hover:bg-slate-50/60">
              <TableCell className="font-medium text-slate-900 text-sm capitalize">
                {p.concepto.replace(/_/g, " ")}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {p.solicitud?.inquilino?.nombre_completo ?? "Inquilino"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-slate-500">{formatDate(p.fecha_pago)}</TableCell>
              <TableCell className="text-right text-sm text-slate-600">{formatCurrency(Number(p.importe))}€</TableCell>
              <TableCell className="text-right text-sm text-rose-500">-{formatCurrency(comision)}€</TableCell>
              <TableCell className="text-right font-semibold text-slate-900 text-sm">{formatCurrency(neto)}€</TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                  p.estado === "COMPLETADO" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {p.estado === "COMPLETADO"
                    ? <><CheckCircle2 className="h-3 w-3" /> Recibido</>
                    : <><Clock className="h-3 w-3" /> Pendiente</>}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ─── Contract Section ─── */
function ContractSection({ sol }: { sol: SolicitudConContrato | null }) {
  if (!sol?.contrato) {
    return (
      <div className="text-center py-8">
        <FileText className="h-7 w-7 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Sin contrato activo para esta vivienda</p>
      </div>
    );
  }

  const c = sol.contrato;
  const pdfUrl = c.pdf_final_url ?? c.pdf_borrador_url;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4 p-4 rounded-xl ring-1 ring-slate-200 bg-white">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              Contrato con {sol.usuarios?.nombre_completo ?? sol.inquilino?.nombre_completo ?? "Inquilino"}
            </p>
            {c.firmado_propietario && c.firmado_inquilino ? (
              <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Firmado
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0 text-[10px]">
                <PenTool className="h-3 w-3 mr-1" /> Pendiente firma
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateShort(sol.fecha_entrada)} – {formatDateShort(sol.fecha_salida)}
            </span>
          </div>

          <div className="flex gap-3 text-xs">
            <span className={cn("flex items-center gap-1", c.firmado_propietario ? "text-emerald-600" : "text-slate-400")}>
              {c.firmado_propietario ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              Propietario
            </span>
            <span className={cn("flex items-center gap-1", c.firmado_inquilino ? "text-emerald-600" : "text-slate-400")}>
              {c.firmado_inquilino ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              Inquilino
            </span>
          </div>

          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-slate-200 border-0 gap-1 mt-1">
                <FileText className="h-3 w-3" /> Ver PDF <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ViviendaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { vivienda, sols, pays, totalEarned, totalPending, commission, netEarned, activeContract, cargando } = useViviendaDetail(id);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!vivienda) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
          <Building2 className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Vivienda no encontrada</h3>
        <Link href="/propietario">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Volver al panel
          </Button>
        </Link>
      </div>
    );
  }

  const pendientes = sols.filter((s) => s.estado === "PENDIENTE").length;
  const aceptadas = sols.filter((s) => s.estado === "ACEPTADA").length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back nav */}
      <Link href="/propietario" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Mis viviendas
      </Link>

      {/* ─── Section A: Header ─── */}
      <div className="space-y-4">
        <PhotoGallery fotos={vivienda.fotos ?? []} titulo={vivienda.titulo} />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{vivienda.titulo}</h1>
              <Badge className={cn(
                "text-[10px]",
                vivienda.activa
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0"
                  : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 border-0"
              )}>
                {vivienda.activa ? "Activa" : "Pausada"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {vivienda.direccion}, {vivienda.ciudad}{vivienda.provincia ? ` (${vivienda.provincia})` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-slate-900">{vivienda.precio_mes}€</p>
            <p className="text-xs text-slate-400">/mes</p>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
            <Bed className="h-3.5 w-3.5" /> {vivienda.habitaciones} hab
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
            <Bath className="h-3.5 w-3.5" /> {vivienda.banos} {vivienda.banos === 1 ? "baño" : "baños"}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
            <Ruler className="h-3.5 w-3.5" /> {vivienda.m2}m²
          </span>
          {vivienda.estancia_minima > 0 && (
            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full ring-1 ring-slate-200">
              <Calendar className="h-3.5 w-3.5" /> {vivienda.estancia_minima}–{vivienda.estancia_maxima} meses
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <ToggleActivaButton id={vivienda.id} activa={vivienda.activa} />
          <Link href={`/propietario/vivienda/${vivienda.id}/editar`}>
            <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-indigo-200 border-0 text-indigo-600 hover:bg-indigo-50 gap-1">
              <Edit3 className="h-3 w-3" /> Editar
            </Button>
          </Link>
          <Link href={`/vivienda/${vivienda.id}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-slate-200 border-0 gap-1">
              Ver anuncio <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Section B: Finanzas ─── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-600" /> Finanzas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total ganado", value: `${formatCurrency(totalEarned)}€`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Pendiente de cobro", value: `${formatCurrency(totalPending)}€`, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
            { label: "Neto (comisión 3%)", value: `${formatCurrency(netEarned)}€`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-500/10" },
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

        <Card className="ring-1 ring-slate-200 shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-3 bg-slate-50/80 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900">Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PaymentTable pagos={pays} />
          </CardContent>
        </Card>
      </div>

      {/* ─── Section C: Solicitudes ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" /> Solicitudes
            {sols.length > 0 && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {sols.length}
              </span>
            )}
          </h2>
          {pendientes > 0 && (
            <Link href="/propietario/solicitudes">
              <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-amber-200 border-0 text-amber-700 hover:bg-amber-50 gap-1">
                {pendientes} pendiente{pendientes > 1 ? "s" : ""} <ArrowLeft className="h-3 w-3 rotate-180" />
              </Button>
            </Link>
          )}
        </div>

        {sols.length > 0 ? (
          <div className="space-y-3">
            {sols.map((s) => (
              <SolicitudMiniCard key={s.id} sol={s} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Inbox className="h-7 w-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No hay solicitudes para esta vivienda</p>
          </div>
        )}
      </div>

      {/* ─── Section D: Contrato activo ─── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" /> Contrato activo
        </h2>
        <ContractSection sol={activeContract} />
      </div>

      {/* ─── Section E: Ocupación ─── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" /> Ocupación
        </h2>
        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5">
            <OccupancyTimeline solicitudes={sols} />
          </CardContent>
        </Card>
      </div>

      {/* Footer summary */}
      <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            <strong className="text-slate-900">{sols.length}</strong> solicitud{sols.length !== 1 ? "es" : ""}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            {aceptadas} aceptada{aceptadas !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            {pendientes} pendiente{pendientes !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Ingresos netos</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(netEarned)}€</p>
        </div>
      </div>
    </div>
  );
}
