"use client";

import { create } from "zustand";
import {
  obtenerSolicitudesPropietario,
  type Solicitud,
} from "@/lib/solicitudes";
import { obtenerMisViviendas, type Vivienda } from "@/lib/viviendas";
import {
  obtenerPagosPropietario,
  type PagoPropietario,
} from "@/lib/pagos";
import {
  obtenerContratoBySolicitud,
  type ContratoDigital,
} from "@/lib/contratos";
import { useAuthStore } from "@/store/authStore";

export interface SolicitudConContrato extends Solicitud {
  contrato?: ContratoDigital | null;
}

interface PropietarioState {
  viviendas: Vivienda[];
  solicitudes: SolicitudConContrato[];
  pagos: PagoPropietario[];
  cargando: boolean;
  cargar: () => Promise<void>;
  recargar: () => Promise<void>;
  actualizarViviendaLocal: (id: string, patch: Partial<Vivienda>) => void;
  reset: () => void;
}

const initialState = {
  viviendas: [] as Vivienda[],
  solicitudes: [] as SolicitudConContrato[],
  pagos: [] as PagoPropietario[],
  cargando: true,
};

// Flag module-level para deduplicar cargas concurrentes (StrictMode double-invoke)
let _cargarRunning = false;

export const usePropietarioStore = create<PropietarioState>((set, get) => ({
  ...initialState,

  cargar: async () => {
    if (_cargarRunning) return;
    _cargarRunning = true;
    set({ cargando: true });
    try {
      const [vivResult, solResult, pagResult] = await Promise.all([
        obtenerMisViviendas(),
        obtenerSolicitudesPropietario(),
        obtenerPagosPropietario(),
      ]);

      // Safety filter: backend ya filtra es_borrador=false,
      // pero defendemos client-side por si cambia la API
      const viviendas = vivResult.data.filter((v: Vivienda) => !v.es_borrador);

      const conContratos: SolicitudConContrato[] = [];
      for (const sol of solResult.data) {
        let contrato: ContratoDigital | null = null;
        if (sol.estado === "ACEPTADA") {
          const { data } = await obtenerContratoBySolicitud(sol.id);
          contrato = data;
        }
        conContratos.push({ ...sol, contrato });
      }

      set({
        viviendas,
        solicitudes: conContratos,
        pagos: pagResult.data,
        cargando: false,
      });
    } catch (err) {
      console.error("Error cargando datos del propietario:", err);
      set({ cargando: false });
    } finally {
      _cargarRunning = false;
    }
  },

  recargar: async () => {
    await get().cargar();
  },

  actualizarViviendaLocal: (id, patch) => {
    set((state) => ({
      viviendas: state.viviendas.map((v) =>
        v.id === id ? { ...v, ...patch } : v
      ),
    }));
  },

  reset: () => set(initialState),
}));

/**
 * Hook de compatibilidad — mismo shape que el antiguo PropietarioContext.
 * Incluye `solicitudesPendientes` computado.
 */
export function usePropietario() {
  const state = usePropietarioStore();
  const solicitudesPendientes = state.solicitudes.filter(
    (s) => s.estado === "PENDIENTE"
  ).length;
  return {
    viviendas: state.viviendas,
    solicitudes: state.solicitudes,
    pagos: state.pagos,
    solicitudesPendientes,
    cargando: state.cargando,
    recargar: state.recargar,
    actualizarViviendaLocal: state.actualizarViviendaLocal,
  };
}

// Reset automático en signout: cuando usuario pasa a null, limpiamos el store.
let _prevUsuario: ReturnType<typeof useAuthStore.getState>["usuario"] =
  useAuthStore.getState().usuario;
useAuthStore.subscribe((state) => {
  if (_prevUsuario && state.usuario === null) {
    usePropietarioStore.getState().reset();
  }
  _prevUsuario = state.usuario;
});
