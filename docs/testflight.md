# De tu Mac a TestFlight — los pasos exactos

Todo esto corre en TU Mac (el agente no tiene Xcode ni tus
credenciales). Orden pensado para descubrir problemas baratos
primero. Tiempo realista: 1–2 horas de trabajo + esperas de builds.

## 0. Requisitos (una vez)

```sh
# Node 22 (nvm respeta .nvmrc), pnpm, firebase-tools, eas-cli
npm i -g pnpm firebase-tools eas-cli
xcode-select --install   # si Xcode no está
```

## 1. Correr la app en el simulador (lo primero, HOY)

```sh
cd ~/Documents/MiaApp/_final/mia-tulum-app   # o la carpeta más nueva
pnpm i
pnpm typecheck && pnpm lint && pnpm test     # deben pasar como aquí
npx expo run:ios                             # compila el dev client y abre el simulador
```

- El primer `run:ios` tarda (CocoaPods + Xcode). Después: `pnpm dev`.
- La cámara del QR NO funciona en simulador — para escanear, usa el
  dispositivo físico (paso 5) o entra con habitación `204` y apellido
  `Lopez`.

## 2. Emulador de Firebase + seed + tests de reglas

```sh
firebase login
pnpm emulators          # Auth + Firestore + Functions locales
# en otra terminal:
pnpm seed               # siembra el emulador (idempotente)
pnpm test:rules         # los 19 casos de firestore.rules — NUNCA han corrido
```

Si `test:rules` falla, las reglas se corrigen ANTES de cualquier
deploy. **Y te toca leer `firestore.rules` completo, línea por línea
— versión actual con el claim `sexp`.**

## 3. Firebase real (proyecto miaapp-30191)

En la consola (https://console.firebase.google.com/project/miaapp-30191):

1. Authentication → Sign-in method → habilita **Anonymous** y **Apple**.
2. Firestore → crea la base (modo producción, us-central1).

En la terminal:

```sh
# Secretos (Secret Manager) — los valores NO van al repo
firebase functions:secrets:set QR_MASTER_SECRET   # pega un valor largo aleatorio
firebase functions:secrets:set STRIPE_TEST_KEY    # sk_test_... de tu cuenta Stripe

# Reglas + functions
firebase deploy --only firestore:rules
cd functions && pnpm i && cd ..
firebase deploy --only functions

# Sembrar el proyecto real
gcloud auth application-default login
pnpm seed:demo
```

Después del deploy, para pasar de cobros simulados a Stripe test
real: pídemelo — es escribir el adaptador `StripePaymentAdapter`
(PaymentSheet + crearPago) y cambiar una línea en
`packages/domain/di.ts`. Lo dejé fuera a propósito hasta que las
functions existan.

## 4. EAS + TestFlight

```sh
eas login                      # tu cuenta de Expo
eas init                       # crea el proyecto y llena extra.eas.projectId
eas build --profile development --platform ios   # build para TU teléfono
# instala el .ipa en tu iPhone (QR que da EAS) y prueba QR/push/cámara

eas build --profile preview --platform ios       # build para TestFlight
eas submit -p ios --latest                       # sube a App Store Connect
```

- En App Store Connect: crea la app con bundle `com.mia.app` si EAS
  no la creó; agrega tu usuario al grupo interno de TestFlight.
- El APK de Android: `eas build --profile apk --platform android` →
  enlace de instalación directa (avisa a los testers del permiso de
  orígenes desconocidos).

## 5. Prueba en dispositivo — la matriz mínima

1. **Escanear**: imprime un QR (cuando functions estén desplegadas,
   genera el token con `firmarToken` de `functions/src/qr.ts`; hay
   que escribir un mini-script `seed/qr-stickers.ts` — pídemelo).
2. **Pedir**: menú → carrito → pedido → `/kitchen` en otra sesión →
   avanzar → el cargo aparece en Tu estancia.
3. **Apartar**: mapa → hold → notificación local 10 min antes.
4. **Reservar**: Resort → detalle → checkout → confirmación con Olas.
   (La cadena escanear-pedir-apartar-reservar es lo que nunca se corta.)

## 6. Antes de la beta externa (Beta App Review)

- Notas para el revisor: la sesión de invitado funciona SIN
  credenciales (habitación `204` / apellido `Lopez`); cobros en modo
  test — tarjeta `4242 4242 4242 4242`, cualquier fecha futura y CVC.
- Política de privacidad publicada en un URL (una página simple basta).
- Export compliance: ya está `ITSAppUsesNonExemptEncryption: false`
  en app.config.ts.
- Etiquetas de privacidad en App Store Connect (identificadores:
  ninguno; datos: none mientras Sentry no esté — si activas Sentry,
  decláralo).
