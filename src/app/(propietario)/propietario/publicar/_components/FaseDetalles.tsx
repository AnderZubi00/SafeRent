"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Camera,
  ChevronRight,
  ImageIcon,
  Loader2,
  Upload,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { guardarFase, type Vivienda } from "@/lib/viviendas";
import LocationSelector from "@/components/forms/LocationSelector";

const MOTIVOS_OPCIONES = ["Estudios", "Trabajo temporal", "Otros"];

interface FaseDetallesProps {
  viviendaId: string;
  vivienda: Vivienda;
  onComplete: (vivienda: Vivienda) => void;
}

export default function FaseDetalles({
  viviendaId,
  vivienda,
  onComplete,
}: FaseDetallesProps) {
  // Form state pre-filled from vivienda data
  const [descripcion, setDescripcion] = useState(vivienda.descripcion ?? "");
  const [provincia, setProvincia] = useState(vivienda.provincia ?? "");
  const [ciudad, setCiudad] = useState(vivienda.ciudad ?? "");
  const [direccion, setDireccion] = useState(vivienda.direccion ?? "");
  const [habitaciones, setHabitaciones] = useState(
    vivienda.habitaciones ? String(vivienda.habitaciones) : "2",
  );
  const [banos, setBanos] = useState(
    vivienda.banos ? String(vivienda.banos) : "1",
  );
  const [m2, setM2] = useState(vivienda.m2 ? String(vivienda.m2) : "");
  const [numRegistro, setNumRegistro] = useState(
    vivienda.num_registro_vivienda ?? "",
  );
  const [motivos, setMotivos] = useState<string[]>(
    vivienda.motivos?.length ? vivienda.motivos : ["Estudios", "Trabajo temporal"],
  );

  // Photo state
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
  const [fotosNuevasPreviews, setFotosNuevasPreviews] = useState<string[]>([]);
  const [fotosExistentes, setFotosExistentes] = useState<string[]>(
    vivienda.fotos ?? [],
  );

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Photo handlers (copied from original page.tsx pattern) ──

  function handleFotoPrincipal(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Replace first photo
    if (fotosExistentes.length > 0) {
      // Remove existing principal, add new file as principal
      setFotosExistentes((prev) => prev.slice(1));
    } else if (fotosNuevas.length > 0) {
      setFotosNuevas((prev) => prev.slice(1));
      setFotosNuevasPreviews((prev) => prev.slice(1));
    }
    const file = files[0];
    setFotosNuevas((prev) => [file, ...prev]);
    setFotosNuevasPreviews((prev) => [URL.createObjectURL(file), ...prev]);
  }

  function handleFotosAdicionales(files: FileList | null) {
    if (!files) return;
    const nuevas = Array.from(files);
    setFotosNuevas((prev) => [...prev, ...nuevas]);
    setFotosNuevasPreviews((prev) => [
      ...prev,
      ...nuevas.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function eliminarFotoExistente(idx: number) {
    setFotosExistentes((prev) => prev.filter((_, i) => i !== idx));
  }

  function eliminarFotoNueva(idx: number) {
    setFotosNuevas((prev) => prev.filter((_, i) => i !== idx));
    setFotosNuevasPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleMotivo(motivo: string) {
    setMotivos((prev) =>
      prev.includes(motivo) ? prev.filter((m) => m !== motivo) : [...prev, motivo],
    );
  }

  // ── Validation ──

  function validate(): string | null {
    if (!m2 || Number(m2) <= 0) return "Indica los metros cuadrados";
    if (!numRegistro.trim()) return "El número de registro es obligatorio";
    if (!provincia) return "Selecciona una provincia";
    if (!ciudad) return "Selecciona una ciudad";
    if (!direccion.trim()) return "La dirección es obligatoria";
    if (motivos.length === 0) return "Selecciona al menos un motivo de estancia";
    return null;
  }

  // ── Submit ──

  async function handleSubmit() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCargando(true);

    try {
      // Upload new photos via signed URLs
      const uploadedUrls: string[] = [];

      for (const foto of fotosNuevas) {
        try {
          const { signedUrl, publicUrl } = await api.post<{
            signedUrl: string;
            publicUrl: string;
          }>(`/viviendas/${viviendaId}/fotos/upload-url`, {
            filename: foto.name,
          });

          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            body: foto,
            headers: { "Content-Type": foto.type },
          });

          if (uploadRes.ok) {
            uploadedUrls.push(publicUrl);
          } else {
            console.error(`Error subiendo foto ${foto.name}:`, uploadRes.status);
          }
        } catch (uploadErr) {
          console.error(`Error subiendo foto ${foto.name}:`, uploadErr);
        }
      }

      const todasLasFotos = [...fotosExistentes, ...uploadedUrls];

      const resultado = await guardarFase(viviendaId, 3, {
        descripcion: descripcion || undefined,
        provincia,
        ciudad,
        direccion,
        habitaciones: Number(habitaciones),
        banos: Number(banos),
        m2: Number(m2),
        num_registro_vivienda: numRegistro,
        motivos,
        fotos: todasLasFotos,
      });

      onComplete(resultado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar los detalles");
    } finally {
      setCargando(false);
    }
  }

  // ── Combined photos for display ──
  const allPreviews = [
    ...fotosExistentes.map((url) => ({ type: "existing" as const, src: url })),
    ...fotosNuevasPreviews.map((url) => ({ type: "new" as const, src: url })),
  ];
  const principalPreview = allPreviews[0];
  const additionalPreviews = allPreviews.slice(1);

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-indigo-600" /> Detalles de la vivienda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* ── Photos ── */}
        <div className="space-y-4">
          <input
            id="foto-principal-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFotoPrincipal(e.target.files)}
          />
          <input
            id="fotos-adicionales-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFotosAdicionales(e.target.files)}
          />

          {/* Principal photo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Foto principal
            </Label>
            {principalPreview ? (
              <div
                className="relative h-52 rounded-xl overflow-hidden ring-1 ring-slate-200 group cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFotoPrincipal(e.dataTransfer.files);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={principalPreview.src}
                  alt="Foto principal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
                  Principal
                </span>
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label
                    htmlFor="foto-principal-input"
                    className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer shadow-sm"
                  >
                    <Upload className="h-3.5 w-3.5" /> Cambiar
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (principalPreview.type === "existing") {
                        eliminarFotoExistente(0);
                      } else {
                        eliminarFotoNueva(0);
                      }
                    }}
                    className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm"
                  >
                    <XIcon className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="foto-principal-input"
                className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all group text-slate-400 group-hover:text-indigo-500"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFotoPrincipal(e.dataTransfer.files);
                }}
              >
                <Upload className="h-8 w-8" />
                <p className="text-sm font-medium">
                  Arrastrá la foto principal aquí o hacé clic
                </p>
                <p className="text-xs">JPG, PNG o WEBP · 10 MB máx.</p>
              </label>
            )}
          </div>

          {/* Additional photos */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fotos adicionales{" "}
              {additionalPreviews.length > 0 && (
                <span className="text-slate-400 font-normal normal-case">
                  ({additionalPreviews.length} añadida
                  {additionalPreviews.length !== 1 ? "s" : ""})
                </span>
              )}
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {additionalPreviews.map((preview, i) => {
                // Calculate the real index based on type
                const realExistingIdx =
                  preview.type === "existing"
                    ? fotosExistentes.indexOf(preview.src)
                    : -1;
                const realNewIdx =
                  preview.type === "new"
                    ? fotosNuevasPreviews.indexOf(preview.src)
                    : -1;

                return (
                  <div
                    key={`${preview.type}-${i}`}
                    className="relative h-24 rounded-xl overflow-hidden ring-1 ring-slate-200 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.src}
                      alt={`Foto ${i + 2}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all" />
                    <button
                      type="button"
                      onClick={() => {
                        if (preview.type === "existing" && realExistingIdx >= 0) {
                          eliminarFotoExistente(realExistingIdx);
                        } else if (preview.type === "new" && realNewIdx >= 0) {
                          eliminarFotoNueva(realNewIdx);
                        }
                      }}
                      className="absolute top-1.5 right-1.5 h-6 w-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="h-3 w-3 text-slate-700" />
                    </button>
                  </div>
                );
              })}
              <label
                htmlFor="fotos-adicionales-input"
                className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all group"
              >
                <Upload className="h-5 w-5" />
                <span className="text-[10px] font-medium group-hover:text-indigo-400 text-slate-400">
                  Añadir
                </span>
              </label>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Sin límite · JPG, PNG o WEBP · 10 MB cada una
            </p>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Descripción
          </Label>
          <textarea
            rows={4}
            placeholder="Describí tu vivienda: ubicación, características, normas de la casa..."
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {/* ── Rooms/Baths/m2 ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Habitaciones *",
              value: habitaciones,
              set: setHabitaciones,
              placeholder: "2",
            },
            {
              label: "Baños *",
              value: banos,
              set: setBanos,
              placeholder: "1",
            },
            {
              label: "Superficie (m²) *",
              value: m2,
              set: setM2,
              placeholder: "65",
            },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {f.label}
              </Label>
              <Input
                type="number"
                min="1"
                placeholder={f.placeholder}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* ── Registration number ── */}
        <div className="space-y-2">
          <div className="bg-indigo-50 ring-1 ring-indigo-200 rounded-xl p-3 text-sm text-indigo-800">
            <p className="font-semibold">Número de registro</p>
            <p className="text-xs mt-1">
              Según la normativa local de tu comunidad, puede ser obligatorio
              disponer de un número de registro para alquiler temporal.
            </p>
          </div>
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Número de registro de vivienda{" "}
            <span className="text-rose-500">*</span>
          </Label>
          <Input
            placeholder="Ej: VT-2025-SS-00123"
            value={numRegistro}
            onChange={(e) => setNumRegistro(e.target.value)}
          />
        </div>

        {/* ── Location ── */}
        <LocationSelector
          provincia={provincia}
          ciudad={ciudad}
          direccion={direccion}
          onProvinciaChange={setProvincia}
          onCiudadChange={setCiudad}
          onDireccionChange={setDireccion}
        />

        {/* ── Motivos ── */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Motivos de estancia aceptados{" "}
            <span className="text-rose-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {MOTIVOS_OPCIONES.map((m) => (
              <label
                key={m}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all select-none",
                  motivos.includes(m)
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30",
                )}
              >
                <input
                  type="checkbox"
                  className="rounded accent-indigo-600"
                  checked={motivos.includes(m)}
                  onChange={() => toggleMotivo(m)}
                />
                <span className="text-sm font-medium">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Submit ── */}
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
