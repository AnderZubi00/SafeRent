"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type KycMobileEstado =
  | "idle"
  | "generando"
  | "esperando_escaneo"
  | "escaneando"
  | "completado"
  | "fallido"
  | "expirado";

export interface KycMobileResultado {
  safeScore: number;
  nombreExtraido: string;
  apellidosExtraidos: string;
  dniExtraido: string;
  tipoDocumento: string;
}

interface SesionData {
  id: string;
  token: string;
  expira_en: string;
}

export function useKycMobileSession() {
  const [estado, setEstado] = useState<KycMobileEstado>("idle");
  const [resultado, setResultado] = useState<KycMobileResultado | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiraEn, setExpiraEn] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expirationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const limpiarSubscripcion = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const limpiarTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (expirationRef.current) {
      clearInterval(expirationRef.current);
      expirationRef.current = null;
    }
  }, []);

  const limpiarTodo = useCallback(() => {
    limpiarSubscripcion();
    limpiarTimers();
  }, [limpiarSubscripcion, limpiarTimers]);

  // QR URL — deep link to open the mobile app directly
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isLocalhost = !appUrl || appUrl.includes("localhost");
  const qrUrl =
    sesionId && token
      ? isLocalhost
        ? `saferent://kyc-movil?token=${token}&sesion=${sesionId}`
        : `${appUrl}/kyc-movil?token=${token}&sesion=${sesionId}`
      : null;

  // Subscribe to Realtime changes
  const subscribirRealtime = useCallback(
    (id: string) => {
      limpiarSubscripcion();

      const supabase = createClient();

      const channel = supabase
        .channel(`kyc_sesion_${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "kyc_sesiones",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const nuevo = payload.new as Record<string, unknown>;
            const dbEstado = nuevo.estado as string;

            if (dbEstado === "ESCANEANDO") {
              setEstado("escaneando");
            } else if (dbEstado === "COMPLETADO") {
              setResultado({
                safeScore: (nuevo.safe_score as number) ?? 0,
                nombreExtraido: (nuevo.nombre_extraido as string) ?? "",
                apellidosExtraidos: (nuevo.apellidos_extraidos as string) ?? "",
                dniExtraido: (nuevo.dni_extraido as string) ?? "",
                tipoDocumento: (nuevo.tipo_documento as string) ?? "",
              });
              setEstado("completado");
              limpiarTodo();
            } else if (dbEstado === "FALLIDO") {
              setEstado("fallido");
              limpiarTodo();
            } else if (dbEstado === "EXPIRADO") {
              setEstado("expirado");
              limpiarTodo();
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    },
    [limpiarSubscripcion, limpiarTodo]
  );

  // Start countdown timer
  const iniciarCountdown = useCallback((expiraEnStr: string) => {
    limpiarTimers();

    function actualizar() {
      const ahora = Date.now();
      const expira = new Date(expiraEnStr).getTime();
      const diff = expira - ahora;

      if (diff <= 0) {
        setTiempoRestante("0:00");
        setEstado("expirado");
        return;
      }

      const minutos = Math.floor(diff / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);
      setTiempoRestante(`${minutos}:${segundos.toString().padStart(2, "0")}`);
    }

    actualizar();
    countdownRef.current = setInterval(actualizar, 1000);

    // Check expiration every 30s
    expirationRef.current = setInterval(() => {
      const ahora = Date.now();
      const expira = new Date(expiraEnStr).getTime();
      if (ahora >= expira) {
        setEstado("expirado");
        limpiarTodo();
      }
    }, 30_000);
  }, [limpiarTimers, limpiarTodo]);

  // Check for recent completed KYC session on mount via backend
  useEffect(() => {
    async function buscarSesionReciente() {
      try {
        const data = await api.get<{
          estado: string;
          safe_score?: number;
          nombre_extraido?: string;
          apellidos_extraidos?: string;
          dni_extraido?: string;
          tipo_documento?: string;
        }>("/kyc/estado");

        if (data.estado === "COMPLETADO") {
          setResultado({
            safeScore: data.safe_score ?? 0,
            nombreExtraido: data.nombre_extraido ?? "",
            apellidosExtraidos: data.apellidos_extraidos ?? "",
            dniExtraido: data.dni_extraido ?? "",
            tipoDocumento: data.tipo_documento ?? "",
          });
          setEstado("completado");
        }
      } catch {
        // No session found or not authenticated — ignore
      }
    }

    buscarSesionReciente();
  }, []);

  // Create session
  const iniciarSesion = useCallback(async () => {
    setEstado("generando");
    setError(null);
    setResultado(null);
    limpiarTodo();

    try {
      // Crear sesión KYC a través del backend
      const data = await api.post<SesionData>("/kyc/sesion");
      setSesionId(data.id);
      setToken(data.token);
      setExpiraEn(data.expira_en);
      setEstado("esperando_escaneo");

      subscribirRealtime(data.id);
      iniciarCountdown(data.expira_en);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setEstado("fallido");
    }
  }, [limpiarTodo, subscribirRealtime, iniciarCountdown]);

  // Cancel
  const cancelar = useCallback(() => {
    limpiarTodo();
    setEstado("idle");
    setSesionId(null);
    setToken(null);
    setExpiraEn(null);
    setResultado(null);
    setTiempoRestante("");
    setError(null);
  }, [limpiarTodo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      limpiarTodo();
    };
  }, [limpiarTodo]);

  return {
    estado,
    resultado,
    qrUrl,
    tiempoRestante,
    iniciarSesion,
    cancelar,
    error,
    token,
    sesionId,
  };
}
