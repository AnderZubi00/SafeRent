"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotonReservar } from "@/components/reserva/BotonReservar";
import { CalendarioReserva } from "@/components/reserva/CalendarioReserva";
import { Shield, FileText, CreditCard } from "lucide-react";

interface CardReservaProps {
  viviendaId: string;
  precioMes: number;
  fianzaImporte: number;
  estanciaMinima?: number;
  estanciaMaxima?: number;
  disponibleDesde?: string | null;
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

export function CardReserva({ viviendaId, precioMes, fianzaImporte, estanciaMinima, estanciaMaxima, disponibleDesde }: CardReservaProps) {
  const [entrada, setEntrada] = useState("");
  const [salida, setSalida] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const meses = useMemo(() => calcularMeses(entrada, salida), [entrada, salida]);
  const mesesDisplay = meses ?? 1;

  const subtotal = precioMes * mesesDisplay;
  const comision = precioMes * 0.09;
  const totalEstimado = subtotal + fianzaImporte + comision;

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
        {/* Fechas — trigger del modal */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full border border-slate-200 rounded-xl p-3 text-left hover:border-indigo-300 transition-colors"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Entrada</p>
              <p className={`text-sm ${entrada ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {entrada
                  ? new Date(entrada + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Seleccionar'}
              </p>
            </div>
            <div className="border-l border-slate-100 pl-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Salida</p>
              <p className={`text-sm ${salida ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {salida
                  ? new Date(salida + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Seleccionar'}
              </p>
            </div>
          </div>
        </button>

        <div className="space-y-2 py-3 border-t border-b border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {precioMes}€ × {mesesDisplay} {mesesDisplay === 1 ? "mes" : "meses"}
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

      <CalendarioReserva
        viviendaId={viviendaId}
        estanciaMinima={estanciaMinima ?? 1}
        estanciaMaxima={estanciaMaxima ?? 12}
        disponibleDesde={disponibleDesde}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(from, to) => {
          setEntrada(from.toISOString().split('T')[0]);
          setSalida(to.toISOString().split('T')[0]);
        }}
      />
    </Card>
  );
}
