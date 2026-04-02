"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Eye, CheckCircle2, XCircle, FileText, Building2,
  User, Clock, Loader2, ExternalLink, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface ViviendaPendiente {
  id: string;
  titulo: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  num_registro_vivienda: string;
  nota_simple_url: string | null;
  fotos: string[];
  fecha_creacion: string;
  propietario: { id: string; nombre_completo: string; email: string };
}

interface UsuarioKyc {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  dni_nie: string | null;
  fecha_creacion: string;
  kyc_sesiones: {
    id: string;
    estado: string;
    dni_extraido: string | null;
    nombre_extraido: string | null;
    creado_en: string;
  }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function VerificacionPage() {
  const [viviendas, setViviendas] = useState<ViviendaPendiente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioKyc[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<Record<string, boolean>>({});

  const cargarDatos = useCallback(async () => {
    try {
      setError(null);
      const [viv, usr] = await Promise.all([
        api.get<ViviendaPendiente[]>("/admin/viviendas/pendientes"),
        api.get<UsuarioKyc[]>("/admin/usuarios/pendientes-kyc"),
      ]);
      setViviendas(viv);
      setUsuarios(usr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  async function accion(
    tipo: "vivienda-aprobar" | "vivienda-rechazar" | "kyc-aprobar",
    id: string,
  ) {
    setProcesando((p) => ({ ...p, [id]: true }));
    try {
      if (tipo === "vivienda-aprobar") {
        await api.patch(`/admin/viviendas/${id}/aprobar`, {});
        setViviendas((v) => v.filter((x) => x.id !== id));
      } else if (tipo === "vivienda-rechazar") {
        await api.patch(`/admin/viviendas/${id}/rechazar`, {});
        setViviendas((v) => v.filter((x) => x.id !== id));
      } else if (tipo === "kyc-aprobar") {
        await api.patch(`/admin/usuarios/${id}/aprobar-kyc`, {});
        setUsuarios((u) => u.filter((x) => x.id !== id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar acción");
    } finally {
      setProcesando((p) => ({ ...p, [id]: false }));
    }
  }

  const totalPendientes = viviendas.length + usuarios.length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Verificación</h1>
          <p className="text-slate-500 mt-1">Cola de elementos pendientes de revisión</p>
        </div>
        <span className={cn(
          "flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full",
          totalPendientes > 0
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"
        )}>
          <Clock className="h-4 w-4" />
          {totalPendientes > 0 ? `${totalPendientes} pendientes` : "Todo al día"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Tabs defaultValue="viviendas">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="viviendas" className="gap-2">
            <Building2 className="h-4 w-4" /> Viviendas
            {viviendas.length > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 ml-1">
                {viviendas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2">
            <User className="h-4 w-4" /> KYC usuarios
            {usuarios.length > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 ml-1">
                {usuarios.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Viviendas ── */}
        <TabsContent value="viviendas" className="mt-4 space-y-4">
          {viviendas.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay viviendas pendientes de verificación</p>
            </div>
          ) : (
            viviendas.map((v) => (
              <Card key={v.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {v.fotos[0] ? (
                      <img
                        src={v.fotos[0]}
                        alt={v.titulo}
                        className="h-14 w-14 rounded-xl object-cover shrink-0 ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{v.titulo}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {v.direccion} · {v.ciudad}
                          </p>
                          <p className="text-sm text-slate-500">
                            Propietario: <span className="font-medium text-slate-700">{v.propietario.nombre_completo}</span>
                            <span className="text-slate-400"> · {v.propietario.email}</span>
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                          {formatFecha(v.fecha_creacion)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-50 ring-1 ring-slate-200 rounded-lg px-3 py-1.5">
                          <span className="text-xs text-slate-600 font-medium">Registro:</span>
                          <span className="text-xs font-mono text-blue-600">{v.num_registro_vivienda}</span>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                          v.nota_simple_url
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        )}>
                          <FileText className="h-3.5 w-3.5" />
                          {v.nota_simple_url ? "Nota simple subida" : "Sin nota simple"}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 flex-wrap">
                        {v.nota_simple_url && (
                          <a href={v.nota_simple_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <ExternalLink className="h-3.5 w-3.5" /> Ver nota simple
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          disabled={procesando[v.id]}
                          onClick={() => accion("vivienda-aprobar", v.id)}
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {procesando[v.id]
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={procesando[v.id]}
                          onClick={() => accion("vivienda-rechazar", v.id)}
                          className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Tab KYC ── */}
        <TabsContent value="kyc" className="mt-4 space-y-4">
          {usuarios.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay usuarios pendientes de verificación KYC</p>
            </div>
          ) : (
            usuarios.map((u) => {
              const sesion = u.kyc_sesiones[0];
              return (
                <Card key={u.id} className="border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">{u.nombre_completo}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={cn(
                              "text-xs",
                              u.rol === "INQUILINO"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 border-0"
                                : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 border-0"
                            )}>
                              {u.rol === "INQUILINO" ? "Inquilino" : "Propietario"}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {formatFecha(u.fecha_creacion)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {u.dni_nie ? (
                            <div className="flex items-center gap-1.5 bg-slate-50 ring-1 ring-slate-200 rounded-lg px-3 py-1.5 text-xs">
                              <span className="text-slate-600 font-medium">DNI/NIE:</span>
                              <span className="font-mono text-slate-800">{u.dni_nie}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700">
                              Sin DNI/NIE registrado
                            </div>
                          )}
                          {sesion && (
                            <div className={cn(
                              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                              sesion.estado === "COMPLETADO"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            )}>
                              <Eye className="h-3.5 w-3.5" />
                              KYC: {sesion.estado}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2 flex-wrap">
                          {sesion?.nombre_extraido && (
                            <div className="flex items-center gap-1.5 bg-blue-50 ring-1 ring-blue-200 rounded-lg px-3 py-1.5 text-xs text-blue-700">
                              Nombre extraído: <span className="font-medium">{sesion.nombre_extraido}</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            disabled={procesando[u.id]}
                            onClick={() => accion("kyc-aprobar", u.id)}
                            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {procesando[u.id]
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Aprobar KYC
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
