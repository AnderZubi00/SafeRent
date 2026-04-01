"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  fotos: string[];
  titulo: string;
}

export function GaleriaVivienda({ fotos, titulo }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + fotos.length) % fotos.length));
  }, [fotos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % fotos.length));
  }, [fotos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, prev, next]);

  // Bloquear scroll cuando el lightbox está abierto
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  return (
    <>
      {/* Galería en página */}
      <div className="space-y-2">
        {/* Fila principal */}
        <div className="flex gap-2">
          {/* Foto principal */}
          <button
            onClick={() => open(0)}
            className="rounded-2xl overflow-hidden ring-1 ring-slate-200 shrink-0 flex-2 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            style={{ aspectRatio: "16/9" }}
            aria-label="Ver foto 1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos[0]}
              alt={titulo}
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
            />
          </button>

          {/* Columna secundaria */}
          {fotos.length >= 2 && (
            <div className="flex-1 flex flex-col gap-2">
              {fotos.slice(1, 3).map((url, i) => (
                <button
                  key={i}
                  onClick={() => open(i + 1)}
                  className="rounded-2xl overflow-hidden ring-1 ring-slate-200 flex-1 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={`Ver foto ${i + 2}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${titulo} – foto ${i + 2}`}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fila adicional (4ª, 5ª...) */}
        {fotos.length > 3 && (
          <div className="flex gap-2">
            {fotos.slice(3).map((url, i) => (
              <button
                key={i}
                onClick={() => open(i + 3)}
                className="flex-1 h-20 rounded-xl overflow-hidden ring-1 ring-slate-200 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={`Ver foto ${i + 4}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${i + 4}`}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Contenedor central — no cierra al hacer click en él */}
          <div
            className="relative flex items-center justify-center w-full h-full px-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen activa */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos[lightboxIndex]}
              alt={`${titulo} – foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-[92vh] object-contain select-none"
              draggable={false}
            />

            {/* Contador */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {fotos.length}
            </div>

            {/* Botón cerrar */}
            <button
              onClick={close}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Anterior */}
            {fotos.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Siguiente */}
            {fotos.length > 1 && (
              <button
                onClick={next}
                className="absolute right-2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Miniaturas */}
          {fotos.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {fotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden ring-2 transition-all ${
                    i === lightboxIndex
                      ? "ring-white opacity-100"
                      : "ring-transparent opacity-50 hover:opacity-80"
                  }`}
                  aria-label={`Ir a foto ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
