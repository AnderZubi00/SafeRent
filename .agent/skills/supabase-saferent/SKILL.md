# Supabase Patterns — SafeRent

> Cargar cuando: queries a Supabase, auth checks, operaciones de storage, RLS, realtime, error handling.

---

## Client Selection (Regla Crítica)

| Contexto | Cliente | Archivo |
|---------|---------|---------|
| Server Components, API routes, middleware | `createServerClient` con cookie store | `src/lib/supabase/server.ts` |
| Client Components (`'use client'`) | `createBrowserClient` singleton | `src/lib/supabase/client.ts` |

```
¿El archivo tiene 'use client'?
  SÍ → import desde '@/lib/supabase/client.ts'
  NO → import desde '@/lib/supabase/server.ts'
       (Server Components, API route handlers, server actions)
```

```typescript
// Client Component ('use client')
import { supabase } from '@/lib/supabase/client';

// Server Component o API route
import { createSupabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
const supabase = createSupabaseServer(cookies());
```

**Nunca** importar `server.ts` en un Client Component — referencia `next/headers` que no está disponible client-side y lanza error en runtime.

**Nunca** importar el browser client en un Server Component o API route — bypasea RLS con la anon key en el servidor.

---

## Auth & Role Checks

- Leer siempre el usuario autenticado desde `supabase.auth.getUser()`, no `getSession()` — las sessions pueden ser spoofed client-side.
- Los roles están guardados en la tabla `usuarios` como `rol: 'INQUILINO' | 'PROPIETARIO' | 'ADMINISTRADOR'`.
- El helper `src/lib/auth.ts` ya wrappea el fetching de roles — usarlo en lugar de queries crudas.
- El middleware (`src/middleware.ts`) enforcea el acceso a route groups; no duplicar esa lógica en código de página.

```typescript
// Server-side auth check en API route
import { createSupabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServer(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... resto del handler
}
```

`onAuthStateChange` se setea una sola vez en `AuthContext` — NO agregar listeners adicionales en componentes individuales.

---

## Row Level Security (RLS)

Todas las tablas **deben** tener RLS habilitado. La service role key es server-only — nunca usarla client-side, bypasea RLS para todos los usuarios.

### `viviendas`
- `SELECT`: cualquier usuario autenticado (listings públicos).
- `INSERT/UPDATE/DELETE`: solo el propietario dueño (`propietario_id = auth.uid()`).

### `solicitudes`
- `SELECT`: el inquilino (`inquilino_id = auth.uid()`) **o** el propietario que es dueño de la propiedad destino.
- `INSERT`: usuarios autenticados con rol `INQUILINO` únicamente.
- `UPDATE`: propietario dueño de la propiedad (para aceptar/rechazar).

### `documentos`
- `SELECT/DELETE`: vinculado al dueño de la `solicitud` — inquilino o propietario de esa propiedad.
- Nunca exponer documentos entre usuarios no relacionados.

### `contratos`
- `SELECT`: inquilino o propietario del alquiler relacionado.
- `INSERT/UPDATE`: server-only (API route con service role key), nunca desde el browser.

### `pagos`
- `SELECT`: el pagador (`usuario_id = auth.uid()`) o el propietario receptor.
- `INSERT/UPDATE`: server-only via Stripe webhook handler.

---

## Storage (`documentos-solicitud` bucket)

El bucket es **privado** — nunca usar `getPublicUrl()` para documentos de inquilinos.

```typescript
// Upload de documento de inquilino
const { data, error } = await supabase.storage
  .from('documentos-solicitud')
  .upload(`${solicitudId}/${tipo}/${filename}`, file, {
    cacheControl: '3600',
    upsert: false,
  });

if (error) throw error;

// Signed URL para acceso privado (server-side)
const { data: urlData, error: urlError } = await supabase.storage
  .from('documentos-solicitud')
  .createSignedUrl(`${solicitudId}/${tipo}/${filename}`, 3600); // 1 hora de expiración

if (urlError) throw urlError;
const signedUrl = urlData.signedUrl;
```

Convención de path: `{solicitudId}/{tipo}/{filename}` — mantiene archivos scopeados por solicitud.

---

## Data Access Helpers

Preferir los helpers existentes sobre calls crudas a Supabase. Nunca escribir `.from()` crudos dentro de páginas o componentes.

```typescript
// CORRECTO — llamar al helper
import { getSolicitudesByInquilino } from '@/lib/solicitudes';
const solicitudes = await getSolicitudesByInquilino(userId);

// MAL — query cruda dentro de un componente de página
const { data } = await supabase.from('solicitudes').select('*').eq('inquilino_id', userId);
```

| Helper | Archivo | Funciones |
|--------|---------|-----------|
| Auth & user fetch | `src/lib/auth.ts` | `resolveUserRole()`, `getUserProfile()` |
| Solicitudes CRUD | `src/lib/solicitudes.ts` | `createSolicitud()`, `getSolicitudesByInquilino()`, `getSolicitudesByVivienda()`, `updateSolicitudEstado()` |
| Viviendas queries | `src/lib/viviendas.ts` | `getViviendas()`, `getViviendaById()`, `createVivienda()`, `updateVivienda()` |
| Contratos | `src/lib/contratos.ts` | `getContratoById()`, `getContratosBySolicitud()`, `updateContratoEstado()` |
| Pagos | `src/lib/pagos.ts` | `getPagosByContrato()`, `createPago()`, `updatePagoEstado()` |

Si una query no cabe en un helper existente, agregarla ahí — no dispersar calls crudas por componentes.

---

## Context Providers

- `InquilinoContext` (tenant layout) y `PropietarioContext` (landlord layout) cachean data de Supabase client-side.
- Llamar `recargar()` del context después de mutaciones en lugar de re-fetchear manualmente.
- Nunca compartir context entre grupos de roles — los scopes de datos son intencionalmente separados.

---

## Realtime — Usar con Criterio

Usar Supabase Realtime solo cuando las actualizaciones en vivo son genuinamente necesarias y el polling es insuficiente (ej: propietario viendo nuevas solicitudes, inquilino viendo estado de pago).

```typescript
// Client Component — subscripción realtime con cleanup
useEffect(() => {
  const channel = supabase
    .channel('solicitudes-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'solicitudes',
        filter: `inquilino_id=eq.${userId}`,
      },
      (payload) => {
        setSolicitud(payload.new as Solicitud);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // siempre limpiar
  };
}, [userId]);
```

Siempre limpiar las subscripciones en el return del `useEffect`. Siempre scopear filtros al usuario actual para respetar el intent de RLS.

---

## Error Handling — Siempre Explícito

Nunca ignorar el campo `error` de las respuestas de Supabase. Cada `{ data, error }` destructurado debe manejar el caso de error.

```typescript
// CORRECTO — error handling explícito
const { data: solicitudes, error } = await supabase
  .from('solicitudes')
  .select('id, estado, created_at, vivienda_id'); // nunca select('*') en tablas sensibles

if (error) {
  console.error('Error fetching solicitudes:', error.message);
  throw error; // o retornar respuesta de error apropiada
}

// MAL — ignorando el error
const { data: solicitudes } = await supabase.from('solicitudes').select('*');
// Si esto falla silenciosamente, solicitudes es null y el código downstream se rompe
```

En API routes, retornar respuestas de error estructuradas:

```typescript
if (error) {
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: 500 }
  );
}
```

---

## Decision Tree

```
¿Escribiendo una query de Supabase?
├── Archivo tiene 'use client' → import desde @/lib/supabase/client.ts
└── Server Component o API route → import desde @/lib/supabase/server.ts

¿Escribiendo una query en un componente o página?
└── STOP — mover la query al helper apropiado en src/lib/

¿Subiendo un documento?
├── Siempre bucket: 'documentos-solicitud'
└── Siempre signed URLs — nunca getPublicUrl() para docs de inquilinos

¿Verificando auth?
├── Client-side → usar onAuthStateChange en AuthContext (ya configurado)
├── Server Component → supabase.auth.getUser() con server client
└── API route → supabase.auth.getUser(), retornar 401 si no hay usuario

¿Necesitás realtime?
├── ¿Puede funcionar polling? → usar polling
└── Necesita live updates → canal de Supabase, siempre limpiar, siempre filtrar por usuario

¿Manejando una respuesta de Supabase?
└── Siempre destructurar { data, error } y manejar el error antes de usar data
```

---

## Guardrails

- **No** importar `src/lib/supabase/server.ts` en un Client Component — lanzará error en runtime.
- **No** usar la service role key client-side — bypasea RLS para todos los usuarios.
- **No** llamar `getPublicUrl()` en `documentos-solicitud` — el bucket es privado, usar signed URLs.
- **No** escribir queries `.from('tabla').select()` crudas directamente en páginas o componentes — usar helpers de `src/lib/`.
- **No** setear listeners `onAuthStateChange` fuera de `AuthContext` — causa listeners duplicados y memory leaks.
- **No** ignorar el campo `error` de las respuestas de Supabase — siempre verificar antes de usar `data`.
- **No** dejar subscripciones de Realtime sin cleanup en el return del `useEffect`.
- **No** agregar Realtime cuando polling o un fetch puntual son suficientes.
- **No** usar `select('*')` en tablas sensibles — enumerar columnas explícitamente.
- **No** olvidar `.eq('usuario_id', user.id)` en queries de pagos/documentos — confiar en RLS pero ser explícito en los helpers también.
- **No** usar la service role key client-side — debe vivir únicamente en API routes server-side via env vars **sin** el prefijo `NEXT_PUBLIC_`.
