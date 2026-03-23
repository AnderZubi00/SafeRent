# Tasks — KYC Mobile QR + NFC

Ejecutar en orden estricto. Marcar como completada antes de pasar a la siguiente.
No avanzar si hay errores de TypeScript o de lógica en la tarea anterior.

## Fase 1 — Base de datos

- [ ] **T01** Ejecutar SQL de creación de tabla kyc_sesiones en Supabase
      (SQL completo en SPEC.md — Parte 1)
      Verificar: Realtime habilitado, RLS activado, trigger actualizado_en OK

- [ ] **T02** Ejecutar ALTER TABLE para añadir columnas NFC
      nfc_passive_auth, nfc_plataforma, foto_chip_url
      Verificar en Supabase Table Editor que las columnas existen

## Fase 2 — API Route (Frontend Next.js)

- [ ] **T03** Crear `src/app/api/kyc/sesion/route.ts`
      POST: autentica con Supabase server, crea o reutiliza sesión PENDIENTE
      Devuelve: { id, token, expira_en }
      Verificar: responde 401 sin sesión, 200 con sesión válida

## Fase 3 — Hook y componente web (Frontend Next.js)

- [ ] **T04** Crear `src/hooks/useKycMobileSession.ts`
      Estados: idle → generando → esperando_escaneo → escaneando → completado/fallido
      Suscripción Realtime con cleanup en useEffect return
      qrUrl: ${NEXT_PUBLIC_APP_URL}/kyc-movil?token=X&sesion=Y
      Verificar: el cleanup se ejecuta al desmontar el componente

- [ ] **T05** Instalar qrcode.react si no está en package.json
      npm install qrcode.react
      Verificar: importación de QRCodeSVG funciona sin errores TS

- [ ] **T06** Crear `src/components/kyc/KycMobilePanel.tsx`
      Estado esperando_escaneo: QR centrado en fondo oscuro + temporizador 15min
      Estado escaneando: spinner con texto
      Estado completado: KycResultBadge + llamada a onCompletado() tras 1.5s
      Enlace "Prefiero subir una foto" → onSaltarAManual()
      Regenerar QR automáticamente al expirar
      Verificar: los tres estados se renderizan correctamente

## Fase 4 — Integración en checkout (Frontend Next.js)

- [ ] **T07** Modificar `src/app/(inquilino)/inquilino/checkout/page.tsx`
      Step 1: KycMobilePanel como opción principal
      Toggle para mostrar flujo manual (subida de archivo, ya existente)
      onCompletado guarda resultado y avanza a Step 2 automáticamente
      Al montar: detectar sesión COMPLETADA reciente (< 30min) para el usuario
      Verificar: el flujo manual sigue funcionando sin cambios

## Fase 5 — Librería NFC (App Móvil Expo)

- [ ] **T08** Instalar librería NFC
      npm install @didit-sdk/react-native-nfc-passport-reader

- [ ] **T09** Configurar manifests nativos
      Android: AndroidManifest.xml (permisos + intent filter + meta-data)
      Android: res/xml/nfc_tech_filter.xml
      iOS: Info.plist (NFCReaderUsageDescription + select-identifiers)
      iOS: Podfile (pod 'OpenSSL-Universal', '~> 1.1.1900')
      iOS: entitlements (select-identifiers)
      app.json: scheme "saferent" si no existe
      Verificar: npx expo prebuild completa sin errores

- [ ] **T10** Crear `lib/nfc/index.ts`
      Tipos: MrzKeys, NfcChipResult, CodigoErrorNfc
      leerChipDocumento(): verifica soporte → llama librería → mapea resultado
      mapearError(): detecta PACE_IM_NO_SOPORTADO en iOS por mensaje de error
      parsearMrzDesdeOcr(): extrae MrzKeys del resultado OCR
      normalizarNombre(): quita tildes, mayúsculas, limpia espacios
      Verificar: todos los tipos son correctos en TypeScript

## Fase 6 — Pantalla KYC móvil (App Móvil Expo)

- [ ] **T11** Crear `app/kyc-movil.tsx` — Estado VALIDANDO
      Leer token y sesion de useLocalSearchParams
      Verificar token en Supabase, comprobar expiración
      UPDATE estado = 'ESCANEANDO' si válido
      Mostrar error claro si expirado o inválido
      Verificar: funciona con un token real de la BD

- [ ] **T12** Implementar estado CAMARA en kyc-movil.tsx
      CameraView full-screen con expo-camera
      Overlay: rectángulo guía (ratio 1.586:1) con esquinas resaltadas
      Zona fuera del rectángulo semitransparente
      Botón circular de captura
      Compresión: quality 0.85, maxWidth 1920
      Verificar: la captura produce un blob válido

- [ ] **T13** Implementar estado PROCESANDO_OCR en kyc-movil.tsx
      POST a EXPO_PUBLIC_API_URL/api/kyc/analizar con FormData
      Si RECHAZAR → ERROR con reintentar → CAMARA
      Si APROBAR/REVISAR_MANUAL → guardar resultadoOcr → INSTRUCCIONES_NFC
      Verificar: la llamada a la API funciona desde el dispositivo

- [ ] **T14** Implementar estado INSTRUCCIONES_NFC en kyc-movil.tsx
      Animación 3 ondas NFC con Animated.loop
      SVG con localización del chip en el DNI español
      Condicional iOS + DNI: aviso amber con dos opciones
        "Intentar de todas formas" → LEYENDO_NFC
        "Continuar con revisión manual" → completarSinNfc()
      Resto de casos: botón "Empezar lectura NFC" → LEYENDO_NFC
      Verificar: el condicional iOS/DNI se activa correctamente

- [ ] **T15** Implementar estado LEYENDO_NFC en kyc-movil.tsx
      Timeout 30s con cleanup correcto
      Llamada a leerChipDocumento()
      Gestión de todos los códigos de error:
        PACE_IM_NO_SOPORTADO → completarSinNfc()
        NFC_DESACTIVADO → openNfcSettings() (Android)
        TAG_PERDIDO / TIMEOUT → reintentar
        passive_auth_ok false → ERROR
        Cualquier otro → reintentar o completarSinNfc()
      Cruce OCR vs NFC con normalizarNombre() si exitoso
      Verificar: el flujo completo funciona en dispositivo Android físico

- [ ] **T16** Implementar completarConNfc() en kyc-movil.tsx
      Subir foto_base64 a Storage 'kyc-fotos-chip' si existe
      UPDATE kyc_sesiones con todos los campos NFC
      datos_raw sin foto_base64
      Verificar: el UPDATE dispara Realtime en la web

- [ ] **T17** Implementar completarSinNfc() en kyc-movil.tsx
      safe_score máximo 65
      UPDATE kyc_sesiones con nfc_passive_auth: false
      Verificar: el UPDATE también dispara Realtime en la web

- [ ] **T18** Implementar pantallas EXITO y EXITO_PARCIAL en kyc-movil.tsx
      EXITO: check animado, datos del chip, foto si existe
      EXITO_PARCIAL: check naranja, aviso revisión manual
      Verificar: la web avanza al Step 2 automáticamente al recibir el Realtime

## Fase 7 — Verificación end-to-end

- [ ] **T19** Test completo flujo Android (DNI 3.0 español)
      Web genera QR → App escanea → Cámara captura → OCR aprueba →
      NFC lee chip (PACE-IM) → UPDATE COMPLETADO → Web avanza Step 2
      Requisito: dispositivo Android físico con NFC

- [ ] **T20** Test completo flujo iOS (Pasaporte)
      Mismo flujo con BAC en lugar de PACE-IM
      Requisito: Apple Developer Account + EAS Build en iPhone

- [ ] **T21** Test fallback iOS (DNI 3.0 español)
      iOS + DNI → aviso amber → "Continuar con revisión manual" →
      UPDATE COMPLETADO con safe_score ≤ 65 → Web avanza Step 2

- [ ] **T22** Test flujo manual (subida de archivo desde web)
      Verificar que el flujo original de subida de archivo en el checkout
      sigue funcionando correctamente después de todos los cambios