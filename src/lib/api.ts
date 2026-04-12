const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * JWT dual-channel: cookie HttpOnly (persistente, page reloads) + in-memory (sesión actual).
 *
 * La cookie cross-origin (localhost:3000 → localhost:3001) no siempre se almacena
 * en Chrome/Firefox por restricciones de SameSite/third-party cookies.
 * El token in-memory actúa como fallback inmediato; el backend acepta ambos
 * (cookie primero, Authorization: Bearer segundo — ver jwt-auth.guard.ts).
 */
let _inMemoryToken: string | null = null;

/** Error de API con status HTTP incluido para detección confiable (p.ej. 429 rate limit). */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Limpia la sesión: token in-memory + cookie HttpOnly del backend. */
export async function clearBackendToken(): Promise<void> {
  _inMemoryToken = null;
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {
    // Si el logout falla (p.ej. red caída) seguimos deslogueando localmente
  });
}

/** Almacena el JWT en memoria para la sesión actual (fallback a cookie). */
export function setBackendToken(token: string): void {
  _inMemoryToken = token;
}

/** Devuelve el JWT in-memory (null si no existe — la cookie puede seguir activa). */
export function getBackendToken(): string | null {
  return _inMemoryToken;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}/api/v1${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Fallback: si hay token in-memory, enviarlo como Authorization header.
  // El backend prioriza la cookie, pero usa Bearer si no hay cookie.
  if (_inMemoryToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${_inMemoryToken}`;
  }

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
      throw new ApiError(JSON.stringify(error), response.status);
    }
    const msg = error.message ?? `Error ${response.status}`;
    throw new ApiError(msg, response.status);
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
