Implementa el flujo KYC con cámara + chip NFC para la app Expo de SafeRent.
Android e iOS usando react-native-nfc-manager como base, con manejo
explícito del fallo PACE-IM en iOS para el DNI español 3.0.

═══════════════════════════════════════════════════════════════
LIBRERÍA Y LIMITACIONES REALES
═══════════════════════════════════════════════════════════════

Librería principal: @didit-sdk/react-native-nfc-passport-reader
  npm install @didit-sdk/react-native-nfc-passport-reader

API de la librería:
  import NfcPassportReader from '@didit-sdk/react-native-nfc-passport-reader'
  import type { NfcResult } from '@didit-sdk/react-native-nfc-passport-reader'

  const result: NfcResult = await NfcPassportReader.startReading({
    bacKey: {
      documentNo: '123456789',   // 9 chars rellenado con '<'
      expiryDate: 'YYYY-MM-DD',
      birthDate:  'YYYY-MM-DD',
    },
    includeImages: true,
  })

Comportamiento por plataforma:
  Android: intenta PACE-IM → PACE-GM → BAC (cubre DNI 3.0 español, pasaportes)
  iOS:     intenta PACE-GM → BAC (cubre pasaportes y DNI pre-2015)
  iOS + DNI español 3.0: lanza error PACE-IM → capturar → flujo de fallback OCR

Detección del fallo PACE-IM en iOS:
  El error tiene message que contiene "IM not yet implemented" o
  code que contiene "PACEError" o "invalidated" con contexto PACE.
  Capturar este error específicamente y tratarlo como PACE_IM_NO_SOPORTADO.

═══════════════════════════════════════════════════════════════
CONFIGURACIÓN NATIVA
═══════════════════════════════════════════════════════════════

iOS Info.plist — añadir:
  <key>NFCReaderUsageDescription</key>
  <string>SafeRent necesita leer el chip de tu documento para verificar tu identidad</string>
  <key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
  <array>
    <string>A0000002471001</string>
    <string>A0000002472001</string>
    <string>D4100000030001</string>
    <string>00000000000000</string>
  </array>

iOS Podfile — añadir (requerido por la librería):
  pod 'OpenSSL-Universal', '~> 1.1.1900'

iOS Entitlements — añadir en ios/SafeRentMobile.entitlements:
  <key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
  <array>
    <string>A0000002471001</string>
    <string>A0000002472001</string>
    <string>D4100000030001</string>
    <string>00000000000000</string>
  </array>

NOTA: El entitlement NFC en iOS requiere cuenta Apple Developer activa para
compilar en dispositivo físico. Para desarrollo, usar Android.
Añadir comentario en el código indicando este requisito.

Android AndroidManifest.xml:
  <uses-permission android:name="android.permission.NFC"/>
  <uses-feature android:name="android.hardware.nfc" android:required="false"/>

Android NFC intent filter en la Activity principal:
  <intent-filter>
    <action android:name="android.nfc.action.TECH_DISCOVERED"/>
  </intent-filter>
  <meta-data android:name="android.nfc.action.TECH_DISCOVERED"
    android:resource="@xml/nfc_tech_filter"/>

Android res/xml/nfc_tech_filter.xml:
  <resources>
    <tech-list><tech>android.nfc.tech.IsoDep</tech></tech-list>
  </resources>

═══════════════════════════════════════════════════════════════
PARTE 1 — lib/nfc/index.ts
═══════════════════════════════════════════════════════════════

Tipos:

  interface MrzKeys {
    documentNumber: string  // 9 chars con '<' de padding
    dateOfBirth: string     // YYYY-MM-DD
    dateOfExpiry: string    // YYYY-MM-DD
  }

  type CodigoErrorNfc =
    | 'NFC_NO_DISPONIBLE'
    | 'NFC_DESACTIVADO'
    | 'PACE_IM_NO_SOPORTADO'   // DNI 3.0 en iOS
    | 'TIMEOUT'
    | 'TAG_PERDIDO'
    | 'LECTURA_ERROR'

  interface NfcChipResult {
    exitoso: boolean
    plataforma: 'android' | 'ios'
    nombre: string | null
    apellidos: string | null
    numero_documento: string | null
    fecha_nacimiento: string | null
    fecha_caducidad: string | null
    nacionalidad: string | null
    foto_base64: string | null
    passive_auth_ok: boolean
    error: string | null
    error_codigo: CodigoErrorNfc | null
  }

Función leerChipDocumento(keys: MrzKeys): Promise<NfcChipResult>:

  1. Verificar soporte:
     const supported = await NfcPassportReader.isNfcSupported()
     if (!supported) return error('NFC_NO_DISPONIBLE')

     if (Platform.OS === 'android') {
       const enabled = await NfcPassportReader.isNfcEnabled()
       if (!enabled) return error('NFC_DESACTIVADO')
     }

  2. Llamar a la librería:
     try {
       const result: NfcResult = await NfcPassportReader.startReading({
         bacKey: {
           documentNo: keys.documentNumber,
           expiryDate: keys.dateOfExpiry,
           birthDate:  keys.dateOfBirth,
         },
         includeImages: true,
       })
       return mapearResultado(result)
     } catch (err) {
       return mapearError(err)
     }

  3. Función mapearError(err):
     - Si err.message incluye 'IM not yet' o 'PACE' y Platform.OS === 'ios':
       return error('PACE_IM_NO_SOPORTADO')
     - Si err.message incluye 'timeout' o 'timed out':
       return error('TIMEOUT')
     - Si err.message incluye 'tag' o 'lost' o 'connection':
       return error('TAG_PERDIDO')
     - Cualquier otro: error('LECTURA_ERROR') con el mensaje original

  4. Función mapearResultado(r: NfcResult): NfcChipResult:
     - Mapear campos de NfcResult a NfcChipResult
     - passive_auth_ok = r.documentSigningCertificate != null (o el campo
       equivalente que devuelva la librería para Passive Auth)
     - foto_base64: extraer de r.face?.image si includeImages fue true

Función parsearMrzDesdeOcr(ocr: KycResultado): MrzKeys:
  - documentNumber: (ocr.datos_extraidos.numero_documento ?? '').padEnd(9,'<').slice(0,9)
  - dateOfBirth: ocr.datos_extraidos.fecha_nacimiento ?? '2000-01-01'
  - dateOfExpiry: ocr.datos_extraidos.fecha_caducidad ?? '2030-01-01'

Función normalizarNombre(s: string | null): string:
  - toUpperCase()
  - normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  - replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim()

═══════════════════════════════════════════════════════════════
PARTE 2 — app/kyc-movil.tsx
═══════════════════════════════════════════════════════════════

Params: token: string, sesion: string (de useLocalSearchParams)

Estados internos: 'VALIDANDO' | 'CAMARA' | 'PROCESANDO_OCR' |
                  'INSTRUCCIONES_NFC' | 'LEYENDO_NFC' |
                  'EXITO' | 'EXITO_PARCIAL' | 'ERROR'

VALIDANDO (inicial):
  Verificar en Supabase que token existe y estado === 'PENDIENTE' y
  expira_en > now(). Si no → estado ERROR con mensaje "QR caducado".
  Si válido → UPDATE estado = 'ESCANEANDO' → pasar a CAMARA.

CAMARA:
  CameraView de expo-camera full-screen.
  Overlay con rectángulo guía (ratio 85.6/54 ≈ 1.586) usando View con
  posición absoluta. Las 4 esquinas con líneas indigo de 3px.
  Zona fuera del rectángulo: View semitransparente negro (opacity 0.5).
  Instrucciones bajo el rectángulo.
  Botón circular captura (60px, indigo, bottom:40).
  Al capturar: comprimir quality:0.85, maxWidth:1920 → pasar a PROCESANDO_OCR.

PROCESANDO_OCR:
  ActivityIndicator + "Analizando documento…"
  POST ${EXPO_PUBLIC_API_URL}/api/kyc/analizar con FormData {documento: blob}.
  Si recomendacion === 'RECHAZAR' → ERROR con botón reintentar → CAMARA.
  Si 'APROBAR' o 'REVISAR_MANUAL':
    Guardar resultadoOcr en estado local.
    Pasar a INSTRUCCIONES_NFC.

INSTRUCCIONES_NFC:
  Animación 3 ondas NFC con Animated.loop (opacity 1→0, delay escalonado 300ms).
  Título + instrucciones de posicionamiento.
  SVG simple mostrando dónde está el chip en el DNI español:
    Rectángulo blanco (tarjeta), punto/cuadrado en esquina superior-izquierda
    del reverso con texto "Chip aquí".

  CONDICIONAL SEGÚN PLATAFORMA Y TIPO DE DOCUMENTO:
    if (Platform.OS === 'ios' && resultadoOcr.tipo_documento === 'DNI'):
      Mostrar aviso amber:
        "⚠️ DNI español en iPhone
        El DNI 3.0 español usa un protocolo NFC (PACE-IM) que aún no está
        soportado en iOS. Tu identidad se verificará mediante OCR con
        revisión manual de un agente."
      Dos botones:
        "Intentar de todas formas" → LEYENDO_NFC (puede fallar, el fallback manejará el error)
        "Continuar con revisión manual" → completarSinNfc()

    else:
      Solo botón "Empezar lectura NFC" → LEYENDO_NFC.

  Enlace pequeño "¿Mi móvil no tiene NFC?" → Modal explicativo.

LEYENDO_NFC:
  Animación pulso. Texto "Acerca el DNI al móvil…".
  Timeout 30s con useEffect.
  Llamar leerChipDocumento(parsearMrzDesdeOcr(resultadoOcr)).

  Gestión del resultado:
    Si exitoso && passive_auth_ok:
      Cruzar nombre/DNI OCR vs NFC con normalizarNombre().
      Si coinciden → completarConNfc(nfc).
      Si no → estado ERROR "Los datos del chip no coinciden."

    Si error_codigo === 'PACE_IM_NO_SOPORTADO':
      Mostrar aviso: "Tu DNI requiere protocolo PACE-IM, no disponible en iPhone."
      Botón → completarSinNfc().

    Si error_codigo === 'NFC_DESACTIVADO':
      Modal con botón "Abrir ajustes NFC" → NfcPassportReader.openNfcSettings() (Android).

    Si error_codigo === 'TAG_PERDIDO' o 'TIMEOUT':
      Botón "Reintentar" → vuelve a INSTRUCCIONES_NFC.

    Si passive_auth_ok === false:
      Estado ERROR: "El chip del documento no supera la verificación."

    Cualquier otro error:
      Botón "Reintentar" → INSTRUCCIONES_NFC.
      Botón "Continuar sin NFC" → completarSinNfc().

Función completarConNfc(nfc: NfcChipResult):
  1. Si nfc.foto_base64 existe:
     Subir a Supabase Storage 'kyc-fotos-chip' → guardar URL.
  2. UPDATE kyc_sesiones:
     estado: 'COMPLETADO',
     safe_score: resultadoOcr.safe_score,
     nombre_extraido: nfc.nombre,
     apellidos_extraidos: nfc.apellidos,
     dni_extraido: nfc.numero_documento,
     tipo_documento: resultadoOcr.tipo_documento,
     nfc_passive_auth: nfc.passive_auth_ok,
     nfc_plataforma: nfc.plataforma,
     foto_chip_url: fotoChipUrl,
     datos_raw: { ocr: resultadoOcr, nfc: { ...nfc, foto_base64: null } }
  3. setEstado('EXITO')

Función completarSinNfc():
  UPDATE kyc_sesiones:
    estado: 'COMPLETADO',
    safe_score: Math.min(resultadoOcr.safe_score, 65),
    nombre_extraido: resultadoOcr.datos_extraidos.nombre,
    apellidos_extraidos: resultadoOcr.datos_extraidos.apellidos,
    dni_extraido: resultadoOcr.datos_extraidos.numero_documento,
    tipo_documento: resultadoOcr.tipo_documento,
    nfc_passive_auth: false,
    nfc_plataforma: Platform.OS,
    datos_raw: { ocr: resultadoOcr, nfc: null }
  setEstado('EXITO_PARCIAL')

EXITO:
  Check animado (Animated.spring scale 0→1).
  "¡Identidad verificada!" en verde.
  Badge "Chip NFC autenticado ✓".
  Nombre completo y número de documento del chip.
  Si foto_chip_url: Avatar circular con la foto.
  "Vuelve al ordenador para continuar."

EXITO_PARCIAL:
  Check naranja.
  "Documento verificado".
  Badge amber "Verificación manual pendiente".
  "Tu documento se verificará en las próximas horas."
  "Vuelve al ordenador para continuar."

═══════════════════════════════════════════════════════════════
PARTE 3 — SQL: añadir columnas
═══════════════════════════════════════════════════════════════

  ALTER TABLE kyc_sesiones
    ADD COLUMN IF NOT EXISTS nfc_passive_auth BOOLEAN,
    ADD COLUMN IF NOT EXISTS nfc_plataforma   TEXT,
    ADD COLUMN IF NOT EXISTS foto_chip_url    TEXT;

═══════════════════════════════════════════════════════════════
RESTRICCIONES
═══════════════════════════════════════════════════════════════

- foto_base64 NUNCA en datos_raw de Supabase. Solo a Storage, solo la URL.
- NfcPassportReader.stopReading() siempre en bloque finally en Android.
- Incluir comentario en código: "iOS NFC requiere Apple Developer Account
  para compilar en dispositivo físico. Usar EAS Build con perfil development."
- NativeWind para estilos. Español en todos los textos de UI.
- Usar npx expo prebuild antes de compilar (NFC no funciona en Expo Go).
- Probar en dispositivo Android físico — simuladores no tienen NFC.
- PACE-IM en iOS: si el error cambia de mensaje en versiones futuras de
  la librería, capturar también cualquier error que ocurra específicamente
  en documentos de tipo DNI en iOS, no solo por message de error.