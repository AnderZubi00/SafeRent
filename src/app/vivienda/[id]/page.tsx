import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Separator } from "@/components/ui/separator";
import { CardReserva } from "@/components/reserva/CardReserva";
import type { Vivienda } from "@/lib/viviendas";
import {
  Shield, MapPin, Star, BedDouble, Bath, Maximize2,
  CheckCircle2, FileText, ChevronLeft, Calendar,
  Building2, Home,
} from "lucide-react";

const CARD_COLORS = [
  "from-indigo-500 to-indigo-700",
  "from-teal-500 to-teal-700",
  "from-slate-500 to-slate-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
];

function getColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function FichaVivienda({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await fetch(`${API_URL}/api/v1/viviendas/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) notFound();

  const vivienda = (await res.json()) as Vivienda & {
    propietario: { nombre_completo: string; verificado_kyc: boolean; fecha_creacion: string } | null;
  };

  const propietario = vivienda.propietario;
  const iniciales = propietario?.nombre_completo
    ? propietario.nombre_completo.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  const anioMiembro = propietario?.fecha_creacion
    ? new Date(propietario.fecha_creacion).getFullYear()
    : null;

  const gradientColor = getColor(vivienda.id);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8 pt-[calc(68px+2rem)]">
        <Link href="/buscar" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Volver a resultados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galería */}
            {vivienda.fotos && vivienda.fotos.length > 0 ? (
              <div className="space-y-2">
                {/* Fila principal */}
                <div className={`flex gap-2 ${vivienda.fotos.length === 1 ? "" : ""}`}>
                  {/* Foto principal — ocupa todo el ancho si es la única, si no 65% */}
                  <div
                    className={`rounded-2xl overflow-hidden ring-1 ring-slate-200 shrink-0 ${
                      vivienda.fotos.length === 1 ? "w-full" : "flex-2"
                    }`}
                    style={{ aspectRatio: "16/9" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vivienda.fotos[0]}
                      alt={vivienda.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Columna de fotos secundarias — solo si existen */}
                  {vivienda.fotos.length >= 2 && (
                    <div className="flex-1 flex flex-col gap-2">
                      {vivienda.fotos.slice(1, 3).map((url, i) => (
                        <div
                          key={i}
                          className="rounded-2xl overflow-hidden ring-1 ring-slate-200 flex-1"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`${vivienda.titulo} – foto ${i + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fila de fotos adicionales (4ª y 5ª) */}
                {vivienda.fotos.length > 3 && (
                  <div className="flex gap-2">
                    {vivienda.fotos.slice(3).map((url, i) => (
                      <div
                        key={i}
                        className="flex-1 h-20 rounded-xl overflow-hidden ring-1 ring-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i + 4}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Placeholder sin fotos */
              <div
                className={`bg-linear-to-br ${gradientColor} rounded-2xl flex items-center justify-center ring-1 ring-slate-200 overflow-hidden relative`}
                style={{ aspectRatio: "16/9" }}
              >
                <Home className="h-32 w-32 text-white/10 absolute" />
                <Building2 className="h-16 w-16 text-white/60 relative z-10" />
              </div>
            )}

            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                      <Shield className="h-3.5 w-3.5" /> Vivienda verificada
                    </span>
                    {vivienda.motivos.map((m: string) => (
                      <span key={m} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-indigo-200">
                        {m}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{vivienda.titulo}</h1>
                  <p className="mt-1 text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {vivienda.ciudad}{vivienda.provincia ? `, ${vivienda.provincia}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold text-slate-900">{vivienda.precio_mes}€</p>
                  <p className="text-sm text-slate-500">/mes</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-900">Nueva</span>
                <span className="text-sm text-slate-500">· Sin reseñas aún</span>
              </div>
            </div>

            <Separator className="bg-slate-200" />

            {/* Características */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Habitaciones", value: String(vivienda.habitaciones), icon: BedDouble },
                { label: "Baños", value: String(vivienda.banos), icon: Bath },
                { label: "Superficie", value: `${vivienda.m2} m²`, icon: Maximize2 },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <c.icon className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-lg font-bold text-slate-900">{c.value}</p>
                    <p className="text-xs text-slate-500">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción */}
            {vivienda.descripcion && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{vivienda.descripcion}</p>
              </div>
            )}

            {/* Detalles adicionales */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Detalles de la estancia</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Estancia: {vivienda.estancia_minima ?? 1}–{vivienda.estancia_maxima ?? 11} meses
                </div>
                {vivienda.disponible_desde && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                    <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                    Disponible desde: {new Date(vivienda.disponible_desde).toLocaleDateString("es-ES")}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-700 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                  Nº registro: {vivienda.num_registro_vivienda}
                </div>
              </div>
            </div>

            {/* Propietario */}
            {propietario && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Propietario</h2>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-700 ring-1 ring-indigo-200 shrink-0">
                    {iniciales}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{propietario.nombre_completo}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {propietario.verificado_kyc && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium ring-1 ring-emerald-200">
                          <Shield className="h-3 w-3" /> KYC Verificado
                        </span>
                      )}
                      {anioMiembro && (
                        <span className="text-xs text-slate-500">Miembro desde {anioMiembro}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card de reserva (sticky) */}
          <div className="lg:col-span-1">
            <CardReserva
              viviendaId={id}
              precioMes={vivienda.precio_mes}
              fianzaImporte={vivienda.fianza_importe}
              estanciaMinima={vivienda.estancia_minima}
              estanciaMaxima={vivienda.estancia_maxima}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
