---
name: publicar-wizard
description: >
  5-phase persistent wizard for vivienda publication with borrador (draft) support,
  KYC integration, nota simple upload.
  Trigger: When modifying the publicar flow, borradores, wizard phases, draft lifecycle,
  or publication validation.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0.0"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Agent
---

## When to Use

- Modifying the 5-phase publicar wizard flow
- Working with borradores (drafts) lifecycle
- Changing publication validation rules
- Modifying KYC integration in wizard
- Updating phase-specific forms or DTOs
- Working with nota simple upload
- Modifying dashboard borrador indicators

## Critical Patterns

### Phase Flow

| Phase | Name | Endpoint | Key Fields |
|-------|------|----------|-----------|
| 1 | Nombre del piso | POST /viviendas/borrador | titulo |
| 2 | Verificación KYC | PATCH /kyc/completar-propietario | nombre, apellidos, dni_nie, tipo_documento |
| 3 | Datos de la vivienda | PATCH /viviendas/:id/fase/3 | descripcion, fotos, direccion, provincia, ciudad, habitaciones, banos, m2, num_registro, motivos |
| 4 | Precio y disponibilidad | PATCH /viviendas/:id/fase/4 | precio_mes, fianza_importe, disponible_desde, estancia_minima, estancia_maxima |
| 5 | Verificación + Publicar | POST /viviendas/:id/publicar | nota_simple_url (optional) |

### Borrador Lifecycle

- Created at Phase 1 with `es_borrador: true, activa: false, fase_actual: 1`
- Each phase saves to DB — user can exit and resume
- `fase_actual` NEVER regresses (uses `Math.max`)
- Publish validates ALL fields, returns `{ camposFaltantes }` on 400
- On publish: `es_borrador: false, activa: true, fase_actual: 5`

### Route Ordering (NestJS)

`/viviendas/borradores` MUST be declared BEFORE `/viviendas/:id` in controller.
NestJS matches routes top-down — if `:id` comes first, "borradores" is interpreted as an ID param.

### KYC in Wizard

- If `verificado_kyc === true`: show summary card, allow continue or redo
- If `verificado_kyc === false`: render KycMobilePanel, call `completarPropietario` on completion

### Schema Fields

- **Vivienda**: `fase_actual Int @default(1)`, `es_borrador Boolean @default(false)`
- **Usuario**: `nombre_kyc String?`, `apellidos_kyc String?`, `tipo_documento String?`
- `es_borrador` defaults to `false` (NOT `true`) — protects existing data

### Public Search Isolation

`findAll()` filters `es_borrador: false` AND `activa: true` — borradores are never visible to tenants.

## Key Files

### Backend

- `SafeRent_backend/prisma/schema.prisma` — Vivienda + Usuario models
- `SafeRent_backend/src/viviendas/viviendas.service.ts` — createBorrador, updateFase, findBorradores, publicar, deleteBorrador
- `SafeRent_backend/src/viviendas/viviendas.controller.ts` — 6 new endpoints
- `SafeRent_backend/src/viviendas/dto/` — create-borrador, update-fase3/4/5 DTOs
- `SafeRent_backend/src/kyc/kyc.service.ts` — completarPropietario
- `SafeRent_backend/src/auth/auth.service.ts` — KYC fields in response

### Frontend

- `SafeRent/src/app/(propietario)/propietario/publicar/page.tsx` — wizard container
- `SafeRent/src/app/(propietario)/propietario/publicar/_components/` — 6 components (stepper + 5 phases)
- `SafeRent/src/lib/viviendas.ts` — crearBorrador, guardarFase, obtenerBorradores, publicarViviendaFinal, obtenerUrlNotaSimple, eliminarBorrador
- `SafeRent/src/lib/kyc.ts` — completarKycPropietario
- `SafeRent/src/app/(propietario)/propietario/page.tsx` — dashboard borradores section
