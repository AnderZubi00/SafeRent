# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Orchestration

This project uses a skill-based lazy loading system. Before starting any non-trivial task,
read `AGENT.md` for routing rules, then load only the relevant skill from `.agent/skills/`:

| Domain | Skill file |
|---|---|
| UI / Visual Design | `.agent/skills/frontend-design/SKILL.md` |
| Animations (GSAP) | `.agent/skills/gsap-core/SKILL.md` + domain-specific `gsap-*` |
| UI/UX Design Intelligence | `ui-ux-pro-max` plugin (invoke via skill) |
| Component Generation | Magic MCP (`@21st-dev/magic`) |
| Next.js / React / Performance | `.agent/skills/vercel-react-best-practices/SKILL.md` |
| Architecture / Routes / Types | `.agent/skills/saferent-architecture/SKILL.md` |
| Supabase / RLS / Auth | `.agent/skills/supabase-saferent/SKILL.md` |
| Stripe / Payments / Escrow | `.agent/skills/stripe-connect-saferent/SKILL.md` |
| KYC / OCR / MRZ / NFC | `.agent/skills/kyc-ocr-saferent/SKILL.md` |
| Publicar wizard / Borradores / Draft flow | `.agent/skills/publicar-wizard/SKILL.md` |
| SDD (Spec-Driven Dev) | Global: `~/.claude/skills/sdd-*/SKILL.md` |

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
NEXT_PUBLIC_API_URL=              # NestJS backend URL (default: http://localhost:3001)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe publishable key for Elements
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
- **`PropietarioContext`** (`(propietario)/layout.tsx`) — `viviendas`, `solicitudes`, `pagos`, `solicitudesPendientes`, `recargar()`, `actualizarViviendaLocal()` (optimistic local update for single vivienda fields like `activa`).

### Location System

- **Static data**: `src/data/spain-locations.ts` — 50 Spanish provinces + cities per province. Helpers: `getAllProvincias()`, `getCiudadesByProvincia(code)`, `getProvinciaByCode(code)`, `getProvinciaByName(name)`.
- **Shared component**: `src/components/forms/LocationSelector.tsx` — cascading Province → City selects with Nominatim address validation. Used in publicar and editar forms.
- **Address validation**: `src/lib/address-validation.ts` — Nominatim (OpenStreetMap) geocoding, non-blocking (informational only).
- **DB field**: `provincia` column on `viviendas` table (NOT NULL, default ""). Backend accepts it in create/update/filter DTOs.

### Supabase Integration

Supabase is used ONLY for auth state and storage URLs. All business data queries go through NestJS backend.

### Backend API (NestJS)

All business data (viviendas, solicitudes, contratos, pagos) is fetched from the NestJS backend via `src/lib/api.ts`. Supabase is used ONLY for:
- **Auth state**: `onAuthStateChange` listener, session management
- **Storage URLs**: displaying uploaded images/documents
- **Token exchange**: Supabase token → POST /api/v1/auth/exchange → SafeRent JWT

- `src/lib/api.ts` — HTTP client to NestJS backend
- `src/lib/supabase/client.ts` — browser client (Client Components)
- `src/lib/supabase/server.ts` — server client with cookie management (Server Components / API routes)
- Data access helpers (call NestJS backend via api.ts): `src/lib/auth.ts`, `src/lib/solicitudes.ts`, `src/lib/viviendas.ts`, `src/lib/contratos.ts`, `src/lib/pagos.ts`
- Location data: `src/data/spain-locations.ts` — static province/city data for Spain
- Shared form components: `src/components/forms/LocationSelector.tsx` — cascading location selector
- Address validation: `src/lib/address-validation.ts` — Nominatim geocoding utility
- Real-time hooks: `src/hooks/useNotifications.ts` — Socket.io hook for WebSocket events (JWT auth, `/notifications` namespace)

**User roles:** `INQUILINO`, `PROPIETARIO`, `ADMINISTRADOR`

### Key Business Flow

1. Tenant submits application (`solicitudes`) with identity + temporality documents (uploaded to `documentos-solicitud` Supabase storage bucket)
2. Landlord accepts/rejects via `/propietario/solicitudes`
3. On acceptance, a PDF contract is auto-generated (`/api/contratos/generar`) and signed digitally via Signaturit (wrapped in `$transaction` — rollback if generation fails)
4. Payment processed via Stripe PaymentIntent (`/pagos/create-intent`) + Stripe Elements on frontend; webhook confirms payment
5. Real-time updates via Socket.io WebSocket (`/notifications` namespace) with polling fallback

### Component Conventions

- **UI primitives:** shadcn/ui components in `src/components/ui/` (Radix UI based)
- **Animations:** GSAP (primary, via `.agent/skills/gsap-*/`) + legacy Framer Motion wrappers in `src/components/motion/` (`MotionFadeInUp`, `MotionStagger`, `MotionCard`)
- **Icons:** Lucide React
- **Layout:** `Sidebar`, `TopBar`, `SidebarWrapper` in `src/components/layout/`

### Propietario Dashboard

- **Photo management**: Photos stored in Supabase Storage bucket `viviendas-fotos`, URLs in `viviendas.fotos[]` array in DB.
- **Publication flow**: The publish form (`/propietario/publicar`) is now a 5-phase persistent wizard with borrador (draft) support. Each phase saves progress to DB — users can exit and resume at any time. Phases: (1) Nombre del piso, (2) Verificación KYC, (3) Datos de la vivienda, (4) Precio y disponibilidad, (5) Verificación + Publicar.
- **Borradores pendientes**: Dashboard shows a "Borradores pendientes" section with phase indicators (`fase_actual`) so landlords can see incomplete drafts and resume them.
- **Draft schema fields**: `fase_actual Int @default(1)` and `es_borrador Boolean @default(false)` on the Vivienda model. `es_borrador` defaults to `false` to protect existing data.
- **Toggle Visible/Pausada**: `ToggleActivaButton` uses optimistic update via `actualizarViviendaLocal()` from PropietarioContext. Pausada viviendas show grayscale photo. Backend `findAll()` filters `es_borrador: false` AND `activa: true` for public search — pausada viviendas and borradores are hidden from tenants.
- **IMPORTANT**: `actualizarVivienda()` in `src/lib/viviendas.ts` only includes `fotos` in PATCH payload when `fotosNuevas` or `fotosExistentes` params are explicitly passed. This prevents accidental photo deletion on field-only updates (e.g., toggling `activa`).

### TypeScript Types

Shared interfaces in `src/types/index.ts`. Key types: `Usuario`, `Vivienda`, `Solicitud`, `Contrato`, `Pago`.
