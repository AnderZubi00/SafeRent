import { api } from "@/lib/api";

export interface CompletarKycData {
  nombre: string;
  apellidos: string;
  dni_nie: string;
  tipo_documento: string;
}

export async function completarKycPropietario(
  data: CompletarKycData,
): Promise<unknown> {
  return api.patch("/kyc/completar-propietario", data);
}
