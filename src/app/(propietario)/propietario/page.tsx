"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Button } from "@/components/ui/button";
import {
  MapPin, Plus, Users, Wallet, CheckCircle2, TrendingUp,
  Building2, ArrowRight, PartyPopper, Loader2, Calendar,
  User, Clock, FileText, Inbox, EyeOff, ExternalLink,
  FileEdit, Trash2, CreditCard, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropietario } from "@/store/propietarioStore";
import { useAuth } from "@/store/authStore";
import { mockStripeConnect } from "@/lib/stripe-connect";
import ToggleActivaButton from "./_components/ToggleActivaButton";
import { obtenerBorradores, eliminarBorrador } from "@/lib/viviendas";
import type { Vivienda } from "@/lib/viviendas";

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

const MOTIVO_ICON: Record<string, typeof Users> = {
  Estudios: Users,
  "Trabajo temporal": Users,
  Salud: Users,
  Otros: Users,
};

const FASE_NOMBRES: Record<number, string> = {
  1: "Nombre del piso",
  2: "Verificación KYC",
  3: "Datos de la vivienda",
  4: "Precio y disponibilidad",
  5: "Verificación",
};

export default function PropietarioInicio() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <PropietarioInicioContent />
    </Suspense>
  );
}

function PropietarioInicioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const publicada = searchParams.get("publicada");
  const editada = searchParams.get("editada");
  const stripeConnected = searchParams.get("stripe_connected");

  const { viviendas, solicitudes, pagos, solicitudesPendientes, cargando } = usePropietario();
  const { usuario } = useAuth();

  const [loadingStripe, setLoadingStripe] = useState(false);

  const [borradores, setBorradores] = useState<Vivienda[]>([]);
  const [cargandoBorradores, setCargandoBorradores] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargarBorradores = useCallback(async () => {
    try {
      setCargandoBorradores(true);
      const data = await obtenerBorradores();
      setBorradores(data);
    } catch {
      console.error("Error al cargar borradores");
    } finally {
      setCargandoBorradores(false);
    }
  }, []);

  useEffect(() => {
    if (usuario && usuario.rol === "PROPIETARIO") cargarBorradores();
  }, [cargarBorradores, usuario]);

  const handleEliminarBorrador = async (id: string) => {
    setEliminandoId(id);
    try {
      await eliminarBorrador(id);
      setBorradores((prev) => prev.filter((b) => b.id !== id));
    } catch {
      console.error("Error al eliminar borrador");
    } finally {
      setEliminandoId(null);
    }
  };

  const totalViviendas = viviendas.length;
  const activas = viviendas.filter((v) => v.activa).length;

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();
  const ingresosMes = pagos
    .filter((p) => {
      if (p.estado !== "COMPLETADO") return false;
      const fecha = new Date(p.fecha_pago);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    })
    .reduce((sum, p) => sum + (p.importe_propietario ?? p.importe), 0);

  const solicitudesRecientes = solicitudes
    .filter((s) => s.estado === "PENDIENTE")
    .slice(0, 3);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
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

      {usuario?.stripe_onboarding_complete ? (
        stripeConnected && (
          <div className="flex items-center gap-3 bg-emerald-50 ring-1 ring-emerald-200 rounded-2xl px-5 py-4 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Cuenta bancaria conectada correctamente</p>
              <p className="text-sm text-emerald-700 mt-0.5">Ya podés recibir pagos de tus inquilinos a través de Stripe.</p>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-5 py-4 shadow-sm">
          <CreditCard className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Conecta tu cuenta bancaria</p>
            <p className="text-sm text-amber-700 mt-0.5">Necesitas vincular tu cuenta de Stripe para recibir pagos de tus inquilinos.</p>
          </div>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white border-0 gap-2 shrink-0"
            disabled={loadingStripe}
            onClick={async () => {
              setLoadingStripe(true);
              const { data, error } = await mockStripeConnect();
              if (data?.url) {
                window.location.href = data.url;
              } else {
                console.error("Stripe onboarding error:", error);
                setLoadingStripe(false);
              }
            }}
          >
            {loadingStripe && <Loader2 className="h-4 w-4 animate-spin" />}
            Conectar cuenta
          </Button>
        </div>
      )}

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
            label: "Solicitudes pendientes",
            value: String(solicitudesPendientes),
            delta: solicitudesPendientes > 0
              ? `${solicitudesPendientes} por revisar`
              : "Sin solicitudes pendientes",
            icon: Users,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600",
            positive: solicitudesPendientes > 0,
          },
          {
            label: "Ingresos este mes",
            value: `${ingresosMes.toLocaleString("es-ES")}€`,
            delta: ingresosMes > 0
              ? `+${ingresosMes.toLocaleString("es-ES")}€ este mes`
              : "Sin ingresos este mes",
            icon: Wallet,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-600",
            positive: ingresosMes > 0,
          },
        ].map((s) => (
          <MagicCard key={s.label} className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow" gradientColor="#6366f110">
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
              <p className="text-2xl font-bold text-slate-900">
                {s.label === "Ingresos este mes"
                  ? <><NumberTicker value={ingresosMes} />€</>
                  : <NumberTicker value={Number(s.value)} />}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </MagicCard>
        ))}
      </div>

      {/* Borradores pendientes */}
      {!cargandoBorradores && borradores.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-indigo-500" />
              Borradores pendientes
            </h2>
            <span className="text-xs text-slate-500">
              {borradores.length} borrador{borradores.length !== 1 ? "es" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {borradores.map((b) => (
              <Card key={b.id} className="ring-1 ring-indigo-100 shadow-sm border-0 hover:shadow-md transition-shadow bg-indigo-50/30">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {b.titulo || "Sin título"}
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium mt-1">
                      Fase {b.fase_actual} de 5 — {FASE_NOMBRES[b.fase_actual] ?? "Desconocida"}
                    </p>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            step < b.fase_actual
                              ? "bg-indigo-500"
                              : step === b.fase_actual
                                ? "bg-indigo-400"
                                : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => router.push(`/propietario/publicar?id=${b.id}`)}
                    >
                      Continuar <ArrowRight className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 ring-1 ring-rose-200 border-0 text-rose-500 hover:bg-rose-50"
                      title="Eliminar borrador"
                      disabled={eliminandoId === b.id}
                      onClick={() => handleEliminarBorrador(b.id)}
                    >
                      {eliminandoId === b.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {cargandoBorradores && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando borradores...
        </div>
      )}

      {/* Solicitudes recientes */}
      {solicitudesRecientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Solicitudes pendientes
            </h2>
            <Link href="/propietario/solicitudes">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ring-1 ring-slate-200 shadow-sm border-0">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {solicitudesRecientes.map((s) => (
              <Card key={s.id} className="ring-1 ring-amber-100 shadow-sm border-0 hover:shadow-md transition-shadow bg-amber-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {s.usuarios?.nombre_completo ?? "Inquilino"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{s.usuarios?.email}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-200">
                      Pendiente
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full ring-1 ring-slate-200">
                      <Building2 className="h-3 w-3" />
                      {s.vivienda?.titulo ?? "Vivienda"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full ring-1 ring-slate-200">
                      <Calendar className="h-3 w-3" />
                      {new Date(s.fecha_entrada).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} – {new Date(s.fecha_salida).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full ring-1 ring-slate-200">
                      <FileText className="h-3 w-3" />
                      {s.motivo}
                    </span>
                  </div>
                  {s.motivo_detalle && (
                    <p className="text-xs text-slate-400 italic truncate mt-1">"{s.motivo_detalle}"</p>
                  )}
                  <div className="mt-3">
                    <Link href="/propietario/solicitudes">
                      <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-indigo-200 border-0 text-indigo-600 hover:bg-indigo-50">
                        Revisar solicitud <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
          {viviendas.map((v: Vivienda) => {
            const color = getColor(v.id);
            return (
              <Card key={v.id} className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-all duration-200 overflow-hidden group">
                <Link href={`/propietario/vivienda/${v.id}`} className="block">
                  <div className={`h-28 bg-linear-to-br ${color} flex items-center justify-center relative`}>
                    {v.fotos?.[0] ? (
                      <img
                        src={v.fotos[0]}
                        alt={v.titulo}
                        className={cn(
                          "absolute inset-0 w-full h-full object-cover",
                          !v.activa && "grayscale"
                        )}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <Building2 className="h-9 w-9 text-white/60" />
                    )}
                    {v.verificada && (
                      <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full ring-1 ring-emerald-200 z-10">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Verificada
                      </span>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors truncate">{v.titulo}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {v.ciudad}{v.provincia ? `, ${v.provincia}` : ""}
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
                  </CardContent>
                </Link>

                <div className="px-4 pb-4 space-y-2">
                  {!v.verificada && (
                    <Link href={`/propietario/publicar?id=${v.id}`}>
                      <Button size="sm" className="w-full h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0 gap-1">
                        <Shield className="h-3 w-3" /> Completar verificación
                      </Button>
                    </Link>
                  )}
                  <div className="flex gap-2 items-center">
                    <ToggleActivaButton id={v.id} activa={v.activa} />
                    <Link href={`/propietario/vivienda/${v.id}/editar`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs ring-1 ring-indigo-200 border-0 text-indigo-600 hover:bg-indigo-50">
                        Editar
                      </Button>
                    </Link>
                    <Link href={`/vivienda/${v.id}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 ring-1 ring-slate-200 border-0" title="Ver anuncio público">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}

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
            { label: "Solicitudes",   href: "/propietario/solicitudes",   icon: Users,        color: "text-indigo-600",  bg: "bg-indigo-50 hover:bg-indigo-100",   ring: "ring-indigo-200", badge: solicitudesPendientes },
            { label: "Contratos",     href: "/propietario/contratos",     icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", ring: "ring-emerald-200", badge: 0 },
            { label: "Liquidaciones", href: "/propietario/liquidaciones", icon: Wallet,       color: "text-amber-600",   bg: "bg-amber-50 hover:bg-amber-100",     ring: "ring-amber-200", badge: 0 },
            { label: "Publicar",      href: "/propietario/publicar",      icon: Plus,         color: "text-slate-600",   bg: "bg-slate-50 hover:bg-slate-100",     ring: "ring-slate-200", badge: 0 },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={`relative flex flex-col items-center gap-2 p-4 rounded-xl ring-1 ${a.ring} text-center transition-all cursor-pointer ${a.bg}`}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-200">
                  <a.icon className={`h-4 w-4 ${a.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
                {a.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5">
                    {a.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
