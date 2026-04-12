import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import {
  obtenerUsuarioActual,
  reautenticarConSesionActual,
  type UsuarioAuth,
} from "@/lib/auth";
import { clearBackendToken, ApiError } from "@/lib/api";

/**
 * Control de concurrencia para cargarPerfil().
 *
 * _running: impide ejecuciones simultáneas (StrictMode, múltiples eventos).
 * _retryNeeded: si un evento llega mientras corre, se reintenta al terminar.
 *
 * Esto resuelve el caso crítico donde Supabase dispara TOKEN_REFRESHED
 * con un token fresco MIENTRAS cargarPerfil() está fallando con el token viejo.
 * Sin retry, el token fresco se pierde y el usuario queda sin sesión.
 */
let _cargarPerfilRunning = false;
let _cargarPerfilRetryNeeded = false;

interface AuthState {
  /** undefined = cargando, null = sin sesión, UsuarioAuth = logueado */
  usuario: UsuarioAuth | null | undefined;
  cargando: boolean;
  setUsuario: (usuario: UsuarioAuth | null) => void;
  cerrarSesion: () => Promise<void>;
  /** Inicializa la suscripción de Supabase Auth. Devuelve la función de cleanup. */
  _init: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: undefined,
  cargando: true,

  setUsuario: (usuario) => set({ usuario, cargando: false }),

  cerrarSesion: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearBackendToken();
    set({ usuario: null, cargando: false });
  },

  _init: () => {
    const supabase = createClient();

    /**
     * @param markRetryIfRunning - true solo para eventos de Supabase (SIGNED_IN,
     * TOKEN_REFRESHED) donde un token fresco justifica un reintento al terminar.
     * false para llamadas directas (init, StrictMode double-mount) — ahí queremos
     * dedupear silenciosamente sin gatillar otro ciclo.
     */
    async function cargarPerfil(markRetryIfRunning = false) {
      if (_cargarPerfilRunning) {
        if (markRetryIfRunning) _cargarPerfilRetryNeeded = true;
        return;
      }
      _cargarPerfilRunning = true;
      _cargarPerfilRetryNeeded = false;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          clearBackendToken();
          set({ usuario: null, cargando: false });
          return;
        }

        // Intenta obtener el perfil usando la cookie HttpOnly existente
        try {
          const usuario = await obtenerUsuarioActual();
          if (usuario) {
            set({ usuario, cargando: false });
            return;
          }
        } catch {
          // Cookie expirada o inexistente — continúa al exchange
        }

        // Intercambia el token de Supabase por un JWT fresco del backend
        try {
          const usuario = await reautenticarConSesionActual();
          set({ usuario: usuario ?? null, cargando: false });
        } catch (error) {
          // En 429, la cookie anterior podría ser válida — no limpiarla todavía
          const is429 = error instanceof ApiError && error.status === 429;
          if (is429) {
            const usuarioExistente = await obtenerUsuarioActual();
            if (usuarioExistente) {
              set({ usuario: usuarioExistente, cargando: false });
              return;
            }
          }
          clearBackendToken();
          set({ usuario: null, cargando: false });
        }
      } finally {
        _cargarPerfilRunning = false;
        if (_cargarPerfilRetryNeeded && !get().usuario) {
          _cargarPerfilRetryNeeded = false;
          cargarPerfil();
        }
      }
    }

    cargarPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearBackendToken();
        set({ usuario: null, cargando: false });
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!get().usuario) {
          // markRetryIfRunning=true: si llega un token fresco mientras corre
          // un cargarPerfil con el viejo, reintentamos al terminar.
          cargarPerfil(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  },
}));

/** Hook de autenticación — alias de useAuthStore para compatibilidad con consumers. */
export const useAuth = () => useAuthStore();
