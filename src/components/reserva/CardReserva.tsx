"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotonReservar } from "@/components/reserva/BotonReservar";
import { Shield, FileText, CreditCard, Calendar } from "lucide-react";

interface CardReservaProps {
  viviendaId: string;
  precioMes: number;
  fianzaImporte: number;
  estanciaMinima?: number;
  estanciaMaxima?: number;
}

function calcularMeses(entrada: string, salida: string): number | null {
  if (!entrada || !salida) return null;
  const d1 = new Date(entrada);
  const d2 = new Date(salida);
  if (d2 <= d1) return null;
  const diffMs = d2.getTime() - d1.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  // Redondear a meses (30 días = 1 mes), mínimo 1
  const meses = Math.max(1, Math.round(diffDias / 30));
  return meses;
}

export function CardReserva({ viviendaId, precioMes, fianzaImporte, estanciaMinima, estanciaMaxima }: CardReservaProps) {
  const [entrada, setEntrada] = useState("");
  const [salida, setSalida] = useState("");

  const meses = useMemo(() => calcularMeses(entrada, salida), [entrada, salida]);
  const mesesDisplay = meses ?? 1;

  const subtotal = precioMes * mesesDisplay;
  const comision = precioMes * 0.09;
  const totalEstimado = subtotal + fianzaImporte + comision;

  // Fecha mínima de entrada: hoy
  const hoy = new Date().toISOString().split("T")[0];

  // Fecha mínima de salida: al menos 1 mes después de entrada
  const minSalida = useMemo(() => {
    if (!entrada) return hoy;
    const d = new Date(entrada);
    const minMeses = estanciaMinima ?? 1;
    d.setMonth(d.getMonth() + minMeses);
    return d.toISOString().split("T")[0];
  }, [entrada, estanciaMinima, hoy]);

  // Fecha máxima de salida: estanciaMaxima meses después de entrada
  const maxSalida = useMemo(() => {
    if (!entrada || !estanciaMaxima) return undefined;
    const d = new Date(entrada);
    d.setMonth(d.getMonth() + estanciaMaxima);
    return d.toISOString().split("T")[0];
  }, [entrada, estanciaMaxima]);

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0 sticky top-24">
      <CardHeader className="pb-4">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-2xl">
            {precioMes}€ <span className="text-base font-normal text-slate-500">/mes</span>
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500">+ {fianzaImporte}€ de fianza</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrada</label>
            <div className="flex items-center gap-2 ring-1 ring-slate-200 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                className="text-sm outline-none flex-1 bg-transparent"
                min={hoy}
                value={entrada}
                onChange={(e) => {
                  setEntrada(e.target.value);
                  // Reset salida si ya no es válida
                  if (salida && e.target.value && new Date(salida) <= new Date(e.target.value)) {
                    setSalida("");
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salida</label>
            <div className="flex items-center gap-2 ring-1 ring-slate-200 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                className="text-sm outline-none flex-1 bg-transparent"
                min={minSalida}
                max={maxSalida}
                value={salida}
                onChange={(e) => setSalida(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 py-3 border-t border-b border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {precioMes}€ × {mesesDisplay} {mesesDisplay === 1 ? "mes" : "meses"}
              {meses === null && <span className="text-slate-400 text-xs ml-1">(estimado)</span>}
            </span>
            <span className="font-medium text-slate-900">{subtotal.toLocaleString("es-ES")}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Fianza (reembolsable)</span>
            <span className="font-medium text-slate-900">{fianzaImporte}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Comisión plataforma (9%)</span>
            <span className="font-medium text-slate-900">{comision.toLocaleString("es-ES", { maximumFractionDigits: 2 })}€</span>
          </div>
        </div>

        <div className="flex justify-between font-bold text-slate-900">
          <span>Total estimado</span>
          <span>{totalEstimado.toLocaleString("es-ES", { maximumFractionDigits: 2 })}€</span>
        </div>

        <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Pago retenido en Escrow
          </p>
          <p className="text-xs text-amber-700 mt-1">Tu pago queda protegido hasta confirmar la estancia.</p>
        </div>

        <BotonReservar viviendaId={viviendaId} fechaEntrada={entrada} fechaSalida={salida} />

        <div className="flex items-center gap-4 text-xs text-slate-500 justify-center">
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Contrato digital</span>
          <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Stripe seguro</span>
        </div>
      </CardContent>
    </Card>
  );
}
