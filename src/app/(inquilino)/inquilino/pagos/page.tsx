"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
  Inbox,
  Search,
  MapPin,
  Receipt,
  Wallet,
  ArrowRight,
  Home,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInquilino } from "@/context/InquilinoContext";
import type { Pago } from "@/lib/pagos";

const CONCEPTO_LABELS: Record<string, { label: string; desc: string }> = {
  primer_mes: { label: "Primer mes de renta", desc: "Renta mensual" },
  fianza: { label: "Fianza", desc: "Depósito reembolsable" },
  comision_servicio: { label: "Comisión de servicio", desc: "Comisión SafeRent" },
  renta_mensual: { label: "Renta mensual", desc: "Pago mensual" },
};

const ESTADO_CONFIG = {
  COMPLETADO: {
    label: "Pagado",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0",
    icon: CheckCircle2,
  },
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0",
    icon: Clock,
  },
  FALLIDO: {
    label: "Fallido",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 border-0",
    icon: X,
  },
} as const;

function getConceptoIcon(concepto: string) {
  switch (concepto) {
    case "fianza":
      return Shield;
    case "comision_servicio":
      return Receipt;
    default:
      return CreditCard;
  }
}

function getConceptoBg(concepto: string) {
  switch (concepto) {
    case "fianza":
      return "bg-amber-50 ring-amber-200";
    case "comision_servicio":
      return "bg-slate-50 ring-slate-200";
    default:
      return "bg-indigo-50 ring-indigo-200";
  }
}

function getConceptoColor(concepto: string) {
  switch (concepto) {
    case "fianza":
      return "text-amber-600";
    case "comision_servicio":
      return "text-slate-600";
    default:
      return "text-indigo-600";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function PagoRow({ pago }: { pago: Pago }) {
  const conceptoInfo = CONCEPTO_LABELS[pago.concepto] ?? {
    label: pago.concepto,
    desc: "",
  };
  const estadoKey = pago.estado as keyof typeof ESTADO_CONFIG;
  const estado = ESTADO_CONFIG[estadoKey] ?? ESTADO_CONFIG.COMPLETADO;
  const EstadoIcon = estado.icon;
  const ConceptoIcon = getConceptoIcon(pago.concepto);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl ring-1 ring-slate-200 hover:shadow-sm transition-shadow bg-white">
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center ring-1 shrink-0",
          getConceptoBg(pago.concepto)
        )}
      >
        <ConceptoIcon className={cn("h-5 w-5", getConceptoColor(pago.concepto))} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{conceptoInfo.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {pago.vivienda && (
            <>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Home className="h-3 w-3" />
                {pago.vivienda.titulo}
              </span>
              <span className="text-slate-300">·</span>
            </>
          )}
          <span className="text-xs text-slate-400">{formatDate(pago.fecha_pago)}</span>
          {conceptoInfo.desc && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{conceptoInfo.desc}</span>
            </>
          )}
        </div>
      </div>

      <p className="text-base font-bold text-slate-900 shrink-0 tabular-nums">
        {formatCurrency(Number(pago.importe))}€
      </p>

      <Badge className={cn("text-[10px] shrink-0", estado.className)}>
        <EstadoIcon className="h-3 w-3 mr-1" />
        {estado.label}
      </Badge>
    </div>
  );
}

export default function PagosPage() {
  const { pagos, solicitudes, cargando } = useInquilino();

  const totalPagado = pagos
    .filter((p) => p.estado === "COMPLETADO")
    .reduce((s, p) => s + Number(p.importe), 0);

  const totalFianzas = pagos
    .filter((p) => p.concepto === "fianza" && p.estado === "COMPLETADO")
    .reduce((s, p) => s + Number(p.importe), 0);

  const proximoPago = solicitudes.find(
    (s) =>
      s.estado === "ACEPTADA" &&
      s.contrato?.firmado_inquilino &&
      s.contrato?.firmado_propietario
  );
  const proximoPagoImporte = proximoPago?.viviendas?.precio_mes ?? 0;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (pagos.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial y estado de tus pagos
          </p>
        </div>
        <div className="text-center py-20 space-y-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
            <Wallet className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Sin pagos registrados
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Cuando completes una reserva y realices el pago, aparecerá aquí tu historial completo.
            </p>
          </div>
          <Link href="/buscar">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm">
              <Search className="h-4 w-4" /> Buscar alojamiento
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pagosPorVivienda = pagos.reduce<Record<string, Pago[]>>((acc, p) => {
    const key = p.vivienda?.titulo ?? p.vivienda_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial y estado de tus pagos
          </p>
        </div>
        <Link href="/inquilino">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 hover:text-indigo-700 gap-1">
            Panel <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalPagado)}€
              </p>
              <p className="text-xs text-slate-500">Total pagado</p>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalFianzas)}€
              </p>
              <p className="text-xs text-slate-500">Fianzas retenidas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-slate-200 shadow-sm border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-500/10">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {proximoPagoImporte > 0
                  ? `${formatCurrency(proximoPagoImporte)}€`
                  : "--"}
              </p>
              <p className="text-xs text-slate-500">Próximo pago</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments grouped by property */}
      <div className="space-y-6">
        {Object.entries(pagosPorVivienda).map(([vivienda, pagosGrupo]) => {
          const subtotal = pagosGrupo.reduce(
            (s, p) => s + Number(p.importe),
            0
          );
          return (
            <Card key={vivienda} className="ring-1 ring-slate-200 shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center">
                      <Home className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      {vivienda}
                    </CardTitle>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Subtotal: <span className="text-slate-900">{formatCurrency(subtotal)}€</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pagosGrupo.map((pago) => (
                  <PagoRow key={pago.id} pago={pago} />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            <strong className="text-slate-900">{pagos.length}</strong> pago{pagos.length !== 1 ? "s" : ""} registrado{pagos.length !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            {pagos.filter((p) => p.estado === "COMPLETADO").length} completado{pagos.filter((p) => p.estado === "COMPLETADO").length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total acumulado</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(totalPagado)}€</p>
        </div>
      </div>
    </div>
  );
}
