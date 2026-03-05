import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware actual: paso libre para todas las rutas.
 *
 * La autenticación se gestiona mediante JWT en localStorage (client-side).
 * Las rutas protegidas están guardadas por los propios layouts de cliente.
 *
 * Cuando se integre Supabase Auth completamente, aquí se añadirá
 * la verificación de sesión basada en cookies.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Excluye rutas internas de Next.js y archivos estáticos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
