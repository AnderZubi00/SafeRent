"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Search, Menu, X, Building2, Users, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { rutaSegunRol } from "@/lib/auth";

export function Navbar() {
  const router = useRouter();
  const { usuario, cargando, cerrarSesion } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleCerrarSesion() {
    await cerrarSesion();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const panelHref = usuario ? rutaSegunRol(usuario.rol) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/40">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Safe<span className="text-indigo-400">Rent</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/buscar",         label: "Buscar alojamiento", icon: Search },
            { href: "/#como-funciona", label: "Cómo funciona",      icon: Users },
            { href: "/#propietarios",  label: "Para propietarios",  icon: Building2 },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0 min-w-[180px] justify-end">
          {cargando ? (
            <div className="h-8 w-28 rounded-lg bg-slate-800/50 animate-pulse" aria-hidden />
          ) : usuario ? (
            <>
              <Link href={panelHref!}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-white/5 gap-1.5"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Mi panel
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCerrarSesion}
                className="text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 font-semibold"
                >
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900 px-6 py-4 space-y-1">
          {[
            { href: "/buscar",         label: "Buscar alojamiento" },
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: "/#propietarios",  label: "Para propietarios" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-white/10">
            {cargando ? (
              <div className="h-10 w-full rounded-lg bg-slate-800/50 animate-pulse" aria-hidden />
            ) : usuario ? (
              <>
                <Link href={panelHref!} onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Mi panel
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleCerrarSesion}
                  className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
