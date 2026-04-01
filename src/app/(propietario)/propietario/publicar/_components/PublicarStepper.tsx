"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FASES = [
  { num: 1, nombre: "Nombre" },
  { num: 2, nombre: "Verificación" },
  { num: 3, nombre: "Detalles" },
  { num: 4, nombre: "Precio" },
  { num: 5, nombre: "Publicar" },
];

interface PublicarStepperProps {
  faseActual: number;
  onFaseClick?: (fase: number) => void;
}

export default function PublicarStepper({
  faseActual,
  onFaseClick,
}: PublicarStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {FASES.map((fase, i) => {
        const isCompleted = faseActual > fase.num;
        const isCurrent = faseActual === fase.num;
        const isClickable = isCompleted && onFaseClick;

        return (
          <div key={fase.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onFaseClick(fase.num)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white cursor-pointer hover:bg-emerald-400"
                    : isCurrent
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "bg-white border-slate-200 text-slate-400",
                  !isClickable && "cursor-default",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  fase.num
                )}
              </button>
              <p
                className={cn(
                  "text-xs font-medium text-center",
                  isCurrent
                    ? "text-indigo-700"
                    : isCompleted
                      ? "text-emerald-600"
                      : "text-slate-400",
                )}
              >
                {fase.nombre}
              </p>
            </div>
            {i < FASES.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mb-5 mx-1",
                  isCompleted ? "bg-emerald-300" : "bg-slate-100",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
