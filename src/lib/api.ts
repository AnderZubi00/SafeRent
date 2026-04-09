const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * El JWT vive en una cookie HttpOnly seteada por el backend en /auth/exchange.
 * JS nunca puede leerla — el navegador la envía automáticamente con credentials: 'include'.
 */

/** Limpia la sesión llamando al endpoint de logout del backend (borra la cookie HttpOnly). */
export async function clearBackendToken(): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {
    // Si el logout falla (p.ej. red caída) seguimos deslogueando localmente
  });
}

/** @deprecated La cookie HttpOnly la setea el servidor — esta función ya no hace nada. */
export function setBackendToken(_token: string): void {}

/** @deprecated La cookie HttpOnly no es legible desde JS. Siempre devuelve null. */
export function getBackendToken(): null { return null; }

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}/api/v1${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Si hay código estructurado (ej. STRIPE_NOT_CONNECTED), serializar todo
    // para que el caller pueda hacer JSON.parse(e.message) y leer el código
    if (error.code || typeof error.message === 'object') {
      throw new Error(JSON.stringify(error));
    }
    const msg = error.message ?? `Error ${response.status}`;
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
