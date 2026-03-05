"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AlertCircle } from "lucide-react";

interface BotonReservarProps {
  viviendaId: string;
}

export function BotonReservar({ viviendaId }: BotonReservarProps) {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [error, setError] = useState<string | null>(null);

  function handleReservar() {
    setError(null);

    if (cargando) return;

    if (!usuario) {
      const redirectUrl = `/inquilino/checkout?vivienda=${viviendaId}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    if (usuario.rol !== "INQUILINO") {
      setError("Solo los inquilinos pueden reservar viviendas. Inicia sesión con una cuenta de inquilino.");
      return;
    }

    router.push(`/inquilino/checkout?vivienda=${viviendaId}`);
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}
      <Button
        onClick={handleReservar}
        disabled={cargando}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 font-semibold shadow-sm"
      >
        <span className="flex items-center gap-2">
          Reservar ahora <ArrowRight className="h-4 w-4" />
        </span>
      </Button>
    </div>
  );
}
