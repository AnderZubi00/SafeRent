# SafeRent Business Rules

> Cargar cuando: modificaciones a solicitudes, contratos, pagos, guards de rol, flujo inquilino→propietario→contrato→pago, upload de documentos, integración Signaturit, lógica Stripe.

---

## Core Lifecycle (State Machine)

```
TENANT SUBMITS SOLICITUD
  └── /inquilino/solicitudes/nueva
  └── Uploads docs → bucket: documentos-solicitud
  └── solicitudes.estado = 'PENDIENTE'
          ↓
LANDLORD REVIEWS → /propietario/solicitudes
          ↓
  ┌───────┴────────┐
ACEPTADA        RECHAZADA
  │                  └── notify tenant via /api/email
  │                  └── vivienda queda disponible de nuevo
  ↓
CONTRACT GENERATION (automático)
  └── POST /api/contratos/generar
  └── contratos.estado = 'BORRADOR' → 'ENVIADO' (Signaturit)
          ↓
  ┌───────┴────────┐
FIRMADO         CANCELADO (irreversible)
  │
  ↓
PAYMENT — Stripe Connect
  └── pagos.estado = 'PENDIENTE' → 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO'
```

**Nunca saltarse estados.** Un contrato no puede ser FIRMADO sin pasar por ENVIADO. Un pago no puede ser COMPLETADO sin un contrato FIRMADO.

---

## Solicitudes

- Un inquilino solo puede tener **una solicitud activa** (`PENDIENTE` o `ACEPTADA`) por vivienda a la vez.
- Los documentos (`documentos`) adjuntos a una solicitud son requeridos antes de que el propietario pueda aceptar: documento de identidad + documento de temporalidad (guardados en el bucket `documentos-solicitud`).
- Solo el propietario dueño de la vivienda puede aceptar o rechazar una solicitud.
- Al **aceptar**: disparar inmediatamente la generación del contrato (`/api/contratos/generar`). No dejar el sistema en estado aceptada-sin-contrato.
- Al **rechazar**: notificar al inquilino via email (`/api/email`). La vivienda vuelve a estar disponible.

### Document Upload

```typescript
// Siempre el bucket correcto — nunca otro bucket para docs de inquilinos
const bucket = 'documentos-solicitud';

const { data, error } = await supabase.storage
  .from(bucket)
  .upload(`${solicitudId}/${tipo}/${fileName}`, file);

if (error) throw error; // siempre manejar errores explícitamente
```

Tipos de documentos esperados:
- Documento de identidad (DNI, pasaporte)
- Documento de temporalidad (contrato laboral, nómina, etc.)

---

## Contratos

- El PDF del contrato es auto-generado server-side via `/api/contratos/generar` usando `@react-pdf/renderer`.
- Después de la generación del PDF, enviarlo inmediatamente a Signaturit para firma digital — no exponer PDFs sin firmar a los usuarios.
- El `signaturit_id` guardado en el contrato es la fuente de verdad para el estado de la firma.
- Nunca permitir que un contrato transite de CANCELADO a cualquier otro estado.
- Un contrato es FIRMADO solo después de que el webhook de Signaturit confirma que ambas partes firmaron.

### Contract Generation API

```typescript
// Disparar generación de contrato después de aceptar solicitud
const response = await fetch('/api/contratos/generar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ solicitudId }),
});

if (!response.ok) {
  // Manejar error — no asumir éxito
  throw new Error('Error generando contrato');
}
```

La API route en `src/app/api/contratos/generar/route.ts` maneja:
1. Fetch de solicitud + vivienda + datos del inquilino
2. Generación del PDF
3. Envío a Signaturit
4. Creación del registro `contratos` en Supabase

---

## Pagos

```
Inquilino paga → fondos retenidos en Stripe escrow
                        ↓
                Confirmación del inicio del stay (ambas partes)
                        ↓
                Fondos liberados al propietario
```

- El primer pago (depósito + primer mes) se cobra en checkout (`/checkout`) **antes** de que el contrato sea marcado FIRMADO.
- Los fondos se retienen en Stripe escrow; no liberar al propietario hasta que el inquilino confirme el inicio del stay.
- Los montos de pago siempre se calculan server-side desde `viviendas.precio` y `viviendas.deposito` — nunca confiar en montos provistos por el cliente.
- Un reembolso solo es válido si la solicitud fue rechazada después del pago o el contrato fue cancelado dentro del período de cooling-off.
- Stripe references se guardan en `pagos.stripe_payment_intent_id` y `pagos.stripe_transfer_id`.

Nunca implementar transferencias directas de Stripe a cuentas de propietarios — todos los pagos deben fluir por escrow.

---

## Estado de Solicitud — Valores Exactos

```
PENDIENTE → ACEPTADA → (contrato generado automáticamente)
          ↘ RECHAZADA
```

| Estado | Significado |
|---|---|
| `'PENDIENTE'` | Enviada, esperando revisión del propietario |
| `'ACEPTADA'` | Propietario aprobó — generación de contrato disparada |
| `'RECHAZADA'` | Propietario rechazó — inquilino notificado |

Siempre usar estos valores exactos como strings — nunca inventar nuevos estados.

---

## Role Permissions Summary

| Acción | INQUILINO | PROPIETARIO | ADMINISTRADOR |
|--------|-----------|-------------|---------------|
| Browse viviendas | ✅ | ✅ | ✅ |
| Submit solicitud | ✅ | ❌ | ❌ |
| Accept/reject solicitud | ❌ | ✅ (propias) | ✅ |
| Generate contrato | ❌ | ❌ | Server only |
| Sign contrato | ✅ (inquilino) | ✅ (propietario) | ❌ |
| Initiate payment | ✅ | ❌ | ❌ |
| Release payout | ❌ | ❌ | Server (webhook) |
| Publish vivienda | ❌ | ✅ | ✅ |
| Audit any user | ❌ | ❌ | ✅ |

### Por rol en detalle

**INQUILINO:**
- Enviar y ver propias solicitudes
- Ver propios documentos en `documentos-solicitud`
- Ver propios pagos y reservas
- Firmar contratos via link de Signaturit

**PROPIETARIO:**
- Crear y gestionar viviendas
- Revisar y aceptar/rechazar solicitudes de sus viviendas
- Ver contratos de sus propiedades
- Ver liquidaciones (resúmenes de pago)

**ADMINISTRADOR:**
- Acceso completo lectura/escritura via `/admin/*`
- Puede impersonar o auditar cualquier flujo de usuario
- Puede gestionar configuración de la plataforma

---

## Route Group Boundaries

- `/inquilino/*` — solo inquilinos; redirect a `/login` si no es INQUILINO.
- `/propietario/*` — solo propietarios; redirect a `/login` si no es PROPIETARIO.
- `/admin/*` — solo admins; redirect a `/login` si no es ADMINISTRADOR.
- El middleware (`src/middleware.ts`) es el único punto de enforcement — no duplicar checks de rol en cada página.

La lógica de redirect por rol vive en `src/context/AuthContext.tsx`:

```typescript
const { role } = await resolveUserRole(user.id); // desde src/lib/auth.ts

if (role === 'INQUILINO') router.push('/inquilino/dashboard');
else if (role === 'PROPIETARIO') router.push('/propietario/dashboard');
else if (role === 'ADMINISTRADOR') router.push('/admin/dashboard');
```

---

## Email Notifications

Requeridas en estos eventos del lifecycle (via `/api/email`):

| Evento | Destinatario |
|-------|-----------|
| Solicitud enviada | Propietario |
| Solicitud aceptada | Inquilino |
| Solicitud rechazada | Inquilino |
| Contrato enviado a firmar | Ambas partes |
| Contrato firmado | Ambas partes |
| Pago confirmado | Ambas partes |
| Pago fallido | Inquilino |

---

## Decision Tree

```
¿Trabajando en el flujo de solicitud?
├── Inquilino enviando → /inquilino/solicitudes/nueva
│   └── Docs van al bucket: documentos-solicitud
├── Propietario revisando → /propietario/solicitudes
│   ├── Aceptar: update estado a 'ACEPTADA' + trigger POST /api/contratos/generar
│   └── Rechazar: update estado a 'RECHAZADA' + notificar via /api/email
└── Check de estado: PENDIENTE → ACEPTADA o RECHAZADA únicamente

¿Trabajando en contratos?
├── Generación → POST /api/contratos/generar (server-side only)
├── Firma → integración Signaturit
└── Nunca generar PDFs directamente en client components

¿Trabajando en pagos?
├── Siempre Stripe Connect
├── Siempre modelo escrow — nunca transferencia directa
└── Liberar solo en confirmación del stay

¿Trabajando en guards de rol?
├── INQUILINO → solo puede acceder a /inquilino/*
├── PROPIETARIO → solo puede acceder a /propietario/*
└── ADMINISTRADOR → /admin/* + acceso de auditoría
```

---

## Invariants to Never Break

1. Una vivienda con `estado = 'RENTADA'` debe siempre tener exactamente un alquiler `ACTIVE`.
2. Un contrato debe siempre referenciar una solicitud válida que esté `ACEPTADA`.
3. Un pago debe siempre referenciar un contrato válido que esté `FIRMADO` (excepto el pago inicial de checkout que precede a la firma).
4. Eliminar una vivienda no está permitido si tiene solicitudes `PENDIENTE` o `ACEPTADA`.
5. Un contrato CANCELADO nunca puede transitar a otro estado.
6. Nunca disparar generación de contrato antes de que el estado de la solicitud sea `'ACEPTADA'`.
7. Nunca transferir fondos de Stripe directamente a cuentas de propietarios — siempre escrow, liberar en confirmación del stay.

---

## Guardrails

- **No** exponer rutas `/admin/*` a roles `INQUILINO` o `PROPIETARIO`.
- **No** disparar generación de contrato antes de que el estado de la solicitud sea `'ACEPTADA'`.
- **No** transferir fondos de Stripe directamente al propietario — siempre escrow.
- **No** guardar documentos de inquilinos en un bucket que no sea `documentos-solicitud`.
- **No** escribir valores de estado de solicitud distintos de `'PENDIENTE'`, `'ACEPTADA'`, `'RECHAZADA'`.
- **No** duplicar lógica de redirect por rol — vive únicamente en `AuthContext`.
- **No** llamar a `/api/contratos/generar` desde código client-side sin un server action intermediario.
- **No** permitir que un inquilino vea los documentos o solicitudes de otro inquilino — RLS debe enforcearlo.
