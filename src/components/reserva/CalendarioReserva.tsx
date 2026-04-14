'use client';

import { useEffect, useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import {
  isBefore,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInMonths,
  areIntervalsOverlapping,
} from 'date-fns';
import 'react-day-picker/style.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Ocupacion {
  fecha_entrada: string;
  fecha_salida: string;
}

interface DisponibilidadResponse {
  disponible_desde: string | null;
  estancia_minima: number;
  estancia_maxima: number;
  ocupaciones: Ocupacion[];
}

interface CalendarioReservaProps {
  viviendaId: string;
  estanciaMinima: number;
  estanciaMaxima: number;
  disponibleDesde?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (from: Date, to: Date) => void;
}

export function CalendarioReserva({
  viviendaId,
  estanciaMinima,
  estanciaMaxima,
  disponibleDesde,
  isOpen,
  onClose,
  onConfirm,
}: CalendarioReservaProps) {
  const [ocupaciones, setOcupaciones] = useState<Ocupacion[]>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API_URL}/viviendas/${viviendaId}/disponibilidad`)
      .then((r) => r.json())
      .then((data: DisponibilidadResponse) => {
        setOcupaciones(data.ocupaciones ?? []);
      })
      .catch(() => setOcupaciones([]))
      .finally(() => setLoading(false));
  }, [isOpen, viviendaId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // El mes mínimo seleccionable es el próximo mes (el mes actual ya tiene días pasados
  // y startOfMonth(mes_actual) siempre queda en el pasado)
  const primerMesDisponible = startOfMonth(addMonths(today, 1));

  const disabledDays = (date: Date): boolean => {
    // Bloquear todo el mes actual y anteriores
    if (isBefore(date, primerMesDisponible)) return true;

    if (disponibleDesde) {
      const desde = new Date(disponibleDesde);
      desde.setHours(0, 0, 0, 0);
      if (isBefore(date, desde)) return true;
    }

    for (const oc of ocupaciones) {
      const start = new Date(oc.fecha_entrada);
      const end = new Date(oc.fecha_salida);
      end.setDate(end.getDate() - 1); // fecha_salida es exclusiva
      if (isWithinInterval(date, { start, end })) return true;
    }

    return false;
  };

  // Selección mensual: snap al primer/último día del mes
  const handleSelect = (selected: DateRange | undefined) => {
    setError(null);
    if (!selected) { setRange(undefined); return; }
    const from = selected.from ? startOfMonth(selected.from) : undefined;
    const to = selected.to ? endOfMonth(selected.to) : undefined;
    setRange({ from, to });
  };

  const handleConfirm = () => {
    if (!range?.from || !range?.to) {
      setError('Seleccioná el mes de entrada y el mes de salida.');
      return;
    }
    // Meses exactos: differenceInMonths + 1 (incluye el mes de inicio)
    const meses = differenceInMonths(range.to, range.from) + 1;
    if (meses < estanciaMinima) {
      setError(`La estancia mínima es ${estanciaMinima} ${estanciaMinima === 1 ? 'mes' : 'meses'}.`);
      return;
    }
    if (meses > estanciaMaxima) {
      setError(`La estancia máxima es ${estanciaMaxima} meses.`);
      return;
    }
    // Verificar que el rango seleccionado no se superponga con ocupaciones
    const overlap = ocupaciones.some((oc) =>
      areIntervalsOverlapping(
        { start: range.from!, end: range.to! },
        { start: new Date(oc.fecha_entrada), end: new Date(oc.fecha_salida) },
        { inclusive: false },
      ),
    );
    if (overlap) {
      setError('El período seleccionado tiene fechas ocupadas. Elegí otro rango.');
      return;
    }
    onConfirm(range.from, range.to);
    onClose();
  };

  if (!isOpen) return null;

  return (
    /* Backdrop = scroll container. Click fuera cierra. */
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl mx-auto"
        style={{ marginTop: '8rem', marginBottom: '5rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Seleccioná las fechas</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />
            Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
            Seleccionado
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Cargando disponibilidad...
          </div>
        ) : (
          <div className="flex justify-center">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              disabled={disabledDays}
              numberOfMonths={1}
              locale={es}
              weekStartsOn={1}
              fromDate={primerMesDisponible}
              classNames={{
                disabled: 'opacity-30 cursor-not-allowed',
                range_start: 'rounded-l-full bg-indigo-600 text-white',
                range_end: 'rounded-r-full bg-indigo-600 text-white',
                range_middle: 'bg-indigo-100 text-indigo-700',
                selected: 'bg-indigo-600 text-white rounded-full',
                today: 'font-bold',
              }}
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="text-sm text-slate-500">
            {range?.from && range?.to ? (
              <>
                <span className="font-medium text-slate-700">
                  {range.from.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                {' → '}
                <span className="font-medium text-slate-700">
                  {range.to.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <span className="ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {differenceInMonths(range.to, range.from) + 1} {differenceInMonths(range.to, range.from) + 1 === 1 ? 'mes' : 'meses'}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Seleccioná el mes de entrada y el mes de salida</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!range?.from || !range?.to}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar fechas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
