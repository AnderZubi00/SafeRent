"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, CreditCard, Euro, Loader2, Rocket } from "lucide-react";
import { guardarFase, publicarViviendaFinal, type Vivienda } from "@/lib/viviendas";
import { mockStripeConnect } from "@/lib/stripe-connect";

interface FasePrecioProps {
  viviendaId: string;
  vivienda: Vivienda;
  onComplete: (vivienda: Vivienda) => void;
}

export default function FasePrecio({
  viviendaId,
  vivienda,
  onComplete,
}: FasePrecioProps) {
  const router = useRouter();
  const [precioMes, setPrecioMes] = useState(
    vivienda.precio_mes ? String(vivienda.precio_mes) : "",
  );
  const [fianzaImporte, setFianzaImporte] = useState(
    vivienda.fianza_importe ? String(vivienda.fianza_importe) : "",
  );
  const [disponibleDesde, setDisponibleDesde] = useState(
    vivienda.disponible_desde ? vivienda.disponible_desde.split("T")[0] : "",
  );
  const [estanciaMinima, setEstanciaMinima] = useState(
    vivienda.estancia_minima ? String(vivienda.estancia_minima) : "1",
  );
  const [estanciaMaxima, setEstanciaMaxima] = useState(
    vivienda.estancia_maxima ? String(vivienda.estancia_maxima) : "11",
  );

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef(false);
  const [stripeModal, setStripeModal] = useState(false);
  const [conectandoStripe, setConectandoStripe] = useState(false);

  function validate(): string | null {
    if (!precioMes || Number(precioMes) <= 0) return "Indica el precio mensual";
    if (!fianzaImporte || Number(fianzaImporte) <= 0)
      return "Indica el importe de la fianza";
    return null;
  }

  async function handleSubmit() {
    if (submitRef.current) return;
    submitRef.current = true;
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      submitRef.current = false;
      return;
    }

    setCargando(true);

    try {
      await guardarFase(viviendaId, 4, {
        precio_mes: Number(precioMes),
        fianza_importe: Number(fianzaImporte),
        disponible_desde: disponibleDesde || undefined,
        estancia_minima: Number(estanciaMinima) || 1,
        estancia_maxima: Number(estanciaMaxima) || 11,
      });

      const publicada = await publicarViviendaFinal(viviendaId);
      onComplete(publicada);
    } catch (e) {
      if (e instanceof Error) {
        try {
          const parsed = JSON.parse(e.message);
          if (parsed.code === "STRIPE_NOT_CONNECTED") {
            setStripeModal(true);
            return;
          }
          if (parsed.camposFaltantes) {
            setError(`Faltan campos: ${parsed.camposFaltantes.join(", ")}`);
            return;
          }
        } catch { /* not JSON */ }
        setError(e.message);
      } else {
        setError("Error al publicar la vivienda");
      }
    } finally {
      setCargando(false);
      submitRef.current = false;
    }
  }

  async function handleConectarStripe() {
    setConectandoStripe(true);
    const { data, error: stripeError } = await mockStripeConnect();
    if (stripeError || !data?.url) {
      setStripeModal(false);
      setError("Error al iniciar la conexión con Stripe. Intentá desde el dashboard.");
      setConectandoStripe(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <>
      <Card className="ring-1 ring-slate-200 shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Euro className="h-5 w-5 text-indigo-600" /> Precio y disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 ring-1 ring-rose-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Precio mensual (€) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="850"
                value={precioMes}
                onChange={(e) => setPrecioMes(e.target.value)}
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
                value={fianzaImporte}
                onChange={(e) => setFianzaImporte(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Disponible desde
            </Label>
            <Input
              type="date"
              value={disponibleDesde}
              onChange={(e) => setDisponibleDesde(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estancia mínima{" "}
                <span className="text-slate-400 font-normal normal-case">
                  (meses)
                </span>
              </Label>
              <Select value={estanciaMinima} onValueChange={setEstanciaMinima}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "mes" : "meses"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estancia máxima{" "}
                <span className="text-slate-400 font-normal normal-case">
                  (meses)
                </span>
              </Label>
              <Select value={estanciaMaxima} onValueChange={setEstanciaMaxima}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "mes" : "meses"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">
                Al publicar, tu vivienda quedará visible para los inquilinos. Podrás agregar la verificación SafeRent en el siguiente paso.
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={cargando}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {cargando ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Publicando...
                </>
              ) : (
                <>
                  <Rocket className="mr-1.5 h-4 w-4" /> Guardar y publicar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Stripe no conectado */}
      <Dialog open={stripeModal} onOpenChange={setStripeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-2">
              <CreditCard className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Cuenta de pagos requerida</DialogTitle>
            <DialogDescription className="text-center">
              Para publicar tu vivienda y recibir pagos de los inquilinos, necesitás conectar tu cuenta bancaria a través de Stripe.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Los pagos se transfieren directamente a tu cuenta
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Proceso seguro gestionado por Stripe
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              Solo tarda unos minutos en completarse
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleConectarStripe}
              disabled={conectandoStripe}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {conectandoStripe ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Redirigiendo...
                </>
              ) : (
                <>
                  <CreditCard className="mr-1.5 h-4 w-4" /> Conectar cuenta bancaria
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-slate-500"
              onClick={() => { setStripeModal(false); router.push("/propietario"); }}
            >
              Hacerlo desde el dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
