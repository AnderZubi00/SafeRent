import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Building2, CreditCard, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const RESERVAS = [
  { id: "SR-001", inquilino: "Carlos López",     propietario: "María García", vivienda: "Piso Parte Vieja", importe: 850,  estado: "PAGO_RETENIDO", fecha: "20/08/2026" },
  { id: "SR-002", inquilino: "Laura Iriarte",    propietario: "Jon Etxea",    vivienda: "Estudio Gros",     importe: 620,  estado: "CONFIRMADO",    fecha: "15/08/2026" },
  { id: "SR-003", inquilino: "Mikel Etxeberria", propietario: "Amaia Lasa",   vivienda: "Piso Amara",       importe: 950,  estado: "DISPUTA",       fecha: "10/08/2026" },
  { id: "SR-004", inquilino: "Ana Rodríguez",    propietario: "María García", vivienda: "Estudio Gros",     importe: 620,  estado: "COMPLETADO",    fecha: "01/10/2025" },
  { id: "SR-005", inquilino: "Iker Zabala",      propietario: "Jon Etxea",    vivienda: "Loft Centro",      importe: 780,  estado: "PENDIENTE",     fecha: "22/08/2026" },
  { id: "SR-006", inquilino: "Nora Bengoetxea",  propietario: "Amaia Lasa",   vivienda: "Piso Indautxu",    importe: 1100, estado: "CANCELADO",     fecha: "05/08/2026" },
];

const ESTADO: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDIENTE:     { label: "Pendiente",     bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400" },
  PAGO_RETENIDO: { label: "Pago retenido", bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500" },
  CONFIRMADO:    { label: "Confirmado",    bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  COMPLETADO:    { label: "Completado",    bg: "bg-indigo-50",   text: "text-indigo-700",  dot: "bg-indigo-500" },
  DISPUTA:       { label: "En disputa",    bg: "bg-rose-50",     text: "text-rose-700",    dot: "bg-rose-500" },
  CANCELADO:     { label: "Cancelado",     bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-300" },
};

const STATS = [
  { label: "Total usuarios",    value: "247",    delta: "+12 este mes",     icon: Users,         iconBg: "bg-indigo-500/10",  iconColor: "text-indigo-600",  up: true },
  { label: "Viviendas activas", value: "84",     delta: "+5 esta semana",   icon: Building2,     iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600", up: true },
  { label: "Volumen Escrow",    value: "42.8K€", delta: "Retenido ahora",   icon: CreditCard,    iconBg: "bg-amber-500/10",   iconColor: "text-amber-600",   up: true },
  { label: "Disputas abiertas", value: "2",      delta: "Requieren acción", icon: AlertTriangle, iconBg: "bg-rose-500/10",    iconColor: "text-rose-600",    up: false },
];

export default function AdminGlobal() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Banner admin */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-sm ring-1 ring-slate-700/50 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-rose-400" />
            <p className="text-slate-400 text-sm font-medium">Panel de administración</p>
          </div>
          <h1 className="text-2xl font-bold">Gestión Global</h1>
          <p className="text-slate-400 text-sm mt-1">
            247 usuarios · 84 viviendas activas · 2 disputas abiertas
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/admin/verificacion">
            <Button className="bg-white/10 hover:bg-white/15 text-white border-0 ring-1 ring-white/10 gap-2 text-sm">
              Verificación <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">5</span>
            </Button>
          </Link>
          <Link href="/admin/disputas">
            <Button className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-0 ring-1 ring-rose-500/20 gap-2 text-sm">
              Disputas <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Card key={s.label} className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
                <span className={cn("flex items-center gap-1 text-xs font-medium", s.up ? "text-emerald-600" : "text-rose-500")}>
                  {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {s.delta}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de reservas */}
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardHeader className="pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">Todas las reservas</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">{RESERVAS.length} reservas en total</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar reserva, usuario..."
                  className="pl-8 w-56 h-8 text-xs bg-slate-50 ring-1 ring-slate-200 border-0"
                />
              </div>
              <select className="h-8 rounded-md ring-1 ring-slate-200 px-2 text-xs bg-white text-slate-700 outline-none cursor-pointer hover:bg-slate-50">
                <option>Todos los estados</option>
                <option>Pago retenido</option>
                <option>Confirmado</option>
                <option>En disputa</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide pl-6">ID</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Inquilino</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Propietario</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Vivienda</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">Importe</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Estado</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fecha</TableHead>
                <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right pr-6">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESERVAS.map((r) => {
                const conf = ESTADO[r.estado];
                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="pl-6">
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded ring-1 ring-slate-200">{r.id}</span>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 text-sm">{r.inquilino}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{r.propietario}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{r.vivienda}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{r.importe}€</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                        conf.bg, conf.text
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", conf.dot)} />
                        {conf.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{r.fecha}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 ring-1 ring-slate-200 border-0 hover:bg-slate-900 hover:text-white hover:ring-slate-900 transition-colors">
                        Ver <ArrowRight className="h-3 w-3" />
                      </Button>
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
