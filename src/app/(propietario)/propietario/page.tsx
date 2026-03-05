import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Vivienda } from "@/lib/viviendas";
import {
  MapPin, Plus, Users, Wallet, CheckCircle2, TrendingUp,
  Building2, ArrowRight, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_COLORS = [
  "from-indigo-500 to-indigo-700",
  "from-teal-500 to-teal-700",
  "from-slate-500 to-slate-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
];

function getColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export default async function PropietarioInicio({
  searchParams,
}: {
  searchParams: Promise<{ publicada?: string; editada?: string }>;
}) {
  const { publicada, editada } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: viviendas = [] } = user
    ? await supabase
        .from("viviendas")
        .select("*")
        .eq("propietario_id", user.id)
        .order("fecha_creacion", { ascending: false })
    : { data: [] as Vivienda[] };

  const totalViviendas = viviendas?.length ?? 0;
  const activas = viviendas?.filter((v) => v.activa).length ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Banner edición exitosa */}
      {editada && (
        <div className="flex items-center gap-3 bg-indigo-50 ring-1 ring-indigo-200 rounded-2xl px-5 py-4 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
          <div>
            <p className="font-semibold text-indigo-800">¡Cambios guardados correctamente!</p>
            <p className="text-sm text-indigo-700 mt-0.5">Tu anuncio ya está actualizado y visible para los inquilinos.</p>
          </div>
          <Link href={`/vivienda/${editada}`} className="ml-auto shrink-0">
            <Button size="sm" variant="outline" className="text-xs gap-1 ring-1 ring-indigo-300 border-0 text-indigo-700 hover:bg-indigo-100">
              Ver anuncio <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Banner publicación exitosa */}
      {publicada && (
        <div className="flex items-center gap-3 bg-emerald-50 ring-1 ring-emerald-200 rounded-2xl px-5 py-4 shadow-sm">
          <PartyPopper className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">¡Vivienda publicada con éxito!</p>
            <p className="text-sm text-emerald-700 mt-0.5">Tu propiedad ya es visible para los inquilinos en la búsqueda.</p>
          </div>
          <Link href={`/vivienda/${publicada}`} className="ml-auto shrink-0">
            <Button size="sm" variant="outline" className="text-xs gap-1 ring-1 ring-emerald-300 border-0 text-emerald-700 hover:bg-emerald-100">
              Ver anuncio <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Banner bienvenida */}
      <div className="rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-sm ring-1 ring-indigo-500/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-sm font-medium mb-1">Panel de propietario</p>
          <h1 className="text-2xl font-bold">Gestión de viviendas</h1>
          <p className="text-indigo-100 text-sm mt-1">
            {totalViviendas === 0
              ? "Publica tu primera vivienda para empezar a recibir solicitudes."
              : `Tienes ${totalViviendas} vivienda${totalViviendas !== 1 ? "s" : ""} publicada${totalViviendas !== 1 ? "s" : ""}, ${activas} activa${activas !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <Link href="/propietario/publicar">
          <Button className="bg-white/15 hover:bg-white/25 text-white border-0 ring-1 ring-white/20 backdrop-blur-sm gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Publicar vivienda
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Viviendas publicadas",
            value: String(totalViviendas),
            delta: activas > 0 ? `${activas} activa${activas !== 1 ? "s" : ""}` : "Ninguna activa",
            icon: Building2,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-600",
            positive: activas > 0,
          },
          {
            label: "Solicitudes nuevas",
            value: "0",
            delta: "Sin solicitudes aún",
            icon: Users,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
            positive: false,
          },
          {
            label: "Ingresos este mes",
            value: "0€",
            delta: "Sin reservas activas",
            icon: Wallet,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-600",
            positive: false,
          },
        ].map((s) => (
          <Card key={s.label} className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                </div>
                <span className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  s.positive ? "text-emerald-600" : "text-slate-500"
                )}>
                  {s.positive && <TrendingUp className="h-3 w-3" />}
                  {s.delta}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Viviendas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Mis viviendas</h2>
          <Link href="/propietario/publicar">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ring-1 ring-slate-200 shadow-sm border-0">
              <Plus className="h-3 w-3" /> Añadir
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(viviendas ?? []).map((v: Vivienda) => {
            const color = getColor(v.id);
            return (
              <Card key={v.id} className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-all duration-200 overflow-hidden group">
                <div className={`h-32 bg-linear-to-br ${color} flex items-center justify-center relative`}>
                  <Building2 className="h-10 w-10 text-white/70" />
                  {v.verificada && (
                    <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verificada
                    </span>
                  )}
                  <span className={cn(
                    "absolute top-2.5 right-2.5 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm",
                    v.activa
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", v.activa ? "bg-indigo-500" : "bg-slate-400")} />
                    {v.activa ? "Disponible" : "Inactiva"}
                  </span>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors truncate">{v.titulo}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {v.barrio ? `${v.barrio}, ` : ""}{v.ciudad.split("-")[0]}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="font-bold text-slate-900">
                      {v.precio_mes}€ <span className="text-xs font-normal text-slate-400">/mes</span>
                    </p>
                    <p className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full ring-1 ring-slate-200">
                      {v.habitaciones} hab · {v.m2}m²
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/propietario/vivienda/${v.id}/editar`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs ring-1 ring-indigo-200 border-0 text-indigo-600 hover:bg-indigo-50">
                        Editar
                      </Button>
                    </Link>
                    <Link href={`/vivienda/${v.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs ring-1 ring-slate-200 border-0 gap-1">
                        Ver <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Añadir tarjeta */}
          <Link href="/propietario/publicar">
            <div className="border-2 border-dashed border-slate-200 rounded-xl h-full min-h-56 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center ring-1 ring-slate-200">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold">Añadir vivienda</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Solicitudes",   href: "/propietario/solicitudes",   icon: Users,        color: "text-indigo-600",  bg: "bg-indigo-50 hover:bg-indigo-100",   ring: "ring-indigo-200" },
            { label: "Contratos",     href: "/propietario/contratos",     icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", ring: "ring-emerald-200" },
            { label: "Liquidaciones", href: "/propietario/liquidaciones", icon: Wallet,       color: "text-amber-600",   bg: "bg-amber-50 hover:bg-amber-100",     ring: "ring-amber-200" },
            { label: "Publicar",      href: "/propietario/publicar",      icon: Plus,         color: "text-slate-600",   bg: "bg-slate-50 hover:bg-slate-100",     ring: "ring-slate-200" },
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
