/**
 * Cloud Functions gen2 — la única puerta de escritura confiable.
 * Una function existe solo cuando hay un secreto que guardar o una
 * decisión en la que no se puede confiar al cliente.
 *
 * Semana 1: estructura y contratos. validarQR ya trae la lógica HMAC
 * real; el resto son puertas con validación de entrada y TODOs de la
 * semana que les toca (ver docs/ruta.dc.html).
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { cierreDelDiaMs, validarToken } from "./qr.js";

initializeApp();

/** Secreto maestro del QR — vive en Secret Manager, jamás en el repo */
const QR_MASTER_SECRET = defineSecret("QR_MASTER_SECRET");
/** Clave de Stripe en modo test — Secret Manager */
const STRIPE_TEST_KEY = defineSecret("STRIPE_TEST_KEY");

const SCOPE_INVITADO = ["order", "hold", "book"] as const;

/**
 * validarQR — comprueba el token del sticker y escribe custom claims
 * en el UID anónimo: spotId, scope y vencimiento al cierre del día.
 * El scope del invitado nunca incluye abrir una puerta ni escribir
 * en el ledger.
 */
export const validarQR = onCall(
  { secrets: [QR_MASTER_SECRET] },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Sesión requerida");
    }
    const spotId = String(req.data?.spotId ?? "");
    const token = String(req.data?.token ?? "");
    if (!spotId || !token) {
      throw new HttpsError("invalid-argument", "Faltan spotId o token");
    }

    const res = validarToken(QR_MASTER_SECRET.value(), spotId, token);
    if (!res.ok) {
      throw new HttpsError(
        "permission-denied",
        res.motivo === "vencido" ? "qr-vencido" : "qr-invalido",
      );
    }

    // 'exp' es claim reservado del JWT: el vencimiento de la sesión
    // viaja como 'sexp' (ms epoch) — ver decisión en claude/estado.md
    const sexp = cierreDelDiaMs();
    await getAuth().setCustomUserClaims(req.auth.uid, {
      spotId,
      scope: [...SCOPE_INVITADO],
      sexp,
    });

    const db = getFirestore();
    await db.collection("sessions").doc(req.auth.uid).set(
      {
        uid: req.auth.uid,
        spotId,
        scope: [...SCOPE_INVITADO],
        expiresAt: new Date(sexp).toISOString(),
      },
      { merge: true },
    );

    return { spotId, scope: SCOPE_INVITADO, sexp };
  },
);

/**
 * buscarEstancia — habitación + apellido, verificado en el servidor.
 * La app nunca recibe la lista de huéspedes.
 * TODO(semana 2): bloqueo tras tres intentos fallidos (10 min) y
 * emisión de claims con roomId.
 */
export const buscarEstancia = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
  const habitacion = String(req.data?.habitacion ?? "").trim();
  const apellido = String(req.data?.apellido ?? "").trim().toLowerCase();
  if (!habitacion || !apellido) {
    throw new HttpsError("invalid-argument", "Faltan habitación o apellido");
  }
  throw new HttpsError("unimplemented", "semana-2");
});

/**
 * crearPago — PaymentIntent de Stripe (modo test) con clave de
 * idempotencia. TODO(semana 4): implementación con STRIPE_TEST_KEY.
 */
export const crearPago = onCall({ secrets: [STRIPE_TEST_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
  const idempotencyKey = String(req.data?.idempotencyKey ?? "");
  if (!idempotencyKey) {
    throw new HttpsError("invalid-argument", "Falta clave de idempotencia");
  }
  throw new HttpsError("unimplemented", "semana-4");
});

/**
 * cerrarFolio — liquida el folio y dispara la acreditación de Olas.
 * TODO(semana 6).
 */
export const cerrarFolio = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
  throw new HttpsError("unimplemented", "semana-6");
});

/**
 * liberarHold — disparada por Cloud Task programada al crear el hold.
 * TODO(semana 4): handler HTTP de tareas + push de aviso previo.
 */
export const liberarHold = onCall(async () => {
  throw new HttpsError("unimplemented", "semana-4");
});

/**
 * acreditarOlas — ÚNICO escritor del ledger. El saldo siempre se
 * deriva de la suma de asientos; nunca existe un contador editable.
 * TODO(semana 7).
 */
export const acreditarOlas = onCall(async () => {
  throw new HttpsError("unimplemented", "semana-7");
});
