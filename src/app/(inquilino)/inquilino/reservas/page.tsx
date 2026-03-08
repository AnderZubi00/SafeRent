"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  Loader2,
  Home,
  Inbox,
  Search,
  Clock,
  CheckCircle2,
  X,
  Send,
  PenTool,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInquilino, type SolicitudConContrato } from "@/context/InquilinoContext";

const PASO_LABELS = ["Identidad", "Temporalidad", "Contrato", "Pago"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function calcularMeses(entrada: string, salida: string): number {
  const start = new Date(entrada);
  const end = new Date(salida);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

function getEstadoInfo(sol: SolicitudConContrato) {
  const c = sol.contrato;
  if (c?.firmado_inquilino && c?.firmado_propietario) {
    return {
      label: "Contrato firmado",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0",
      icon: CheckCircle2,
    };
  }
  if (c?.firmado_propietario && !c?.firmado_inquilino) {
    return {
      label: "Firma pendiente",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0",
      icon: PenTool,
    };
  }
  if (sol.estado === "ACEPTADA") {
    return {
      label: "Aceptada",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0",
      icon: CheckCircle2,
    };
  }
  if (sol.estado === "PENDIENTE") {
    return {
      label: "En revisión",
      className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 border-0",
      icon: Send,
    };
  }
  return {
    label: "Rechazada",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 border-0",
    icon: X,
  };
}

function getCheckoutUrl(sol: SolicitudConContrato) {
  return `/inquilino/checkout?vivienda=${sol.vivienda_id}&solicitud=${sol.id}`;
}

function calcularPasos(sol: SolicitudConContrato) {
  const c = sol.contrato;
  const inquilinoFirmo = c?.firmado_inquilino ?? false;
  const propietarioFirmo = c?.firmado_propietario ?? false;
  const ambosFirmaron = inquilinoFirmo && propietarioFirmo;

  return [
    { done: true, current: false },
    { done: true, current: sol.estado === "PENDIENTE" },
    { done: inquilinoFirmo, current: sol.estado === "ACEPTADA" && propietarioFirmo && !inquilinoFirmo },
    { done: ambosFirmaron, current: inquilinoFirmo && !ambosFirmaron },
  ];
}

function SolicitudCard({ sol }: { sol: SolicitudConContrato }) {
  const estado = getEstadoInfo(sol);
  const EstadoIcon = estado.icon;
  const pasos = sol.estado !== "RECHAZADA" ? calcularPasos(sol) : null;
  const pasosCompletados = pasos ? pasos.filter((p) => p.done).length : 0;
  const progreso = pasos ? Math.round((pasosCompletados / pasos.length) * 100) : 0;
  const meses = calcularMeses(sol.fecha_entrada, sol.fecha_salida);
  const enProceso = sol.estado === "PENDIENTE" || (sol.estado === "ACEPTADA" && !(sol.contrato?.firmado_inquilino && sol.contrato?.firmado_propietario));

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-40 h-32 sm:h-auto shrink-0 relative">
            {sol.viviendas?.fotos?.[0] ? (
              <img
                src={sol.viviendas.fotos[0]}
                alt={sol.viviendas.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <Home className="h-10 w-10 text-white/60" />
              </div>
            )}
            <Badge className={cn("absolute top-2 left-2 text-[10px] shadow-sm", estado.className)}>
              <EstadoIcon className="h-3 w-3 mr-1" />
              {estado.label}
            </Badge>
          </div>

          <div className="flex-1 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {sol.viviendas?.titulo ?? "Vivienda"}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {sol.viviendas?.ciudad}
                  {sol.viviendas?.barrio && `, ${sol.viviendas.barrio}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-slate-900">
                  {sol.viviendas?.precio_mes?.toLocaleString("es-ES")}€
                </p>
                <p className="text-[10px] text-slate-400">/mes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatDateShort(sol.fecha_entrada)} – {formatDateShort(sol.fecha_salida)}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-medium">{meses} mes{meses > 1 ? "es" : ""}</span>
              <span className="text-slate-300">|</span>
              <span className="capitalize text-slate-500">{sol.motivo}</span>
            </div>

            {pasos && sol.estado !== "RECHAZADA" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Progress value={progreso} className="h-1.5 bg-slate-100 flex-1" />
                  <span className="text-[10px] font-semibold text-slate-500">{progreso}%</span>
                </div>
                <div className="flex gap-1">
                  {PASO_LABELS.map((label, i) => {
                    const paso = pasos[i];
                    return (
                      <div key={label} className="flex items-center gap-1">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold",
                            paso.done
                              ? "bg-emerald-500 text-white"
                              : paso.current
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-200"
                                : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {paso.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : i + 1}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] mr-2",
                            paso.done
                              ? "text-emerald-700 font-medium"
                              : paso.current
                                ? "text-indigo-700 font-medium"
                                : "text-slate-400"
                          )}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sol.estado === "RECHAZADA" && sol.motivo_rechazo && (
              <div className="bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">
                <p className="text-xs text-rose-700">
                  <span className="font-semibold">Motivo:</span> {sol.motivo_rechazo}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {enProceso && (
                <Link href={getCheckoutUrl(sol)}>
                  <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1 shadow-sm">
                    {sol.contrato?.firmado_propietario && !sol.contrato?.firmado_inquilino
                      ? <>Firmar contrato <PenTool className="h-3 w-3" /></>
                      : <>Continuar <ChevronRight className="h-3 w-3" /></>}
                  </Button>
                </Link>
              )}
              {sol.contrato?.pdf_borrador_url && (
                <a href={sol.contrato.pdf_borrador_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-slate-200 border-0 gap-1">
                    <FileText className="h-3 w-3" /> Contrato <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
              {sol.estado === "RECHAZADA" && (
                <Link href="/buscar">
                  <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-slate-200 border-0 gap-1">
                    <Search className="h-3 w-3" /> Buscar otra
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
  const { solicitudes, cargando } = useInquilino();

  const activas = solicitudes.filter(
    (s) => s.estado === "PENDIENTE" || s.estado === "ACEPTADA"
  );
  const finalizadas = solicitudes.filter(
    (s) => s.estado === "RECHAZADA" || (s.estado === "ACEPTADA" && s.contrato?.firmado_inquilino && s.contrato?.firmado_propietario)
  );

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Reservas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historial y estado de tus solicitudes de alquiler
          </p>
        </div>
        <Link href="/buscar">
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm">
            <Search className="h-3.5 w-3.5" /> Buscar alojamiento
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="activas">
        <TabsList className="bg-slate-100 ring-1 ring-slate-200">
          <TabsTrigger value="activas" className="text-xs gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Activas
            {activas.length > 0 && (
              <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="finalizadas" className="text-xs gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finalizadas
            {finalizadas.length > 0 && (
              <span className="ml-1 bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {finalizadas.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="mt-4 space-y-4">
          {activas.length > 0 ? (
            activas.map((sol) => <SolicitudCard key={sol.id} sol={sol} />)
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
                <Inbox className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Sin reservas activas
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Cuando reserves una vivienda, aparecerá aquí con su estado en tiempo real.
                </p>
              </div>
              <Link href="/buscar">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm">
                  <Search className="h-4 w-4" /> Buscar alojamiento
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="finalizadas" className="mt-4 space-y-4">
          {finalizadas.length > 0 ? (
            finalizadas.map((sol) => <SolicitudCard key={sol.id} sol={sol} />)
          ) : (
            <div className="text-center py-16 space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
                <Calendar className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Sin historial
              </h3>
              <p className="text-xs text-slate-500">
                Las reservas completadas y solicitudes rechazadas aparecerán aquí.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {solicitudes.length > 0 && (
        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              <strong className="text-slate-900">{solicitudes.length}</strong> solicitud{solicitudes.length > 1 ? "es" : ""} total{solicitudes.length > 1 ? "es" : ""}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              {activas.length} activa{activas.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-slate-300" />
              {finalizadas.length} finalizada{finalizadas.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Link href="/inquilino">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 gap-1">
              Panel <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
