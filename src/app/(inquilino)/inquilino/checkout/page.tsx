"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield, CheckCircle2, Upload, FileText, CreditCard,
  User, GraduationCap, Briefcase, MapPin, Calendar, ChevronRight, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Verificación de identidad", icon: User, desc: "Confirma quién eres" },
  { id: 2, label: "Prueba de temporalidad", icon: GraduationCap, desc: "Justifica tu estancia" },
  { id: 3, label: "Firma del contrato", icon: FileText, desc: "Acuerdo legal digital" },
  { id: 4, label: "Pago seguro", icon: CreditCard, desc: "Stripe · Escrow" },
];

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const viviendaId = searchParams.get("vivienda") ?? "1";

  const [step, setStep] = useState(1);
  const [motivo, setMotivo] = useState<string | null>(null);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Proceso de reserva</h1>
          <p className="text-slate-500 mt-1">Vivienda #{viviendaId} · Piso luminoso en Parte Vieja · Donostia</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stepper + Contenido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stepper vertical */}
            <div className="flex flex-col gap-0">
              {STEPS.map((s, i) => {
                const isCompleted = step > s.id;
                const isCurrent = step === s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ring-2",
                        isCompleted ? "bg-emerald-500 ring-emerald-500 text-white" :
                        isCurrent ? "bg-indigo-600 ring-indigo-600 text-white shadow-sm" :
                        "bg-white ring-slate-200 text-slate-400"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={cn("w-0.5 h-8 my-1", isCompleted ? "bg-emerald-300" : "bg-slate-200")} />
                      )}
                    </div>
                    <div className={cn("pb-8 pt-1.5", i === STEPS.length - 1 && "pb-0")}>
                      <p className={cn("text-sm font-semibold", isCurrent ? "text-indigo-700" : isCompleted ? "text-emerald-700" : "text-slate-400")}>
                        Paso {s.id} · {s.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contenido del paso actual */}
            <Card className="ring-1 ring-slate-200 shadow-sm border-0">
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-indigo-600" /> Verificación de identidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-sm text-slate-600">Necesitamos verificar tu identidad para garantizar la seguridad de todos en la plataforma.</p>
                    <div className="grid grid-cols-2 gap-4">
                      {["DNI / NIE", "Pasaporte"].map((doc) => (
                        <div key={doc} className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group">
                          <Upload className="h-8 w-8 text-slate-300 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" />
                          <p className="text-sm font-medium text-slate-700">{doc}</p>
                          <p className="text-xs text-slate-400 mt-1">JPG, PNG o PDF · Max 5MB</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-3 flex items-start gap-2">
                      <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700">Tus datos están cifrados y protegidos. Solo los usamos para verificación KYC.</p>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm">
                      Continuar <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5 text-indigo-600" /> Prueba de temporalidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-sm text-slate-600">¿Cuál es el motivo de tu estancia temporal?</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "estudios", label: "Estudios", icon: GraduationCap, doc: "Matrícula universitaria" },
                        { id: "trabajo", label: "Trabajo temporal", icon: Briefcase, doc: "Contrato laboral" },
                        { id: "otros", label: "Otros", icon: FileText, doc: "Documento justificativo" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMotivo(m.id)}
                          className={cn(
                            "p-4 rounded-xl ring-1 text-left transition-all",
                            motivo === m.id ? "ring-indigo-500 bg-indigo-50" : "ring-slate-200 hover:ring-slate-300"
                          )}
                        >
                          <m.icon className={cn("h-5 w-5 mb-2", motivo === m.id ? "text-indigo-600" : "text-slate-400")} />
                          <p className={cn("text-sm font-semibold", motivo === m.id ? "text-indigo-700" : "text-slate-700")}>{m.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{m.doc}</p>
                        </button>
                      ))}
                    </div>
                    {motivo && (
                      <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center bg-indigo-50/50">
                        <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700">Subir documento justificativo</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, JPG o PNG · Max 10MB</p>
                        <Button size="sm" variant="outline" className="mt-3 ring-1 ring-slate-200 border-0">Seleccionar archivo</Button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 ring-1 ring-slate-200 border-0">Atrás</Button>
                      <Button onClick={() => setStep(3)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm" disabled={!motivo}>
                        Continuar <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-indigo-600" /> Firma del contrato digital
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <FileText className="h-10 w-10" />
                      <p className="text-sm font-medium">Vista previa del contrato</p>
                      <p className="text-xs">Contrato de alquiler temporal · 10 meses</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        ["Vivienda", `Vivienda #${viviendaId} · Piso Parte Vieja, Donostia`],
                        ["Duración", "01/09/2026 – 30/06/2027"],
                        ["Renta mensual", "850€/mes"],
                        ["Fianza", "850€"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1.5 border-b border-slate-200">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-medium text-slate-900">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(2)} className="flex-1 ring-1 ring-slate-200 border-0">Atrás</Button>
                      <Button onClick={() => setStep(4)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm">
                        Firmar digitalmente <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 4 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5 text-indigo-600" /> Pago seguro con Stripe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-3 flex items-start gap-2">
                      <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 font-medium">Tu pago quedará retenido en escrow hasta que confirmes la llegada a la vivienda.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">NÚMERO DE TARJETA</label>
                        <div className="flex items-center gap-2 ring-1 ring-slate-200 rounded-lg px-3 py-2.5">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <input placeholder="1234 5678 9012 3456" className="text-sm flex-1 outline-none text-slate-900 placeholder:text-slate-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">VENCIMIENTO</label>
                          <input placeholder="MM / AA" className="w-full ring-1 ring-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">CVV</label>
                          <input placeholder="···" className="w-full ring-1 ring-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(3)} className="flex-1 ring-1 ring-slate-200 border-0">Atrás</Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm">
                        Pagar 3.476,50€ <Lock className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          {/* Resumen fijo */}
          <div className="lg:col-span-1">
            <Card className="ring-1 ring-slate-200 shadow-sm border-0 sticky top-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen de reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b border-slate-200">
                  <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0 ring-1 ring-slate-200">🏙️</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Piso Parte Vieja</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />Donostia</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600"><Calendar className="h-3.5 w-3.5" />Entrada</span>
                    <span className="font-medium text-slate-900">01/09/2026</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600"><Calendar className="h-3.5 w-3.5" />Salida</span>
                    <span className="font-medium text-slate-900">30/06/2027</span>
                  </div>
                </div>
                <Separator className="bg-slate-200" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">850€ × 10 meses</span>
                    <span className="font-medium">8.500€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fianza</span>
                    <span className="font-medium">850€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Comisión (3%)</span>
                    <span className="font-medium">255€</span>
                  </div>
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total</span>
                  <span>9.605€</span>
                </div>
                <div className="bg-amber-50 ring-1 ring-amber-200 rounded-lg p-2.5 text-center">
                  <p className="text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Pago retenido en Escrow
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
