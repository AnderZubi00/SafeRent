"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Camera,
  FileText,
  Euro,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Upload,
  X as XIcon,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { publicarVivienda } from "@/lib/viviendas";
import LocationSelector from "@/components/forms/LocationSelector";

const STEPS = [
  { id: 1, label: "Fotos y descripción", icon: Camera },
  { id: 2, label: "Datos legales", icon: FileText },
  { id: 3, label: "Precios y disponibilidad", icon: Euro },
];

const MOTIVOS_OPCIONES = ["Estudios", "Trabajo temporal", "Otros"];

interface FormData {
  titulo: string;
  descripcion: string;
  habitaciones: string;
  banos: string;
  m2: string;
  num_registro_vivienda: string;
  direccion: string;
  provincia: string;
  ciudad: string;
  precio_mes: string;
  fianza_importe: string;
  motivos: string[];
  disponible_desde: string;
  estancia_minima: string;
  estancia_maxima: string;
}

export default function PublicarViviendaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotosPreviews, setFotosPreviews] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>({
    titulo: "",
    descripcion: "",
    habitaciones: "2",
    banos: "1",
    m2: "",
    num_registro_vivienda: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    precio_mes: "",
    fianza_importe: "",
    motivos: ["Estudios", "Trabajo temporal"],
    disponible_desde: "",
    estancia_minima: "1",
    estancia_maxima: "11",
  });

  function set(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFotoPrincipal(files: FileList | null) {
    if (!files || files.length === 0) return;
    const nuevas = [files[0], ...fotos.slice(1)];
    setFotos(nuevas);
    setFotosPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  }

  function handleFotosAdicionales(files: FileList | null) {
    if (!files) return;
    const nuevas = [...fotos, ...Array.from(files)];
    setFotos(nuevas);
    setFotosPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  }

  function eliminarFoto(idx: number) {
    const nuevas = fotos.filter((_, i) => i !== idx);
    setFotos(nuevas);
    setFotosPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  }

  function toggleMotivo(motivo: string) {
    setForm((prev) => ({
      ...prev,
      motivos: prev.motivos.includes(motivo)
        ? prev.motivos.filter((m) => m !== motivo)
        : [...prev.motivos, motivo],
    }));
  }

  function validateStep1() {
    if (!form.titulo.trim()) return "El título es obligatorio";
    if (!form.m2 || Number(form.m2) <= 0) return "Indica los metros cuadrados";
    return null;
  }

  function validateStep2() {
    if (!form.num_registro_vivienda.trim()) return "El número de registro es obligatorio";
    if (!form.provincia) return "Selecciona una provincia";
    if (!form.ciudad) return "Selecciona una ciudad";
    if (!form.direccion.trim()) return "La dirección es obligatoria";
    return null;
  }

  function validateStep3() {
    if (!form.precio_mes || Number(form.precio_mes) <= 0) return "Indica el precio mensual";
    if (!form.fianza_importe || Number(form.fianza_importe) <= 0) return "Indica el importe de la fianza";
    if (form.motivos.length === 0) return "Selecciona al menos un motivo de estancia";
    return null;
  }

  function handleNext(nextStep: number) {
    setError(null);
    const validationError =
      step === 1 ? validateStep1() :
      step === 2 ? validateStep2() : null;
    if (validationError) { setError(validationError); return; }
    setStep(nextStep);
  }

  async function handlePublicar() {
    setError(null);
    const validationError = validateStep3();
    if (validationError) { setError(validationError); return; }

    setEnviando(true);
    const { data, error: err } = await publicarVivienda({
      titulo: form.titulo,
      descripcion: form.descripcion || undefined,
      direccion: form.direccion,
      provincia: form.provincia,
      ciudad: form.ciudad,
      precio_mes: Number(form.precio_mes),
      fianza_importe: Number(form.fianza_importe),
      habitaciones: Number(form.habitaciones),
      banos: Number(form.banos),
      m2: Number(form.m2),
      motivos: form.motivos,
      num_registro_vivienda: form.num_registro_vivienda,
      disponible_desde: form.disponible_desde || undefined,
      estancia_minima: Number(form.estancia_minima) || 1,
      estancia_maxima: Number(form.estancia_maxima) || 11,
    }, fotos.length > 0 ? fotos : undefined);
    setEnviando(false);

    if (err || !data) {
      setError(err ?? "Error al publicar la vivienda");
      return;
    }

    router.push(`/propietario?publicada=${data.id}`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Publicar vivienda</h1>
        <p className="text-slate-500 mt-1">Completa los 3 pasos para publicar tu propiedad</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const isCompleted = step > s.id;
          const isCurrent = step === s.id;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all",
                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                  isCurrent ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25" :
                  "bg-white border-slate-200 text-slate-400"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <p className={cn("text-xs font-medium text-center", isCurrent ? "text-indigo-700" : isCompleted ? "text-emerald-600" : "text-slate-400")}>
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mb-5 mx-1", isCompleted ? "bg-emerald-300" : "bg-slate-100")} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        {/* ───────────── STEP 1 ───────────── */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-indigo-600" /> Fotos y descripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Zona de fotos */}
              <div className="space-y-4">
                {/* Hidden inputs */}
                <input id="foto-principal-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFotoPrincipal(e.target.files)} />
                <input id="fotos-adicionales-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFotosAdicionales(e.target.files)} />

                {/* — Foto principal — */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Foto principal <span className="text-rose-500">*</span>
                  </Label>
                  {fotosPreviews[0] ? (
                    <div
                      className="relative h-52 rounded-xl overflow-hidden ring-1 ring-slate-200 group cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleFotoPrincipal(e.dataTransfer.files); }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fotosPreviews[0]} alt="Foto principal" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">Principal</span>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label
                          htmlFor="foto-principal-input"
                          className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer shadow-sm"
                        >
                          <Upload className="h-3.5 w-3.5" /> Cambiar
                        </label>
                        <button
                          type="button"
                          onClick={() => eliminarFoto(0)}
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
                      onDrop={(e) => { e.preventDefault(); handleFotoPrincipal(e.dataTransfer.files); }}
                    >
                      <Upload className="h-8 w-8" />
                      <p className="text-sm font-medium">Arrastrá la foto principal aquí o hacé clic</p>
                      <p className="text-xs">JPG, PNG o WEBP · 10 MB máx.</p>
                    </label>
                  )}
                </div>

                {/* — Fotos adicionales — */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Fotos adicionales{" "}
                    {fotos.length > 1 && (
                      <span className="text-slate-400 font-normal normal-case">({fotos.length - 1} añadida{fotos.length - 1 !== 1 ? "s" : ""})</span>
                    )}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {fotosPreviews.slice(1).map((preview, i) => (
                      <div key={i} className="relative h-24 rounded-xl overflow-hidden ring-1 ring-slate-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={`Foto ${i + 2}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all" />
                        <button
                          type="button"
                          onClick={() => eliminarFoto(i + 1)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="h-3 w-3 text-slate-700" />
                        </button>
                      </div>
                    ))}
                    {/* Botón añadir — siempre visible */}
                    <label
                      htmlFor="fotos-adicionales-input"
                      className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all group"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px] font-medium group-hover:text-indigo-400 text-slate-400">Añadir</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Sin límite · JPG, PNG o WEBP · 10 MB cada una
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Título del anuncio <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Ej: Piso luminoso en el centro de Donostia"
                  value={form.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</Label>
                <textarea
                  rows={4}
                  placeholder="Describe tu vivienda: ubicación, características, normas de la casa..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  value={form.descripcion}
                  onChange={(e) => set("descripcion", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Habitaciones *", field: "habitaciones" as const, placeholder: "2" },
                  { label: "Baños *", field: "banos" as const, placeholder: "1" },
                  { label: "Superficie (m²) *", field: "m2" as const, placeholder: "65" },
                ].map((f) => (
                  <div key={f.field} className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{f.label}</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder={f.placeholder}
                      value={form[f.field]}
                      onChange={(e) => set(f.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() => handleNext(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}

        {/* ───────────── STEP 2 ───────────── */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-600" /> Datos legales y ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-indigo-50 ring-1 ring-indigo-200 rounded-xl p-3 text-sm text-indigo-800">
                <p className="font-semibold">Número de registro</p>
                <p className="text-xs mt-1">Según la normativa local de tu comunidad, puede ser obligatorio disponer de un número de registro para alquiler temporal.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Número de registro de vivienda <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Ej: VT-2025-SS-00123"
                  value={form.num_registro_vivienda}
                  onChange={(e) => set("num_registro_vivienda", e.target.value)}
                />
                <p className="text-xs text-slate-500">Consulta la normativa de tu comunidad autónoma para obtener tu número de registro</p>
              </div>

              <LocationSelector
                provincia={form.provincia}
                ciudad={form.ciudad}
                direccion={form.direccion}
                onProvinciaChange={(v) => set("provincia", v)}
                onCiudadChange={(v) => set("ciudad", v)}
                onDireccionChange={(v) => set("direccion", v)}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
                </Button>
                <Button onClick={() => handleNext(3)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
                  Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* ───────────── STEP 3 ───────────── */}
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Euro className="h-5 w-5 text-indigo-600" /> Precios y disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Precio mensual (€) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="850"
                    value={form.precio_mes}
                    onChange={(e) => set("precio_mes", e.target.value)}
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
                    value={form.fianza_importe}
                    onChange={(e) => set("fianza_importe", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Motivos de estancia aceptados <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {MOTIVOS_OPCIONES.map((m) => (
                    <label
                      key={m}
                      className={cn(
                        "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all select-none",
                        form.motivos.includes(m)
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="rounded accent-indigo-600"
                        checked={form.motivos.includes(m)}
                        onChange={() => toggleMotivo(m)}
                      />
                      <span className="text-sm font-medium">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponible desde</Label>
                  <Input
                    type="date"
                    value={form.disponible_desde}
                    onChange={(e) => set("disponible_desde", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Estancia mínima <span className="text-slate-400 font-normal normal-case">(meses)</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="11"
                    value={form.estancia_minima}
                    onChange={(e) => set("estancia_minima", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Estancia máxima <span className="text-slate-400 font-normal normal-case">(meses)</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="11"
                    value={form.estancia_maxima}
                    onChange={(e) => set("estancia_maxima", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={enviando}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
                </Button>
                <Button
                  onClick={handlePublicar}
                  disabled={enviando}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {enviando ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Publicando...</>
                  ) : (
                    <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar vivienda</>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
