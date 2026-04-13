// En dev usamos URL relativa para que el rewrite de Next.js proxie las llamadas
// a localhost:3001 como mismo origen → la cookie HttpOnly viaja en todos los requests.
// En prod, NEXT_PUBLIC_API_URL puede apuntar al dominio propio (mismo origen ya nativo).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * JWT triple-channel:
 * 1. Cookie HttpOnly (backend, cross-origin — no llega al middleware en dev)
 * 2. In-memory (sesión actual, se pierde en page refresh)
 * 3. sessionStorage (mismo tab, sobrevive page refresh, se borra al cerrar el tab)
 *
 * En dev, la cookie cross-origin (localhost:3000 → localhost:3001) no viaja por
 * restricciones SameSite. El Bearer + sessionStorage son el canal principal en dev.
 * En prod (mismo dominio) la cookie HttpOnly funciona nativamente.
 *
 * Prioridad en cada request: in-memory → sessionStorage → cookie (implícita via credentials:include)
 */
const SESSION_STORAGE_KEY = 'sr_jwt';
let _inMemoryToken: string | null = null;

/** Error de API con status HTTP incluido para detección confiable (p.ej. 429 rate limit). */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Limpia la sesión: token in-memory + sessionStorage + cookies. */
export async function clearBackendToken(): Promise<void> {
  _inMemoryToken = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  if (typeof document !== 'undefined') {
    document.cookie = 'saferent_role=; path=/; max-age=0; SameSite=Lax';
  }
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {
    // Si el logout falla (p.ej. red caída) seguimos deslogueando localmente
  });
}

/** Almacena el JWT en memoria y en sessionStorage (sobrevive page refresh, no tab close). */
export function setBackendToken(token: string): void {
  _inMemoryToken = token;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEY, token);
  }
}

/**
 * Devuelve el JWT activo.
 * Restaura desde sessionStorage si _inMemoryToken fue limpiado por un page refresh.
 */
export function getBackendToken(): string | null {
  if (_inMemoryToken) return _inMemoryToken;
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      _inMemoryToken = stored; // restaurar al módulo
      return stored;
    }
  }
  return null;
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

  // Incluir JWT como Bearer si está disponible (in-memory o sessionStorage).
  // El backend prioriza la cookie HttpOnly, pero en dev (cross-origin) no llega
  // y usa Bearer como fallback. getBackendToken() restaura desde sessionStorage
  // si _inMemoryToken fue limpiado por un page refresh.
  const token = getBackendToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
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
