"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  MapPin,
  Send,
  FileText,
  Info,
} from "lucide-react";
import {
  guardarFase,
  obtenerUrlNotaSimple,
  publicarViviendaFinal,
  type Vivienda,
} from "@/lib/viviendas";

interface FaseVerificacionProps {
  viviendaId: string;
  vivienda: Vivienda;
  onPublicar: () => void;
}

export default function FaseVerificacion({
  viviendaId,
  vivienda,
  onPublicar,
}: FaseVerificacionProps) {
  const router = useRouter();
  const [notaSimpleUrl, setNotaSimpleUrl] = useState<string | null>(
    vivienda.nota_simple_url ?? null,
  );
  const [subiendo, setSubiendo] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([]);

  async function handleSubirNotaSimple(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setError(null);

    try {
      const { signedUrl, publicUrl } = await obtenerUrlNotaSimple(viviendaId);

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Error al subir el archivo");
      }

      // Save the nota simple reference
      const resultado = await guardarFase(viviendaId, 5, {
        nota_simple_url: publicUrl, // public URL from Supabase Storage
      });
      setNotaSimpleUrl(resultado.nota_simple_url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al subir la nota simple",
      );
    } finally {
      setSubiendo(false);
    }
  }

  async function handlePublicar() {
    setError(null);
    setCamposFaltantes([]);
    setPublicando(true);

    try {
      await publicarViviendaFinal(viviendaId);
      onPublicar();
      router.push("/propietario?publicada=true");
    } catch (e) {
      if (e instanceof Error) {
        // Try to parse camposFaltantes from the error
        try {
          const parsed = JSON.parse(e.message);
          if (parsed.camposFaltantes) {
            setCamposFaltantes(parsed.camposFaltantes);
            setError("Faltan campos obligatorios por completar:");
            setPublicando(false);
            return;
          }
        } catch {
          // Not JSON, use as-is
        }
        setError(e.message);
      } else {
        setError("Error al publicar la vivienda");
      }
    } finally {
      setPublicando(false);
    }
  }

  return (
    <Card className="ring-1 ring-slate-200 shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5 text-indigo-600" /> Revisar y publicar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-rose-700">{error}</p>
              {camposFaltantes.length > 0 && (
                <ul className="text-sm text-rose-600 mt-1 list-disc list-inside">
                  {camposFaltantes.map((campo) => (
                    <li key={campo}>{campo}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── Summary ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Resumen de la vivienda
          </h3>

          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4 space-y-3">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Título
              </p>
              <p className="text-sm font-medium text-slate-900">
                {vivienda.titulo || "-"}
              </p>
            </div>

            <Separator />

            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-700">
                  {vivienda.direccion || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {[vivienda.ciudad, vivienda.provincia]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Property details */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-400">Habitaciones</p>
                <p className="text-sm font-semibold text-slate-900">
                  {vivienda.habitaciones || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Baños</p>
                <p className="text-sm font-semibold text-slate-900">
                  {vivienda.banos || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Superficie</p>
                <p className="text-sm font-semibold text-slate-900">
                  {vivienda.m2 ? `${vivienda.m2} m²` : "-"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Precio mensual</p>
                <p className="text-sm font-semibold text-slate-900">
                  {vivienda.precio_mes
                    ? `${vivienda.precio_mes} €/mes`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Fianza</p>
                <p className="text-sm font-semibold text-slate-900">
                  {vivienda.fianza_importe
                    ? `${vivienda.fianza_importe} €`
                    : "-"}
                </p>
              </div>
            </div>

            {/* Registration */}
            <Separator />
            <div>
              <p className="text-xs text-slate-400">Nº registro</p>
              <p className="text-sm text-slate-700">
                {vivienda.num_registro_vivienda || "-"}
              </p>
            </div>

            {/* Stay duration */}
            {(vivienda.estancia_minima || vivienda.estancia_maxima) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Estancia mínima</p>
                    <p className="text-sm text-slate-700">
                      {vivienda.estancia_minima
                        ? `${vivienda.estancia_minima} ${vivienda.estancia_minima === 1 ? "mes" : "meses"}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Estancia máxima</p>
                    <p className="text-sm text-slate-700">
                      {vivienda.estancia_maxima
                        ? `${vivienda.estancia_maxima} ${vivienda.estancia_maxima === 1 ? "mes" : "meses"}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Photos count */}
            {vivienda.fotos && vivienda.fotos.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-slate-400">Fotos</p>
                  <p className="text-sm text-slate-700">
                    {vivienda.fotos.length} foto
                    {vivienda.fotos.length !== 1 ? "s" : ""} subida
                    {vivienda.fotos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Nota simple ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Nota simple (opcional)
          </h3>

          <div className="flex items-start gap-2 bg-indigo-50 ring-1 ring-indigo-200 rounded-xl px-4 py-3">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700">
              La nota simple es opcional pero recomendada. Sin ella, la vivienda
              se publicará como no verificada.
            </p>
          </div>

          {notaSimpleUrl ? (
            <div className="flex items-center gap-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700">
                Nota simple subida correctamente
              </p>
            </div>
          ) : (
            <div>
              <input
                id="nota-simple-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleSubirNotaSimple}
              />
              <label
                htmlFor="nota-simple-input"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                {subiendo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" /> Subir nota simple
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* ── Publish button ── */}
        <Button
          onClick={handlePublicar}
          disabled={publicando}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {publicando ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Publicando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar vivienda
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
