"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface KycDatos {
  nombre: string;
  apellidos: string;
  numero_documento: string;
  fecha_nacimiento: string;
  fecha_expiracion: string;
  nacionalidad: string;
}

export interface KycResultado {
  valido: boolean;
  tipo_documento: string;
  datos: KycDatos;
  confianza: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Quitar el prefijo data:image/...;base64,
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useKycAnalysis() {
  const [resultado, setResultado] = useState<KycResultado | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analizar(file: File) {
    setAnalizando(true);
    setError(null);
    setResultado(null);

    try {
      const imagen_base64 = await fileToBase64(file);

      // Llamar al backend para análisis KYC
      const data = await api.post<KycResultado>("/kyc/analizar", { imagen_base64 });
      setResultado(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setAnalizando(false);
    }
  }

  return { analizar, resultado, analizando, error };
}
