"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Shield, Search, Menu, X, Building2, Users, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/authStore";
import { rutaSegunRol } from "@/lib/auth";

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, cargando, cerrarSesion } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  async function handleCerrarSesion() {
    await cerrarSesion();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const panelHref = usuario ? rutaSegunRol(usuario.rol) : null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600"
            style={{ boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)" }}
          >
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span
            className={`font-semibold text-[17px] tracking-tight transition-colors duration-300 ${
              scrolled ? "text-slate-900" : "text-white"
            }`}
          >
            saferent
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: "/buscar",         label: "Buscar alojamiento" },
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: "/#propietarios",  label: "Para propietarios" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors duration-200 ${
                scrolled
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-white/70 hover:text-white"
              }`}
              style={{ fontWeight: 450, letterSpacing: "-0.01em" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {cargando ? (
            <div className="h-9 w-28 rounded-lg bg-slate-200/30 animate-pulse" aria-hidden />
          ) : usuario ? (
            <>
              <Link href={panelHref!}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm rounded-lg h-9 px-4 ${
                    scrolled
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Mi panel
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCerrarSesion}
                className={`text-sm rounded-lg h-9 px-4 ${
                  scrolled
                    ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontWeight: 500 }}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm rounded-lg h-9 px-4 ${
                    scrolled
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg h-9 px-5"
                  style={{ fontWeight: 500, boxShadow: "0 1px 3px rgba(79,70,229,0.25), 0 4px 12px rgba(79,70,229,0.15)" }}
                >
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${
            scrolled ? "text-slate-500 hover:text-slate-900 hover:bg-slate-50" : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-5 flex flex-col gap-4">
          {[
            { href: "/buscar",         label: "Buscar alojamiento" },
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: "/#propietarios",  label: "Para propietarios" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-slate-700 hover:text-slate-900"
              style={{ fontWeight: 450 }}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            {cargando ? (
              <div className="h-10 w-full rounded-lg bg-slate-100 animate-pulse" aria-hidden />
            ) : usuario ? (
              <>
                <Link href={panelHref!} onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full rounded-lg border-slate-200 gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Mi panel
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleCerrarSesion}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full rounded-lg border-slate-200">Iniciar sesión</Button>
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button className="w-full bg-indigo-600 text-white rounded-lg">Registrarse</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
