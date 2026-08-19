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
import Stripe from "stripe";
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
 * idempotencia. La idempotencia vive en Stripe: la misma clave nunca
 * produce dos intents, así que un doble toque no cobra dos veces.
 */
export const crearPago = onCall({ secrets: [STRIPE_TEST_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
  const idempotencyKey = String(req.data?.idempotencyKey ?? "");
  const montoCents = Number(req.data?.montoCents ?? 0);
  const currency = String(req.data?.currency ?? "");
  const concepto = String(req.data?.concepto ?? "");
  if (!idempotencyKey) {
    throw new HttpsError("invalid-argument", "Falta clave de idempotencia");
  }
  if (!Number.isInteger(montoCents) || montoCents <= 0) {
    throw new HttpsError("invalid-argument", "Monto inválido");
  }
  if (currency !== "usd" && currency !== "mxn") {
    throw new HttpsError("invalid-argument", "Moneda inválida");
  }

  const stripe = new Stripe(STRIPE_TEST_KEY.value());
  const intent = await stripe.paymentIntents.create(
    {
      amount: montoCents,
      currency,
      description: concepto,
      automatic_payment_methods: { enabled: true },
      metadata: { uid: req.auth.uid },
    },
    { idempotencyKey },
  );

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
  };
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
 * liberarHold — libera un hold vencido y devuelve el lugar a libre,
 * en transacción. En producción la dispara una Cloud Task programada
 * al crear el hold; también sirve para liberar a mano.
 */
export const liberarHold = onCall(async (req) => {
  const holdId = String(req.data?.holdId ?? "");
  if (!holdId) throw new HttpsError("invalid-argument", "Falta holdId");
  const db = getFirestore();
  await db.runTransaction(async (tx) => {
    // Todas las lecturas ANTES de cualquier escritura (regla de
    // transacciones de Firestore)
    const holdRef = db.collection("spotHolds").doc(holdId);
    const holdSnap = await tx.get(holdRef);
    if (!holdSnap.exists) {
      throw new HttpsError("not-found", "Hold inexistente");
    }
    const hold = holdSnap.data() as { spotId: string; state: string };
    if (hold.state !== "active") return; // idempotente
    const spotRef = db.collection("spots").doc(hold.spotId);
    const spotSnap = await tx.get(spotRef);

    tx.update(holdRef, { state: "released" });
    if (spotSnap.exists && spotSnap.get("state") === "held") {
      tx.update(spotRef, { state: "free" });
    }
  });
  return { ok: true };
});

/**
 * acreditarOlas — ÚNICO escritor del ledger. El saldo siempre se
 * deriva de la suma de asientos; nunca existe un contador editable.
 * TODO(semana 7).
 */
export const acreditarOlas = onCall(async () => {
  throw new HttpsError("unimplemented", "semana-7");
});

/**
 * eliminarCuenta — borrado de cuenta a petición del usuario.
 *
 * Apple lo EXIGE para cualquier app que permita crear cuenta: sin esto,
 * la app se rechaza en revisión. También es la vía práctica para atender
 * el derecho de cancelación bajo la ley mexicana de datos personales.
 *
 * Qué borra: el perfil, las sesiones y el ledger de Olas del usuario, y
 * al final la propia cuenta de Auth.
 *
 * Qué NO borra, a propósito: los cargos ya liquidados. Un folio cerrado
 * es un registro contable del hotel y borrarlo destruiría su
 * contabilidad; se conserva desligado del perfil. El diálogo de la app
 * se lo dice al usuario antes de confirmar.
 *
 * Se niega si hay una cuenta abierta: nadie debe poder desaparecer con
 * un consumo sin pagar.
 */
export const eliminarCuenta = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
  const uid = req.auth.uid;
  const db = getFirestore();

  const abiertos = await db
    .collection("folios")
    .where("uid", "==", uid)
    .where("estado", "==", "open")
    .get();
  const conSaldo = abiertos.docs.some(
    (d) => Number(d.get("saldoCents") ?? 0) > 0,
  );
  if (conSaldo) {
    throw new HttpsError("failed-precondition", "folio-abierto");
  }

  // Borrado por lotes: cada colección con datos personales del usuario.
  const colecciones = ["profiles", "sessions", "ledger"];
  for (const col of colecciones) {
    const snap =
      col === "profiles"
        ? await db.collection(col).where("__name__", "==", uid).get()
        : await db.collection(col).where("uid", "==", uid).get();
    let lote = db.batch();
    let n = 0;
    for (const doc of snap.docs) {
      lote.delete(doc.ref);
      n += 1;
      // Firestore limita cada lote a 500 escrituras.
      if (n % 400 === 0) {
        await lote.commit();
        lote = db.batch();
      }
    }
    if (n % 400 !== 0) await lote.commit();
  }

  // El folio liquidado se conserva, pero deja de apuntar a una persona.
  const liquidados = await db
    .collection("folios")
    .where("uid", "==", uid)
    .get();
  const anon = db.batch();
  for (const doc of liquidados.docs) {
    anon.update(doc.ref, { uid: "deleted", anonimizadoAt: new Date().toISOString() });
  }
  await anon.commit();

  await getAuth().deleteUser(uid);
  return { ok: true };
});

/**
 * avanzarPedido — el ÚNICO camino para mover un pedido de estado.
 *
 * Vive en el servidor, no en el cliente, por dos razones que no son
 * cosméticas: verifica el claim `staff` (las reglas no dejan al cliente
 * escribir orders), y al entregar dispara el cargo al folio dentro de la
 * misma transacción. Si eso viviera en la app, una app cerrada a medio
 * camino dejaría un pedido entregado sin cobrar.
 *
 * Idempotente: el cargo usa la clave del pedido, así que reintentar no
 * cobra dos veces.
 */
const SIGUIENTE: Record<string, string | null> = {
  received: "preparing",
  preparing: "on-way",
  "on-way": "delivered",
  delivered: null,
};

export const avanzarPedido = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
  if (req.auth.token.staff !== true) {
    throw new HttpsError("permission-denied", "Solo personal de Mía");
  }
  const orderId = String(req.data?.orderId ?? "");
  if (!orderId) throw new HttpsError("invalid-argument", "Falta orderId");

  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    // Todas las lecturas antes de cualquier escritura: Firestore lo exige.
    const ref = db.collection("orders").doc(orderId);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Pedido inexistente");

    const estado = String(snap.get("estado") ?? "");
    const siguiente = SIGUIENTE[estado] ?? null;
    if (!siguiente) {
      throw new HttpsError("failed-precondition", "pedido-terminado");
    }

    const uid = String(snap.get("uid") ?? "");
    const totalCents = Number(snap.get("totalCents") ?? 0);

    let folioRef = null;
    let folioSnap = null;
    if (siguiente === "delivered" && uid) {
      const abiertos = await tx.get(
        db
          .collection("folios")
          .where("uid", "==", uid)
          .where("estado", "==", "open")
          .limit(1),
      );
      const primero = abiertos.docs[0];
      folioRef = primero ? primero.ref : db.collection("folios").doc();
      folioSnap = primero ?? null;
    }

    tx.update(ref, { estado: siguiente });

    if (siguiente === "delivered" && folioRef) {
      // El cargo se congela AQUI, con el total que el pedido ya traia.
      // Jamas se relee el catalogo de precios.
      const linea = {
        idempotencyKey: `order:${orderId}`,
        concepto: { es: "Pedido", en: "Order" },
        precioCents: totalCents,
        cantidad: 1,
        origen: "order",
        refId: orderId,
        createdAt: new Date().toISOString(),
      };
      if (!folioSnap) {
        tx.set(folioRef, {
          uid,
          lineas: [linea],
          saldoCents: totalCents,
          estado: "open",
        });
      } else {
        const lineas = (folioSnap.get("lineas") ?? []) as { idempotencyKey?: string }[];
        const yaEsta = lineas.some((l) => l.idempotencyKey === linea.idempotencyKey);
        if (!yaEsta) {
          tx.update(folioRef, {
            lineas: [...lineas, linea],
            saldoCents: Number(folioSnap.get("saldoCents") ?? 0) + totalCents,
          });
        }
      }
    }

    return { ok: true, estado: siguiente };
  });
});

/**
 * crearCheckout — sesión de Stripe Checkout para cobrar de verdad.
 *
 * Por qué Checkout y no el SDK nativo: el SDK de Stripe para React
 * Native obliga a compilar un módulo nativo cuya descarga colgó
 * `pod install` dos veces en la máquina de Carlos. Checkout es una
 * página alojada por Stripe que se abre en el navegador del teléfono:
 * mismo cobro real, cero código nativo, y la captura de la tarjeta
 * nunca toca nuestra app (menos superficie de cumplimiento PCI).
 *
 * El regreso es por deep link a la propia app.
 */
export const crearCheckout = onCall(
  { secrets: [STRIPE_TEST_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
    const idempotencyKey = String(req.data?.idempotencyKey ?? "");
    const montoCents = Number(req.data?.montoCents ?? 0);
    const currency = String(req.data?.currency ?? "");
    const concepto = String(req.data?.concepto ?? "Mía Tulum");
    if (!idempotencyKey) {
      throw new HttpsError("invalid-argument", "Falta clave de idempotencia");
    }
    if (!Number.isInteger(montoCents) || montoCents <= 0) {
      throw new HttpsError("invalid-argument", "Monto inválido");
    }
    if (currency !== "usd" && currency !== "mxn") {
      throw new HttpsError("invalid-argument", "Moneda inválida");
    }

    const stripe = new Stripe(STRIPE_TEST_KEY.value());
    const sesion = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: montoCents,
              product_data: { name: concepto },
            },
          },
        ],
        // El scheme de la app; el navegador devuelve al usuario aquí.
        success_url: "mia://pago?estado=ok",
        cancel_url: "mia://pago?estado=cancelado",
        metadata: { uid: req.auth.uid, idempotencyKey },
      },
      { idempotencyKey },
    );

    return { sessionId: sesion.id, url: sesion.url };
  },
);

/**
 * verificarPago — la app NUNCA decide si un cobro ocurrió.
 *
 * El navegador puede cerrarse, mentir o quedarse a medias. La única
 * fuente de verdad es Stripe, y solo el servidor puede preguntarle.
 * Devuelve `pagado: true` únicamente cuando Stripe lo confirma.
 */
export const verificarPago = onCall(
  { secrets: [STRIPE_TEST_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Sesión requerida");
    const sessionId = String(req.data?.sessionId ?? "");
    if (!sessionId) throw new HttpsError("invalid-argument", "Falta sessionId");

    const stripe = new Stripe(STRIPE_TEST_KEY.value());
    const sesion = await stripe.checkout.sessions.retrieve(sessionId);

    // Nadie puede consultar el cobro de otra persona.
    if (sesion.metadata?.uid !== req.auth.uid) {
      throw new HttpsError("permission-denied", "Sesión de otro usuario");
    }

    const pagado = sesion.payment_status === "paid";
    const intent = sesion.payment_intent;
    return {
      pagado,
      paymentIntentId: typeof intent === "string" ? intent : (intent?.id ?? ""),
    };
  },
);
