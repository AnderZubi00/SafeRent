"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
  Search,
  Receipt,
  Wallet,
  ArrowRight,
  Home,
  X,
  AlertTriangle,
  ChevronRight,
  CalendarDays,
  TrendingUp,
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

function PagoRow({ pago, showAction }: { pago: Pago; showAction?: boolean }) {
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

      {showAction && pago.estado === "PENDIENTE" && (
        <Link href={`/inquilino/checkout?vivienda=${pago.vivienda_id}&solicitud=${pago.solicitud_id}`}>
          <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1 shadow-sm shrink-0">
            Pagar <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      )}

      {showAction && pago.estado === "FALLIDO" && (
        <Link href={`/inquilino/checkout?vivienda=${pago.vivienda_id}&solicitud=${pago.solicitud_id}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-rose-200 text-rose-700 border-0 gap-1 shrink-0">
            Reintentar <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function PagosGroupedByVivienda({ pagos, showAction }: { pagos: Pago[]; showAction?: boolean }) {
  const pagosPorVivienda = pagos.reduce<Record<string, Pago[]>>((acc, p) => {
    const key = p.vivienda?.titulo ?? p.vivienda_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(pagosPorVivienda).map(([vivienda, pagosGrupo]) => {
        const subtotal = pagosGrupo.reduce((s, p) => s + Number(p.importe), 0);
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
                <PagoRow key={pago.id} pago={pago} showAction={showAction} />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState({ type }: { type: "all" | "pendientes" | "completados" | "fallidos" }) {
  const config = {
    all: {
      icon: Wallet,
      title: "Sin pagos registrados",
      desc: "Cuando completes una reserva y realices el pago, aparecerá aquí tu historial completo.",
      showSearch: true,
    },
    pendientes: {
      icon: Clock,
      title: "Sin pagos pendientes",
      desc: "No tenés pagos pendientes de completar.",
      showSearch: false,
    },
    completados: {
      icon: CheckCircle2,
      title: "Sin pagos completados",
      desc: "Aún no se ha registrado ningún pago completado.",
      showSearch: false,
    },
    fallidos: {
      icon: AlertTriangle,
      title: "Sin pagos fallidos",
      desc: "No hay pagos con errores.",
      showSearch: false,
    },
  };

  const c = config[type];
  const Icon = c.icon;

  return (
    <div className="text-center py-16 space-y-4">
      <div className="h-14 w-14 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
        <Icon className="h-7 w-7 text-slate-300" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
        <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
      </div>
      {c.showSearch && (
        <Link href="/buscar">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm">
            <Search className="h-4 w-4" /> Buscar alojamiento
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function PagosPage() {
  const { pagos, solicitudes, cargando } = useInquilino();

  const completados = pagos.filter((p) => p.estado === "COMPLETADO");
  const pendientes = pagos.filter((p) => p.estado === "PENDIENTE");
  const fallidos = pagos.filter((p) => p.estado === "FALLIDO");

  const totalPagado = completados.reduce((s, p) => s + Number(p.importe), 0);
  const totalPendiente = pendientes.reduce((s, p) => s + Number(p.importe), 0);

  const totalFianzas = completados
    .filter((p) => p.concepto === "fianza")
    .reduce((s, p) => s + Number(p.importe), 0);

  // "Próximo pago": solicitud aceptada con ambas firmas y sin pago completado
  const solicitudesSinPago = solicitudes.filter(
    (s) =>
      s.estado === "ACEPTADA" &&
      s.contrato?.firmado_inquilino &&
      s.contrato?.firmado_propietario &&
      !pagos.some((p) => p.solicitud_id === s.id && p.estado === "COMPLETADO")
  );
  const proximoPago = solicitudesSinPago[0];
  const proximoPagoImporte = proximoPago?.vivienda?.precio_mes ?? 0;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (pagos.length === 0 && solicitudesSinPago.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial y estado de tus pagos
          </p>
        </div>
        <EmptyState type="all" />
      </div>
    );
  }

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
              {totalPendiente > 0 ? (
                <Clock className="h-5 w-5 text-amber-600" />
              ) : (
                <Shield className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {totalPendiente > 0
                  ? `${formatCurrency(totalPendiente)}€`
                  : `${formatCurrency(totalFianzas)}€`}
              </p>
              <p className="text-xs text-slate-500">
                {totalPendiente > 0 ? "Pendiente de pago" : "Fianzas retenidas"}
              </p>
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

      {/* Alerta de pagos pendientes */}
      {(pendientes.length > 0 || solicitudesSinPago.length > 0) && (
        <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              {pendientes.length > 0
                ? `Tenés ${pendientes.length} pago${pendientes.length > 1 ? "s" : ""} pendiente${pendientes.length > 1 ? "s" : ""}`
                : `Tenés ${solicitudesSinPago.length} reserva${solicitudesSinPago.length > 1 ? "s" : ""} esperando pago`}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Completá el pago para finalizar tu reserva.
            </p>
          </div>
          {solicitudesSinPago.length > 0 && pendientes.length === 0 && (
            <Link href={`/inquilino/checkout?vivienda=${proximoPago.vivienda_id}&solicitud=${proximoPago.id}`}>
              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white gap-1 shadow-sm">
                Ir a pagar <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Alerta de pagos fallidos */}
      {fallidos.length > 0 && (
        <div className="bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4 flex items-start gap-3">
          <X className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-900">
              {fallidos.length} pago{fallidos.length > 1 ? "s" : ""} fallido{fallidos.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-rose-700 mt-0.5">
              Revisá el método de pago e intentá nuevamente.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={pendientes.length > 0 ? "pendientes" : "todos"}>
        <TabsList className="bg-slate-100 ring-1 ring-slate-200">
          <TabsTrigger value="todos" className="text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Todos
            <span className="ml-1 bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pagos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="text-xs gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pendientes
            {pendientes.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendientes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completados" className="text-xs gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completados
            {completados.length > 0 && (
              <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {completados.length}
              </span>
            )}
          </TabsTrigger>
          {fallidos.length > 0 && (
            <TabsTrigger value="fallidos" className="text-xs gap-1.5">
              <X className="h-3.5 w-3.5" />
              Fallidos
              <span className="ml-1 bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {fallidos.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          {pagos.length > 0 ? (
            <PagosGroupedByVivienda pagos={pagos} showAction />
          ) : (
            <EmptyState type="all" />
          )}
        </TabsContent>

        <TabsContent value="pendientes" className="mt-4">
          {pendientes.length > 0 ? (
            <PagosGroupedByVivienda pagos={pendientes} showAction />
          ) : (
            <EmptyState type="pendientes" />
          )}
        </TabsContent>

        <TabsContent value="completados" className="mt-4">
          {completados.length > 0 ? (
            <PagosGroupedByVivienda pagos={completados} />
          ) : (
            <EmptyState type="completados" />
          )}
        </TabsContent>

        <TabsContent value="fallidos" className="mt-4">
          {fallidos.length > 0 ? (
            <PagosGroupedByVivienda pagos={fallidos} showAction />
          ) : (
            <EmptyState type="fallidos" />
          )}
        </TabsContent>
      </Tabs>

      {/* Footer summary */}
      <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span>
            <strong className="text-slate-900">{pagos.length}</strong> pago{pagos.length !== 1 ? "s" : ""} registrado{pagos.length !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            {completados.length} completado{completados.length !== 1 ? "s" : ""}
          </span>
          {pendientes.length > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {fallidos.length > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                {fallidos.length} fallido{fallidos.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total acumulado</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(totalPagado)}€</p>
        </div>
      </div>
    </div>
  );
}
