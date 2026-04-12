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
import {
  obtenerSolicitudesPropietario,
  type Solicitud,
} from "@/lib/solicitudes";
import {
  obtenerMisViviendas,
  type Vivienda,
} from "@/lib/viviendas";
import {
  obtenerPagosPropietario,
  type PagoPropietario,
} from "@/lib/pagos";
import { obtenerContratoBySolicitud, type ContratoDigital } from "@/lib/contratos";
import { useAuthStore } from "@/store/authStore";

export interface SolicitudConContrato extends Solicitud {
  contrato?: ContratoDigital | null;
}

interface PropietarioState {
  viviendas: Vivienda[];
  solicitudes: SolicitudConContrato[];
  pagos: PagoPropietario[];
  solicitudesPendientes: number;
  cargando: boolean;
  recargar: () => Promise<void>;
  actualizarViviendaLocal: (id: string, patch: Partial<Vivienda>) => void;
}

const PropietarioContext = createContext<PropietarioState>({
  viviendas: [],
  solicitudes: [],
  pagos: [],
  solicitudesPendientes: 0,
  cargando: true,
  recargar: async () => {},
  actualizarViviendaLocal: () => {},
});

export function PropietarioProvider({ children }: { children: ReactNode }) {
  const { usuario, cargando: authCargando } = useAuthStore();
  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudConContrato[]>([]);
  const [pagos, setPagos] = useState<PagoPropietario[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [vivResult, solResult, pagResult] = await Promise.all([
        obtenerMisViviendas(),
        obtenerSolicitudesPropietario(),
        obtenerPagosPropietario(),
      ]);

      // Safety filter: backend already filters es_borrador=false,
      // but we defend client-side in case of API changes
      setViviendas(vivResult.data.filter((v: Vivienda) => !v.es_borrador));
      setPagos(pagResult.data);

      const conContratos: SolicitudConContrato[] = [];
      for (const sol of solResult.data) {
        let contrato: ContratoDigital | null = null;
        if (sol.estado === "ACEPTADA") {
          const { data } = await obtenerContratoBySolicitud(sol.id);
          contrato = data;
        }
        conContratos.push({ ...sol, contrato });
      }
      setSolicitudes(conContratos);
    } catch (err) {
      console.error("Error cargando datos del propietario:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  const actualizarViviendaLocal = useCallback(
    (id: string, patch: Partial<Vivienda>) => {
      setViviendas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
      );
    },
    []
  );

  useEffect(() => {
    if (!authCargando && usuario) {
      cargar();
    }
  }, [cargar, authCargando, usuario]);

  const solicitudesPendientes = useMemo(
    () => solicitudes.filter((s) => s.estado === "PENDIENTE").length,
    [solicitudes]
  );

  const value = useMemo<PropietarioState>(
    () => ({
      viviendas,
      solicitudes,
      pagos,
      solicitudesPendientes,
      cargando,
      recargar: cargar,
      actualizarViviendaLocal,
    }),
    [viviendas, solicitudes, pagos, solicitudesPendientes, cargando, cargar, actualizarViviendaLocal]
  );

  return (
    <PropietarioContext.Provider value={value}>
      {children}
    </PropietarioContext.Provider>
  );
}

export function usePropietario() {
  return useContext(PropietarioContext);
}
