"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { KycMobilePanel } from "@/components/kyc/KycMobilePanel";
import type { KycMobileResultado } from "@/hooks/useKycMobileSession";
import { completarKycPropietario } from "@/lib/kyc";
import { obtenerUsuarioActual, type UsuarioAuth } from "@/lib/auth";
import { useAuth } from "@/store/authStore";

interface FaseKycProps {
  onComplete: () => void;
  usuario: UsuarioAuth;
}

export default function FaseKyc({ onComplete, usuario }: FaseKycProps) {
  const { setUsuario } = useAuth();
  const [mostrarKyc, setMostrarKyc] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKycComplete(resultado: KycMobileResultado) {
    setCargando(true);
    setError(null);

    try {
      await completarKycPropietario({
        nombre: resultado.nombreExtraido,
        apellidos: resultado.apellidosExtraidos,
        dni_nie: resultado.dniExtraido,
        tipo_documento: resultado.tipoDocumento,
      });

      // Refresh user data
      const usuarioActualizado = await obtenerUsuarioActual();
      if (usuarioActualizado) {
        setUsuario(usuarioActualizado);
      }

      onComplete();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al completar la verificación",
      );
    } finally {
      setCargando(false);
    }
  }

  // Verificación real: flag true AND datos completos.
  // Protege contra estados inconsistentes (flag=true con campos null por seeds/migraciones viejas).
  const kycCompleto = Boolean(
    usuario.verificado_kyc &&
      usuario.nombre_kyc &&
      usuario.apellidos_kyc &&
      usuario.tipo_documento
  );

  // Already verified
  if (kycCompleto && !mostrarKyc) {
    return (
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> Verificación
            de identidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-3 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Identidad verificada
              </p>
              <div className="text-sm text-emerald-700 mt-1 space-y-0.5">
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {usuario.nombre_kyc ?? "-"}
                </p>
                <p>
                  <span className="font-medium">Apellidos:</span>{" "}
                  {usuario.apellidos_kyc ?? "-"}
                </p>
                <p>
                  <span className="font-medium">Documento:</span>{" "}
                  {usuario.tipo_documento ?? "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={onComplete}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Continuar
            </Button>
            <button
              type="button"
              onClick={() => setMostrarKyc(true)}
              className="text-xs text-slate-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
            >
              Actualizar datos de verificación
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not verified or wants to update
  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-indigo-600" /> Verificación de
          identidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!kycCompleto && (
          <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800">
              Para publicar una vivienda, necesitás verificar tu identidad
              escaneando tu DNI/NIE con el móvil.
            </p>
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">
              Guardando verificación...
            </p>
          </div>
        ) : (
          <KycMobilePanel onCompletado={handleKycComplete} />
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {mostrarKyc && kycCompleto && (
          <button
            type="button"
            onClick={() => setMostrarKyc(false)}
            className="text-xs text-slate-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
          >
            Cancelar y mantener datos actuales
          </button>
        )}
      </CardContent>
    </Card>
  );
}
