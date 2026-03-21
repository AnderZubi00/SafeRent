"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  useKycMobileSession,
  type KycMobileResultado,
} from "@/hooks/useKycMobileSession";
import { KycResultBadge } from "@/components/kyc/KycResultBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  QrCode,
} from "lucide-react";

interface Props {
  onCompletado: (resultado: KycMobileResultado) => void;
}

export function KycMobilePanel({ onCompletado }: Props) {
  const {
    estado,
    resultado,
    qrUrl,
    tiempoRestante,
    iniciarSesion,
    error,
    token,
    sesionId,
  } = useKycMobileSession();

  const [iniciado, setIniciado] = useState(false);
  const completadoRef = useRef(false);

  // Auto-call onCompletado after 1.5s when completed
  useEffect(() => {
    if (estado === "completado" && resultado && !completadoRef.current) {
      completadoRef.current = true;
      const timer = setTimeout(() => {
        onCompletado(resultado);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [estado, resultado, onCompletado]);

  // If we found a recent completed session on mount, notify immediately
  useEffect(() => {
    if (estado === "completado" && resultado && !iniciado) {
      completadoRef.current = true;
      onCompletado(resultado);
    }
  }, [estado, resultado, iniciado, onCompletado]);

  const handleIniciar = async () => {
    setIniciado(true);
    completadoRef.current = false;
    await iniciarSesion();
  };

  // idle state or not yet started — show button
  if (estado === "idle" && !iniciado) {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">Verificar con el móvil</p>
              <p className="text-sm text-muted-foreground mt-1">
                Escaneá un QR y usá la cámara del celular para capturar tu documento
              </p>
            </div>
            <Button
              onClick={handleIniciar}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              <QrCode className="h-4 w-4" />
              Generar código QR
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generating
  if (estado === "generando") {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Generando código QR...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Waiting for scan — show QR
  if (estado === "esperando_escaneo" && qrUrl) {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0 overflow-hidden">
        <CardContent className="p-0">
          {/* QR on dark background */}
          <div className="bg-slate-950 flex flex-col items-center gap-4 p-8">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG
                value={qrUrl}
                size={200}
                level="M"
                includeMargin
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                Escaneá con la App SafeRent
              </p>
              <p className="text-xs text-slate-400 mt-1">
                para verificar tu DNI
              </p>
            </div>
            {tiempoRestante && (
              <p className="text-xs text-slate-400">
                Expira en{" "}
                <span className="font-mono font-medium text-white">
                  {tiempoRestante}
                </span>
              </p>
            )}
          </div>

          {/* Dev token + sesionId + skip link */}
          <div className="p-4 space-y-3">
            {token && sesionId && (
              <div className="rounded-lg bg-slate-100 px-3 py-2 space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Datos para Expo Go
                </p>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Token</p>
                  <p
                    className="text-xs font-mono text-slate-700 break-all cursor-pointer select-all"
                    title="Hacé clic para seleccionar"
                    onClick={(e) => {
                      const range = document.createRange();
                      range.selectNodeContents(e.currentTarget);
                      window.getSelection()?.removeAllRanges();
                      window.getSelection()?.addRange(range);
                    }}
                  >
                    {token}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">ID Sesión</p>
                  <p
                    className="text-xs font-mono text-slate-700 break-all cursor-pointer select-all"
                    title="Hacé clic para seleccionar"
                    onClick={(e) => {
                      const range = document.createRange();
                      range.selectNodeContents(e.currentTarget);
                      window.getSelection()?.removeAllRanges();
                      window.getSelection()?.addRange(range);
                    }}
                  >
                    {sesionId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scanning — mobile is processing
  if (estado === "escaneando") {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <Smartphone className="h-12 w-12 text-indigo-500 animate-pulse" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-900">
              El móvil está procesando tu documento…
            </p>
            <p className="text-xs text-muted-foreground">
              No cierres esta ventana
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completed
  if (estado === "completado" && resultado) {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">Análisis completado</p>
            <KycResultBadge resultado={resultado} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed
  if (estado === "fallido") {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">
                Error en la verificación
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {error || "Ocurrió un error al procesar el documento"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIniciar}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expired — auto-regenerate
  if (estado === "expirado") {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="text-sm font-medium text-amber-600">
                Sesión expirada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                El código QR ha expirado. Generá uno nuevo para continuar.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIniciar}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generar nuevo QR
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback loading
  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </CardContent>
    </Card>
  );
}
