"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ChevronRight, Euro, Loader2 } from "lucide-react";
import { guardarFase, type Vivienda } from "@/lib/viviendas";

interface FasePrecioProps {
  viviendaId: string;
  vivienda: Vivienda;
  onComplete: (vivienda: Vivienda) => void;
}

export default function FasePrecio({
  viviendaId,
  vivienda,
  onComplete,
}: FasePrecioProps) {
  const [precioMes, setPrecioMes] = useState(
    vivienda.precio_mes ? String(vivienda.precio_mes) : "",
  );
  const [fianzaImporte, setFianzaImporte] = useState(
    vivienda.fianza_importe ? String(vivienda.fianza_importe) : "",
  );
  const [disponibleDesde, setDisponibleDesde] = useState(
    vivienda.disponible_desde ?? "",
  );
  const [estanciaMinima, setEstanciaMinima] = useState(
    vivienda.estancia_minima ? String(vivienda.estancia_minima) : "1",
  );
  const [estanciaMaxima, setEstanciaMaxima] = useState(
    vivienda.estancia_maxima ? String(vivienda.estancia_maxima) : "11",
  );

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!precioMes || Number(precioMes) <= 0) return "Indica el precio mensual";
    if (!fianzaImporte || Number(fianzaImporte) <= 0)
      return "Indica el importe de la fianza";
    return null;
  }

  async function handleSubmit() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCargando(true);

    try {
      const resultado = await guardarFase(viviendaId, 4, {
        precio_mes: Number(precioMes),
        fianza_importe: Number(fianzaImporte),
        disponible_desde: disponibleDesde || undefined,
        estancia_minima: Number(estanciaMinima) || 1,
        estancia_maxima: Number(estanciaMaxima) || 11,
      });

      onComplete(resultado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el precio");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Euro className="h-5 w-5 text-indigo-600" /> Precio y disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Precio mensual (€) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="850"
              value={precioMes}
              onChange={(e) => setPrecioMes(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fianza (€) <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              placeholder="850"
              value={fianzaImporte}
              onChange={(e) => setFianzaImporte(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Disponible desde
          </Label>
          <Input
            type="date"
            value={disponibleDesde}
            onChange={(e) => setDisponibleDesde(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estancia mínima{" "}
              <span className="text-slate-400 font-normal normal-case">
                (meses)
              </span>
            </Label>
            <Select value={estanciaMinima} onValueChange={setEstanciaMinima}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "mes" : "meses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estancia máxima{" "}
              <span className="text-slate-400 font-normal normal-case">
                (meses)
              </span>
            </Label>
            <Select value={estanciaMaxima} onValueChange={setEstanciaMaxima}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "mes" : "meses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {cargando ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
