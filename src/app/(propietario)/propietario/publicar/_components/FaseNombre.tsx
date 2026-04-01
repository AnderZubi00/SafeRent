"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Type } from "lucide-react";
import { crearBorrador, guardarFase, type Vivienda } from "@/lib/viviendas";

interface FaseNombreProps {
  onComplete: (vivienda: Vivienda) => void;
  viviendaExistente?: Vivienda;
}

export default function FaseNombre({
  onComplete,
  viviendaExistente,
}: FaseNombreProps) {
  const [titulo, setTitulo] = useState(viviendaExistente?.titulo ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const tituloTrimmed = titulo.trim();
    if (!tituloTrimmed) {
      setError("El título es obligatorio");
      return;
    }

    setError(null);
    setCargando(true);

    try {
      let vivienda: Vivienda;

      if (viviendaExistente) {
        vivienda = await guardarFase(viviendaExistente.id, 1, {
          titulo: tituloTrimmed,
        });
      } else {
        vivienda = await crearBorrador(tituloTrimmed);
      }

      onComplete(vivienda);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Type className="h-5 w-5 text-indigo-600" /> Nombre de la vivienda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Título del anuncio <span className="text-rose-500">*</span>
          </Label>
          <Input
            placeholder="Ej: Piso luminoso en el centro de Donostia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <p className="text-xs text-slate-400">
            Pon un título atractivo que describa tu vivienda
          </p>
        </div>

        {error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {cargando ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : viviendaExistente ? (
            "Continuar"
          ) : (
            "Crear borrador"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
