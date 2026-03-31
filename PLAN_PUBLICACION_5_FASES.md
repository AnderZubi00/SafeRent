# Prompt para Claude Code: Nuevo flujo de publicación de vivienda en 5 fases

## Instrucción principal

Necesito rehacer el flujo de publicación de vivienda (`/propietario/publicar`) de 3 pasos a 5 fases, con guardado persistente en base de datos para que el usuario pueda salir de la plataforma y retomar donde lo dejó.

---

## Fases del nuevo flujo

| Fase | Nombre | Contenido |
|------|--------|-----------|
| 1 | **Nombre del piso** | Solo el título — al completar, se crea un borrador en BD |
| 2 | **Verificación KYC** | Verificación de identidad del propietario. Si ya hizo KYC previamente (`verificado_kyc === true`), mostrar resumen de datos y permitir continuar o rehacer KYC. Si es la primera vez, es obligatorio completar el flujo KYC |
| 3 | **Datos de la vivienda** | Fotos (principal + adicionales), descripción, dirección (provincia/ciudad con LocationSelector), habitaciones, baños, m², número de registro, motivos de alquiler |
| 4 | **Precio y disponibilidad** | Precio/mes, fianza, fecha disponible desde, estancia mínima/máxima |
| 5 | **Verificación con Nota Simple** | Subida de nota simple (opcional pero recomendada). Botón "Publicar" para finalizar. Si no sube nota simple, la vivienda se publica con `verificada: false` |

---

## Requisitos técnicos

### 1. Migración de base de datos (Prisma)

**En el modelo `Vivienda` (`SafeRent_backend/prisma/schema.prisma`):**
- Añadir campo `fase_actual Int @default(1)` — rastrea en qué fase está el wizard
- Añadir campo `es_borrador Boolean @default(true)` — true hasta que se publique
- Hacer `num_registro_vivienda` nullable (`String? @unique`) para soportar borradores sin este dato
- Poner defaults en `direccion @default("")`, `precio_mes @default(0)`, `fianza_importe @default(0)`
- **IMPORTANTE**: Las viviendas existentes deben recibir `fase_actual = 5` y `es_borrador = false` en la migración

**En el modelo `Usuario`:**
- Añadir `nombre_kyc String?` — nombre extraído del KYC
- Añadir `apellidos_kyc String?` — apellidos extraídos del KYC
- Añadir `tipo_documento String?` — "DNI" | "NIE" | "Pasaporte"

### 2. Backend — Nuevos endpoints

**Viviendas:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/viviendas/borrador` | Crear borrador con solo `{ titulo }`. Devuelve la vivienda creada con su `id`. Crea con `es_borrador: true, activa: false, fase_actual: 1` |
| `PATCH` | `/viviendas/:id/fase/:num` | Guardar datos de una fase específica (2-5). Actualiza `fase_actual` al número de fase |
| `GET` | `/viviendas/borradores` | Obtener borradores activos del propietario autenticado (`es_borrador: true`) |
| `POST` | `/viviendas/:id/publicar` | Validar que todos los campos obligatorios están completos → poner `es_borrador = false, activa = true` |
| `POST` | `/viviendas/:id/nota-simple/upload-url` | Generar signed URL para subir la nota simple a Supabase Storage |
| `DELETE` | `/viviendas/:id/borrador` | Eliminar un borrador (solo si `es_borrador: true`) |

**KYC:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `PATCH` | `/kyc/completar-propietario` | Recibe `{ nombre, apellidos, dni_nie, tipo_documento }` → actualiza `Usuario` con estos datos + `verificado_kyc = true` |

**DTOs a crear:**
- `create-borrador.dto.ts` — solo `titulo: string` (required)
- `update-fase3.dto.ts` — descripcion?, fotos?, direccion, provincia, ciudad, habitaciones, banos, m2, num_registro_vivienda, motivos
- `update-fase4.dto.ts` — precio_mes, fianza_importe, disponible_desde?, estancia_minima, estancia_maxima
- `update-fase5.dto.ts` — nota_simple_url? (optional)

**Archivos backend a modificar:**
- `src/viviendas/viviendas.service.ts` — añadir métodos: `createBorrador()`, `updateFase()`, `findBorradores()`, `publicar()`
- `src/viviendas/viviendas.controller.ts` — añadir endpoints
- `src/kyc/kyc.service.ts` — añadir método `completarPropietario()`
- `src/kyc/kyc.controller.ts` — añadir endpoint PATCH
- `src/auth/auth.service.ts` — incluir `nombre_kyc`, `apellidos_kyc`, `tipo_documento` en la respuesta de `/auth/me` y en el JWT payload

**Validación del endpoint `publicar`:**
Verificar que están presentes: titulo, direccion (no vacío), ciudad (no vacío), precio_mes (> 0), fianza_importe (> 0), num_registro_vivienda, habitaciones, banos, m2, motivos (al menos uno). Si falta algo, devolver 400 con los campos faltantes.

### 3. Frontend — Componentes

**Crear esta estructura:**
```
src/app/(propietario)/propietario/publicar/
  page.tsx                              ← Reescribir: wizard container
  _components/
    PublicarStepper.tsx                 ← Stepper visual de 5 pasos
    FaseNombre.tsx                      ← Fase 1: input título
    FaseKyc.tsx                         ← Fase 2: integración KYC
    FaseDetalles.tsx                    ← Fase 3: fotos, dirección, detalles
    FasePrecio.tsx                      ← Fase 4: precios y disponibilidad
    FaseVerificacion.tsx                ← Fase 5: nota simple + publicar
```

**Lógica del wizard (`page.tsx`):**
1. Al montar → `GET /viviendas/borradores`
2. Si hay borrador → cargar datos, posicionarse en `fase_actual` (la última fase guardada)
3. Si no hay borrador → empezar en Fase 1
4. Cada fase al completarse llama a su endpoint y avanza
5. Navegación atrás permitida para editar fases completadas
6. Fase 5 → botón "Publicar" que llama `POST /viviendas/:id/publicar`

**Lógica de Fase 2 (KYC):**
```
Si usuario.verificado_kyc === true:
  → Mostrar tarjeta resumen con datos (nombre, apellidos, DNI/NIE)
  → Botón "Continuar" para avanzar
  → Link secundario "Actualizar datos" que lanza nuevo flujo KYC
Si usuario.verificado_kyc === false:
  → Renderizar <KycMobilePanel /> (el componente existente con QR)
  → Al completar KYC → llamar PATCH /kyc/completar-propietario con datos extraídos
  → Refrescar usuario en AuthContext
  → Avanzar a Fase 3
```

**Archivos frontend a modificar:**
- `src/lib/viviendas.ts` — nuevas funciones: `crearBorrador()`, `guardarFase()`, `obtenerBorradores()`, `publicarViviendaFinal()`, `obtenerUrlNotaSimple()`
- `src/lib/auth.ts` — extender interfaz `UsuarioAuth` con `nombre_kyc`, `apellidos_kyc`, `tipo_documento`
- `src/types/index.ts` — extender tipo `Vivienda` con `fase_actual`, `es_borrador`; extender tipo `Usuario` con campos KYC
- `src/context/PropietarioContext.tsx` — filtrar `es_borrador: true` de la lista de viviendas publicadas
- **Crear** `src/lib/kyc.ts` — función `completarKycPropietario(datos)`

### 4. Dashboard del propietario — Indicador de borradores

**Modificar `src/app/(propietario)/propietario/page.tsx`:**
- Añadir sección "Borradores pendientes" antes de la lista de viviendas
- Cada borrador muestra: título del piso, fase actual (ej: "Fase 2 de 5 — Verificación KYC"), botón "Continuar" que lleva a `/propietario/publicar?borrador=<id>`
- Si no hay borradores, no mostrar la sección

---

## Componentes existentes a reutilizar

- `src/components/kyc/KycMobilePanel.tsx` — panel KYC con QR para Fase 2
- `src/components/forms/LocationSelector.tsx` — selector cascada provincia/ciudad para Fase 3
- `src/data/spain-locations.ts` — datos estáticos de provincias y ciudades
- Patrón de upload con signed URLs de `src/lib/viviendas.ts` — para fotos y nota simple
- Componentes shadcn/ui: Card, Button, Input, Label, Select, Separator
- Iconos Lucide React

---

## Orden de implementación recomendado

1. Migración Prisma (schema + migrate dev)
2. Backend DTOs
3. Backend Service (viviendas.service.ts)
4. Backend Controller (viviendas.controller.ts)
5. Backend KYC (completarPropietario en service + controller)
6. Backend Auth (extender /auth/me)
7. Frontend lib + tipos (viviendas.ts, kyc.ts, auth.ts, types/index.ts)
8. Frontend componentes (5 fases + stepper)
9. Frontend page.tsx (wizard container)
10. Frontend dashboard (indicador de borradores)

---

## Verificación final

- [ ] Crear borrador (Fase 1) → salir de la app → volver → retoma en la fase correcta
- [ ] Usuario nuevo: KYC obligatorio en Fase 2
- [ ] Usuario con KYC previo: puede saltar Fase 2 o elegir rehacer
- [ ] Fotos se suben correctamente vía signed URLs en Fase 3
- [ ] Nota simple es opcional en Fase 5 — se puede publicar sin ella (`verificada: false`)
- [ ] `GET /viviendas` (búsqueda pública) NO muestra borradores (`activa: false`)
- [ ] Dashboard del propietario muestra borradores pendientes con fase actual y botón "Continuar"
- [ ] Viviendas ya publicadas NO se ven afectadas por la migración (reciben `fase_actual=5, es_borrador=false`)
