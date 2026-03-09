import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MotionFadeInUp,
  MotionFadeIn,
  MotionStagger,
  MotionStaggerItem,
  MotionCard,
} from "@/components/motion";
import {
  Search, Shield, FileText, CreditCard, MapPin, Star,
  CheckCircle2, Building2, GraduationCap, Users, ArrowRight,
  Home, TrendingUp, Lock,
} from "lucide-react";

const VIVIENDAS_DESTACADAS = [
  { id: "1", titulo: "Piso en Parte Vieja",  ciudad: "Donostia", precio: 850, habitaciones: 2, verificada: true, motivos: ["Estudios", "Trabajo"],  color: "from-indigo-500 to-indigo-700" },
  { id: "2", titulo: "Estudio en Gros",       ciudad: "Donostia", precio: 620, habitaciones: 1, verificada: true, motivos: ["Estudios"],              color: "from-teal-500 to-teal-700" },
  { id: "3", titulo: "Apartamento en Amara", ciudad: "Donostia", precio: 950, habitaciones: 3, verificada: true, motivos: ["Trabajo temporal", "Otros"],      color: "from-slate-500 to-slate-700" },
];

const METRICAS = [
  { value: "+1.200", label: "Usuarios activos",      icon: Users },
  { value: "340+",   label: "Viviendas verificadas", icon: Building2 },
  { value: "98%",    label: "Satisfacción",           icon: Star },
  { value: "0€",     label: "Comisión inquilino",     icon: TrendingUp },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 py-24 lg:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.10),transparent_55%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <MotionFadeInUp>
              <Badge className="mb-6 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/10">
                Plataforma oficial de alquiler temporal
              </Badge>
            </MotionFadeInUp>
            <MotionFadeInUp delay={0.05}>
              <h1 className="text-5xl font-bold leading-[1.15] text-white lg:text-6xl">
                Alquila con
                <span className="block bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">
                  total seguridad
                </span>
              </h1>
            </MotionFadeInUp>
            <MotionFadeInUp delay={0.1}>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
                Conectamos estudiantes, trabajadores temporales y propietarios.
              </p>
            </MotionFadeInUp>

            {/* Buscador */}
            <MotionFadeInUp delay={0.15}>
              <div className="mt-10 bg-white rounded-2xl p-2 shadow-sm flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto ring-1 ring-slate-200">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="¿Dónde? Donostia, Bilbao, Vitoria..."
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none py-2.5"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 border-l border-slate-100">
                  <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                  <select className="bg-transparent text-sm text-slate-900 outline-none py-2.5 pr-6 cursor-pointer">
                    <option>Motivo de estancia</option>
                    <option>Estudios</option>
                    <option>Trabajo temporal</option>
                    <option>Otros</option>
                  </select>
                </div>
                <Link href="/buscar">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto px-6 rounded-xl font-semibold shadow-sm">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </Link>
              </div>
            </MotionFadeInUp>

            <MotionFadeIn delay={0.2}>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                {["Contratos digitales", "Pago seguro en escrow", "Verificación KYC"].map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </MotionFadeIn>
          </div>
        </div>

        {/* Métricas */}
        <MotionStagger className="relative mx-auto max-w-4xl px-6 mt-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICAS.map((m) => {
              const Icon = m.icon;
              return (
                <MotionStaggerItem key={m.label}>
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-5 text-center ring-1 ring-white/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                      <Icon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{m.value}</p>
                    <p className="text-xs text-slate-400">{m.label}</p>
                  </div>
                </MotionStaggerItem>
              );
            })}
          </div>
        </MotionStagger>
      </section>

      {/* ── Viviendas destacadas ── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Viviendas verificadas</p>
              <h2 className="text-3xl font-bold text-slate-900">Propiedades de confianza</h2>
              <p className="mt-2 text-slate-500 max-w-md">Con número de registro oficial según la normativa de la Ventanilla Única 2026.</p>
            </div>
            <Link href="/buscar">
              <Button variant="outline" className="hidden md:flex gap-2 ring-1 ring-slate-200 shadow-sm border-0">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VIVIENDAS_DESTACADAS.map((v) => (
              <MotionStaggerItem key={v.id}>
                <MotionCard>
                  <Link href={`/vivienda/${v.id}`} className="block">
                    <Card className="group overflow-hidden ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                      <div className={`relative h-48 bg-gradient-to-br ${v.color} flex items-center justify-center`}>
                        <Home className="h-16 w-16 text-white/20" />
                        <Building2 className="h-8 w-8 text-white/70 absolute" />
                        {v.verificada && (
                          <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold px-2.5 py-1.5 rounded-full ring-1 ring-emerald-200">
                            <Shield className="h-3 w-3" /> Verificada
                          </span>
                        )}
                        <div className="absolute top-3 right-3 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{v.titulo}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{v.ciudad}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-slate-900">{v.precio}€</p>
                            <p className="text-xs text-slate-400">/mes</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {v.motivos.map((m) => (
                            <span key={m} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">{m}</span>
                          ))}
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ring-1 ring-slate-200">{v.habitaciones} hab.</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </MotionCard>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
          <div className="mt-8 text-center md:hidden">
            <Link href="/buscar">
              <Button variant="outline" className="gap-2 ring-1 ring-slate-200 shadow-sm border-0">
                Ver todas las viviendas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <MotionFadeInUp>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Proceso simple</p>
              <h2 className="text-3xl font-bold text-slate-900">Cómo funciona SafeRent</h2>
              <p className="mt-3 text-slate-500 max-w-md mx-auto">Un proceso claro, transparente y seguro para todas las partes.</p>
            </div>
          </MotionFadeInUp>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* Inquilinos */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Para inquilinos</h3>
              </div>
              <div className="space-y-6">
                {[
                  { n: "01", title: "Busca y elige",         desc: "Filtra por fecha, precio y motivo de estancia temporal.", icon: Search },
                  { n: "02", title: "Verifica tu identidad", desc: "Sube tu DNI/NIE y el documento que justifica tu estancia.", icon: Shield },
                  { n: "03", title: "Firma el contrato",     desc: "Contrato digital firmado con validez legal (Signaturit).", icon: FileText },
                  { n: "04", title: "Paga con seguridad",    desc: "Tu pago queda retenido en escrow hasta confirmar la estancia.", icon: Lock },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm ring-1 ring-emerald-200">
                      {s.n}
                    </div>
                    <div className="pt-0.5">
                      <h4 className="font-semibold text-slate-900">{s.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Propietarios */}
            <div id="propietarios">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-200">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Para propietarios</h3>
              </div>
              <div className="space-y-6">
                {[
                  { n: "01", title: "Publica tu vivienda",  desc: "Sube fotos, Nota Simple y número de registro oficial.", icon: Building2 },
                  { n: "02", title: "Revisa solicitudes",   desc: "Acepta o rechaza inquilinos con perfil y documentos verificados.", icon: Users },
                  { n: "03", title: "Firma el contrato",    desc: "Contrato generado automáticamente y firmado digitalmente.", icon: FileText },
                  { n: "04", title: "Recibe el pago",       desc: "Stripe Connect transfiere el dinero directamente a tu cuenta.", icon: CreditCard },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm ring-1 ring-indigo-200">
                      {s.n}
                    </div>
                    <div className="pt-0.5">
                      <h4 className="font-semibold text-slate-900">{s.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Garantías ── */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield,   title: "Verificación KYC",   desc: "Identidad verificada para propietarios e inquilinos antes de cualquier transacción.", color: "text-indigo-600", bg: "bg-indigo-50",  ring: "ring-indigo-200" },
              { icon: Lock,     title: "Pago en Escrow",      desc: "El dinero queda retenido de forma segura hasta que ambas partes confirman la estancia.", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" },
              { icon: FileText, title: "Contratos digitales", desc: "Contratos con validez legal firmados digitalmente vía Signaturit, sin papel.", color: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-200" },
            ].map((g) => (
              <div key={g.title} className={`rounded-2xl ${g.bg} p-6 ring-1 ${g.ring}`}>
                <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm ring-1 ring-slate-200 mb-4">
                  <g.icon className={`h-5 w-5 ${g.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{g.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.10),transparent_70%)]" />
        <MotionFadeInUp className="relative mx-auto max-w-3xl px-6 text-center">
          <Badge className="mb-6 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Empieza gratis hoy
          </Badge>
          <h2 className="text-4xl font-bold text-white mb-4">¿Listo para empezar?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Únete a más de 1.200 usuarios que ya alquilan con total confianza en Euskadi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm px-8">
                Buscar alojamiento
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/15 text-white hover:bg-white/8 px-8">
                Publicar mi vivienda
              </Button>
            </Link>
          </div>
        </MotionFadeInUp>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-10 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Home className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">SafeRent</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="#" className="hover:text-slate-700 transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">Términos</Link>
            <Link href="#" className="hover:text-slate-700 transition-colors">Contacto</Link>
          </div>
          <p className="text-xs text-slate-400">Plataforma de alquiler seguro en Euskadi</p>
        </div>
      </footer>
    </div>
  );
}
