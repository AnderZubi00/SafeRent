# Tasks — KYC Mobile QR

Ejecutar en este orden estricto. Marcar cada tarea como completada antes de pasar a la siguiente.

## Fase 1 — Base de datos
- [ ] **T01** Crear la tabla `kyc_sesiones` en Supabase ejecutando el SQL del SPEC.md
  - Verificar que Realtime está habilitado para la tabla
  - Verificar que RLS está activado con la policy correcta

## Fase 2 — Backend (API Route en Next.js)
- [ ] **T02** Crear `src/app/api/kyc/sesion/route.ts`
  - POST: crea o reutiliza sesión KYC para el usuario autenticado
  - Devuelve { id, token, expira_en }

## Fase 3 — Frontend Web
- [ ] **T03** Crear `src/hooks/useKycMobileSession.ts`
  - Estados: idle → generando → esperando_escaneo → escaneando → completado/fallido
  - Suscripción Realtime con cleanup
  - qrUrl generada desde NEXT_PUBLIC_APP_URL

- [ ] **T04** Instalar qrcode.react si no está en package.json
  - `npm install qrcode.react`

- [ ] **T05** Crear `src/components/kyc/KycMobilePanel.tsx`
  - Estado "esperando_escaneo": QR + temporizador 15min
  - Estado "escaneando": spinner
  - Estado "completado": KycResultBadge + llamada a onCompletado()
  - Enlace "Prefiero subir una foto" → onSaltarAManual()

- [ ] **T06** Modificar `src/app/(inquilino)/inquilino/checkout/page.tsx`
  - Step 1: mostrar KycMobilePanel por defecto
  - Toggle para mostrar el flujo manual (input de archivo)
  - onCompletado guarda resultado y avanza a Step 2
  - Detectar sesión COMPLETADA reciente al montar el componente

## Fase 4 — App Móvil
- [ ] **T07** Verificar/añadir scheme "saferent" en app.json

- [ ] **T08** Verificar que expo-camera está instalada
  - Si no: `npx expo install expo-camera`

- [ ] **T09** Crear `app/kyc-movil.tsx`
  - Leer token y sesion de useLocalSearchParams
  - Validar sesión en Supabase (token lookup)
  - Actualizar estado a 'ESCANEANDO'
  - Visor de cámara con overlay guía
  - Captura → enviar a EXPO_PUBLIC_API_URL/api/kyc/analizar
  - Actualizar kyc_sesiones con resultado
  - Pantallas de éxito / error / reintento

## Fase 5 — Verificación
- [ ] **T10** Comprobar que el cleanup de Realtime se ejecuta correctamente
- [ ] **T11** Comprobar que el QR expira y se regenera a los 15 minutos
- [ ] **T12** Comprobar que el flujo manual (subir foto) sigue funcionando
```

---

## Cómo lanzarlo en Claude Code

Una vez tengas la carpeta `specs/kyc-mobile-qr/` creada con los tres archivos, el comando para Claude Code es:
```
Lee specs/kyc-mobile-qr/SPEC.md y specs/kyc-mobile-qr/CONTEXT.md para entender 
el feature completo. Luego ejecuta las tareas de specs/kyc-mobile-qr/TASKS.md 
en orden, marcando cada una como completada antes de pasar a la siguiente. 
No avances a una tarea si la anterior tiene errores de TypeScript o de lógica.