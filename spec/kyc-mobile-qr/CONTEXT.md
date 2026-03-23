# Contexto — KYC Mobile QR + NFC

## Archivos relevantes por repositorio

### Frontend (SafeRent — Next.js)
- `src/app/(inquilino)/inquilino/checkout/page.tsx` — Step 1 a modificar
- `src/app/api/kyc/analizar/route.ts`              — API KYC con OpenAI ya implementada
- `src/app/api/kyc/sesion/route.ts`                — A crear: genera la kyc_session
- `src/components/kyc/KycResultBadge.tsx`           — Componente de resultado ya creado
- `src/components/kyc/KycMobilePanel.tsx`           — A crear: QR + estados Realtime
- `src/hooks/useKycAnalysis.ts`                     — Hook KYC subida manual (no modificar)
- `src/hooks/useKycMobileSession.ts`                — A crear: gestiona sesión + Realtime
- `src/lib/supabase/client.ts`                      — createClient() para browser
- `src/lib/supabase/server.ts`                      — createClient() para API Routes

### Backend (SafeRent_backend — NestJS)
- `prisma/schema.prisma`      — NO modificar
- `src/prisma/prisma.service.ts`
- `src/app.module.ts`

### App Móvil (SafeRentMobile — Expo)
- `lib/supabase.ts`                      — Cliente Supabase ya configurado
- `lib/nfc/index.ts`                     — A crear: wrapper NFC + tipos
- `app/kyc-movil.tsx`                    — A crear: pantalla de escaneo
- `app/(tabs)/(admin)/verificacion.tsx`  — Referencia de pantalla existente
- `app.json`                             — Añadir scheme "saferent" si no existe

## Variables de entorno

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://saferent.vercel.app
```

### App Móvil (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=https://saferent.vercel.app
```

## Librería NFC

**Librería elegida:** `@didit-sdk/react-native-nfc-passport-reader`

Por plataforma:
- Android → PACE-IM → PACE-GM → BAC (cubre DNI 3.0 español y pasaportes)
- iOS     → PACE-GM → BAC (cubre pasaportes y DNI pre-2015)
- iOS + DNI 3.0 español → falla con error PACE-IM → fallback a completarSinNfc()

La limitación iOS no es de la app, es de la librería Swift NFCPassportReader
de AndyQ que hay debajo. Cuando implemente PACE-IM, actualizar la versión
de la librería resolverá el problema sin cambios en el código.

Detección del error PACE-IM en iOS:
  err.message incluye 'IM not yet' o 'PACE' con Platform.OS === 'ios'

## Patrones a respetar

### Supabase Realtime
```typescript
const channel = supabase
  .channel(`kyc_sesion_${sesionId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'kyc_sesiones',
    filter: `id=eq.${sesionId}`
  }, handler)
  .subscribe()

// Cleanup SIEMPRE
return () => { supabase.removeChannel(channel) }
```

### API Route autenticada
```typescript
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
```

### NfcPassportReader (API de la librería)
```typescript
import NfcPassportReader from '@didit-sdk/react-native-nfc-passport-reader'

const result = await NfcPassportReader.startReading({
  bacKey: {
    documentNo: '123456789',   // 9 chars con '<' de relleno
    expiryDate: 'YYYY-MM-DD',
    birthDate:  'YYYY-MM-DD',
  },
  includeImages: true,
})
// Android: NfcPassportReader.stopReading() en finally
```

## Tabla kyc_sesiones (Supabase — NO en Prisma)

Columnas base (SQL de creación en SPEC.md):
  id, token, usuario_id, solicitud_id, estado, safe_score,
  nombre_extraido, apellidos_extraidos, dni_extraido, tipo_documento,
  datos_raw, expira_en, creado_en, actualizado_en

Columnas NFC a añadir (ALTER TABLE):
  nfc_passive_auth BOOLEAN,
  nfc_plataforma   TEXT,
  foto_chip_url    TEXT

Estados posibles: PENDIENTE → ESCANEANDO → COMPLETADO | FALLIDO | EXPIRADO

## Notas importantes

- NFC no funciona en Expo Go ni en simuladores → necesita EAS Development Build
  en dispositivo físico Android para desarrollar/probar
- iOS NFC requiere Apple Developer Account (99€/año) para compilar en dispositivo
- foto_base64 del chip NUNCA va en datos_raw de Supabase (demasiado peso)
  Solo subir a Storage 'kyc-fotos-chip' y guardar la URL
- El safe_score se reduce a máximo 65 cuando no hay verificación NFC
  (completarSinNfc) para distinguirlo de una verificación NFC completasige 