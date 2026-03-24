"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  User,
  GraduationCap,
  Briefcase,
  HelpCircle,
  FileText,
  CheckCircle2,
  X,
  Shield,
  Loader2,
  Clock,
  ExternalLink,
  AlertCircle,
  Inbox,
  Building2,
  Eye,
  Home,
  BedDouble,
  Euro,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePropietario,
  type SolicitudConContrato,
} from "@/context/PropietarioContext";
import {
  aceptarSolicitudAction,
  rechazarSolicitudAction,
  firmarContratoAction,
} from "../actions";
import SignatureCanvas from "react-signature-canvas";

const MOTIVO_CONFIG: Record<string, { icon: typeof GraduationCap; color: string; bg: string }> = {
  Estudios: { icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50 ring-indigo-200" },
  "Trabajo temporal": { icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50 ring-emerald-200" },
  Otros: { icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-50 ring-amber-200" },
};

export default function SolicitudesPage() {
  const { solicitudes, cargando, recargar } = usePropietario();
  const [error, setError] = useState<string | null>(null);

  const [solicitudActiva, setSolicitudActiva] = useState<SolicitudConContrato | null>(null);
  const [modalTipo, setModalTipo] = useState<"detalle" | "rechazar" | "firmar" | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const generandoContrato = false; // El backend genera el contrato al aceptar

  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  function abrirDetalle(s: SolicitudConContrato) {
    setSolicitudActiva(s);
    setModalTipo("detalle");
  }

  function abrirRechazar(s: SolicitudConContrato) {
    setSolicitudActiva(s);
    setMotivoRechazo("");
    setModalTipo("rechazar");
  }

  async function handleAceptar(s: SolicitudConContrato) {
    setProcesando(true);
    setError(null);

    // El backend se encarga de: actualizar estado, enviar email y generar contrato
    const { error: err } = await aceptarSolicitudAction(s.id);
    if (err) {
      setError(err);
      setProcesando(false);
      return;
    }

    // Recargar datos y abrir modal de firma
    await recargar();
    setProcesando(false);
    // El modal de firma se abrirá en el siguiente render cuando el usuario haga clic en "Ver contrato"
  }

  async function handleRechazar() {
    if (!solicitudActiva || !motivoRechazo.trim()) return;

    setProcesando(true);
    // El backend se encarga de actualizar estado y enviar email de rechazo
    const { error: err } = await rechazarSolicitudAction(
      solicitudActiva.id,
      motivoRechazo
    );

    if (err) {
      setError(err);
      setProcesando(false);
      return;
    }

    setModalTipo(null);
    setProcesando(false);
    await recargar();
  }

  async function handleFirmar() {
    if (!sigCanvasRef.current || !solicitudActiva?.contrato) return;
    if (sigCanvasRef.current.isEmpty()) {
      setError("Dibuja tu firma en el recuadro");
      return;
    }

    setProcesando(true);
    setError(null);

    const firmaBase64 = sigCanvasRef.current.toDataURL("image/png");
    // El backend se encarga de registrar la firma y enviar email si corresponde
    const { error: err } = await firmarContratoAction(solicitudActiva.contrato.id, firmaBase64);

    if (err) {
      setError(err);
      setProcesando(false);
      return;
    }

    setModalTipo(null);
    setProcesando(false);
    await recargar();
  }

  function verContrato(s: SolicitudConContrato) {
    if (!s.contrato) {
      setError("No se encontró contrato para esta solicitud.");
      return;
    }
    setSolicitudActiva(s);
    setModalTipo("firmar");
  }

  const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE");
  const resueltas = solicitudes.filter((s) => s.estado !== "PENDIENTE");

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de reserva</h1>
        <p className="text-sm text-slate-500 mt-1">
          Revisa las solicitudes de los inquilinos y decide si aceptar o rechazar.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-rose-400" /></button>
        </div>
      )}

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pendientes ({pendientes.length})
          </h2>
          {pendientes.map((s) => (
            <SolicitudCard
              key={s.id}
              solicitud={s}
              onVerDetalle={() => abrirDetalle(s)}
              onAceptar={() => handleAceptar(s)}
              onRechazar={() => abrirRechazar(s)}
              procesando={procesando}
            />
          ))}
        </div>
      )}

      {/* Resueltas */}
      {resueltas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
            Resueltas ({resueltas.length})
          </h2>
          {resueltas.map((s) => (
            <SolicitudCard
              key={s.id}
              solicitud={s}
              onVerDetalle={() => abrirDetalle(s)}
              onVerContrato={s.estado === "ACEPTADA" && s.contrato ? () => verContrato(s) : undefined}
            />
          ))}
        </div>
      )}

      {solicitudes.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="h-16 w-16 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Sin solicitudes</h3>
          <p className="text-sm text-slate-500">Cuando un inquilino solicite una de tus viviendas, aparecerá aquí.</p>
        </div>
      )}

      {/* MODAL OVERLAY */}
      {modalTipo && solicitudActiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalTipo(null)}>
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Detail modal */}
            {modalTipo === "detalle" && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Detalle de solicitud</h3>
                  <button onClick={() => setModalTipo(null)}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
                </div>

                {/* Vivienda info card */}
                {solicitudActiva.vivienda && (
                  <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {solicitudActiva.vivienda.fotos?.[0] ? (
                        <img
                          src={solicitudActiva.vivienda.fotos[0]}
                          alt={solicitudActiva.vivienda.titulo}
                          className="h-16 w-20 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-20 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                          <Home className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{solicitudActiva.vivienda.titulo}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {solicitudActiva.vivienda.barrio ? `${solicitudActiva.vivienda.barrio}, ` : ""}{solicitudActiva.vivienda.ciudad.split("-")[0]}
                        </p>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Euro className="h-3 w-3" /> {solicitudActiva.vivienda.precio_mes}€/mes
                          </span>
                          <span className="text-xs text-slate-500">
                            Fianza: {solicitudActiva.vivienda.fianza_importe}€
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span className="bg-white px-2 py-0.5 rounded-full ring-1 ring-slate-200">
                        Estancia: {solicitudActiva.vivienda.estancia_minima}–{solicitudActiva.vivienda.estancia_maxima} meses
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Inquilino</span>
                    <span className="font-medium">{solicitudActiva.usuarios?.nombre_completo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium">{solicitudActiva.usuarios?.email}</span>
                  </div>
                  {solicitudActiva.usuarios?.dni_nie && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">DNI/NIE</span>
                      <span className="font-medium">{solicitudActiva.usuarios.dni_nie}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Motivo</span>
                    <span className="font-medium">{solicitudActiva.motivo}</span>
                  </div>
                  {solicitudActiva.motivo_detalle && (
                    <div className="py-2 border-b border-slate-100">
                      <span className="text-slate-500 block mb-1">Detalle del motivo</span>
                      <p className="text-slate-900">{solicitudActiva.motivo_detalle}</p>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Fechas</span>
                    <span className="font-medium">
                      {new Date(solicitudActiva.fecha_entrada).toLocaleDateString("es-ES")} – {new Date(solicitudActiva.fecha_salida).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  {solicitudActiva.estado !== "PENDIENTE" && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Estado</span>
                      <span className={cn(
                        "font-semibold",
                        solicitudActiva.estado === "ACEPTADA" ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {solicitudActiva.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                      </span>
                    </div>
                  )}
                  {solicitudActiva.estado === "RECHAZADA" && solicitudActiva.motivo_rechazo && (
                    <div className="py-2 border-b border-slate-100">
                      <span className="text-slate-500 block mb-1">Motivo del rechazo</span>
                      <p className="text-rose-600 text-sm">{solicitudActiva.motivo_rechazo}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Documentos</p>
                  <div className="flex gap-2">
                    <a href={solicitudActiva.documento_identidad_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-2 bg-slate-50 ring-1 ring-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                      <User className="h-4 w-4 text-indigo-500" /> Doc. identidad <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
                    </a>
                    <a href={solicitudActiva.documento_justificativo_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-2 bg-slate-50 ring-1 ring-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                      <FileText className="h-4 w-4 text-indigo-500" /> Doc. justificativo <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* Contract preview for accepted solicitudes */}
                {solicitudActiva.estado === "ACEPTADA" && solicitudActiva.contrato && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Contrato</p>
                    <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-3 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-800">Contrato generado</p>
                        <p className="text-xs text-emerald-600">
                          {solicitudActiva.contrato.firmado_propietario && solicitudActiva.contrato.firmado_inquilino
                            ? "Firmado por ambas partes"
                            : solicitudActiva.contrato.firmado_propietario
                              ? "Pendiente firma del inquilino"
                              : "Pendiente firma del propietario"}
                        </p>
                      </div>
                      {(solicitudActiva.contrato.pdf_final_url || solicitudActiva.contrato.pdf_borrador_url) && (
                        <a
                          href={solicitudActiva.contrato.pdf_final_url || solicitudActiva.contrato.pdf_borrador_url || ""}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="h-7 text-xs ring-1 ring-emerald-300 border-0 text-emerald-700 hover:bg-emerald-100 gap-1">
                            <Eye className="h-3 w-3" /> Ver PDF
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {solicitudActiva.estado === "PENDIENTE" && (
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => abrirRechazar(solicitudActiva)} className="flex-1 ring-1 ring-rose-200 border-0 text-rose-600 hover:bg-rose-50">
                      Rechazar
                    </Button>
                    <Button onClick={() => handleAceptar(solicitudActiva)} disabled={procesando} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                      {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aceptar solicitud"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Reject modal */}
            {modalTipo === "rechazar" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Rechazar solicitud</h3>
                  <button onClick={() => setModalTipo(null)}><X className="h-5 w-5 text-slate-400" /></button>
                </div>
                <p className="text-sm text-slate-600">
                  Indica el motivo del rechazo. Se notificará al inquilino.
                </p>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej: La vivienda ya no está disponible para esas fechas..."
                  className="w-full rounded-xl ring-1 ring-slate-200 px-4 py-3 text-sm outline-none focus:ring-rose-400 min-h-[100px] resize-none"
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setModalTipo(null)} className="flex-1 ring-1 ring-slate-200 border-0">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRechazar}
                    disabled={!motivoRechazo.trim() || procesando}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar rechazo"}
                  </Button>
                </div>
              </div>
            )}

            {/* Sign contract modal */}
            {modalTipo === "firmar" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Firmar contrato</h3>
                  <button onClick={() => setModalTipo(null)}><X className="h-5 w-5 text-slate-400" /></button>
                </div>

                {generandoContrato ? (
                  <div className="text-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-sm text-slate-500">Generando contrato PDF...</p>
                  </div>
                ) : solicitudActiva.contrato ? (
                  <>
                    {solicitudActiva.contrato.firmado_propietario ? (
                      <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 text-center space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                        <p className="text-sm font-semibold text-emerald-800">Contrato firmado por ti</p>
                        <p className="text-xs text-emerald-600">
                          {solicitudActiva.contrato.firmado_inquilino
                            ? "El inquilino también ha firmado. Contrato completo."
                            : "Esperando la firma del inquilino."}
                        </p>
                        {(solicitudActiva.contrato.pdf_final_url || solicitudActiva.contrato.pdf_borrador_url) && (
                          <a
                            href={solicitudActiva.contrato.pdf_final_url || solicitudActiva.contrato.pdf_borrador_url || ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2"
                          >
                            <Eye className="h-3 w-3" /> Ver contrato PDF
                          </a>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="bg-indigo-50 ring-1 ring-indigo-200 rounded-xl p-3 flex items-start gap-2">
                          <Shield className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-indigo-700">
                            Solicitud aceptada. Revisa el contrato generado y fírmalo para que el inquilino pueda continuar.
                          </p>
                        </div>

                        {solicitudActiva.contrato.pdf_borrador_url && (
                          <div className="space-y-2">
                            <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl overflow-hidden">
                              <iframe
                                src={solicitudActiva.contrato.pdf_borrador_url}
                                className="w-full h-48 border-0"
                                title="Contrato"
                              />
                            </div>
                            <a
                              href={solicitudActiva.contrato.pdf_borrador_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" /> Ver contrato completo
                            </a>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tu firma</label>
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

                        <Button
                          onClick={handleFirmar}
                          disabled={procesando}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          {procesando ? (
                            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Firmando...</>
                          ) : (
                            <><FileText className="mr-1.5 h-4 w-4" /> Firmar contrato</>
                          )}
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">No se encontró el contrato.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SolicitudCard({
  solicitud: s,
  onVerDetalle,
  onAceptar,
  onRechazar,
  onVerContrato,
  procesando,
}: {
  solicitud: SolicitudConContrato;
  onVerDetalle: () => void;
  onAceptar?: () => void;
  onRechazar?: () => void;
  onVerContrato?: () => void;
  procesando?: boolean;
}) {
  const motConfig = MOTIVO_CONFIG[s.motivo] ?? MOTIVO_CONFIG.Otros;
  const MotivoIcon = motConfig.icon;

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-indigo-50 ring-1 ring-indigo-200 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {s.usuarios?.nombre_completo ?? "Inquilino"}
              </p>
              <p className="text-xs text-slate-500 truncate">{s.usuarios?.email}</p>
            </div>
          </div>

          <span className={cn(
            "shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ring-1",
            s.estado === "PENDIENTE" && "bg-amber-50 text-amber-700 ring-amber-200",
            s.estado === "ACEPTADA" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
            s.estado === "RECHAZADA" && "bg-rose-50 text-rose-700 ring-rose-200"
          )}>
            {s.estado === "PENDIENTE" ? "Pendiente" : s.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
          </span>
        </div>

        {/* Vivienda info inline */}
        {s.vivienda && (
          <div className="mt-3 flex items-center gap-2 bg-slate-50 ring-1 ring-slate-100 rounded-lg p-2.5">
            {s.vivienda.fotos?.[0] ? (
              <img
                src={s.vivienda.fotos[0]}
                alt={s.vivienda.titulo}
                className="h-10 w-12 rounded-md object-cover ring-1 ring-slate-200 shrink-0"
              />
            ) : (
              <div className="h-10 w-12 rounded-md bg-slate-200 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-900 truncate">{s.vivienda.titulo}</p>
              <p className="text-[11px] text-slate-400">
                {s.vivienda.ciudad.split("-")[0]} · {s.vivienda.precio_mes}€/mes
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${motConfig.bg}`}>
            <MotivoIcon className={`h-3 w-3 ${motConfig.color}`} />
            {s.motivo}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full ring-1 ring-slate-200">
            <Calendar className="h-3 w-3" />
            {new Date(s.fecha_entrada).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} – {new Date(s.fecha_salida).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Contract status badge for accepted solicitudes */}
        {s.estado === "ACEPTADA" && s.contrato && (
          <div className="mt-2">
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
              s.contrato.firmado_propietario && s.contrato.firmado_inquilino
                ? "bg-emerald-100 text-emerald-700"
                : s.contrato.firmado_propietario
                  ? "bg-amber-100 text-amber-700"
                  : "bg-indigo-100 text-indigo-700"
            )}>
              {s.contrato.firmado_propietario && s.contrato.firmado_inquilino ? (
                <><CheckCircle2 className="h-2.5 w-2.5" /> Contrato firmado</>
              ) : s.contrato.firmado_propietario ? (
                <><Clock className="h-2.5 w-2.5" /> Pend. firma inquilino</>
              ) : (
                <><Clock className="h-2.5 w-2.5" /> Pend. tu firma</>
              )}
            </span>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={onVerDetalle} className="h-7 text-xs ring-1 ring-slate-200 border-0">
            Ver detalle
          </Button>
          {s.estado === "PENDIENTE" && onAceptar && onRechazar && (
            <>
              <Button size="sm" variant="outline" onClick={onRechazar} disabled={procesando} className="h-7 text-xs ring-1 ring-rose-200 border-0 text-rose-600 hover:bg-rose-50">
                Rechazar
              </Button>
              <Button size="sm" onClick={onAceptar} disabled={procesando} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                {procesando ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aceptar"}
              </Button>
            </>
          )}
          {s.estado === "ACEPTADA" && onVerContrato && (
            <Button size="sm" variant="outline" onClick={onVerContrato} className="h-7 text-xs ring-1 ring-indigo-200 border-0 text-indigo-600 hover:bg-indigo-50">
              <FileText className="h-3 w-3 mr-1" /> Ver contrato
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
