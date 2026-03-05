"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, Camera, FileText, Euro, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Upload, X as XIcon, ImageIcon, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { obtenerViviendaById, actualizarVivienda, type Vivienda } from "@/lib/viviendas";

const STEPS = [
  { id: 1, label: "Fotos y descripción", icon: Camera },
  { id: 2, label: "Datos legales", icon: FileText },
  { id: 3, label: "Precios y disponibilidad", icon: Euro },
];

const MOTIVOS_OPCIONES = ["Estudios", "Trabajo temporal", "Otros"];
const DURACION_OPCIONES = ["1 mes", "3 meses", "6 meses", "1 año"];

interface FormData {
  titulo: string;
  descripcion: string;
  habitaciones: string;
  banos: string;
  m2: string;
  num_registro_vivienda: string;
  direccion: string;
  barrio: string;
  ciudad: string;
  precio_mes: string;
  fianza_importe: string;
  motivos: string[];
  disponible_desde: string;
  duracion_minima: string;
}

export default function EditarViviendaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cargando, setCargando] = useState(true);
  const [step, setStep] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fotos existentes (URLs de Supabase Storage)
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  // Nuevas fotos a subir
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
  const [fotosNuevasPreviews, setFotosNuevasPreviews] = useState<string[]>([]);

  const [form, setForm] = useState<FormData>({
    titulo: "",
    descripcion: "",
    habitaciones: "1",
    banos: "1",
    m2: "",
    num_registro_vivienda: "",
    direccion: "",
    barrio: "",
    ciudad: "",
    precio_mes: "",
    fianza_importe: "",
    motivos: [],
    disponible_desde: "",
    duracion_minima: "1 mes",
  });

  // Cargar datos existentes
  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await obtenerViviendaById(id);
      if (err || !data) {
        setError("No se pudo cargar la vivienda");
        setCargando(false);
        return;
      }
      const v: Vivienda = data;
      setForm({
        titulo: v.titulo,
        descripcion: v.descripcion ?? "",
        habitaciones: String(v.habitaciones),
        banos: String(v.banos),
        m2: String(v.m2),
        num_registro_vivienda: v.num_registro_vivienda,
        direccion: v.direccion,
        barrio: v.barrio ?? "",
        ciudad: v.ciudad,
        precio_mes: String(v.precio_mes),
        fianza_importe: String(v.fianza_importe),
        motivos: v.motivos,
        disponible_desde: v.disponible_desde ?? "",
        duracion_minima: v.duracion_minima,
      });
      setFotosExistentes(v.fotos ?? []);
      setCargando(false);
    }
    cargar();
  }, [id]);

  function set(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleMotivo(motivo: string) {
    setForm((prev) => ({
      ...prev,
      motivos: prev.motivos.includes(motivo)
        ? prev.motivos.filter((m) => m !== motivo)
        : [...prev.motivos, motivo],
    }));
  }

  function eliminarFotoExistente(idx: number) {
    setFotosExistentes((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleFotasNuevas(files: FileList | null) {
    if (!files) return;
    const total = fotosExistentes.length + fotosNuevas.length;
    const slots = Math.max(0, 5 - total);
    const nuevas = Array.from(files).slice(0, slots);
    const todas = [...fotosNuevas, ...nuevas];
    setFotosNuevas(todas);
    setFotosNuevasPreviews(todas.map((f) => URL.createObjectURL(f)));
  }

  function eliminarFotoNueva(idx: number) {
    const nuevas = fotosNuevas.filter((_, i) => i !== idx);
    setFotosNuevas(nuevas);
    setFotosNuevasPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  }

  const totalFotos = fotosExistentes.length + fotosNuevas.length;

  function validateStep1() {
    if (!form.titulo.trim()) return "El título es obligatorio";
    if (!form.m2 || Number(form.m2) <= 0) return "Indica los metros cuadrados";
    return null;
  }
  function validateStep2() {
    if (!form.num_registro_vivienda.trim()) return "El número de registro es obligatorio";
    if (!form.direccion.trim()) return "La dirección es obligatoria";
    if (!form.ciudad.trim()) return "La ciudad es obligatoria";
    return null;
  }
  function validateStep3() {
    if (!form.precio_mes || Number(form.precio_mes) <= 0) return "Indica el precio mensual";
    if (!form.fianza_importe || Number(form.fianza_importe) <= 0) return "Indica la fianza";
    if (form.motivos.length === 0) return "Selecciona al menos un motivo";
    return null;
  }

  function handleNext(nextStep: number) {
    setError(null);
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) { setError(err); return; }
    setStep(nextStep);
  }

  async function handleGuardar() {
    setError(null);
    const err = validateStep3();
    if (err) { setError(err); return; }

    setGuardando(true);
    const { data, error: apiErr } = await actualizarVivienda(
      id,
      {
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        direccion: form.direccion,
        barrio: form.barrio || undefined,
        ciudad: form.ciudad,
        precio_mes: Number(form.precio_mes),
        fianza_importe: Number(form.fianza_importe),
        habitaciones: Number(form.habitaciones),
        banos: Number(form.banos),
        m2: Number(form.m2),
        motivos: form.motivos,
        num_registro_vivienda: form.num_registro_vivienda,
        disponible_desde: form.disponible_desde || undefined,
        duracion_minima: form.duracion_minima,
      },
      fotosNuevas.length > 0 ? fotosNuevas : undefined,
      fotosExistentes
    );
    setGuardando(false);

    if (apiErr || !data) {
      setError(apiErr ?? "Error al guardar los cambios");
      return;
    }

    router.push(`/propietario?editada=${id}`);
  }

  if (cargando) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/propietario" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← Volver al panel
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar vivienda</h1>
        <p className="text-slate-500 mt-1">Modifica los datos de tu propiedad</p>
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
              {/* Gestión de fotos */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fotos de la vivienda
                  <span className="text-slate-400 font-normal normal-case ml-1">({totalFotos}/5)</span>
                </Label>

                {/* Fotos existentes */}
                {fotosExistentes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Fotos actuales</p>
                    <div className="grid grid-cols-5 gap-2">
                      {fotosExistentes.map((url, i) => (
                        <div key={url} className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full">Principal</span>
                          )}
                          <button
                            type="button"
                            onClick={() => eliminarFotoExistente(i)}
                            className="absolute top-1 right-1 h-5 w-5 bg-white/95 hover:bg-rose-50 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3 text-rose-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Añadir nuevas fotos */}
                {totalFotos < 5 && (
                  <div className="space-y-2">
                    {fotosExistentes.length > 0 && (
                      <p className="text-xs text-slate-500 font-medium">Añadir más fotos</p>
                    )}
                    {fotosNuevasPreviews.length === 0 ? (
                      <label
                        htmlFor="fotos-nuevas-input"
                        className="block border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition-all group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleFotasNuevas(e.dataTransfer.files); }}
                      >
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <Upload className="h-6 w-6" />
                          <p className="text-sm font-medium">Arrastra fotos o haz clic para seleccionar</p>
                          <p className="text-xs">JPG, PNG o WEBP · Hasta {5 - fotosExistentes.length} fotos más</p>
                        </div>
                        <input id="fotos-nuevas-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFotasNuevas(e.target.files)} />
                      </label>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2">
                          {fotosNuevasPreviews.map((preview, i) => (
                            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-indigo-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preview} alt={`Nueva foto ${i + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-indigo-600/80 text-white px-1.5 py-0.5 rounded-full">Nueva</span>
                              <button
                                type="button"
                                onClick={() => eliminarFotoNueva(i)}
                                className="absolute top-1 right-1 h-5 w-5 bg-white/95 hover:bg-rose-50 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XIcon className="h-3 w-3 text-rose-500" />
                              </button>
                            </div>
                          ))}
                          {totalFotos < 5 && (
                            <label
                              htmlFor="fotos-nuevas-input"
                              className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all"
                            >
                              <Upload className="h-5 w-5" />
                            </label>
                          )}
                        </div>
                        <input id="fotos-nuevas-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFotasNuevas(e.target.files)} />
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5" />
                          {fotosNuevas.length} foto{fotosNuevas.length !== 1 ? "s" : ""} nueva{fotosNuevas.length !== 1 ? "s" : ""} pendiente{fotosNuevas.length !== 1 ? "s" : ""} de guardar
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {totalFotos === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Sin fotos — los anuncios con fotos reciben más visitas
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Título del anuncio <span className="text-rose-500">*</span>
                </Label>
                <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej: Piso luminoso en el centro de Donostia" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</Label>
                <textarea
                  rows={4}
                  placeholder="Describe tu vivienda..."
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
                    <Input type="number" min="1" placeholder={f.placeholder} value={form[f.field]} onChange={(e) => set(f.field, e.target.value)} />
                  </div>
                ))}
              </div>

              <Button onClick={() => handleNext(2)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
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
                <p className="font-semibold">Requerido por ley (2026)</p>
                <p className="text-xs mt-1">El número de registro es obligatorio para anuncios de alquiler temporal en Euskadi.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Número de registro <span className="text-rose-500">*</span>
                </Label>
                <Input placeholder="VT-2025-SS-00123" value={form.num_registro_vivienda} onChange={(e) => set("num_registro_vivienda", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dirección completa <span className="text-rose-500">*</span>
                </Label>
                <Input placeholder="Calle, número, piso, puerta" value={form.direccion} onChange={(e) => set("direccion", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Barrio</Label>
                  <Input placeholder="Parte Vieja, Gros..." value={form.barrio} onChange={(e) => set("barrio", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ciudad <span className="text-rose-500">*</span></Label>
                  <Input placeholder="Donostia-San Sebastián" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} />
                </div>
              </div>

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
                  <Input type="number" min="1" placeholder="850" value={form.precio_mes} onChange={(e) => set("precio_mes", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Fianza (€) <span className="text-rose-500">*</span>
                  </Label>
                  <Input type="number" min="0" placeholder="850" value={form.fianza_importe} onChange={(e) => set("fianza_importe", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Motivos de estancia <span className="text-rose-500">*</span>
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
                      <input type="checkbox" className="rounded accent-indigo-600" checked={form.motivos.includes(m)} onChange={() => toggleMotivo(m)} />
                      <span className="text-sm font-medium">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponible desde</Label>
                  <Input type="date" value={form.disponible_desde} onChange={(e) => set("disponible_desde", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración mínima</Label>
                  <select
                    className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                    value={form.duracion_minima}
                    onChange={(e) => set("duracion_minima", e.target.value)}
                  >
                    {DURACION_OPCIONES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={guardando}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
                </Button>
                <Button onClick={handleGuardar} disabled={guardando} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
                  {guardando ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Guardar cambios</>
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
