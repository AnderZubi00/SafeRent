import { api } from "@/lib/api";

export async function mockStripeConnect(): Promise<{
  data: { url: string } | null;
  error: string | null;
}> {
  try {
    const data = await api.post<{ url: string }>("/pagos/stripe-connect/mock");
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function iniciarOnboardingStripe(): Promise<{
  data: { url: string } | null;
  error: string | null;
}> {
  try {
    const data = await api.post<{ url: string }>("/pagos/stripe-connect/onboard");
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function refrescarOnboardingStripe(): Promise<{
  data: { url: string } | null;
  error: string | null;
}> {
  try {
    const data = await api.post<{ url: string }>("/pagos/stripe-connect/onboard-refresh");
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function obtenerEstadoStripe(): Promise<{
  data: {
    connected: boolean;
    chargesEnabled: boolean;
    onboardingComplete: boolean;
    accountId: string | null;
  } | null;
  error: string | null;
}> {
  try {
    const data = await api.get<{
      connected: boolean;
      chargesEnabled: boolean;
      onboardingComplete: boolean;
      accountId: string | null;
    }>("/pagos/stripe-connect/status");
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Error" };
  }
}
