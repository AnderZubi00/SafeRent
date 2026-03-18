# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Orchestration

This project uses a skill-based lazy loading system. Before starting any non-trivial task,
read `AGENT.md` for routing rules, then load only the relevant skill from `.agent/skills/`:

| Domain | Skill file |
|---|---|
| UI / Visual Design / Animations | `.agent/skills/frontend-design/SKILL.md` |
| Next.js / React / Performance / Deployment | `.agent/skills/vercel-react-best-practices/SKILL.md` |

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase + shadcn/ui

**Path alias:** `@/*` → `src/*`

### Route Structure

Uses Next.js route groups to separate role-based layouts:

| Group | Routes | Purpose |
|-------|--------|---------|
| `(auth)` | `/login` | Unified login/register |
| `(inquilino)` | `/inquilino/*`, `/checkout`, `/documentos`, `/pagos`, `/reservas` | Tenant dashboard |
| `(propietario)` | `/propietario/*`, `/contratos`, `/liquidaciones`, `/publicar`, `/solicitudes` | Landlord dashboard |
| `(admin)` | `/admin/*` | Admin panel |
| public | `/`, `/buscar`, `/vivienda/[id]` | Landing, search, property detail |

### State Management

Three React Context layers, each scoped to its route group:

- **`AuthContext`** (root layout) — current `usuario` with `rol`, `cargando`, `cerrarSesion`. Listens for Supabase auth state changes.
- **`InquilinoContext`** (`(inquilino)/layout.tsx`) — `solicitudes`, `documentos`, `pagos`, `recargar()`.
- **`PropietarioContext`** (`(propietario)/layout.tsx`) — `viviendas`, `solicitudes`, `pagos`, `solicitudesPendientes`, `recargar()`.

### Supabase Integration

- `src/lib/supabase/client.ts` — browser client (Client Components)
- `src/lib/supabase/server.ts` — server client with cookie management (Server Components / API routes)
- Data access helpers: `src/lib/auth.ts`, `src/lib/solicitudes.ts`, `src/lib/viviendas.ts`, `src/lib/contratos.ts`, `src/lib/pagos.ts`

**User roles:** `INQUILINO`, `PROPIETARIO`, `ADMINISTRADOR`

### Key Business Flow

1. Tenant submits application (`solicitudes`) with identity + temporality documents (uploaded to `documentos-solicitud` Supabase storage bucket)
2. Landlord accepts/rejects via `/propietario/solicitudes`
3. On acceptance, a PDF contract is auto-generated (`/api/contratos/generar`) and signed digitally via Signaturit
4. Payment processed via Stripe Connect (escrow model); released on stay confirmation

### Component Conventions

- **UI primitives:** shadcn/ui components in `src/components/ui/` (Radix UI based)
- **Animations:** Custom wrappers in `src/components/motion/` (Framer Motion: `MotionFadeInUp`, `MotionStagger`, `MotionCard`)
- **Icons:** Lucide React
- **Layout:** `Sidebar`, `TopBar`, `SidebarWrapper` in `src/components/layout/`

### TypeScript Types

Shared interfaces in `src/types/index.ts`. Key types: `Usuario`, `Vivienda`, `Solicitud`, `Contrato`, `Pago`.
