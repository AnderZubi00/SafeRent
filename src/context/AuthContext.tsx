"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { UsuarioAuth } from "@/lib/auth";
import { api, setBackendToken, clearBackendToken, getBackendToken } from "@/lib/api";

interface AuthState {
  /** undefined = cargando, null = sin sesión, UsuarioAuth = logueado */
  usuario: UsuarioAuth | null | undefined;
  cargando: boolean;
  setUsuario: (u: UsuarioAuth | null) => void;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  usuario: undefined,
  cargando: true,
  setUsuario: () => {},
  cerrarSesion: async () => {},
});

/**
 * Intercambia el token de Supabase por un JWT del backend.
 * Si ya tenemos un JWT válido, usa /auth/me para cargar el perfil.
 */
async function exchangeToken(supabaseAccessToken: string): Promise<UsuarioAuth | null> {
  try {
    // Si ya tenemos un JWT del backend, intentar usarlo primero
    const existingToken = getBackendToken();
    if (existingToken) {
      try {
        const perfil = await api.get<UsuarioAuth>("/auth/me");
        return perfil;
      } catch {
        // Token expirado, hacer exchange
        clearBackendToken();
      }
    }

    // Exchange: Supabase token → Backend JWT
    const result = await api.post<{ access_token: string; usuario: UsuarioAuth }>(
      "/auth/exchange",
      { supabase_token: supabaseAccessToken }
    );
    setBackendToken(result.access_token);
    return result.usuario;
  } catch (err) {
    console.error("Error en exchange de token:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    async function cargarPerfil() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        clearBackendToken();
        setUsuario(null);
        return;
      }

      const perfil = await exchangeToken(session.access_token);
      setUsuario(perfil);
    }

    cargarPerfil();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token) {
        clearBackendToken();
        setUsuario(null);
        return;
      }

      const perfil = await exchangeToken(session.access_token);
      setUsuario(perfil);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cerrar = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearBackendToken();
    setUsuario(null);
  }, []);

  const value = useMemo<AuthState>(() => ({
    usuario,
    cargando: usuario === undefined,
    setUsuario,
    cerrarSesion: cerrar,
  }), [usuario, cerrar]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
