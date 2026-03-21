"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KycMobileResultado } from "@/hooks/useKycMobileSession";

interface LegacyResultado {
  valido: boolean;
  tipo_documento: string;
  datos: {
    nombre: string;
    apellidos: string;
    numero_documento: string;
  };
  confianza: number;
}

interface Props {
  resultado: LegacyResultado | KycMobileResultado | null;
  className?: string;
}

function isSafeScore(r: LegacyResultado | KycMobileResultado): r is KycMobileResultado {
  return "safeScore" in r;
}

export function KycResultBadge({ resultado, className }: Props) {
  if (!resultado) return null;

  if (isSafeScore(resultado)) {
    const { safeScore, nombreExtraido, apellidosExtraidos, dniExtraido } = resultado;

    if (safeScore >= 70) {
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 gap-2 px-3 py-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Verificado</span>
          </Badge>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-green-600">{safeScore}</span>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">
                {nombreExtraido} {apellidosExtraidos}
              </p>
              <p>Doc: {dniExtraido}</p>
            </div>
          </div>
        </div>
      );
    }

    if (safeScore >= 40) {
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          <Badge
            variant="default"
            className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 gap-2 px-3 py-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Revisión manual</span>
          </Badge>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-yellow-600">{safeScore}</span>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>Documento detectado pero confianza media</p>
              <p className="text-xs">
                Intentá con mejor iluminación o una foto más nítida
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Badge
          variant="default"
          className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 gap-2 px-3 py-2"
        >
          <XCircle className="h-4 w-4" />
          <span>No verificado</span>
        </Badge>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-red-600">{safeScore}</span>
          <p className="text-sm text-muted-foreground">
            No se pudo verificar el documento
          </p>
        </div>
      </div>
    );
  }

  // Legacy format (from useKycAnalysis)
  const { valido, datos, confianza } = resultado;

  if (valido && confianza >= 70) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 gap-2 px-3 py-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Verificado</span>
        </Badge>
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">
            {datos.nombre} {datos.apellidos}
          </p>
          <p>Doc: {datos.numero_documento}</p>
          <p className="text-xs">Confianza: {confianza}%</p>
        </div>
      </div>
    );
  }

  if (valido && confianza < 70) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Badge
          variant="default"
          className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 gap-2 px-3 py-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Verificación parcial</span>
        </Badge>
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p>
            El documento se detectó pero la confianza es baja ({confianza}
            %)
          </p>
          <p className="text-xs">
            Intentá con mejor iluminación o una foto más nítida
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Badge
        variant="default"
        className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 gap-2 px-3 py-2"
      >
        <XCircle className="h-4 w-4" />
        <span>No verificado</span>
      </Badge>
      <div className="text-sm text-muted-foreground space-y-0.5">
        <p>No se pudo verificar el documento</p>
        <p className="text-xs">Confianza: {confianza}%</p>
      </div>
    </div>
  );
}
