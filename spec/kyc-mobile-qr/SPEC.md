Implementa el flujo "Continuar en Móvil" para la verificación KYC en SafeRent.
Este flujo afecta a tres repositorios: frontend (Next.js), backend (NestJS) y
app móvil (Expo). Trabaja en los tres de forma coordinada.

═══════════════════════════════════════════════════════════════
CONTEXTO TÉCNICO DEL PROYECTO
═══════════════════════════════════════════════════════════════

FRONTEND (Next.js):
- Auth y Storage: Supabase (@/lib/supabase/client y @/lib/supabase/server)
- Checkout del inquilino: src/app/(inquilino)/inquilino/checkout/page.tsx
- El Step 1 actual tiene un input para subir DNI desde el PC
- Cliente Supabase browser: createClient() de @/lib/supabase/client

BACKEND (NestJS + Prisma):
- Solo tiene AuthModule implementado actualmente
- Schema Prisma en: prisma/schema.prisma
- PrismaService en: src/prisma/prisma.service.ts
- Patrón de módulos: Module + Controller + Service por feature

APP MÓVIL (Expo):
- Cliente Supabase: supabase de @/lib/supabase (ya configurado con AsyncStorage)
- Navegación: Expo Router (app/(tabs)/)
- La pantalla de verificación admin ya existe en app/(tabs)/(admin)/verificacion.tsx
- El flujo de KYC del inquilino aún NO existe en la app

═══════════════════════════════════════════════════════════════
ARQUITECTURA DEL FLUJO
═══════════════════════════════════════════════════════════════

1. Usuario en la WEB llega al Step 1 del checkout
2. WEB llama a POST /api/kyc/sesion → genera una kyc_session en Supabase con token único
3. WEB muestra un QR que codifica la URL: saferent://kyc?token=<token>&sesion=<id>
4. WEB se suscribe via Supabase Realtime al canal "kyc_session:<id>" escuchando cambios
   en la tabla kyc_sesiones donde id = <id>
5. Usuario escanea el QR con la APP MÓVIL
6. APP MÓVIL abre la pantalla de escaneo KYC
7. APP MÓVIL captura el DNI con la cámara y llama a POST /api/kyc/analizar
   (la API Route de KYC con OpenAI que ya existe)
8. APP MÓVIL actualiza el campo estado de kyc_sesiones a "COMPLETADO" y guarda
   los datos extraídos (nombre, dni_nie, safe_score) en la misma fila
9. Supabase Realtime notifica a la WEB del cambio
10. WEB recibe la notificación, lee los datos extraídos, muestra el SafeScore
    y habilita el botón "Continuar" del Step 1

═══════════════════════════════════════════════════════════════
PARTE 1 — BASE DE DATOS (Supabase / Prisma)
═══════════════════════════════════════════════════════════════

Crear la tabla kyc_sesiones directamente en Supabase con esta SQL
(NO crear migración de Prisma para esta tabla — usar Supabase directo):
```sql
CREATE TABLE kyc_sesiones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  solicitud_id  UUID REFERENCES solicitudes(id) ON DELETE SET NULL,
  estado        TEXT NOT NULL DEFAULT 'PENDIENTE'
                CHECK (estado IN ('PENDIENTE', 'ESCANEANDO', 'COMPLETADO', 'FALLIDO', 'EXPIRADO')),
  safe_score    INTEGER,
  nombre_extraido     TEXT,
  apellidos_extraidos TEXT,
  dni_extraido  TEXT,
  tipo_documento      TEXT,
  datos_raw     JSONB,
  expira_en     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por token (lo usa la app móvil)
CREATE INDEX idx_kyc_sesiones_token ON kyc_sesiones(token);

-- RLS: el usuario solo puede ver/modificar sus propias sesiones
ALTER TABLE kyc_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_sus_sesiones" ON kyc_sesiones
  FOR ALL USING (auth.uid() = usuario_id);

-- Supabase Realtime: habilitar para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE kyc_sesiones;

-- Trigger para actualizar actualizado_en automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.actualizado_en = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kyc_sesiones_updated
  BEFORE UPDATE ON kyc_sesiones
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
```

═══════════════════════════════════════════════════════════════
PARTE 2 — FRONTEND Next.js
═══════════════════════════════════════════════════════════════

### 2.1 API Route: src/app/api/kyc/sesion/route.ts

POST → Crea una nueva kyc_session en Supabase para el usuario autenticado.
- Autenticar con createClient() de @/lib/supabase/server
- Insertar en kyc_sesiones con usuario_id = user.id y estado = 'PENDIENTE'
- Responder con { id, token, expira_en }
- Si ya existe una sesión PENDIENTE reciente (< 15min) para este usuario,
  devolverla en lugar de crear una nueva

### 2.2 Hook: src/hooks/useKycMobileSession.ts

Hook "use client" que gestiona todo el ciclo de vida de la sesión móvil:

Estado interno:
- sesionId: string | null
- token: string | null
- estado: 'idle' | 'generando' | 'esperando_escaneo' | 'escaneando' | 'completado' | 'fallido' | 'expirado'
- resultado: objeto con { safeScore, nombreExtraido, apellidosExtraidos, dniExtraido, tipoDocumento } | null
- error: string | null

Funciones expuestas:
- iniciarSesion(): llama a POST /api/kyc/sesion y guarda id + token en estado
- cancelar(): limpia el estado
- qrUrl: string | null — la URL que va dentro del QR, con formato:
  `${process.env.NEXT_PUBLIC_APP_URL}/kyc-movil?token=${token}&sesion=${sesionId}`
  Si NEXT_PUBLIC_APP_URL no está definida, usar `saferent://kyc?token=${token}&sesion=${sesionId}`

Lógica de Realtime:
- Cuando sesionId no es null, suscribirse al canal de Supabase:
  supabase.channel(`kyc_sesion_${sesionId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'kyc_sesiones',
      filter: `id=eq.${sesionId}`
    }, handler)
    .subscribe()
- En el handler, mapear el campo estado de la BD al estado del hook
- Si estado = 'COMPLETADO', leer los campos nombre_extraido, apellidos_extraidos,
  dni_extraido, tipo_documento, safe_score y guardarlos en resultado
- Al desmontar o cancelar, hacer channel.unsubscribe()

### 2.3 Componente: src/components/kyc/KycMobilePanel.tsx

Componente "use client" que muestra el panel completo del flujo móvil.
Recibe: { onCompletado: (resultado: KycMobileResultado) => void, onSaltarAManual: () => void }

Usar el hook useKycMobileSession internamente.

Estados visuales (los tres estados del flujo):

ESTADO "esperando_escaneo":
- Botón grande "Verificar con el móvil" con icono Smartphone
- Al pulsarlo, llama a iniciarSesion() y muestra el QR
- El QR se genera con el componente QRCodeSVG de la librería qrcode.react
  (instalar: npm install qrcode.react @types/qrcode.react si no existe)
- Tamaño del QR: 200x200px, centrado
- Diseño del panel: fondo slate-950 (oscuro) con el QR en blanco
  para máximo contraste y facilidad de escaneo
- Texto bajo el QR: "Escanea con la App SafeRent para verificar tu DNI"
- Temporizador de cuenta atrás desde 15 minutos (regenerar QR si expira)
- Opción "Prefiero subir una foto" (llama a onSaltarAManual)

ESTADO "escaneando":
- Ocultar el QR
- Mostrar spinner con texto "El móvil está procesando tu documento…"
- Animación pulse en el icono de Smartphone

ESTADO "completado":
- Mostrar KycResultBadge con los datos del resultado
  (importar el componente ya creado en src/components/kyc/KycResultBadge.tsx)
- Construir un objeto KycResultado compatible desde los datos de la sesión
- Llamar automáticamente a onCompletado(resultado) tras 1.5 segundos

### 2.4 Modificar: src/app/(inquilino)/inquilino/checkout/page.tsx

En el Step 1, reemplazar el contenido actual por un layout de dos opciones:

OPCIÓN A — "Verificar con el móvil" (recomendada, aparece primero):
  Mostrar el componente KycMobilePanel
  Cuando onCompletado se dispare, guardar el resultado en estado local kycResultado
  y avanzar automáticamente al Step 2

OPCIÓN B — "Subir desde este dispositivo" (enlace secundario debajo):
  El comportamiento actual del Step 1 (subir archivo + KycResultBadge)
  Seguir usando el hook useKycAnalysis para este flujo

El Step 1 actualizado debe tener este layout:
- Título: "Verifica tu identidad"
- Subtítulo: "Elige cómo quieres hacerlo"
- Card principal: KycMobilePanel (ocupa todo el ancho)
- Separador con texto "o"
- Botón secundario con outline: "Subir foto desde este dispositivo"
  Al pulsarlo, mostrar el input de archivo original (toggle, no nueva pantalla)

═══════════════════════════════════════════════════════════════
PARTE 3 — APP MÓVIL (Expo)
═══════════════════════════════════════════════════════════════

### 3.1 Pantalla: app/kyc-movil.tsx (o app/(kyc)/kyc-movil.tsx)

Pantalla que se abre cuando el usuario escanea el QR.
Recibe por parámetros de URL: token y sesion (IDs de la sesión KYC).

Flujo de la pantalla:

PASO 1 — Validar la sesión:
- Llamar a Supabase: buscar en kyc_sesiones donde token = token recibido
- Si no existe o está expirada → mostrar error "QR caducado. Genera uno nuevo desde la web."
- Si existe y estado = 'PENDIENTE' → actualizar estado a 'ESCANEANDO' y continuar

PASO 2 — Captura del documento:
- Mostrar un visor de cámara usando expo-camera
- Overlay guía: rectángulo punteado centrado con texto "Coloca tu DNI aquí"
- Botón circular de captura en la parte inferior
- Botón para cambiar entre cámara frontal/trasera
- Instrucción: "Buena iluminación · Documento completo · Sin reflejos"

PASO 3 — Procesamiento:
- Al capturar, mostrar pantalla de carga con spinner
- Convertir la foto a base64
- Llamar a POST /api/kyc/analizar en el servidor web (usar EXPO_PUBLIC_API_URL)
  con el archivo como FormData (campo "documento")
- Si hay error → mostrar mensaje y opción de reintentar

PASO 4 — Actualizar sesión en Supabase:
- Si resultado.recomendacion = 'RECHAZAR':
  - Actualizar kyc_sesiones: estado = 'FALLIDO', datos_raw = resultado completo
  - Mostrar pantalla de error con opción "Volver a intentarlo"
- Si resultado.recomendacion = 'APROBAR' o 'REVISAR_MANUAL':
  - Actualizar kyc_sesiones:
    estado = 'COMPLETADO',
    safe_score = resultado.safe_score,
    nombre_extraido = resultado.datos_extraidos.nombre,
    apellidos_extraidos = resultado.datos_extraidos.apellidos,
    dni_extraido = resultado.datos_extraidos.numero_documento,
    tipo_documento = resultado.tipo_documento,
    datos_raw = resultado completo
  - Mostrar pantalla de éxito con el SafeScore y mensaje:
    "¡Listo! Vuelve al ordenador para continuar con tu reserva."
  - Icono de check animado (usar Animated de React Native)

### 3.2 Deep Link / URL Scheme (app.json o app.config.js)

Asegurarse de que el scheme "saferent" está configurado para poder abrir
la app desde el QR con saferent://kyc?token=...&sesion=...

Si ya existe un scheme configurado en app.json, no modificarlo.
Si no existe, añadir:
```json
"scheme": "saferent"
```
en la sección "expo" de app.json.

La ruta app/kyc-movil.tsx debe manejar también la apertura vía deep link
usando el hook useLocalSearchParams de expo-router.

═══════════════════════════════════════════════════════════════
PARTE 4 — RESTRICCIONES
═══════════════════════════════════════════════════════════════

- NO instalar dependencias nuevas salvo: qrcode.react (frontend) y
  expo-camera (si no está ya instalada en el proyecto móvil)
- NO modificar la tabla usuarios ni el schema.prisma del backend
- NO romper el flujo de subida manual que ya existe en el checkout
- La suscripción Realtime debe limpiarse siempre en el cleanup del useEffect
- El QR debe regenerarse automáticamente cuando expire (cada 15 minutos)
- Si el usuario cierra el navegador y vuelve, el Step 1 debe detectar si
  ya existe una sesión COMPLETADA reciente (< 30min) para este usuario
  y mostrar directamente el SafeScore sin pedir el QR de nuevo
- Todos los textos en español
- Respetar el sistema de estilos existente: ring-1, rounded-xl,
  shadcn Card/Button en web; NativeWind en móvil