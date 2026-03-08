"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck,
  CreditCard,
  FileText,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Search,
  Clock,
  Home,
  Loader2,
  X,
  Inbox,
  Send,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useInquilino, type SolicitudConContrato } from "@/context/InquilinoContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCheckoutUrl(sol: SolicitudConContrato) {
  return `/inquilino/checkout?vivienda=${sol.vivienda_id}&solicitud=${sol.id}`;
}

function getEstadoBadge(sol: SolicitudConContrato) {
  if (sol.contrato?.firmado_inquilino && sol.contrato?.firmado_propietario) {
    return { label: "Contrato firmado", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0" };
  }
  if (sol.contrato?.firmado_propietario && !sol.contrato?.firmado_inquilino) {
    return { label: "Firma pendiente", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0" };
  }
  if (sol.estado === "ACEPTADA") {
    return { label: "Aceptada", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0" };
  }
  if (sol.estado === "PENDIENTE") {
    return { label: "Pendiente", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 border-0" };
  }
  return { label: "Rechazada", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 border-0" };
}

export default function InquilinoInicio() {
  const { usuario } = useAuth();
  const { solicitudes, cargando } = useInquilino();

  const nombre = usuario?.nombre_completo?.split(" ")[0] ?? "inquilino";

  const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE");
  const aceptadas = solicitudes.filter((s) => s.estado === "ACEPTADA");
  const rechazadas = solicitudes.filter((s) => s.estado === "RECHAZADA");

  const contratoPendienteFirma = aceptadas.find(
    (s) => s.contrato?.firmado_propietario && !s.contrato?.firmado_inquilino
  );

  const proximaEstancia =
    aceptadas.find((s) => s.contrato?.firmado_inquilino) ??
    aceptadas[0] ??
    null;

  const solicitudActiva = pendientes[0] ?? aceptadas[0] ?? null;

  function calcularPasos(): { label: string; done: boolean; current: boolean }[] {
    if (!solicitudActiva) {
      return [
        { label: "Identidad", done: false, current: false },
        { label: "Temporalidad", done: false, current: false },
        { label: "Contrato", done: false, current: false },
        { label: "Pago", done: false, current: false },
      ];
    }

    const sa = solicitudes.find((s) => s.id === solicitudActiva.id) as SolicitudConContrato;
    const contrato = sa?.contrato;
    const inquilinoFirmo = contrato?.firmado_inquilino ?? false;
    const propietarioFirmo = contrato?.firmado_propietario ?? false;
    const ambosFirmaron = inquilinoFirmo && propietarioFirmo;

    return [
      { label: "Identidad", done: true, current: false },
      { label: "Temporalidad", done: true, current: sa.estado === "PENDIENTE" },
      {
        label: "Contrato",
        done: inquilinoFirmo,
        current: sa.estado === "ACEPTADA" && propietarioFirmo && !inquilinoFirmo,
      },
      { label: "Pago", done: ambosFirmaron, current: inquilinoFirmo && !ambosFirmaron },
    ];
  }

  const pasos = calcularPasos();
  const pasosCompletados = pasos.filter((p) => p.done).length;
  const progreso = Math.round((pasosCompletados / pasos.length) * 100);

  const solicitudesActivas = pendientes.length + aceptadas.length;
  const contratosPendientes = aceptadas.filter(
    (s) => s.contrato && !s.contrato.firmado_inquilino
  ).length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-sm ring-1 ring-indigo-500/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-sm font-medium mb-1">
            Bienvenido de vuelta
          </p>
          <h1 className="text-2xl font-bold">{nombre}</h1>
          {solicitudesActivas > 0 ? (
            <p className="text-indigo-100 text-sm mt-1">
              Tienes {solicitudesActivas} solicitud{solicitudesActivas > 1 ? "es" : ""} activa{solicitudesActivas > 1 ? "s" : ""}
              {contratosPendientes > 0 && ` y ${contratosPendientes} contrato${contratosPendientes > 1 ? "s" : ""} pendiente${contratosPendientes > 1 ? "s" : ""} de firma`}.
            </p>
          ) : (
            <p className="text-indigo-100 text-sm mt-1">
              Encuentra tu próximo hogar temporal.
            </p>
          )}
        </div>
        <Link href="/buscar">
          <Button className="bg-white/15 hover:bg-white/25 text-white border-0 ring-1 ring-white/20 backdrop-blur-sm gap-2 shrink-0">
            <Search className="h-4 w-4" /> Buscar
          </Button>
        </Link>
      </div>

      {/* Alertas condicionales */}
      {contratoPendienteFirma && (
        <div className="flex items-start gap-3 rounded-xl ring-1 ring-amber-200 bg-amber-50 px-4 py-3.5">
          <PenTool className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Contrato pendiente de firma
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              El propietario ha aceptado y firmado tu solicitud para{" "}
              <strong>{contratoPendienteFirma.viviendas?.titulo}</strong>. Firma el contrato para continuar.
            </p>
          </div>
          <Link href={getCheckoutUrl(contratoPendienteFirma)} className="shrink-0">
            <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              Firmar <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {!contratoPendienteFirma && pendientes.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl ring-1 ring-indigo-200 bg-indigo-50 px-4 py-3.5">
          <Send className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900">
              Solicitud enviada
            </p>
            <p className="text-xs text-indigo-700 mt-0.5">
              Tu solicitud para <strong>{pendientes[0].viviendas?.titulo}</strong> está siendo revisada por el propietario.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 shrink-0">
            <Clock className="h-3.5 w-3.5 animate-pulse" /> Esperando respuesta
          </div>
        </div>
      )}

      {!contratoPendienteFirma && pendientes.length === 0 && rechazadas.length > 0 && aceptadas.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl ring-1 ring-rose-200 bg-rose-50 px-4 py-3.5">
          <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-900">
              Solicitud rechazada
            </p>
            <p className="text-xs text-rose-700 mt-0.5">
              Tu solicitud para <strong>{rechazadas[0].viviendas?.titulo}</strong> no fue aceptada.
              {rechazadas[0].motivo_rechazo && (
                <> Motivo: {rechazadas[0].motivo_rechazo}</>
              )}
            </p>
          </div>
          <Link href="/buscar" className="shrink-0">
            <Button size="sm" className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
              Buscar otra <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
                <CalendarCheck className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                solicitudesActivas > 0
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
              )}>
                {solicitudesActivas > 0 ? "En curso" : "Sin actividad"}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{solicitudesActivas}</p>
            <p className="text-xs text-slate-500 mt-0.5">Solicitudes activas</p>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-amber-500/10">
                <FileText className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                contratosPendientes > 0
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
              )}>
                {contratosPendientes > 0 ? "Requiere acción" : "Al día"}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{contratosPendientes}</p>
            <p className="text-xs text-slate-500 mt-0.5">Contratos pendientes</p>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-indigo-500/10">
                <CreditCard className="h-4.5 w-4.5 text-indigo-600" />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                {proximaEstancia ? formatDate(proximaEstancia.fecha_entrada) : "--"}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {proximaEstancia ? `${proximaEstancia.viviendas?.precio_mes?.toLocaleString("es-ES")}€` : "--"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Próximo pago</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Próxima estancia */}
        <Card className="ring-1 ring-slate-200 shadow-sm border-0 lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Próxima estancia
              </CardTitle>
              {solicitudes.length > 0 && (
                <Link href="/inquilino/reservas">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 gap-1">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {proximaEstancia ? (
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                {proximaEstancia.viviendas?.fotos?.[0] ? (
                  <img
                    src={proximaEstancia.viviendas.fotos[0]}
                    alt={proximaEstancia.viviendas.titulo}
                    className="h-14 w-14 rounded-xl object-cover shrink-0 ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="h-14 w-14 bg-linear-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <Home className="h-7 w-7 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {proximaEstancia.viviendas?.titulo ?? "Vivienda"}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {proximaEstancia.viviendas?.ciudad}
                      </p>
                    </div>
                    <Badge className={getEstadoBadge(proximaEstancia).className + " text-xs shrink-0"}>
                      {getEstadoBadge(proximaEstancia).label}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        Entrada
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {formatDate(proximaEstancia.fecha_entrada)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        Salida
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {formatDate(proximaEstancia.fecha_salida)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="h-14 w-14 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
                  <Inbox className="h-7 w-7 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Sin estancias programadas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Busca entre cientos de viviendas verificadas.
                  </p>
                </div>
                <Link href="/buscar">
                  <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5">
                    <Search className="h-3.5 w-3.5" /> Encuentra tu hogar
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progreso de reserva */}
        {solicitudActiva ? (
          <Card className="ring-1 ring-slate-200 shadow-sm border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Progreso de reserva
                </CardTitle>
                <Link href={getCheckoutUrl(solicitudActiva as SolicitudConContrato)}>
                  <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shadow-sm">
                    Continuar <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Completado</span>
                  <span className="font-semibold text-slate-900">{progreso}%</span>
                </div>
                <Progress value={progreso} className="h-1.5 bg-slate-100" />
              </div>
              <div className="space-y-2">
                {pasos.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                        step.done
                          ? "bg-emerald-500 text-white shadow-sm"
                          : step.current
                            ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                            : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                      )}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        step.done
                          ? "text-slate-900 font-medium"
                          : step.current
                            ? "text-indigo-700 font-medium"
                            : "text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                    {step.done && (
                      <span className="ml-auto text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full ring-1 ring-emerald-200">
                        Listo
                      </span>
                    )}
                    {step.current && (
                      <span className="ml-auto text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-full ring-1 ring-indigo-200 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> En curso
                      </span>
                    )}
                    {!step.done && !step.current && (
                      <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="ring-1 ring-slate-200 shadow-sm border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Progreso de reserva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
                  <CalendarCheck className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-xs text-slate-500">
                  Cuando reserves una vivienda, aquí verás el progreso.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Historial de solicitudes */}
      {solicitudes.length > 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Historial de solicitudes
          </p>
          <div className="space-y-2">
            {solicitudes.slice(0, 5).map((sol) => {
              const badge = getEstadoBadge(sol);
              return (
                <div
                  key={sol.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl ring-1 ring-slate-200 hover:shadow-sm transition-shadow"
                >
                  {sol.viviendas?.fotos?.[0] ? (
                    <img
                      src={sol.viviendas.fotos[0]}
                      alt={sol.viviendas.titulo}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                      <Home className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {sol.viviendas?.titulo ?? "Vivienda"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(sol.fecha_entrada)} – {formatDate(sol.fecha_salida)}
                    </p>
                  </div>
                  <Badge className={badge.className + " text-[10px] shrink-0"}>
                    {badge.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Accesos rápidos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Mis reservas",
              href: "/inquilino/reservas",
              icon: CalendarCheck,
              color: "text-emerald-600",
              bg: "bg-emerald-50 hover:bg-emerald-100",
              ring: "ring-emerald-200",
            },
            {
              label: "Documentos",
              href: "/inquilino/documentos",
              icon: FileText,
              color: "text-amber-600",
              bg: "bg-amber-50 hover:bg-amber-100",
              ring: "ring-amber-200",
            },
            {
              label: "Pagos",
              href: "/inquilino/pagos",
              icon: CreditCard,
              color: "text-indigo-600",
              bg: "bg-indigo-50 hover:bg-indigo-100",
              ring: "ring-indigo-200",
            },
            {
              label: "Buscar piso",
              href: "/buscar",
              icon: Search,
              color: "text-slate-600",
              bg: "bg-slate-50 hover:bg-slate-100",
              ring: "ring-slate-200",
            },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ring-1 ${a.ring} text-center transition-all cursor-pointer ${a.bg}`}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-200">
                  <a.icon className={`h-4 w-4 ${a.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {a.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
