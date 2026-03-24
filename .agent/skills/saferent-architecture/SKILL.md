# Skill: SafeRent Architecture

> Cargar cuando: cambio arquitectural, nueva ruta, nuevo contexto, query a Supabase, layout de App Router, tipos compartidos, path alias.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 App Router |
| Runtime | React 19 |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind v4 (`@theme inline`) |
| Base de datos | Supabase (Postgres + RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Backend API | NestJS 11 (via src/lib/api.ts → NEXT_PUBLIC_API_URL) |
| Path alias | `@/*` → `src/*` (configurado en `tsconfig.json`) |

---

## Route Group Structure

```
src/app/
├── (auth)/                       # Login — sin layout autenticado
│   └── login/                    # Unified login/register
├── (inquilino)/                  # Dashboard y flujos del inquilino
│   ├── layout.tsx                # Wrappea InquilinoContext — requerido para todas las páginas de inquilino
│   └── inquilino/
│       ├── page.tsx              # Tenant dashboard
│       ├── checkout/             # Checkout flow
│       ├── documentos/           # Documents
│       ├── pagos/                # Payments history
│       └── reservas/             # Reservations
├── (propietario)/                # Dashboard y flujos del propietario
│   ├── layout.tsx                # Wrappea PropietarioContext — requerido para todas las páginas de propietario
│   └── propietario/
│       ├── page.tsx              # Landlord dashboard
│       ├── publicar/             # Publish new property
│       ├── solicitudes/          # Review applications
│       ├── contratos/            # Contracts
│       ├── liquidaciones/        # Settlement/payouts
│       └── vivienda/
│           └── [id]/
│               └── editar/       # Edit property
├── (admin)/                      # Panel de admin — solo rol ADMINISTRADOR
│   ├── layout.tsx
│   └── admin/
│       ├── page.tsx              # Admin dashboard
│       ├── verificacion/         # KYC verification review
│       └── disputas/             # Disputes
├── buscar/                       # Public property search
├── vivienda/
│   └── [id]/                     # Public property detail
├── api/                          # API routes (server-side only)
│   ├── contratos/generar/        # PDF generation
│   ├── email/                    # Email endpoints
│   └── kyc/                      # KYC endpoints
│       ├── analizar/             # KYC analysis
│       └── sesion/               # KYC session
└── page.tsx                      # Public landing
```

Todas las rutas nuevas DEBEN ir dentro del route group correcto. Nunca poner páginas de propietario dentro de `(inquilino)/` o viceversa.

---

## Three Context Layers

Hay exactamente 3 capas de context. No agregar más sin razón fuerte.

| Context | Archivo | Scope |
|---|---|---|
| `AuthContext` | `src/context/AuthContext.tsx` (root layout) | Todos los usuarios autenticados — user object, role, session |
| `InquilinoContext` | `src/app/(inquilino)/layout.tsx` | Data específica del inquilino (solicitudes, pagos, reservas) |
| `PropietarioContext` | `src/app/(propietario)/layout.tsx` | Data específica del propietario (viviendas, solicitudes activas) |

### Patrón de consumo

```typescript
// En cualquier página de (inquilino)
import { useInquilinoContext } from '@/context/InquilinoContext';
const { solicitudes, viviendas, recargar } = useInquilinoContext();

// En cualquier página de (propietario)
import { usePropietarioContext } from '@/context/PropietarioContext';
const { viviendas, solicitudesPendientes, recargar } = usePropietarioContext();

// En cualquier lugar — auth y rol
import { useAuthContext } from '@/context/AuthContext';
const { user, role, session } = useAuthContext();
```

Llamar `recargar()` del context después de mutaciones — no re-fetchear manualmente. Nunca compartir context entre grupos de roles.

---

## Supabase Client (Auth & Storage Only)

Supabase **NO** se usa para queries de datos de negocio — solo para auth state y storage URLs. Todos los datos de negocio se obtienen del backend NestJS via `src/lib/api.ts`.

Esta es la regla más crítica — el cliente equivocado causa bugs de auth o expone secrets del servidor.

```
¿El archivo tiene 'use client'?
  SÍ → import desde '@/lib/supabase/client.ts'
  NO → import desde '@/lib/supabase/server.ts'
       (Server Components, API route handlers, server actions)
```

```typescript
// Client Component ('use client')
import { supabase } from '@/lib/supabase/client';

// Server Component o API route (sin 'use client')
import { createSupabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
const supabase = createSupabaseServer(cookies());
```

Nunca importar `server.ts` en un Client Component — referencia `next/headers` que no está disponible client-side y lanza error en runtime.

---

## Data Helpers

Los data helpers en `src/lib/` llaman al backend NestJS via `api.ts`. La excepción es `src/lib/supabase/` que se usa SOLO para auth state y storage URLs. Llamar estos helpers desde páginas y contexts — nunca escribir queries crudas dentro de archivos de componentes o páginas.

| Archivo helper | Responsabilidad |
|---|---|
| `src/lib/auth.ts` | Lookup de usuario, resolución de rol, helpers de sesión |
| `src/lib/solicitudes.ts` | CRUD para la tabla `solicitudes` |
| `src/lib/viviendas.ts` | CRUD para la tabla `viviendas` |
| `src/lib/contratos.ts` | Fetch de contratos, actualizaciones de estado |
| `src/lib/pagos.ts` | Registros de pagos, referencias de Stripe |

```typescript
// CORRECTO — llamar el helper
import { getSolicitudesByInquilino } from '@/lib/solicitudes';
const solicitudes = await getSolicitudesByInquilino(userId);

// MAL — query cruda en un componente de página
const { data } = await supabase.from('solicitudes').select('*').eq('inquilino_id', userId);
```

---

## Backend Communication

El frontend se comunica con el backend NestJS a través de `src/lib/api.ts`. **NO** accede a datos directamente desde Supabase — Supabase se usa SOLO para Auth state y Storage URLs.

### `src/lib/api.ts` — HTTP Client

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
```

- Base URL configurable via `NEXT_PUBLIC_API_URL`
- JWT almacenado en `localStorage` (key: `saferent_jwt`)
- Token inyectado automáticamente en header `Authorization: Bearer <jwt>`
- Métodos: `api.get()`, `api.post()`, `api.patch()`, `api.delete()`

### Flujo de autenticación

1. Usuario inicia sesión via Supabase Auth (client-side)
2. `AuthContext` llama a `POST /api/v1/auth/exchange` con el token de Supabase
3. Backend verifica token → devuelve JWT de SafeRent
4. JWT se almacena con `setBackendToken(token)`
5. Todas las llamadas subsiguientes via `api.*` incluyen el JWT automáticamente

### Regla crítica

```
¿Necesitas datos del usuario/viviendas/solicitudes/pagos?
  → Usa api.get/post/patch desde src/lib/api.ts
  → NUNCA supabase.from('tabla').select() para datos de negocio

¿Necesitas auth state o escuchar cambios de sesión?
  → Usa src/lib/supabase/client.ts (onAuthStateChange)

¿Necesitas mostrar una imagen de Storage?
  → Usa URL de Supabase Storage directamente
```

---

## Shared Types

Todos los tipos compartidos viven en `src/types/index.ts`. Siempre importar desde ahí — nunca redefinir localmente.

```typescript
import type { Usuario, Vivienda, Solicitud, Contrato, Pago } from '@/types';
```

| Tipo | Descripción |
|---|---|
| `Usuario` | Usuario autenticado con rol y perfil |
| `Vivienda` | Listing de propiedad de alquiler |
| `Solicitud` | Solicitud de alquiler del inquilino |
| `Contrato` | Contrato de alquiler firmado |
| `Pago` | Registro de pago vinculado a Stripe |

```typescript
// src/types/index.ts
type UserRole = 'INQUILINO' | 'PROPIETARIO' | 'ADMINISTRADOR';
```

Nunca hardcodear strings de rol — siempre usar el union type `UserRole` desde `src/types/index.ts`.

---

## Path Alias

Usar siempre el alias `@/*` — nunca usar paths relativos que suban por encima de `src/`.

```typescript
// Correcto
import { getSolicitudes } from '@/lib/solicitudes';
import type { Solicitud } from '@/types';
import { Button } from '@/components/ui/button';

// MAL
import { getSolicitudes } from '../../../lib/solicitudes';
```

`@/*` mapea a `src/*` según lo configurado en `tsconfig.json`.

---

## Role-Based Guard Pattern

```typescript
// Guard de rol en una página
const { role } = useAuthContext();

if (role !== 'ADMINISTRADOR') {
  redirect('/unauthorized');
}
```

El enforcement de route groups vive en `src/middleware.ts` — no duplicar checks de rol en cada página individual.

---

## Decision Tree

```
¿Agregando una nueva página?
├── Para inquilinos → colocar dentro de src/app/(inquilino)/
│   └── Debe estar dentro del scope de (inquilino)/layout.tsx para InquilinoContext
├── Para propietarios → colocar dentro de src/app/(propietario)/
│   └── Debe estar dentro del scope de (propietario)/layout.tsx para PropietarioContext
├── Para admins → colocar dentro de src/app/(admin)/
│   └── Guardar con check role === 'ADMINISTRADOR'
└── Pública/auth → colocar en src/app/(auth)/ o src/app/

¿Escribiendo una query de Supabase?
├── Archivo 'use client' → usar src/lib/supabase/client.ts
├── Server Component o API route → usar src/lib/supabase/server.ts
└── Siempre wrappear en un helper en src/lib/ — nunca quedar raw en componentes

¿Importando un tipo?
└── Siempre desde src/types/index.ts

¿Accediendo a data del contexto?
├── Auth/role → useAuthContext()
├── Data de inquilino → useInquilinoContext()
└── Data de propietario → usePropietarioContext()
```

---

## Guardrails

- **No** poner un componente `'use client'` en un Server Component sin extraerlo en un archivo separado.
- **No** importar el client de Supabase `server.ts` en un Client Component — fallará en runtime.
- **No** escribir queries `.from('tabla').select()` crudas directamente en archivos de páginas o componentes — usar helpers de `src/lib/`.
- **No** hardcodear strings de rol — siempre usar el union type `UserRole` desde `src/types/index.ts`.
- **No** crear una cuarta capa de context sin acuerdo del equipo.
- **No** usar paths relativos que crucen los límites de `src/` — usar el alias `@/*`.
- **No** exponer rutas de admin a roles `INQUILINO` o `PROPIETARIO`.
- **No** poner páginas de un role group dentro del route group de otro.
