# Mía Tulum · app móvil (demo)

Demo para TestFlight del resort y beach club Mía Tulum. Las reglas del
proyecto viven en `CLAUDE.md`; el diseño es `docs/prototipo.dc.html`
(veinte pantallas, bilingüe) y es la especificación, no una referencia.

## Arranque

```sh
pnpm i
pnpm emulators     # Auth + Firestore + Functions en local
pnpm seed          # siembra el emulador (idempotente)
pnpm dev           # dev client de Expo (no Expo Go)
```

Requisitos: Node 22 (`.nvmrc`), pnpm, Java (para el emulador de
Firestore), `firebase-tools` (`npm i -g firebase-tools`), Xcode para
el simulador de iOS.

> **Expo Go no sirve para este proyecto**: cámara (QR), push y Stripe
> requieren un development build (`eas build --profile development`).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm typecheck` | TypeScript estricto, sin emitir |
| `pnpm lint` | ESLint + las dos reglas propias (hex fuera de tokens, texto literal en JSX) |
| `pnpm test` | Tests unitarios de `packages/domain` |
| `pnpm seed` | Siembra el emulador local |
| `pnpm seed:demo` | Siembra el proyecto `miaapp-30191` (requiere `gcloud auth application-default login`) |

El hook de pre-commit corre typecheck + lint (se activa solo con
`pnpm i` vía el script `prepare`).

## Estructura

```
app/(guest)/     las veinte pantallas (Expo Router)
app/(staff)/     cocina y mapa, detrás de bandera (FLAGS.staff)
packages/domain/ ports, adaptadores mock, PLACEHOLDER_PRICES, tipos
packages/ui/     tokens del prototipo y primitivas
packages/i18n/   es.json · en.json (i18next)
packages/lib/    firebase, rutas, estado de UI
functions/       Cloud Functions gen2 (validarQR con HMAC real)
seed/            contenido del demo — editar aquí y correr pnpm seed
docs/            prototipo (especificación), plan v2, ruta
```

## Entornos

- **Firebase**: proyecto `miaapp-30191` (único por ahora). Los
  archivos `google-services.json` / `GoogleService-Info.plist` están
  commiteados a propósito: son identificadores de cliente, no
  secretos. Los secretos reales (QR_MASTER_SECRET, STRIPE_TEST_KEY)
  viven en Secret Manager y nunca entran al repo.
- **Bundle ID**: `com.mia.app` (iOS y Android), registrado en Firebase.
- **Stripe**: modo test, siempre.

## Los dos archivos protegidos

`firestore.rules` y `packages/domain/PLACEHOLDER_PRICES.ts` no se
editan sin avisar explícitamente a Carlos (regla de CLAUDE.md).
