# Contexto — KYC Mobile QR

## Archivos relevantes por repositorio

### Frontend (SafeRent — Next.js)
- `src/app/(inquilino)/inquilino/checkout/page.tsx` — Step 1 a modificar
- `src/app/api/kyc/analizar/route.ts` — API KYC con OpenAI ya implementada
- `src/components/kyc/KycResultBadge.tsx` — Componente de resultado ya creado
- `src/hooks/useKycAnalysis.ts` — Hook KYC existente (no modificar)
- `src/lib/supabase/client.ts` — createClient() para browser
- `src/lib/supabase/server.ts` — createClient() para server/API Routes
- `src/lib/solicitudes.ts` — Referencia del patrón de llamadas a Supabase

### Backend (SafeRent_backend — NestJS)
- `prisma/schema.prisma` — Schema actual (NO modificar)
- `src/prisma/prisma.service.ts` — PrismaService inyectable
- `src/auth/auth.module.ts` — Referencia del patrón Module/Controller/Service
- `src/app.module.ts` — Registrar módulos nuevos aquí

### App Móvil (SafeRentMobile — Expo)
- `lib/supabase.ts` — Cliente Supabase con AsyncStorage ya configurado
- `app/(tabs)/(admin)/verificacion.tsx` — Referencia de pantalla existente
- `app.json` — Verificar/añadir scheme "saferent"

## Variables de entorno necesarias

### Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://saferent.vercel.app  # o localhost en dev

### App Móvil (.env)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=https://saferent.vercel.app  # URL del frontend para /api/kyc/analizar

## Patrones a respetar

### Supabase Realtime (patrón correcto)
```typescript
const channel = supabase
  .channel(`kyc_sesion_${sesionId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'kyc_sesiones',
    filter: `id=eq.${sesionId}`
  }, (payload) => { /* handler */ })
  .subscribe()

// Cleanup SIEMPRE en useEffect return
return () => { supabase.removeChannel(channel) }
```

### API Route autenticada (patrón del proyecto)
```typescript
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
```

### Componente NestJS (patrón del proyecto)
```
src/[feature]/
├── [feature].module.ts
├── [feature].controller.ts
├── [feature].service.ts
└── dto/crear-[feature].dto.ts
```