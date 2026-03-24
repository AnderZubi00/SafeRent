"use client";

import { useMemo, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, Loader2, MapPin } from "lucide-react";
import {
  getAllProvincias,
  getCiudadesByProvincia,
  getProvinciaByName,
  getProvinciaByCode,
} from "@/data/spain-locations";
import { validateAddress, type AddressValidationResult } from "@/lib/address-validation";

interface LocationSelectorProps {
  /** Provincia name as stored in DB (e.g. "Gipuzkoa") */
  provincia: string;
  ciudad: string;
  direccion: string;
  onProvinciaChange: (name: string) => void;
  onCiudadChange: (value: string) => void;
  onDireccionChange: (value: string) => void;
  /** Show validation errors */
  errors?: { provincia?: string; ciudad?: string; direccion?: string };
}

export default function LocationSelector({
  provincia,
  ciudad,
  direccion,
  onProvinciaChange,
  onCiudadChange,
  onDireccionChange,
  errors,
}: LocationSelectorProps) {
  const provincias = useMemo(() => getAllProvincias(), []);

  const [addressCheck, setAddressCheck] = useState<{
    status: "idle" | "loading" | "valid" | "not_found";
    result?: AddressValidationResult;
  }>({ status: "idle" });

  // Convert stored name to code for internal select value
  const provinciaCode = useMemo(() => {
    if (!provincia) return "";
    const found = getProvinciaByName(provincia);
    return found?.code ?? "";
  }, [provincia]);

  const ciudades = useMemo(() => {
    if (!provinciaCode) return [];
    return getCiudadesByProvincia(provinciaCode);
  }, [provinciaCode]);

  function handleProvinciaChange(code: string) {
    const prov = getProvinciaByCode(code);
    onProvinciaChange(prov?.name ?? "");
    onCiudadChange(""); // Reset ciudad when provincia changes
    setAddressCheck({ status: "idle" }); // Reset address validation
  }

  const handleVerifyAddress = useCallback(async () => {
    if (!direccion.trim() || !ciudad || !provincia) return;
    setAddressCheck({ status: "loading" });
    const result = await validateAddress(direccion, ciudad, provincia);
    setAddressCheck({
      status: result.valid ? "valid" : "not_found",
      result,
    });
  }, [direccion, ciudad, provincia]);

  return (
    <div className="space-y-3">
      {/* Provincia + Ciudad in 2 cols */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Provincia <span className="text-rose-500">*</span>
          </Label>
          <Select value={provinciaCode} onValueChange={handleProvinciaChange}>
            <SelectTrigger className={errors?.provincia ? "border-rose-400" : ""}>
              <SelectValue placeholder="Selecciona provincia" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {provincias.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.provincia && (
            <p className="text-xs text-rose-500">{errors.provincia}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ciudad <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={ciudad}
            onValueChange={(v) => { onCiudadChange(v); setAddressCheck({ status: "idle" }); }}
            disabled={!provinciaCode}
          >
            <SelectTrigger className={errors?.ciudad ? "border-rose-400" : ""}>
              <SelectValue
                placeholder={
                  provinciaCode
                    ? "Selecciona ciudad"
                    : "Primero selecciona provincia"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {ciudades.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.ciudad && (
            <p className="text-xs text-rose-500">{errors.ciudad}</p>
          )}
        </div>
      </div>

      {/* Dirección full width + verify */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Dirección completa <span className="text-rose-500">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Calle, número, piso, puerta"
            value={direccion}
            onChange={(e) => { onDireccionChange(e.target.value); setAddressCheck({ status: "idle" }); }}
            className={`flex-1 ${errors?.direccion ? "border-rose-400" : ""}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 h-9 text-xs gap-1.5 ring-1 ring-slate-200 border-0"
            onClick={handleVerifyAddress}
            disabled={!direccion.trim() || !ciudad || addressCheck.status === "loading"}
          >
            {addressCheck.status === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
            Verificar
          </Button>
        </div>

        {/* Validation feedback */}
        {addressCheck.status === "valid" && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Dirección verificada
          </p>
        )}
        {addressCheck.status === "not_found" && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            No se encontró la dirección — puedes continuar igualmente
          </p>
        )}

        {errors?.direccion && (
          <p className="text-xs text-rose-500">{errors.direccion}</p>
        )}
      </div>
    </div>
  );
}
