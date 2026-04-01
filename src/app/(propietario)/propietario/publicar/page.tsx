"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerViviendaById,
  obtenerBorradores,
  type Vivienda,
} from "@/lib/viviendas";

import PublicarStepper from "./_components/PublicarStepper";
import FaseNombre from "./_components/FaseNombre";
import FaseKyc from "./_components/FaseKyc";
import FaseDetalles from "./_components/FaseDetalles";
import FasePrecio from "./_components/FasePrecio";
import FaseVerificacion from "./_components/FaseVerificacion";

export default function PublicarViviendaPage() {
  const searchParams = useSearchParams();
  const { usuario, cargando: cargandoAuth } = useAuth();

  const [faseActual, setFaseActual] = useState(1);
  const [vivienda, setVivienda] = useState<Vivienda | null>(null);
  const [cargando, setCargando] = useState(true);

  // ── Load existing borrador or start fresh ──
  useEffect(() => {
    async function cargar() {
      const idParam = searchParams.get("id");

      try {
        if (idParam) {
          // Resume a specific borrador
          const { data } = await obtenerViviendaById(idParam);
          if (data) {
            setVivienda(data);
            // Go to the next incomplete phase
            const nextFase = data.fase_actual >= 5 ? 5 : data.fase_actual + 1;
            setFaseActual(nextFase);
          }
        } else {
          // Check for existing borradores
          const borradores = await obtenerBorradores();
          if (borradores.length > 0) {
            // Load the most recent borrador
            const ultimo = borradores[0];
            setVivienda(ultimo);
            const nextFase =
              ultimo.fase_actual >= 5 ? 5 : ultimo.fase_actual + 1;
            setFaseActual(nextFase);
          }
          // If no borradores, start at fase 1 (already default)
        }
      } catch (e) {
        console.error("Error cargando borrador:", e);
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [searchParams]);

  // ── Phase completion handlers ──

  const handleNombreComplete = useCallback((v: Vivienda) => {
    setVivienda(v);
    setFaseActual(2);
  }, []);

  const handleKycComplete = useCallback(() => {
    setFaseActual(3);
  }, []);

  const handleDetallesComplete = useCallback((v: Vivienda) => {
    setVivienda(v);
    setFaseActual(4);
  }, []);

  const handlePrecioComplete = useCallback((v: Vivienda) => {
    setVivienda(v);
    setFaseActual(5);
  }, []);

  const handlePublicar = useCallback(() => {
    // Redirect is handled inside FaseVerificacion
  }, []);

  // ── Stepper navigation (only to completed phases) ──

  const handleFaseClick = useCallback(
    (fase: number) => {
      if (fase < faseActual) {
        setFaseActual(fase);
      }
    },
    [faseActual],
  );

  // ── Loading states ──

  if (cargandoAuth || cargando) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex flex-col items-center gap-3 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-slate-500">
          Necesitás iniciar sesión para publicar una vivienda.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Publicar vivienda
        </h1>
        <p className="text-slate-500 mt-1">
          Completá los 5 pasos para publicar tu propiedad
        </p>
      </div>

      <PublicarStepper
        faseActual={faseActual}
        onFaseClick={handleFaseClick}
      />

      {/* ── Phase 1: Nombre ── */}
      {faseActual === 1 && (
        <FaseNombre
          onComplete={handleNombreComplete}
          viviendaExistente={vivienda ?? undefined}
        />
      )}

      {/* ── Phase 2: KYC ── */}
      {faseActual === 2 && (
        <FaseKyc onComplete={handleKycComplete} usuario={usuario} />
      )}

      {/* ── Phase 3: Detalles ── */}
      {faseActual === 3 && vivienda && (
        <FaseDetalles
          viviendaId={vivienda.id}
          vivienda={vivienda}
          onComplete={handleDetallesComplete}
        />
      )}

      {/* ── Phase 4: Precio ── */}
      {faseActual === 4 && vivienda && (
        <FasePrecio
          viviendaId={vivienda.id}
          vivienda={vivienda}
          onComplete={handlePrecioComplete}
        />
      )}

      {/* ── Phase 5: Verificacion y Publicar ── */}
      {faseActual === 5 && vivienda && (
        <FaseVerificacion
          viviendaId={vivienda.id}
          vivienda={vivienda}
          onPublicar={handlePublicar}
        />
      )}
    </div>
  );
}
