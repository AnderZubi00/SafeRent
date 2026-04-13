import { createClient } from "@/lib/supabase/client";
import { api, setBackendToken, clearBackendToken } from "@/lib/api";
import { setLoginInProgress } from "@/lib/auth-flags";

export type Rol = "INQUILINO" | "PROPIETARIO" | "ADMINISTRADOR";

export interface UsuarioAuth {
  id: string;
  email: string;
  nombre_completo: string;
  rol: Rol;
  verificado_kyc: boolean;
  nombre_kyc?: string;
  apellidos_kyc?: string;
  tipo_documento?: string;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean;
}

export function rutaSegunRol(rol: Rol): string {
  switch (rol) {
    case "INQUILINO":     return "/inquilino";
    case "PROPIETARIO":   return "/propietario";
    case "ADMINISTRADOR": return "/admin";
  }
}

/**
 * Intercambia un token de Supabase por un JWT del backend.
 * En registro, pasa nombre_completo y rol para crear el perfil automáticamente.
 */
/**
 * Escribe el rol en una cookie accesible por el middleware de Next.js.
 * NO es HttpOnly — el middleware corre server-side y lee cookies del request
 * entrante (mismo origen: localhost:3000). La cookie saferent_jwt viene del
 * backend (localhost:3001) y por SameSite cross-origin nunca llega al middleware.
 */
function setRoleCookie(rol: Rol): void {
  if (typeof document === "undefined") return;
  document.cookie = `saferent_role=${rol}; path=/; max-age=86400; SameSite=Lax`;
}

async function exchangeForBackendJwt(
  supabaseAccessToken: string,
  registroData?: { nombre_completo: string; rol: Rol }
): Promise<UsuarioAuth> {
  const result = await api.post<{ access_token: string; usuario: UsuarioAuth }>(
    "/auth/exchange",
    {
      supabase_token: supabaseAccessToken,
      ...registroData,
    }
  );
  setBackendToken(result.access_token);
  setRoleCookie(result.usuario.rol);
  return result.usuario;
}

/**
 * Inicia sesión con Supabase Auth y obtiene JWT del backend.
 */
export async function loginConSupabase(
  email: string,
  password: string
): Promise<UsuarioAuth> {
  const supabase = createClient();

  // Marcamos login en progreso ANTES de signInWithPassword.
  // Supabase dispara SIGNED_IN internamente durante signInWithPassword (antes de retornar),
  // lo que causaría que el authStore llame exchange de forma redundante.
  // El flag le dice al listener de SIGNED_IN que loginConSupabase ya lo maneja.
  setLoginInProgress(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Email o contraseña incorrectos");
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Debes confirmar tu email antes de acceder");
      }
      throw new Error(error.message);
    }

    // Exchange Supabase token for backend JWT
    return await exchangeForBackendJwt(data.session.access_token);
  } finally {
    setLoginInProgress(false);
  }
}

/**
 * Registra un nuevo usuario en Supabase Auth y obtiene JWT del backend.
 */
export async function registrarConSupabase(
  email: string,
  password: string,
  nombre_completo: string,
  rol: Rol
): Promise<UsuarioAuth> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      throw new Error("Ya existe una cuenta con ese email");
    }
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("No se pudo crear el usuario");
  }

  // Exchange Supabase token for backend JWT — el backend crea el perfil automáticamente
  if (data.session?.access_token) {
    return exchangeForBackendJwt(data.session.access_token, {
      nombre_completo,
      rol,
    });
  }

  // Si no hay sesión inmediata (email confirmation), devolver datos básicos
  return {
    id: data.user.id,
    email,
    nombre_completo,
    rol,
    verificado_kyc: false,
  };
}

/**
 * Cierra la sesión de Supabase y elimina el JWT del backend.
 */
export async function cerrarSesion(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearBackendToken();
}

/**
 * Obtiene el usuario autenticado desde el backend.
 */
export async function obtenerUsuarioActual(): Promise<UsuarioAuth | null> {
  try {
    return await api.get<UsuarioAuth>("/auth/me");
  } catch {
    return null;
  }
}

/**
 * Re-autentica usando la sesión activa de Supabase sin necesidad de contraseña.
 * Útil para restaurar el backend JWT tras expiración o en el arranque del store.
 */
export async function reautenticarConSesionActual(): Promise<UsuarioAuth | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return exchangeForBackendJwt(session.access_token);
}
