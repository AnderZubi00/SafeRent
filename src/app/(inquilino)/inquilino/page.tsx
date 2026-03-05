import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck, CreditCard, FileText, MapPin, ArrowRight,
  AlertCircle, CheckCircle2, Search, TrendingUp, Clock, Home,
} from "lucide-react";

const STATS = [
  {
    label: "Reservas activas",
    value: "1",
    delta: "En curso",
    icon: CalendarCheck,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    deltaBg: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  {
    label: "Documentos pendientes",
    value: "2",
    delta: "Requieren acción",
    icon: FileText,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    deltaBg: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  {
    label: "Próximo pago",
    value: "850€",
    delta: "1 sep. 2026",
    icon: CreditCard,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600",
    deltaBg: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  },
];

const STEPS = [
  { label: "Identidad", done: true },
  { label: "Temporalidad", done: true },
  { label: "Contrato", done: false },
  { label: "Pago", done: false },
];

export default function InquilinoInicio() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Bienvenida */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-sm ring-1 ring-emerald-500/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-emerald-200 text-sm font-medium mb-1">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold">Panel de inquilino</h1>
          <p className="text-emerald-100 text-sm mt-1">Tienes 1 reserva activa y 2 documentos pendientes.</p>
        </div>
        <Link href="/buscar">
          <Button className="bg-white/15 hover:bg-white/25 text-white border-0 ring-1 ring-white/20 backdrop-blur-sm gap-2 shrink-0">
            <Search className="h-4 w-4" /> Buscar
          </Button>
        </Link>
      </div>

      {/* Alerta */}
      <div className="flex items-start gap-3 rounded-xl ring-1 ring-amber-200 bg-amber-50 px-4 py-3.5">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Contrato pendiente de firma</p>
          <p className="text-xs text-amber-700 mt-0.5">El propietario ha aceptado tu solicitud. Firma para confirmar.</p>
        </div>
        <Link href="/inquilino/checkout" className="shrink-0">
          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            Firmar <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((s) => (
          <Card key={s.label} className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.deltaBg}`}>
                  {s.delta}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Próxima estancia */}
        <Card className="ring-1 ring-slate-200 shadow-sm border-0 lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900">Próxima estancia</CardTitle>
              <Link href="/inquilino/reservas">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 gap-1">
                  Ver todas <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl ring-1 ring-slate-200">
              <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Home className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Piso luminoso en Parte Vieja</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> Donostia-San Sebastián
                    </p>
                  </div>
                  <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200 border-0 text-xs shrink-0">Pago retenido</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Entrada</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">1 sep. 2026</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Salida</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">30 jun. 2027</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progreso checkout */}
        <Card className="ring-1 ring-slate-200 shadow-sm border-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900">Progreso de reserva</CardTitle>
              <Link href="/inquilino/checkout">
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
                <span className="font-semibold text-slate-900">50%</span>
              </div>
              <Progress value={50} className="h-1.5 bg-slate-100" />
            </div>
            <div className="space-y-2">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                    step.done
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                  }`}>
                    {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`text-sm ${step.done ? "text-slate-900 font-medium" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                  {step.done && (
                    <span className="ml-auto text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full ring-1 ring-emerald-200">
                      Listo
                    </span>
                  )}
                  {!step.done && (
                    <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Pendiente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Mis reservas", href: "/inquilino/reservas",   icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", ring: "ring-emerald-200" },
            { label: "Documentos",   href: "/inquilino/documentos", icon: FileText,      color: "text-amber-600",   bg: "bg-amber-50 hover:bg-amber-100",     ring: "ring-amber-200" },
            { label: "Pagos",        href: "/inquilino/pagos",      icon: CreditCard,    color: "text-indigo-600",  bg: "bg-indigo-50 hover:bg-indigo-100",   ring: "ring-indigo-200" },
            { label: "Buscar piso",  href: "/buscar",               icon: Search,        color: "text-slate-600",   bg: "bg-slate-50 hover:bg-slate-100",     ring: "ring-slate-200" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl ring-1 ${a.ring} text-center transition-all cursor-pointer ${a.bg}`}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-200">
                  <a.icon className={`h-4 w-4 ${a.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
