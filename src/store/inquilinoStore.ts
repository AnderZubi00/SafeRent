"use client";

import { create } from "zustand";
import {
  obtenerSolicitudesInquilino,
  type Solicitud,
} from "@/lib/solicitudes";
import { obtenerPagosInquilino, type Pago } from "@/lib/pagos";
import { obtenerContratoBySolicitud } from "@/lib/contratos";
import { useAuthStore } from "@/store/authStore";

export interface ContratoResumen {
  id: string;
  firmado_propietario: boolean;
  firmado_inquilino: boolean;
  pdf_borrador_url: string | null;
  pdf_final_url: string | null;
  fecha_firma_completa: string | null;
}

export interface SolicitudConContrato extends Solicitud {
  contrato?: ContratoResumen | null;
}

export interface DocumentoInquilino {
  id: string;
  tipo: "identidad" | "temporalidad" | "contrato";
  nombre: string;
  url: string;
  estado: "verificado" | "firmado" | "pendiente" | "rechazado";
  fecha: string;
  viviendaTitulo: string;
  viviendaCiudad: string;
  solicitudId: string;
  motivo?: string;
}

interface InquilinoState {
  solicitudes: SolicitudConContrato[];
  documentos: DocumentoInquilino[];
  pagos: Pago[];
  cargando: boolean;
  cargar: () => Promise<void>;
  recargar: () => Promise<void>;
  reset: () => void;
}

function derivarDocumentos(
  solicitudes: SolicitudConContrato[]
): DocumentoInquilino[] {
  const docs: DocumentoInquilino[] = [];

  for (const sol of solicitudes) {
    const viviendaTitulo = sol.vivienda?.titulo ?? "Vivienda";
    const viviendaCiudad = sol.vivienda?.ciudad ?? "";
    const estadoDoc =
      sol.estado === "RECHAZADA"
        ? ("rechazado" as const)
        : sol.estado === "ACEPTADA"
          ? ("verificado" as const)
          : ("pendiente" as const);

    if (sol.documento_identidad_url) {
      docs.push({
        id: `dni-${sol.id}`,
        tipo: "identidad",
        nombre: "Documento de identidad (DNI/NIE)",
        url: sol.documento_identidad_url,
        estado: estadoDoc,
        fecha: sol.fecha_creacion,
        viviendaTitulo,
        viviendaCiudad,
        solicitudId: sol.id,
      });
    }

    if (sol.documento_justificativo_url) {
      const motivoLabel =
        sol.motivo === "Estudios"
          ? "Matrícula / Justificante de estudios"
          : sol.motivo === "Trabajo temporal"
            ? "Contrato laboral / Justificante de trabajo"
            : `Justificante — ${sol.motivo_detalle ?? sol.motivo}`;

      docs.push({
        id: `just-${sol.id}`,
        tipo: "temporalidad",
        nombre: motivoLabel,
        url: sol.documento_justificativo_url,
        estado: estadoDoc,
        fecha: sol.fecha_creacion,
        viviendaTitulo,
        viviendaCiudad,
        solicitudId: sol.id,
        motivo: sol.motivo,
      });
    }

    if (sol.contrato?.pdf_borrador_url) {
      const firmadoAmbos =
        sol.contrato.firmado_propietario && sol.contrato.firmado_inquilino;
      docs.push({
        id: `contrato-${sol.id}`,
        tipo: "contrato",
        nombre: `Contrato temporal — ${viviendaTitulo}`,
        url: sol.contrato.pdf_borrador_url,
        estado: firmadoAmbos ? "firmado" : "pendiente",
        fecha: sol.contrato.fecha_firma_completa ?? sol.fecha_creacion,
        viviendaTitulo,
        viviendaCiudad,
        solicitudId: sol.id,
      });
    }
  }

  return docs;
}

const initialState = {
  solicitudes: [] as SolicitudConContrato[],
  documentos: [] as DocumentoInquilino[],
  pagos: [] as Pago[],
  cargando: true,
};

// Flag module-level para deduplicar cargas concurrentes (StrictMode double-invoke)
let _cargarRunning = false;

export const useInquilinoStore = create<InquilinoState>((set, get) => ({
  ...initialState,

  cargar: async () => {
    if (_cargarRunning) return;
    _cargarRunning = true;
    set({ cargando: true });
    try {
      const [solResult, pagosResult] = await Promise.all([
        obtenerSolicitudesInquilino(),
        obtenerPagosInquilino(),
      ]);

      const conContratos: SolicitudConContrato[] = [];
      for (const sol of solResult.data) {
        let contrato: ContratoResumen | null = null;
        if (sol.estado === "ACEPTADA") {
          const { data } = await obtenerContratoBySolicitud(sol.id);
          contrato = data;
        }
        conContratos.push({ ...sol, contrato });
      }

      set({
        solicitudes: conContratos,
        documentos: derivarDocumentos(conContratos),
        pagos: pagosResult.data,
        cargando: false,
      });
    } catch (err) {
      console.error("Error cargando datos del inquilino:", err);
      set({ cargando: false });
    } finally {
      _cargarRunning = false;
    }
  },

  recargar: async () => {
    await get().cargar();
  },

  reset: () => set(initialState),
}));

/** Hook de compatibilidad — mismo shape que el antiguo InquilinoContext. */
export function useInquilino() {
  const state = useInquilinoStore();
  return {
    solicitudes: state.solicitudes,
    documentos: state.documentos,
    pagos: state.pagos,
    cargando: state.cargando,
    recargar: state.recargar,
  };
}

// Reset automático en signout: cuando usuario pasa a null, limpiamos el store.
let _prevUsuario: ReturnType<typeof useAuthStore.getState>["usuario"] =
  useAuthStore.getState().usuario;
useAuthStore.subscribe((state) => {
  if (_prevUsuario && state.usuario === null) {
    useInquilinoStore.getState().reset();
  }
  _prevUsuario = state.usuario;
});
