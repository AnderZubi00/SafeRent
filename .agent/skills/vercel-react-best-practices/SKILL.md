# Skill: Next.js / React / Performance / Deployment

> Cargar cuando: componentes React, páginas Next.js, App Router, Server Components, data fetching, API routes, bundle optimization, Vercel deployment, hidratación, caching, Supabase queries.

---

## Regla Fundamental: Server vs Client Components

```
Server Component (default) → sin "use client"
Client Component           → necesita "use client" + hooks / estado / eventos del DOM
```

**Decidir ANTES de escribir el componente:**

| Necesita... | Tipo |
|---|---|
| `useState`, `useEffect`, `useContext` | Client |
| Event handlers (`onClick`, `onChange`) | Client |
| Browser APIs | Client |
| Fetch de datos desde Supabase | Server (preferido) |
| Acceso a cookies / headers | Server |
| Solo renderizar HTML estático | Server |

**Regla de oro:** Empujar `"use client"` lo más abajo posible en el árbol — solo en las hojas que realmente lo necesitan.

---

## Data Fetching con Supabase

### Server Component (recomendado para listas/detalle)

```typescript
// app/(propietario)/viviendas/page.tsx
import { createServerClient } from "@/lib/supabase/server";

export default async function ViviendasPage() {
  const supabase = await createServerClient();
  const { data: viviendas } = await supabase
    .from("viviendas")
    .select("*")
    .order("created_at", { ascending: false });

  return <ListaViviendas viviendas={viviendas ?? []} />;
}
```

### Client Component (para data que cambia con interacción del usuario)

```typescript
"use client";
import { useContext } from "react";
import { PropietarioContext } from "@/context/PropietarioContext";

export function ResumenPropietario() {
  const { viviendas, cargando } = useContext(PropietarioContext);
  // ...
}
```

**Preferir Context** para data que ya está cargada en el layout — evitar re-fetches duplicados.

---

## API Routes (Route Handlers)

```typescript
// app/api/contratos/generar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  // lógica...
  return NextResponse.json({ ok: true });
}
```

**Reglas:**
- Siempre verificar auth al inicio del handler.
- Nunca usar `cookies()` directamente — usar `createServerClient()` de `@/lib/supabase/server`.
- Retornar `NextResponse.json()` con status codes explícitos.

---

## Supabase Clients

```typescript
// Client Components / hooks
import { createBrowserClient } from "@/lib/supabase/client";
const supabase = createBrowserClient();

// Server Components / Route Handlers
import { createServerClient } from "@/lib/supabase/server";
const supabase = await createServerClient();
```

**Nunca** crear clientes Supabase inline con `createClient(url, key)` — siempre usar los helpers de `src/lib/supabase/`.

---

## Helpers de Data (`src/lib/`)

Funciones ya implementadas — usar antes de escribir queries manuales:

```typescript
import { obtenerSolicitudesInquilino } from "@/lib/solicitudes";
import { obtenerViviendas } from "@/lib/viviendas";
import { obtenerContrato } from "@/lib/contratos";
import { obtenerPagos } from "@/lib/pagos";
import { getUsuarioActual } from "@/lib/auth";
```

---

## Layouts y Route Groups

```
app/
  (auth)/layout.tsx          -- sin Sidebar, solo contenedor centrado
  (inquilino)/layout.tsx     -- InquilinoContext + SidebarWrapper
  (propietario)/layout.tsx   -- PropietarioContext + SidebarWrapper
  (admin)/layout.tsx         -- solo admin, verificar rol ADMINISTRADOR
  layout.tsx                 -- AuthContext, fuentes, globals.css
```

**Regla:** Nunca agregar lógica de negocio en los layouts — solo providers y estructura visual.

---

## Metadata y SEO

```typescript
// app/(public)/vivienda/[id]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const vivienda = await fetchVivienda(params.id);
  return {
    title: `${vivienda.titulo} — SafeRent`,
    description: vivienda.descripcion,
  };
}
```

---

## Performance — Reglas Clave

1. **No usar `useEffect` para fetch inicial** — mover el fetch al Server Component padre y pasar como prop.
2. **Imágenes:** usar siempre `next/image` con `width` y `height` explícitos o `fill` + contenedor con posición relativa.
3. **Fonts:** cargar en `app/layout.tsx` con `next/font/google` — nunca `<link>` en `<head>`.
4. **Loading states:** usar `loading.tsx` de Next.js o Suspense en lugar de estados locales globales.
5. **Error boundaries:** usar `error.tsx` por route segment — no try/catch globales en componentes.

```typescript
// app/(inquilino)/documentos/loading.tsx
export default function Loading() {
  return <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />;
}
```

---

## Vercel Deployment

- Variables de entorno en Vercel deben coincidir con `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Edge Runtime **no soportado** con Supabase SSR auth — usar Node.js runtime (default).
- Webhooks de Stripe deben apuntar a `https://[dominio]/api/webhooks/stripe`.

---

## Guardrails

- **No** usar `localStorage` para persistir auth — Supabase maneja cookies SSR automáticamente.
- **No** exponer `SUPABASE_SERVICE_ROLE_KEY` en Client Components ni con prefijo `NEXT_PUBLIC_`.
- **No** hacer fetch en `useEffect` para data inicial — usar Server Components.
- **No** mezclar datos de roles distintos en una misma query — siempre filtrar por `usuario_id` o `rol`.
- Verificar RLS en Supabase antes de asumir que los datos están aislados por rol.
