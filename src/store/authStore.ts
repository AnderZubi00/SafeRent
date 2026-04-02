import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import {
  obtenerUsuarioActual,
  reautenticarConSesionActual,
  type UsuarioAuth,
} from "@/lib/auth";
import { clearBackendToken, getBackendToken } from "@/lib/api";

interface AuthState {
  /** undefined = cargando, null = sin sesión, UsuarioAuth = logueado */
  usuario: UsuarioAuth | null | undefined;
  cargando: boolean;
  setUsuario: (usuario: UsuarioAuth | null) => void;
  cerrarSesion: () => Promise<void>;
  /** Inicializa la suscripción de Supabase Auth. Devuelve la función de cleanup. */
  _init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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

    async function cargarPerfil() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        clearBackendToken();
        set({ usuario: null, cargando: false });
        return;
      }

      // Intenta usar el JWT almacenado para obtener el perfil (sin red extra)
      if (getBackendToken()) {
        try {
          const usuario = await obtenerUsuarioActual();
          if (usuario) {
            set({ usuario, cargando: false });
            return;
          }
        } catch {
          // JWT expirado — continúa al re-exchange
        }
      }

      // Re-intercambia el token de Supabase por un JWT fresco del backend
      try {
        const usuario = await reautenticarConSesionActual();
        set({ usuario: usuario ?? null, cargando: false });
      } catch {
        clearBackendToken();
        set({ usuario: null, cargando: false });
      }
    }

    cargarPerfil();

    // Escucha eventos de sesión de Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearBackendToken();
        set({ usuario: null, cargando: false });
        return;
      }
      // TOKEN_REFRESHED: el backend JWT (7d) sigue válido, no hay que re-exchange.
      // SIGNED_IN desde otra pestaña: recargamos el perfil.
      if (event === "SIGNED_IN") {
        cargarPerfil();
      }
    });

    return () => subscription.unsubscribe();
  },
}));
