/**
 * Flags de sincronización para el flujo de autenticación.
 *
 * Módulo separado para evitar dependencias circulares:
 * - auth.ts y authStore.ts importan desde aquí (no entre sí)
 *
 * loginInProgress: true mientras loginConSupabase está en vuelo.
 * Le indica al listener de SIGNED_IN en authStore que loginConSupabase
 * ya está manejando el exchange — evita la doble llamada a /auth/exchange.
 */
let _loginInProgress = false;

export function setLoginInProgress(value: boolean): void {
  _loginInProgress = value;
}

export function isLoginInProgress(): boolean {
  return _loginInProgress;
}
