"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Home, Shield, User, Building2, Lock, Mail,
  ArrowRight, CheckCircle2, AlertCircle, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { loginConSupabase, registrarConSupabase, rutaSegunRol, type Rol } from "@/lib/auth";
import { useAuth } from "@/store/authStore";

type Tab = "login" | "register";

const USUARIOS_DEMO: {
  nombre: string; email: string; password: string; rol: Rol;
  descripcion: string; icon: React.ElementType; color: string; bg: string;
}[] = [
  {
    nombre: "Carlos López", email: "inquilino@saferent.es", password: "Inquilino123!",
    rol: "INQUILINO", descripcion: "Accede como inquilino para buscar y alquilar viviendas.",
    icon: User, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15",
  },
  {
    nombre: "María García", email: "propietario@saferent.es", password: "Propietario123!",
    rol: "PROPIETARIO", descripcion: "Gestiona tus propiedades y contratos de alquiler.",
    icon: Building2, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15",
  },
  {
    nombre: "Admin SafeRent", email: "admin@saferent.es", password: "Admin123!",
    rol: "ADMINISTRADOR", descripcion: "Panel de control completo de la plataforma.",
    icon: Shield, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15",
  },
];

const ROL_CONFIG: Record<Rol, { label: string; badgeBg: string }> = {
  INQUILINO:     { label: "Inquilino",     badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  PROPIETARIO:   { label: "Propietario",   badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25" },
  ADMINISTRADOR: { label: "Administrador", badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/25" },
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const safeRedirect =
    redirectUrl?.startsWith('/') && !redirectUrl.startsWith('//')
      ? redirectUrl
      : '/';
  const { setUsuario } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    nombre: "", email: "", password: "", confirmar: "", rol: "INQUILINO" as Rol,
  });

  function rellenarDemo(u: (typeof USUARIOS_DEMO)[0]) {
    setLoginForm({ email: u.email, password: u.password });
    setTab("login");
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const usuario = await loginConSupabase(loginForm.email, loginForm.password);
      setUsuario(usuario);
      router.push(safeRedirect !== '/' ? safeRedirect : rutaSegunRol(usuario.rol));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (registerForm.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const usuario = await registrarConSupabase(
        registerForm.email,
        registerForm.password,
        registerForm.nombre,
        registerForm.rol
      );
      setUsuario(usuario);
      router.push(safeRedirect !== '/' ? safeRedirect : rutaSegunRol(usuario.rol));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_55%)]" />

        {/* Logo */}
        <div className="relative flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 w-fit rounded-lg transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Safe<span className="text-indigo-400">Rent</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Ir al inicio de la plataforma
          </Link>
        </div>

        {/* Tagline */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            El alquiler de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-300">
              confianza
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Conectamos propietarios e inquilinos con contratos digitales, pagos seguros y verificación de identidad.
          </p>
          <div className="space-y-3 pt-2">
            {[
              "Contratos firmados digitalmente (Signaturit)",
              "Pagos retenidos y seguros (Stripe)",
              "Verificación KYC de propietarios",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usuarios demo */}
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Usuarios de demostración
          </p>
          <div className="space-y-2">
            {USUARIOS_DEMO.map((u) => {
              const Icon = u.icon;
              return (
                <button
                  key={u.email}
                  onClick={() => rellenarDemo(u)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left",
                    u.bg
                  )}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", u.bg)}>
                    <Icon className={cn("h-4 w-4", u.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{u.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium shrink-0", ROL_CONFIG[u.rol].badgeBg)}>
                    {ROL_CONFIG[u.rol].label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 text-center pt-1">Clic en un usuario para rellenar el formulario</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo móvil */}
          <div className="flex lg:hidden flex-col items-center gap-2 mb-2">
            <Link href="/" className="flex items-center gap-3 rounded-lg transition-opacity hover:opacity-90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Safe<span className="text-indigo-400">Rent</span></span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Ir al inicio
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-white/5 ring-1 ring-white/10 p-1">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  tab === t
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {/* Error global */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 ring-1 ring-rose-500/25 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          <Card className="ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-sm shadow-sm border-0">
            {tab === "login" ? (
              <>
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-white">Bienvenido de vuelta</CardTitle>
                  <CardDescription className="text-slate-400">Accede a tu cuenta SafeRent</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          id="email" type="email" placeholder="tu@email.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                          required
                          className="pl-10 bg-white/5 border-0 ring-1 ring-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                          required
                          className="pl-10 pr-10 bg-white/5 border-0 ring-1 ring-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                        />
                        <button
                          type="button" onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit" disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm h-10"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Accediendo...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Iniciar sesión <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    {/* Demo móvil */}
                    <div className="lg:hidden pt-2 space-y-2">
                      <p className="text-xs text-slate-500 text-center">Usuarios de demo</p>
                      <div className="grid grid-cols-3 gap-2">
                        {USUARIOS_DEMO.map((u) => {
                          const Icon = u.icon;
                          return (
                            <button key={u.email} type="button" onClick={() => rellenarDemo(u)}
                              className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all", u.bg)}
                            >
                              <Icon className={cn("h-4 w-4", u.color)} />
                              <span className="text-white font-medium">{ROL_CONFIG[u.rol].label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-white">Crear cuenta</CardTitle>
                  <CardDescription className="text-slate-400">
                    Únete como inquilino o propietario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Tipo de cuenta</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["INQUILINO", "PROPIETARIO"] as Rol[]).map((r) => {
                          const Icon = r === "INQUILINO" ? User : Building2;
                          const isActive = registerForm.rol === r;
                          return (
                            <button key={r} type="button"
                              onClick={() => setRegisterForm((f) => ({ ...f, rol: r }))}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-xl border-0 ring-1 text-sm font-medium transition-all duration-200",
                                isActive
                                  ? r === "INQUILINO"
                                    ? "bg-emerald-500/15 ring-emerald-500/40 text-emerald-300"
                                    : "bg-indigo-500/15 ring-indigo-500/40 text-indigo-300"
                                  : "bg-white/5 ring-white/10 text-slate-400 hover:ring-white/20"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {ROL_CONFIG[r].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-slate-300">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input id="nombre" placeholder="Juan García López"
                          value={registerForm.nombre}
                          onChange={(e) => setRegisterForm((f) => ({ ...f, nombre: e.target.value }))}
                          required
                          className="pl-10 bg-white/5 border-0 ring-1 ring-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-slate-300">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input id="reg-email" type="email" placeholder="tu@email.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                          required
                          className="pl-10 bg-white/5 border-0 ring-1 ring-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-pass" className="text-slate-300">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <Input id="reg-pass" type={showPassword ? "text" : "password"} placeholder="••••••••"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                            required minLength={8}
                            className="pl-10 pr-8 bg-white/5 border-0 ring-1 ring-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                          />
                          <button type="button" onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmar" className="text-slate-300">Confirmar</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <Input id="confirmar" type={showConfirm ? "text" : "password"} placeholder="••••••••"
                            value={registerForm.confirmar}
                            onChange={(e) => setRegisterForm((f) => ({ ...f, confirmar: e.target.value }))}
                            required
                            className="pl-10 pr-8 bg-white/5 border-0 ring-1 ring-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                          />
                          <button type="button" onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {registerForm.confirmar && (
                      <div className={cn("flex items-center gap-2 text-xs",
                        registerForm.password === registerForm.confirmar ? "text-emerald-400" : "text-rose-400"
                      )}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {registerForm.password === registerForm.confirmar
                          ? "Las contraseñas coinciden"
                          : "Las contraseñas no coinciden"}
                      </div>
                    )}

                    <Button type="submit" disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm h-10"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creando cuenta...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Crear cuenta como {ROL_CONFIG[registerForm.rol].label}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}
          </Card>

          <p className="text-center text-xs text-slate-600">
            SafeRent © 2026 · Plataforma de alquiler seguro
          </p>
        </div>
      </div>
    </div>
  );
}
