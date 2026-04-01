"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  MotionFadeInUp,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  MotionCard,
} from "@/components/motion";
import {
  Search, Shield, FileText, MapPin, Star,
  CheckCircle2, Building2, Users, ArrowRight,
  Lock, ChevronRight, Wifi,
} from "lucide-react";
import { obtenerViviendas, type Vivienda } from "@/lib/viviendas";
import { getAllProvincias, getCiudadesByProvincia } from "@/data/spain-locations";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Particles } from "@/components/magicui/particles";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { MagicCard } from "@/components/magicui/magic-card";
import { Marquee } from "@/components/magicui/marquee";
import { RetroGrid } from "@/components/magicui/retro-grid";
import { BlurFade } from "@/components/magicui/blur-fade";

const HERO_BG = "https://images.unsplash.com/photo-1554746210-81e2321a3186?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRyaWQlMjBza3lsaW5lJTIwYnVpbGRpbmdzJTIwc3Vuc2V0JTIwd2FybXxlbnwxfHx8fDE3NzI5OTgxMDN8MA&ixlib=rb-4.1.0&q=80&w=1080";
const COWORK_IMG = "https://images.unsplash.com/photo-1758873271949-742d6648b6b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbHMlMjBjb3dvcmtpbmclMjBtb2Rlcm4lMjBzcGFjZSUyMGxhcHRvcHxlbnwxfHx8fDE3NzI5OTcwOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    obtenerViviendas().then(({ data }) => setViviendas(data.slice(0, 3)));
  }, []);

  // Build flat list of all searchable locations (provinces + cities)
  const allLocations = useMemo(() => {
    const locations: { label: string; type: "provincia" | "ciudad"; provincia?: string }[] = [];
    for (const p of getAllProvincias()) {
      locations.push({ label: p.name, type: "provincia" });
      for (const c of getCiudadesByProvincia(p.code)) {
        locations.push({ label: c, type: "ciudad", provincia: p.name });
      }
    }
    return locations;
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return allLocations
      .filter((loc) => loc.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, allLocations]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("ciudad", searchQuery.trim());
    router.push(`/buscar?${params.toString()}`);
  };

  function selectSuggestion(label: string) {
    setSearchQuery(label);
    setShowSuggestions(false);
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/85 via-slate-900/70 to-slate-950/85" />
          <div className="absolute inset-0 bg-slate-950/30" />
          <Particles className="absolute inset-0 z-[5] hidden md:block" quantity={40} color="#ffffff" size={0.5} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="flex flex-col items-center text-center">
            <div className="max-w-2xl">
              <MotionFadeInUp>
                <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md text-white/90 text-xs px-4 py-2 rounded-full mb-8 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <AnimatedShinyText className="text-white/90" shimmerWidth={200}>
                    Plataforma oficial de alquiler temporal
                  </AnimatedShinyText>
                </div>
              </MotionFadeInUp>

              <MotionFadeInUp delay={0.05}>
                <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] text-white mb-6 leading-[1.05] tracking-tight font-light">
                  <TextAnimate as="span" animation="blurInUp" by="word" startOnView={false} className="inline">
                    Alquila con
                  </TextAnimate>
                  <br />
                  <span className="bg-linear-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">
                    total seguridad
                  </span>
                </h1>
              </MotionFadeInUp>

              <MotionFadeInUp delay={0.1}>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
                Conectamos estudiantes, trabajadores temporales y propietarios.
              </p>
              </MotionFadeInUp>

              {/* Search Box */}
              <MotionFadeInUp delay={0.15}>
                <div
                  ref={searchRef}
                  className="mt-10 bg-white/97 backdrop-blur-xl rounded-2xl p-2 max-w-4xl mx-auto relative"
                  style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 2px 12px rgba(0,0,0,0.1)" }}
                >
                  <div className="flex flex-col sm:flex-row gap-0">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="¿Dónde? Donostia, Bilbao, Madrid..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                        className="w-full pl-10 pr-4 py-3.5 text-sm text-slate-900 bg-transparent border-0 outline-none placeholder:text-slate-400"
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <ShimmerButton
                      onClick={handleSearch}
                      className="m-1 h-11 px-6 rounded-xl"
                      shimmerColor="#ffffff"
                      shimmerSize="0.05em"
                      borderRadius="12px"
                      background="rgba(79, 70, 229, 1)"
                    >
                      <span className="flex items-center gap-2 text-white text-sm font-medium">
                        <Search className="w-4 h-4" />
                        Buscar
                      </span>
                    </ShimmerButton>
                  </div>

                  {/* Autocomplete dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 overflow-hidden z-50">
                      {suggestions.map((s, i) => {
                        const q = searchQuery.trim().toLowerCase();
                        const idx = s.label.toLowerCase().indexOf(q);
                        const before = s.label.slice(0, idx);
                        const match = s.label.slice(idx, idx + q.length);
                        const after = s.label.slice(idx + q.length);
                        return (
                          <button
                            key={`${s.label}-${i}`}
                            type="button"
                            onClick={() => selectSuggestion(s.label)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 transition-colors text-left"
                          >
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>
                              {before}<strong className="text-slate-900">{match}</strong>{after}
                              {s.type === "ciudad" && s.provincia && (
                                <span className="text-slate-400 ml-1.5 text-xs">{s.provincia}</span>
                              )}
                              {s.type === "provincia" && (
                                <span className="text-indigo-500 ml-1.5 text-xs">Provincia</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </MotionFadeInUp>

              {/* Trust indicators */}
              <MotionFadeIn delay={0.25}>
                <div className="flex flex-wrap items-center justify-center gap-5 mt-8">
                  {["Contratos digitales", "Pago seguro en escrow", "Verificación KYC"].map(item => (
                    <span key={item} className="flex items-center gap-2 text-xs text-slate-400" style={{ fontWeight: 450 }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </MotionFadeIn>
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 30C1200 60 960 10 720 30C480 50 240 0 0 30L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Social Proof Bar ── */}
      <section className="bg-white relative z-10 -mt-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div
            className="bg-white rounded-2xl border border-slate-100 p-8 md:p-10 -mt-8 relative z-20 overflow-hidden"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { icon: Users, value: 14000, suffix: "+", label: "Inquilinos satisfechos", color: "text-indigo-600", bg: "bg-indigo-50" },
                { icon: Building2, value: 2400, suffix: "+", label: "Viviendas verificadas", color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: Star, value: 98, suffix: "%", label: "Contratos sin incidencias", color: "text-amber-600", bg: "bg-amber-50" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-slate-900 text-[1.75rem] font-light tracking-tight mb-1">
                      {stat.value === 0 ? `0${stat.suffix}` : (
                        <>
                          <NumberTicker value={stat.value} className="text-slate-900 text-[1.75rem] font-light tracking-tight" />
                          {stat.suffix}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-500" style={{ fontWeight: 450, letterSpacing: "-0.01em" }}>{stat.label}</p>
                  </div>
                );
              })}
            </div>
            <BorderBeam size={200} duration={8} />
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs text-indigo-600 uppercase tracking-[0.12em] mb-3 font-semibold">
                Viviendas destacadas
              </p>
              <h2 className="text-4xl text-slate-900 leading-[1.1] tracking-tight font-light">
                Recién verificadas
              </h2>
            </div>
            <Link href="/buscar">
              <Button
                variant="outline"
                className="hidden md:flex items-center gap-2 text-sm rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 h-9 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {viviendas.map((v, idx) => (
              <MotionStaggerItem key={v.id}>
                <MotionCard>
                  <Link href={`/vivienda/${v.id}`} className="group block">
                    <MagicCard className="rounded-2xl overflow-hidden border border-slate-100" gradientColor="#6366f110">
                      <div className="bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="relative overflow-hidden" style={{ height: idx === 0 ? "240px" : "200px" }}>
                          {v.fotos?.[0] ? (
                            <img
                              src={v.fotos[0]}
                              alt={v.titulo}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-white/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-slate-900/20 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span
                              className="inline-flex items-center gap-1 bg-white/95 text-emerald-600 text-xs px-2.5 py-1 rounded-full"
                              style={{ fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Verificado
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h3
                            className="text-slate-900 text-sm leading-snug mb-1.5"
                            style={{ fontWeight: 600, letterSpacing: "-0.01em" }}
                          >
                            {v.titulo}
                          </h3>
                          <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{v.barrio ? `${v.barrio}, ` : ""}{v.ciudad?.split("-")[0]}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-5 pb-5 border-b border-slate-50">
                            <span>{v.m2} m²</span>
                            <span className="text-slate-200">·</span>
                            <span>{v.habitaciones} hab.</span>
                            <span className="text-slate-200">·</span>
                            <span>{v.banos} baño{v.banos !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-slate-900 text-xl font-light">
                                {v.precio_mes.toLocaleString("es-ES")}€
                              </span>
                              <span className="text-slate-400 text-xs ml-1">/mes</span>
                            </div>
                            <div className="flex gap-1">
                              {v.motivos?.slice(0, 1).map(m => (
                                <span key={m} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md" style={{ fontWeight: 500 }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </MagicCard>
                  </Link>
                </MotionCard>
              </MotionStaggerItem>
            ))}
          </MotionStagger>

          <div className="mt-8 text-center md:hidden">
            <Link href="/buscar">
              <Button variant="outline" className="gap-2 border-slate-200">
                Ver todas las viviendas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <MotionFadeInUp>
            <div className="text-center mb-20">
              <p className="text-xs text-indigo-600 uppercase tracking-[0.12em] mb-3 font-semibold">
                Proceso simplificado
              </p>
              <h2 className="text-4xl text-slate-900 tracking-tight font-light">
                Cómo funciona SafeRent
              </h2>
              <p className="text-slate-500 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
                Desde la búsqueda hasta la firma del contrato, todo está diseñado para que tu alquiler sea seguro y sin fricciones.
              </p>
            </div>
          </MotionFadeInUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Tenant flow */}
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full mb-8 font-semibold">
                Para inquilinos
              </div>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Busca y filtra", desc: "Explora viviendas verificadas con filtros por ciudad, precio, fechas y motivo de estancia.", icon: Search },
                  { step: "02", title: "Verifica tu identidad", desc: "Sube tu DNI y prueba de temporalidad de forma segura. Proceso en 24 horas.", icon: Shield },
                  { step: "03", title: "Firma digitalmente", desc: "El contrato de arrendamiento temporal se genera y firma digitalmente en minutos.", icon: CheckCircle2 },
                  { step: "04", title: "Pago en escrow", desc: "Tu pago queda retenido hasta la confirmación de entrada, protegiendo a ambas partes.", icon: Lock },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <MotionFadeInUp key={item.step}>
                      <div className="flex gap-5">
                        <div className="shrink-0">
                          <div
                            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold"
                            style={{ boxShadow: "0 2px 8px rgba(79,70,229,0.25)" }}
                          >
                            {item.step}
                          </div>
                        </div>
                        <div className="pt-1.5">
                          <h4 className="text-slate-900 mb-1.5 text-sm font-semibold">{item.title}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </MotionFadeInUp>
                  );
                })}
              </div>
              <Link href="/login" className="inline-block mt-10">
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 h-10 px-6 rounded-lg cursor-pointer"
                  style={{ fontWeight: 500, boxShadow: "0 1px 3px rgba(79,70,229,0.25)" }}
                >
                  Empezar como inquilino <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Owner card */}
            <div id="propietarios">
              <MotionFadeInUp>
                <div
                  className="bg-white rounded-2xl p-10 border border-slate-100"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                >
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full mb-8 font-semibold">
                    Para propietarios
                  </div>
                  <h3 className="text-3xl text-slate-900 mb-4 leading-tight tracking-tight font-light">
                    Alquila con total seguridad legal
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    SafeRent se encarga de la verificación de los inquilinos, la generación del contrato temporal conforme a la LAU y la gestión del cobro.
                  </p>

                  <div className="rounded-xl overflow-hidden mb-8">
                    <img src={COWORK_IMG} alt="Modern workspace" className="w-full h-40 object-cover" />
                  </div>

                  <div className="space-y-5 mb-10">
                    {[
                      { icon: Shield, text: "Inquilinos verificados con documentación acreditada" },
                      { icon: FileText, text: "Contratos de arrendamiento temporal (LAU art. 3)" },
                      { icon: Lock, text: "Cobro garantizado a través de sistema de escrow" },
                      { icon: CheckCircle2, text: "Panel de gestión completo para múltiples viviendas" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.text} className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-slate-500" />
                          </div>
                          <p className="text-sm text-slate-700" style={{ fontWeight: 450 }}>{item.text}</p>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/login">
                    <Button
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 h-11 rounded-lg cursor-pointer"
                      style={{ fontWeight: 500 }}
                    >
                      Publicar mi vivienda <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </MotionFadeInUp>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <MotionFadeInUp>
            <div className="text-center mb-16">
              <p className="text-xs text-indigo-600 uppercase tracking-[0.12em] mb-3 font-semibold">
                Testimonios
              </p>
              <h2 className="text-4xl text-slate-900 tracking-tight font-light">
                Lo que dicen nuestros usuarios
              </h2>
            </div>
          </MotionFadeInUp>
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <Marquee pauseOnHover className="[--duration:25s]">
              {[
                {
                  quote: "Encontré piso en 3 días. El proceso de verificación fue rapidísimo y el contrato se firmó digitalmente sin salir de casa.",
                  name: "Sofía M.",
                  role: "Estudiante de Erasmus",
                  stars: 5,
                  initials: "SM",
                  bg: "bg-indigo-100 text-indigo-700",
                },
                {
                  quote: "Como propietario tenía miedo de alquilar temporalmente. Con SafeRent, cada inquilino viene verificado y el pago está garantizado.",
                  name: "Roberto P.",
                  role: "Propietario, Madrid",
                  stars: 5,
                  initials: "RP",
                  bg: "bg-emerald-100 text-emerald-700",
                },
                {
                  quote: "Trabajo en remoto desde Barcelona 3 meses al año. SafeRent es la única plataforma que entiende mis necesidades como nómada digital.",
                  name: "Alex K.",
                  role: "Nómada digital",
                  stars: 5,
                  initials: "AK",
                  bg: "bg-amber-100 text-amber-700",
                },
              ].map((t) => (
                <div key={t.name} className="w-80 mx-2">
                  <div
                    className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-md h-full"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex gap-0.5 mb-6">
                      {Array(t.stars).fill(0).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 leading-[1.8] mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center`}>
                        <span className="text-xs font-bold">{t.initials}</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-900 font-semibold">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-white" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-white" />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <RetroGrid angle={65} opacity={0.15} lightLineColor="rgba(255,255,255,0.15)" darkLineColor="rgba(255,255,255,0.15)" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <BlurFade delay={0.1} inView>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/80 text-xs px-3 py-1.5 rounded-full mb-6 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span style={{ fontWeight: 500 }}>Sin comisión para inquilinos</span>
            </div>
            <h2 className="text-4xl md:text-5xl text-white mb-5 tracking-tight font-light">
              ¿Listo para empezar?
            </h2>
            <p className="text-slate-400 mb-10 text-base leading-relaxed max-w-xl mx-auto">
              Únete a miles de estudiantes, trabajadores y propietarios que ya usan SafeRent para gestionar sus alquileres temporales de forma segura.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <ShimmerButton className="px-8 h-12 rounded-xl" shimmerColor="#ffffff" shimmerSize="0.05em" background="rgba(79, 70, 229, 1)">
                  <span className="text-white text-sm font-medium">Crear cuenta gratis</span>
                </ShimmerButton>
              </Link>
              <Link href="/buscar">
                <Button
                  variant="outline"
                  className="bg-white text-slate-900 border-white/80 hover:bg-white/5 hover:text-white hover:border-slate-500 px-8 h-12 rounded-xl text-sm font-semibold shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Explorar viviendas
                </Button>
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold text-[17px] tracking-tight">saferent</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                La plataforma de referencia para el alquiler temporal verificado en España.
              </p>
            </div>
            {[
              {
                title: "Producto",
                links: [
                  { label: "Buscar vivienda", href: "/buscar" },
                  { label: "Publicar vivienda", href: "/login" },
                  { label: "Cómo funciona", href: "/#como-funciona" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Términos de uso", href: "#" },
                  { label: "Política de privacidad", href: "#" },
                  { label: "Política de cookies", href: "#" },
                ],
              },
              {
                title: "Soporte",
                links: [
                  { label: "Centro de ayuda", href: "#" },
                  { label: "Contacto", href: "#" },
                  { label: "Blog", href: "#" },
                ],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs text-slate-400 mb-4 uppercase tracking-widest font-semibold">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-slate-500 hover:text-white transition-colors duration-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600">
              © 2026 SafeRent Technologies, S.L. Todos los derechos reservados.
            </p>
            <p className="text-xs text-slate-700 bg-slate-900 px-3 py-1.5 rounded-full">
              Plataforma de alquiler temporal verificado
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
