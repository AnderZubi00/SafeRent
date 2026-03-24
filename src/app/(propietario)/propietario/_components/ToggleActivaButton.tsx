"use client";

import { useTransition } from "react";
import { toggleActivaVivienda } from "../actions";
import { usePropietario } from "@/context/PropietarioContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface Props {
  id: string;
  activa: boolean;
}

export default function ToggleActivaButton({ id, activa }: Props) {
  const [isPending, startTransition] = useTransition();
  const { actualizarViviendaLocal } = usePropietario();

  function handleToggle() {
    const nuevoEstado = !activa;
    actualizarViviendaLocal(id, { activa: nuevoEstado }); // optimistic

    startTransition(async () => {
      const { error } = await toggleActivaVivienda(id, nuevoEstado);
      if (error) actualizarViviendaLocal(id, { activa }); // revert
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={activa ? "Pausar anuncio" : "Publicar anuncio"}
      className={`
        flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold
        ring-1 transition-all duration-200 disabled:opacity-60
        ${activa
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
        }
      `}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : activa ? (
        <Eye className="h-3 w-3" />
      ) : (
        <EyeOff className="h-3 w-3" />
      )}
      {activa ? "Visible" : "Pausada"}
    </button>
  );
}
