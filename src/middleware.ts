import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Rol } from "@/lib/auth";

/**
 * Rutas protegidas y el rol que las puede visitar.
 * Clave = prefijo de pathname, valor = Rol requerido.
 */
const RUTAS_PROTEGIDAS: Record<string, Rol> = {
  "/admin": "ADMINISTRADOR",
  "/propietario": "PROPIETARIO",
  "/inquilino": "INQUILINO",
};

/** Ruta de inicio según rol */
const RUTA_POR_ROL: Record<Rol, string> = {
  INQUILINO: "/inquilino",
  PROPIETARIO: "/propietario",
  ADMINISTRADOR: "/admin",
};

const ROLES_VALIDOS: Rol[] = ["INQUILINO", "PROPIETARIO", "ADMINISTRADOR"];

/**
 * Extrae el rol del usuario desde cookies.
 *
 * Prioridad:
 * 1. `saferent_role` — cookie JS (no HttpOnly) seteada por el frontend al hacer
 *    exchange. Es same-origin (localhost:3000) y el middleware siempre la ve.
 * 2. `saferent_jwt` — cookie HttpOnly seteada por el backend (localhost:3001).
 *    En dev no viaja cross-origin por SameSite, pero sirve en producción con
 *    un solo dominio.
 */
function getRolDesdeCookie(request: NextRequest): Rol | null {
  // 1. Cookie de rol (mismo origen — confiable en dev y prod)
  const rolCookie = request.cookies.get("saferent_role")?.value;
  if (rolCookie && ROLES_VALIDOS.includes(rolCookie as Rol)) {
    return rolCookie as Rol;
  }

  // 2. Fallback: decodificar JWT del backend
  const token = request.cookies.get("saferent_jwt")?.value;
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return (payload.rol as Rol) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Construimos la respuesta base y el cliente de Supabase SSR.
  // El cliente actualiza automáticamente las cookies de sesión si van a expirar.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() verifica el token con el servidor de Supabase (no solo decodifica).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Rutas protegidas ────────────────────────────────────────────────────────
  const prefijo = Object.keys(RUTAS_PROTEGIDAS).find((p) =>
    pathname.startsWith(p)
  );

  if (prefijo) {
    // Sin sesión → login, recordando la URL original para redirigir después
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Sesión activa pero rol incorrecto → redirige al dashboard propio
    const rolRequerido = RUTAS_PROTEGIDAS[prefijo];
    const rolUsuario = getRolDesdeCookie(request);

    if (rolUsuario && rolUsuario !== rolRequerido) {
      return NextResponse.redirect(
        new URL(RUTA_POR_ROL[rolUsuario], request.url)
      );
    }
  }

  // ── Página de login ─────────────────────────────────────────────────────────
  // Si ya hay sesión y tiene rol conocido, redirige directamente al dashboard
  if (pathname === "/login" && user) {
    const rolUsuario = getRolDesdeCookie(request);
    if (rolUsuario) {
      return NextResponse.redirect(
        new URL(RUTA_POR_ROL[rolUsuario], request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto archivos estáticos y rutas internas de Next.js.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
