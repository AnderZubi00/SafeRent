# Skill: UI / Frontend Design

> Cargar cuando: UI, componentes, diseño visual, animaciones, Magic UI, shadcn/ui, nuevas páginas/pantallas, layout, colores, tipografía, iconos.

---

## Stack de UI

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 App Router |
| Runtime | React 19 |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind v4 |
| Componentes base | shadcn/ui (Radix UI) |
| Animaciones | Framer Motion (via `src/components/motion/` wrappers) |
| UI decorativa | Magic UI (via `src/components/magicui/`) |
| Iconos | Lucide React |

---

## Paleta de Colores

```css
/* src/app/globals.css — @theme inline */
@import "tailwindcss";

@theme inline {
  --color-primary:    oklch(55% 0.2 250);   /* indigo-600 — acciones principales, botones CTA */
  --color-background: oklch(98% 0 0);       /* slate-950 — fondo oscuro, hero sections */
  --color-success:    oklch(72% 0.18 160);  /* emerald-500 — confirmaciones, estados positivos */
  --font-sans: 'Inter', sans-serif;
}
```

Usar siempre las variables CSS del tema (`--color-*`) en lugar de valores hardcoded. No crear `tailwind.config.js` — Tailwind v4 usa `@theme inline` en `globals.css`.

---

## Sistema de Componentes

### UI Primitives — shadcn/ui (`src/components/ui/`)

Radix UI como base, estilizado con Tailwind. Importar siempre desde `@/components/ui/`, nunca Radix directamente.

Primitivos disponibles:

- `Button`, `Input`, `Label`, `Textarea`, `Select`
- `Dialog`, `Sheet`, `Drawer`, `Popover`, `Tooltip`
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Badge`, `Avatar`, `Separator`, `Skeleton`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
```

Siempre usar estos primitivos antes que `<div>` custom o HTML crudo.

### Animaciones — Framer Motion (`src/components/motion/`)

NO importar Framer Motion directamente en páginas o features. Usar los wrappers pre-construidos:

| Wrapper | Caso de uso |
|---|---|
| `MotionFadeInUp` | Fade-in + slide up al montar — elemento único |
| `MotionStagger` | Animación escalonada de hijos — wrappear una lista |
| `MotionCard` | Card con hover lift + scale sutil |

```typescript
import { MotionFadeInUp } from "@/components/motion/MotionFadeInUp";
import { MotionStagger } from "@/components/motion/MotionStagger";
import { MotionCard } from "@/components/motion/MotionCard";

// Elemento único
<MotionFadeInUp>
  <p>Aparece con fade up al montar</p>
</MotionFadeInUp>

// Lista escalonada
<MotionStagger>
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</MotionStagger>

// Card con hover
<MotionCard>
  <CardContent>...</CardContent>
</MotionCard>
```

### Magic UI (`src/components/magicui/`)

Componentes decorativos y de marketing. Usar en landing pages, hero sections, CTAs y stat displays.

| Componente | Caso de uso |
|---|---|
| `ShimmerButton` | CTA principal con animación shimmer ("Buscar", "Crear cuenta gratis") |
| `AnimatedShinyText` | Textos con efecto shiny en hero o accent text |
| `Particles` | Fondo de partículas en hero/landing |
| `Marquee` | Carrusel de propiedades / logos |
| `MagicCard` | Stat cards en dashboards (spotlight hover) |
| `NumberTicker` | Contadores animados en stat cards |
| `BorderBeam` | Borde animado en cards destacadas |
| `BlurFade` | Aparición con blur en secciones |
| `AnimatedGradientText` | Texto con gradiente animado |
| `BentoGrid` / `BentoCard` | Grid de features en landing |

```typescript
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { MagicCard } from '@/components/magicui/magic-card';

<ShimmerButton>Solicitar vivienda</ShimmerButton>
<NumberTicker value={1240} />
```

### Layout (`src/components/layout/`)

| Componente | Archivo | Rol |
|---|---|---|
| `Sidebar` | `src/components/layout/Sidebar.tsx` | Nav izquierdo con links por rol |
| `TopBar` | `src/components/layout/TopBar.tsx` | Header con avatar de usuario, notificaciones |
| `SidebarWrapper` | `src/components/layout/SidebarWrapper.tsx` | Flex container que contiene Sidebar + contenido principal |

No recrear la estructura de layout dentro de páginas individuales — usar los `layout.tsx` del route group.

### Iconos — Lucide React

```typescript
import { Home, User, FileText, CreditCard, Shield, Bell, ChevronRight } from "lucide-react";
```

Tamaños estándar:
- Inline con texto: `h-4 w-4`
- Nav items de sidebar: `h-5 w-5`
- Hero / display grande: `h-8 w-8` o `h-10 w-10`

No instalar ni usar Heroicons, Phosphor, React Icons u otras librerías de iconos.

---

## Estructura de Página Estándar (App Router)

```typescript
// app/(grupo)/ruta/page.tsx
export default function MiPagina() {
  return (
    <SidebarWrapper>
      <div className="p-6 space-y-6">
        <MotionFadeInUp>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Título</h1>
            <p className="text-slate-500 text-sm mt-1">Descripción</p>
          </div>
        </MotionFadeInUp>
        <MotionStagger>
          {/* Cards, tablas, formularios */}
        </MotionStagger>
      </div>
    </SidebarWrapper>
  );
}
```

---

## Convenciones de Diseño

| Elemento | Clases |
|---|---|
| Título de página | `text-2xl font-bold text-slate-900` |
| Subtítulo | `text-sm text-slate-500` |
| Cuerpo | `text-slate-700` |
| Label de formulario | `text-sm font-medium text-slate-700` |
| Card padding | `p-6` |
| Gap entre lista items | `gap-4` |
| Border radius card | `rounded-xl` |
| Border radius input | `rounded-lg` |

### Badge de rol

```typescript
const colorPorRol = {
  INQUILINO:      "bg-emerald-100 text-emerald-700",
  PROPIETARIO:    "bg-indigo-100 text-indigo-700",
  ADMINISTRADOR:  "bg-rose-100 text-rose-700",
};
```

### Estados de UI

```typescript
// Skeleton
<div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />

// Error
<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
  {mensaje}
</div>

// Empty state
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icono className="mb-3 h-10 w-10 text-slate-300" />
  <p className="text-slate-500">Sin datos todavía</p>
</div>
```

---

## Decision Tree

```
¿Necesitás un elemento de UI?
├── Button, input, card, table, dialog, badge → shadcn/ui desde @/components/ui/
└── No existe → revisar si hay un componente custom en src/components/

¿Necesitás animación?
├── Fade in / slide up → MotionFadeInUp
├── Lista escalonada → MotionStagger
├── Card con hover → MotionCard
└── Otro → revisar src/components/motion/ antes de usar Framer Motion directo

¿Necesitás un componente decorativo/marketing?
├── CTA button → ShimmerButton
├── Texto hero → AnimatedShinyText
├── Stats → NumberTicker
├── Fondo → Particles
└── Card premium → MagicCard

¿Necesitás un ícono?
└── Siempre Lucide React — importar por nombre desde 'lucide-react'

¿Necesitás configurar un color o token de tema?
└── Agregar al bloque @theme inline en src/app/globals.css — NO en un config file

¿Dónde va la animación?
├── Landing page → Magic UI
└── Dashboards → Motion wrappers
```

---

## Guardrails

- **No** importar Radix UI directamente — siempre a través de shadcn/ui.
- **No** importar `framer-motion` directamente — usar wrappers de `src/components/motion/`.
- **No** instalar nuevas librerías de animación — usar `src/components/motion/` o `src/components/magicui/`.
- **No** crear `tailwind.config.js` — Tailwind v4 usa `@theme inline` en `globals.css`.
- **No** usar Heroicons, Phosphor ni otras librerías de iconos — solo Lucide React.
- **No** recrear la estructura Sidebar/TopBar dentro de páginas individuales.
- **No** usar `<div className="flex ...">` como card — usar `Card` de shadcn/ui.
- **No** agregar animaciones client-side a Server Components — extraer en un wrapper `'use client'`.
- **No** mezclar data de roles distintos en un mismo componente.
- **No** usar `shadow-xl` en listas — máximo `shadow-sm` en cards.
