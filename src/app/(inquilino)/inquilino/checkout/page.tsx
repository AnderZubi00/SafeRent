"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  CheckCircle2,
  Upload,
  FileText,
  CreditCard,
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  ChevronRight,
  Lock,
  Loader2,
  Clock,
  X,
  ArrowLeft,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KycMobilePanel } from "@/components/kyc/KycMobilePanel";
import { KycResultBadge } from "@/components/kyc/KycResultBadge";
import type { KycMobileResultado } from "@/hooks/useKycMobileSession";
import { useInquilino } from "@/store/inquilinoStore";
import { obtenerViviendaById, type Vivienda } from "@/lib/viviendas";
import {
  crearSolicitud,
  obtenerEstadoSolicitud,
} from "@/lib/solicitudes";
import {
  firmarContrato,
  obtenerContratoBySolicitud,
} from "@/lib/contratos";
import { crearPaymentIntent, obtenerFeePreview } from "@/lib/pagos";
import SignatureCanvas from "react-signature-canvas";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useNotifications } from "@/hooks/useNotifications";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const STEPS = [
  { id: 1, label: "Verificación de identidad", icon: User, desc: "Confirma quién eres" },
  { id: 2, label: "Prueba de temporalidad", icon: GraduationCap, desc: "Justifica tu estancia" },
  { id: 3, label: "Firma del contrato", icon: FileText, desc: "Acuerdo legal digital" },
  { id: 4, label: "Pago seguro", icon: CreditCard, desc: "Primer mes + fianza" },
];

const MOTIVOS = [
  { id: "Estudios", label: "Estudios", icon: GraduationCap, doc: "Matrícula universitaria" },
  { id: "Trabajo temporal", label: "Trabajo temporal", icon: Briefcase, doc: "Contrato laboral" },
  { id: "Salud", label: "Salud", icon: Shield, doc: "Informe médico o similar" },
  { id: "Otros", label: "Otros", icon: HelpCircle, doc: "Documento justificativo" },
];

function StripeCheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/inquilino/checkout${window.location.search}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Error al procesar el pago");
      setProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
      >
        {processing ? (
          <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando...</>
        ) : (
          <>Confirmar pago <Lock className="ml-1.5 h-4 w-4" /></>
        )}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recargar } = useInquilino();
  const viviendaId = searchParams.get("vivienda") ?? "";
  const solicitudIdParam = searchParams.get("solicitud");
  const entradaParam = searchParams.get("entrada") ?? "";
  const salidaParam = searchParams.get("salida") ?? "";

  const [step, setStep] = useState(1);
  const [vivienda, setVivienda] = useState<Vivienda | null>(null);
  const [cargandoVivienda, setCargandoVivienda] = useState(true);

  // Step 1
  const [kycResultado, setKycResultado] = useState<KycMobileResultado | null>(null);

  // Step 2
  const [motivo, setMotivo] = useState<string | null>(null);
  const [motivoDetalle, setMotivoDetalle] = useState("");
  const [docJustificativo, setDocJustificativo] = useState<File | null>(null);
  const [fechaEntrada, setFechaEntrada] = useState(entradaParam);
  const [fechaSalida, setFechaSalida] = useState(salidaParam);

  // Solicitud state
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [solicitudId, setSolicitudId] = useState<string | null>(solicitudIdParam);
  const [solicitudEstado, setSolicitudEstado] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);
  const [esperandoRespuesta, setEsperandoRespuesta] = useState(false);

  // Step 3 - Contrato
  const [contratoId, setContratoId] = useState<string | null>(null);
  const [contratoPdfUrl, setContratoPdfUrl] = useState<string | null>(null);
  const [firmando, setFirmando] = useState(false);
  const [firmaCompleta, setFirmaCompleta] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  // Step 4 - Pago
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [feePreview, setFeePreview] = useState<{ guestFeePct: number; guestFee: number } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState(!!solicitudIdParam);

  // Load vivienda data + fee preview
  useEffect(() => {
    if (!viviendaId) {
      setCargandoVivienda(false);
      return;
    }
    async function cargar() {
      const { data } = await obtenerViviendaById(viviendaId);
      setVivienda(data);
      setCargandoVivienda(false);
      if (data) {
        const { data: fee } = await obtenerFeePreview(data.precio_mes);
        if (fee) setFeePreview({ guestFeePct: fee.guestFeePct, guestFee: fee.guestFee });
      }
    }
    cargar();
  }, [viviendaId]);

  // If returning with a solicitud ID, recover full state from backend
  useEffect(() => {
    if (!solicitudIdParam) return;
    setSolicitudId(solicitudIdParam);

    async function recuperarEstado() {
      setCargandoEstado(true);
      const result = await obtenerEstadoSolicitud(solicitudIdParam!);

      if (result.error) {
        setCargandoEstado(false);
        setStep(2);
        setEsperandoRespuesta(true);
        return;
      }

      setSolicitudEstado(result.estado);
      if (result.fecha_entrada) setFechaEntrada(result.fecha_entrada);
      if (result.fecha_salida) setFechaSalida(result.fecha_salida);

      if (result.estado === "RECHAZADA") {
        setMotivoRechazo(result.motivo_rechazo);
        setStep(2);
        setEsperandoRespuesta(false);
      } else if (result.estado === "PENDIENTE") {
        setStep(2);
        setEsperandoRespuesta(true);
      } else if (result.estado === "ACEPTADA") {
        const contrato = result.contrato;
        if (contrato?.firmado_propietario && !contrato?.firmado_inquilino) {
          setContratoId(contrato.id);
          setContratoPdfUrl(contrato.pdf_borrador_url);
          setStep(3);
          setEsperandoRespuesta(false);
        } else if (contrato?.firmado_inquilino) {
          setContratoId(contrato.id);
          if ((result as any).pagos_completados && (result as any).pagos_completados > 0) {
            setPagoCompletado(true);
            setStep(4);
          } else {
            setStep(4);
          }
          setEsperandoRespuesta(false);
        } else {
          setStep(2);
          setEsperandoRespuesta(true);
        }
      }

      setCargandoEstado(false);
    }

    recuperarEstado();
  }, [solicitudIdParam]);

  // Poll solicitud status
  const pollStatus = useCallback(async () => {
    if (!solicitudId) return;

    const result = await obtenerEstadoSolicitud(solicitudId);
    if (result.error) {
      console.error("Error polling solicitud:", result.error);
      if (result.estado === "ERROR") {
        setError("No se pudo consultar el estado de la solicitud. Es posible que ya no exista.");
        setEsperandoRespuesta(false);
      }
      return;
    }

    setSolicitudEstado(result.estado);

    if (result.estado === "RECHAZADA") {
      setMotivoRechazo(result.motivo_rechazo);
      setEsperandoRespuesta(false);
    } else if (result.estado === "ACEPTADA") {
      if (result.contrato?.firmado_propietario) {
        setContratoId(result.contrato.id);
        setContratoPdfUrl(result.contrato.pdf_borrador_url);
        setEsperandoRespuesta(false);
        setStep(3);
      }
    }
  }, [solicitudId]);

  useNotifications(
    {
      "solicitud:updated": () => { pollStatus(); },
      "contrato:signed": () => { pollStatus(); },
      "pago:completed": () => { pollStatus(); },
    },
    esperandoRespuesta || (step >= 3 && !pagoCompletado),
  );

  useEffect(() => {
    if (!esperandoRespuesta || !solicitudId) return;

    pollStatus();
    const interval = setInterval(pollStatus, 30000);
    return () => clearInterval(interval);
  }, [esperandoRespuesta, solicitudId, pollStatus]);

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void
  ) {
    const file = e.target.files?.[0] ?? null;
    setter(file);
  }

  async function handleEnviarSolicitud() {
    if (!vivienda || !kycResultado || !docJustificativo || !motivo) return;

    const kycData = JSON.stringify({
      verificado_via: "kyc_movil",
      safe_score: kycResultado.safeScore,
      nombre: kycResultado.nombreExtraido,
      apellidos: kycResultado.apellidosExtraidos,
      dni: kycResultado.dniExtraido,
      tipo_documento: kycResultado.tipoDocumento,
    });
    const blob = new Blob([kycData], { type: "application/json" });
    const identidadFile = new File([blob], "kyc-verificacion-movil.json", { type: "application/json" });
    if (motivo === "Otros" && !motivoDetalle.trim()) {
      setError("Por favor describí el motivo de tu estancia.");
      return;
    }
    if (!fechaEntrada || !fechaSalida) {
      setError("Selecciona las fechas de entrada y salida");
      return;
    }

    setError(null);
    setEnviandoSolicitud(true);

    const { data, error: err } = await crearSolicitud(
      {
        vivienda_id: vivienda.id,
        propietario_id: vivienda.propietario_id,
        motivo,
        motivo_detalle: motivo === "Otros" ? motivoDetalle : undefined,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
      },
      identidadFile,
      docJustificativo
    );

    setEnviandoSolicitud(false);

    if (err || !data) {
      setError(err ?? "Error al enviar la solicitud");
      return;
    }

    setSolicitudId(data.id);
    setEsperandoRespuesta(true);
    recargar();

    // Persist solicitudId in URL for page refresh resilience
    const url = new URL(window.location.href);
    url.searchParams.set("solicitud", data.id);
    window.history.replaceState({}, "", url.toString());

    // El backend envía el email al propietario automáticamente al crear la solicitud
  }

  async function handleFirmarContrato() {
    if (!contratoId || !sigCanvasRef.current) return;
    if (sigCanvasRef.current.isEmpty()) {
      setError("Dibuja tu firma en el recuadro");
      return;
    }

    setError(null);
    setFirmando(true);

    const firmaBase64 = sigCanvasRef.current.toDataURL("image/png");
    const { error: err } = await firmarContrato(contratoId, "inquilino", firmaBase64);

    setFirmando(false);

    if (err) {
      setError(err);
      return;
    }

    setFirmaCompleta(true);
    setStep(4);
    recargar();
  }

  async function handleIniciarPago() {
    if (!vivienda || !solicitudId) return;
    setError(null);
    setProcesandoPago(true);

    const { data, error: err } = await crearPaymentIntent({
      solicitud_id: solicitudId,
      vivienda_id: vivienda.id,
      concepto: "reserva_completa",
      importe: vivienda.precio_mes,
      fianza_importe: vivienda.fianza_importe,
    });

    if (err || !data) {
      setError(err ?? "Error al iniciar el pago");
      setProcesandoPago(false);
      return;
    }

    setClientSecret(data.clientSecret);
    setProcesandoPago(false);
  }

  function fechaValida(d: string): boolean {
    return !!d && !isNaN(new Date(d).getTime());
  }

  const fechasValidas = fechaValida(fechaEntrada) && fechaValida(fechaSalida);

  function calcularMeses(): number {
    if (!fechasValidas) return 1;
    const start = new Date(fechaEntrada);
    const end = new Date(fechaSalida);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }

  function calcularTotal(): number {
    if (!vivienda) return 0;
    const meses = calcularMeses();
    const renta = vivienda.precio_mes * meses;
    const feePct = (feePreview?.guestFeePct ?? 5) / 100;
    const comision = Math.round(renta * feePct * 100) / 100;
    return renta + vivienda.fianza_importe + comision;
  }

  // Determine effective step for stepper display
  const effectiveStep = esperandoRespuesta ? 2.5 : step;

  if (cargandoVivienda || cargandoEstado) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!vivienda) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Vivienda no encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/buscar")} className="mt-4">
          Volver a buscar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Proceso de reserva</h1>
          <p className="text-slate-500 mt-1">{vivienda.titulo} · {vivienda.ciudad}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Stepper */}
            <div className="flex flex-col gap-0">
              {STEPS.map((s, i) => {
                const isCompleted = effectiveStep > s.id;
                const isCurrent = Math.floor(effectiveStep) === s.id || (esperandoRespuesta && s.id === 2);
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

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto shrink-0">
                  <X className="h-4 w-4 text-rose-400 hover:text-rose-600" />
                </button>
              </div>
            )}

            {/* Step content */}
            <Card className="ring-1 ring-slate-200 shadow-sm border-0">
              {/* STEP 1 - Verificación de identidad */}
              {step === 1 && !esperandoRespuesta && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-indigo-600" /> Verificación de identidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Result badge (shown when already verified) */}
                    {kycResultado && (
                      <div className="space-y-3">
                        <KycResultBadge resultado={kycResultado} />
                        <button
                          onClick={() => setKycResultado(null)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Verificar otro documento
                        </button>
                      </div>
                    )}

                    {/* Mobile QR — única opción */}
                    {!kycResultado && (
                      <KycMobilePanel
                        onCompletado={(resultado) => {
                          setKycResultado(resultado);
                          setStep(2);
                        }}
                      />
                    )}

                    {/* Privacy notice */}
                    <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-3 flex items-start gap-2">
                      <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700">Tus datos están cifrados y protegidos. Solo los usamos para verificación KYC.</p>
                    </div>
                  </CardContent>
                </>
              )}

              {/* STEP 2 - Prueba de temporalidad */}
              {step === 2 && !esperandoRespuesta && !solicitudId && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5 text-indigo-600" /> Prueba de temporalidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-sm text-slate-600">¿Cuál es el motivo de tu estancia temporal?</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {MOTIVOS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setMotivo(m.id); if (m.id !== "Otros") setMotivoDetalle(""); }}
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

                    {/* Motivo detalle for "Otros" */}
                    {motivo === "Otros" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Contanos más sobre tu situación <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={motivoDetalle}
                          onChange={(e) => setMotivoDetalle(e.target.value)}
                          placeholder="Describí brevemente el motivo de tu estancia..."
                          rows={3}
                          maxLength={300}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                        />
                        <p className="text-xs text-slate-400 text-right mt-1">{motivoDetalle.length}/300</p>
                      </div>
                    )}

                    {/* Document upload */}
                    {motivo && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Documento justificativo
                        </label>
                        <label className="block">
                          <div className={cn(
                            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                            docJustificativo ? "border-emerald-400 bg-emerald-50/50" : "border-indigo-300 bg-indigo-50/50"
                          )}>
                            {docJustificativo ? (
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-700">{docJustificativo.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setDocJustificativo(null); }}
                                  className="ml-2 text-slate-400 hover:text-rose-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-700">Subir {MOTIVOS.find(m => m.id === motivo)?.doc?.toLowerCase()}</p>
                                <p className="text-xs text-slate-400 mt-1">PDF, JPG o PNG · Max 10MB</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileSelect(e, setDocJustificativo)}
                          />
                        </label>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de entrada</label>
                        <input
                          type="date"
                          value={fechaEntrada}
                          onChange={(e) => setFechaEntrada(e.target.value)}
                          className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de salida</label>
                        <input
                          type="date"
                          value={fechaSalida}
                          onChange={(e) => setFechaSalida(e.target.value)}
                          min={fechaEntrada}
                          className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {fechaEntrada && fechaSalida && (
                      <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-3 text-sm text-slate-600">
                        Estancia de <strong>{calcularMeses()} meses</strong>
                        {vivienda && (
                          <span className="text-slate-400"> (mín. {vivienda.estancia_minima}, máx. {vivienda.estancia_maxima} meses)</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 ring-1 ring-slate-200 border-0">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                      </Button>
                      <Button
                        onClick={handleEnviarSolicitud}
                        disabled={!motivo || !docJustificativo || !fechaEntrada || !fechaSalida || enviandoSolicitud}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      >
                        {enviandoSolicitud ? (
                          <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enviando...</>
                        ) : (
                          <>Enviar solicitud <ChevronRight className="ml-1 h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}

              {/* WAITING STATE - Esperando respuesta del propietario */}
              {esperandoRespuesta && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-amber-500" /> Solicitud enviada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="text-center py-8 space-y-4">
                      <div className="h-16 w-16 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mx-auto">
                        <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Esperando respuesta del propietario</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Hemos enviado tu solicitud al propietario. Te notificaremos cuando tome una decisión.
                        </p>
                      </div>
                      <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Comprobando estado automáticamente...
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push("/inquilino")} className="w-full ring-1 ring-slate-200 border-0">
                      <ArrowLeft className="mr-1 h-4 w-4" /> Volver al panel
                    </Button>
                  </CardContent>
                </>
              )}

              {/* REJECTED STATE */}
              {solicitudEstado === "RECHAZADA" && !esperandoRespuesta && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-rose-700">
                      <X className="h-5 w-5" /> Solicitud rechazada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="text-center py-6 space-y-4">
                      <div className="h-16 w-16 rounded-full bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center mx-auto">
                        <X className="h-8 w-8 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Tu solicitud no ha sido aceptada</h3>
                        {motivoRechazo && (
                          <div className="mt-3 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4 text-left">
                            <p className="text-xs font-semibold text-rose-800 uppercase mb-1">Motivo del rechazo</p>
                            <p className="text-sm text-rose-700">{motivoRechazo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => router.push("/buscar")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                      Buscar otras viviendas
                    </Button>
                  </CardContent>
                </>
              )}

              {/* STEP 3 - Firma del contrato */}
              {step === 3 && !esperandoRespuesta && solicitudEstado !== "RECHAZADA" && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-indigo-600" /> Firma del contrato digital
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-3 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700">El propietario ha aceptado tu solicitud y ha firmado el contrato. Revísalo y fírmalo tú también.</p>
                    </div>

                    {/* Contract preview */}
                    {contratoPdfUrl ? (
                      <div className="space-y-2">
                        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl overflow-hidden">
                          <iframe
                            src={contratoPdfUrl}
                            className="w-full h-64 border-0"
                            title="Vista previa del contrato"
                          />
                        </div>
                        <a
                          href={contratoPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" /> Abrir contrato completo en nueva pestaña
                        </a>
                      </div>
                    ) : (
                      <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FileText className="h-10 w-10" />
                        <p className="text-sm font-medium">Contrato generado</p>
                      </div>
                    )}

                    {/* Contract summary */}
                    <div className="space-y-2 text-sm">
                      {[
                        ["Vivienda", `${vivienda.titulo} · ${vivienda.ciudad}`],
                        ["Duración", fechaEntrada && fechaSalida ? `${new Date(fechaEntrada).toLocaleDateString("es-ES")} – ${new Date(fechaSalida).toLocaleDateString("es-ES")}` : "—"],
                        ["Renta mensual", `${vivienda.precio_mes.toLocaleString("es-ES")}€/mes`],
                        ["Fianza", `${vivienda.fianza_importe.toLocaleString("es-ES")}€`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1.5 border-b border-slate-200">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-medium text-slate-900">{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Signature pad */}
                    {!firmaCompleta && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tu firma digital</label>
                        <div className="ring-1 ring-slate-200 rounded-xl overflow-hidden bg-white">
                          <SignatureCanvas
                            ref={sigCanvasRef}
                            penColor="#1e293b"
                            canvasProps={{
                              className: "w-full h-32",
                              style: { width: "100%", height: "128px" },
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => sigCanvasRef.current?.clear()}
                          className="text-xs text-slate-500 hover:text-indigo-600"
                        >
                          Borrar firma
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => router.push("/inquilino")} className="flex-1 ring-1 ring-slate-200 border-0">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Volver
                      </Button>
                      <Button
                        onClick={handleFirmarContrato}
                        disabled={firmando || firmaCompleta}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                      >
                        {firmando ? (
                          <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Firmando...</>
                        ) : firmaCompleta ? (
                          <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Firmado</>
                        ) : (
                          <>Firmar digitalmente <ChevronRight className="ml-1 h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}

              {/* STEP 4 - Pago */}
              {step === 4 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5 text-indigo-600" /> Pago seguro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {pagoCompletado ? (
                      <div className="text-center py-8 space-y-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">¡Reserva completada!</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            El pago se ha procesado correctamente. El propietario ha sido notificado.
                          </p>
                        </div>
                        <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 space-y-2 text-sm text-left">
                          <div className="flex justify-between">
                            <span className="text-emerald-700">Estado</span>
                            <span className="font-semibold text-emerald-800">Pago retenido en escrow</span>
                          </div>
                          <p className="text-xs text-emerald-600">El pago se liberará al propietario cuando confirmes tu llegada a la vivienda.</p>
                        </div>
                        <Button onClick={() => router.push("/inquilino")} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                          Ir a mi panel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-3 flex items-start gap-2">
                          <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 font-medium">Tu pago quedará retenido en escrow hasta que confirmes la llegada a la vivienda.</p>
                        </div>

                        {/* Payment summary */}
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Primer mes de renta</span>
                            <span className="font-medium">{vivienda.precio_mes.toLocaleString("es-ES")}€</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Fianza</span>
                            <span className="font-medium">{vivienda.fianza_importe.toLocaleString("es-ES")}€</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Comisión SafeRent ({feePreview?.guestFeePct ?? 5}%)</span>
                            <span className="font-medium">{(feePreview?.guestFee ?? Math.round(vivienda.precio_mes * 0.05 * 100) / 100).toLocaleString("es-ES")}€</span>
                          </div>
                          <div className="flex justify-between py-2 font-bold text-slate-900 text-base">
                            <span>Total a pagar</span>
                            <span>{(vivienda.precio_mes + vivienda.fianza_importe + (feePreview?.guestFee ?? Math.round(vivienda.precio_mes * 0.05 * 100) / 100)).toLocaleString("es-ES")}€</span>
                          </div>
                        </div>

                        {clientSecret ? (
                          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                            <StripeCheckoutForm onSuccess={() => { setPagoCompletado(true); recargar(); }} />
                          </Elements>
                        ) : (
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(3)} className="flex-1 ring-1 ring-slate-200 border-0">
                              <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
                            </Button>
                            <Button
                              onClick={handleIniciarPago}
                              disabled={procesandoPago}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                            >
                              {procesandoPago ? (
                                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Preparando pago...</>
                              ) : (
                                <>Pagar {(vivienda.precio_mes + vivienda.fianza_importe + vivienda.precio_mes * 0.03).toLocaleString("es-ES")}€ <Lock className="ml-1.5 h-4 w-4" /></>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          {/* Sidebar - Resumen de reserva */}
          <div className="lg:col-span-1">
            <Card className="ring-1 ring-slate-200 shadow-sm border-0 sticky top-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen de reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b border-slate-200">
                  {vivienda.fotos?.[0] ? (
                    <img src={vivienda.fotos[0]} alt={vivienda.titulo} className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0" />
                  ) : (
                    <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0 ring-1 ring-slate-200">🏠</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{vivienda.titulo}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{vivienda.ciudad}</p>
                  </div>
                </div>

                {fechasValidas && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600"><Calendar className="h-3.5 w-3.5" />Entrada</span>
                      <span className="font-medium text-slate-900">{new Date(fechaEntrada).toLocaleDateString("es-ES")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600"><Calendar className="h-3.5 w-3.5" />Salida</span>
                      <span className="font-medium text-slate-900">{new Date(fechaSalida).toLocaleDateString("es-ES")}</span>
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-200" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {vivienda.precio_mes.toLocaleString("es-ES")}€ × {Math.max(1, calcularMeses())} {Math.max(1, calcularMeses()) === 1 ? "mes" : "meses"}
                      {calcularMeses() === 0 && <span className="text-slate-400 text-xs ml-1"></span>}
                    </span>
                    <span className="font-medium">{(vivienda.precio_mes * Math.max(1, calcularMeses())).toLocaleString("es-ES")}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fianza</span>
                    <span className="font-medium">{vivienda.fianza_importe.toLocaleString("es-ES")}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Comisión SafeRent ({feePreview?.guestFeePct ?? 5}%)</span>
                    <span className="font-medium">{(vivienda.precio_mes * Math.max(1, calcularMeses()) * ((feePreview?.guestFeePct ?? 5) / 100)).toLocaleString("es-ES", { maximumFractionDigits: 2 })}€</span>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total</span>
                  <span>{calcularTotal().toLocaleString("es-ES", { maximumFractionDigits: 2 })}€</span>
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
