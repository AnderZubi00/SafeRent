'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  addMonths,
  subMonths,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SolicitudCalendario {
  id: string;
  vivienda_id: string;
  fecha_entrada: string;
  fecha_salida: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  inquilino?: {
    nombre_completo: string;
    email: string;
  } | null;
  // Alias usado en el store
  usuarios?: {
    nombre_completo: string;
    email: string;
  } | null;
}

interface CalendarioPropietarioProps {
  solicitudes: SolicitudCalendario[];
  viviendaId: string;
}

type EstadoDia = 'aceptado' | 'pendiente' | null;

interface TooltipInfo {
  texto: string;
  dayKey: string;
}

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function CalendarioPropietario({ solicitudes, viviendaId }: CalendarioPropietarioProps) {
  const [mesActual, setMesActual] = useState<Date>(new Date());
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Filtrar solo solicitudes activas de esta vivienda
  const solicitudesActivas = useMemo(
    () =>
      solicitudes.filter(
        (s) =>
          s.vivienda_id === viviendaId &&
          (s.estado === 'ACEPTADA' || s.estado === 'PENDIENTE')
      ),
    [solicitudes, viviendaId]
  );

  // Mapa día → estado para lookup O(1)
  const mapaEstados = useMemo(() => {
    const mapa = new Map<string, EstadoDia>();
    solicitudesActivas.forEach((s) => {
      const inicio = parseISO(s.fecha_entrada);
      const fin = parseISO(s.fecha_salida);
      const dias = eachDayOfInterval({ start: inicio, end: fin });
      dias.forEach((d) => {
        const key = format(d, 'yyyy-MM-dd');
        // ACEPTADA tiene prioridad sobre PENDIENTE
        if (!mapa.has(key) || s.estado === 'ACEPTADA') {
          mapa.set(key, s.estado === 'ACEPTADA' ? 'aceptado' : 'pendiente');
        }
      });
    });
    return mapa;
  }, [solicitudesActivas]);

  // Días del calendario (incluyendo días de semanas parciales)
  const diasCalendario = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fin });
  }, [mesActual]);

  const handleDayEnter = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const estado = mapaEstados.get(key);
    if (!estado) {
      setTooltip(null);
      return;
    }
    const solicitud = solicitudesActivas.find((s) =>
      isWithinInterval(day, {
        start: parseISO(s.fecha_entrada),
        end: parseISO(s.fecha_salida),
      })
    );
    if (solicitud) {
      const nombre =
        solicitud.usuarios?.nombre_completo ??
        solicitud.inquilino?.nombre_completo ??
        'Inquilino';
      const texto =
        estado === 'aceptado'
          ? `Ocupado — ${nombre}`
          : `Pendiente — ${nombre}`;
      setTooltip({ texto, dayKey: key });
    }
  };

  const tituloMes = format(mesActual, 'MMMM yyyy', { locale: es });

  // Reservas activas para el listado inferior
  const reservasConNombre = solicitudesActivas.map((s) => ({
    ...s,
    nombre:
      s.usuarios?.nombre_completo ??
      s.inquilino?.nombre_completo ??
      'Inquilino',
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">
          Calendario de ocupación
        </h3>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
            Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-300 inline-block" />
            Pendiente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
            Disponible
          </span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg inline-block">
          {tooltip.texto}
        </div>
      )}

      {/* Navegación de mes */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMesActual((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-700 capitalize">
          {tituloMes}
        </span>
        <button
          onClick={() => setMesActual((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid de días */}
      <div onMouseLeave={() => setTooltip(null)}>
        {/* Cabecera de días de semana */}
        <div className="grid grid-cols-7 mb-1">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-semibold text-slate-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {diasCalendario.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const estado = mapaEstados.get(key) ?? null;
            const esMismoMes = isSameMonth(day, mesActual);
            const esHoy = isToday(day);

            return (
              <div
                key={key}
                className={cn(
                  'relative flex items-center justify-center h-9 text-[13px] font-medium rounded-md cursor-default transition-opacity select-none',
                  !esMismoMes && 'opacity-30',
                  estado === 'aceptado' &&
                    'bg-red-400 text-white',
                  estado === 'pendiente' &&
                    'bg-amber-300 text-amber-900',
                  estado === null && 'hover:bg-slate-50 text-slate-700',
                  esHoy &&
                    estado === null &&
                    'ring-2 ring-inset ring-indigo-400 text-indigo-700 font-bold'
                )}
                onMouseEnter={() => handleDayEnter(day)}
              >
                {format(day, 'd')}
                {esHoy && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Listado de reservas activas */}
      {reservasConNombre.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Reservas en esta vivienda
          </p>
          {reservasConNombre.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
            >
              <span className="font-medium">{s.nombre}</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {format(parseISO(s.fecha_entrada), 'dd MMM', { locale: es })}
                  {' – '}
                  {format(parseISO(s.fecha_salida), 'dd MMM yyyy', { locale: es })}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                    s.estado === 'ACEPTADA'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {s.estado === 'ACEPTADA' ? 'Ocupado' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400 pt-2 border-t border-slate-100">
          Sin reservas registradas. Todos los días están disponibles.
        </p>
      )}
    </div>
  );
}
