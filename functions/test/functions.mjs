/**
 * Pruebas de integración de las Cloud Functions, contra los emuladores
 * de Auth, Firestore y Functions.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. El 20-ago-2026 las once functions decían
 * `ACTIVE` en `gcloud functions describe` mientras casi todas fallaban:
 * primero porque la cuenta de servicio no tenía permisos de Firestore ni
 * de Auth, y después porque Cloud Run rechazaba las llamadas con 401
 * antes de ejecutar una sola línea. Ninguna de las dos cosas se ve desde
 * fuera. **La única prueba de que una function sirve es llamarla.**
 *
 * Estas pruebas la llaman como la llamaría el teléfono: con el SDK de
 * cliente, con un token real y con los claims puestos por el servidor.
 *
 * Uso:  pnpm test:fn
 */
import { initializeApp as initAdmin } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminDb } from "firebase-admin/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from "firebase/functions";

const PROYECTO = "miaapp-30191";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

initAdmin({ projectId: PROYECTO });
const adminAuth = getAdminAuth();
const adminDb = getAdminDb();

const app = initializeApp({ projectId: PROYECTO, apiKey: "fake-api-key" });
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const fns = getFunctions(app, "us-central1");
connectFunctionsEmulator(fns, "127.0.0.1", 5001);

// ---------- arnés ----------
let corridos = 0;
let fallas = 0;
const say = (m) => process.stdout.write(`${m}\n`);

async function caso(nombre, fn) {
  corridos += 1;
  try {
    await fn();
    say(`  ok  ${nombre}`);
  } catch (e) {
    fallas += 1;
    say(`  FALLA  ${nombre}`);
    say(`         ${e?.message ?? e}`);
  }
}

const iguales = (a, b, que) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${que}: esperaba ${JSON.stringify(b)}, vino ${JSON.stringify(a)}`);
  }
};
const cierto = (v, que) => {
  if (!v) throw new Error(que);
};

/** Espera que la llamada falle con este code de callable. */
async function falla(promesa, codeEsperado) {
  try {
    await promesa;
  } catch (e) {
    const code = e?.code ?? "";
    if (codeEsperado && code !== codeEsperado) {
      throw new Error(`esperaba ${codeEsperado}, vino ${code}`);
    }
    return e;
  }
  throw new Error(`esperaba que fallara con ${codeEsperado}, y no falló`);
}

/** Entra como `uid` con los claims dados y devuelve el llamador. */
async function entrar(uid, claims = {}) {
  await adminAuth.createUser({ uid }).catch(() => {});
  await adminAuth.setCustomUserClaims(uid, claims);
  const token = await adminAuth.createCustomToken(uid, {});
  await signInWithCustomToken(auth, token);
  // Los claims viajan DENTRO del token: sin refrescar, el servidor ve
  // el anterior. Es el mismo detalle que en la app.
  await auth.currentUser.getIdToken(true);
  return (nombre, datos) => httpsCallable(fns, nombre)(datos ?? {});
}

// ---------- datos de partida ----------
await adminDb.collection("stays").doc("stay-204-lopez").set({
  habitacion: "204",
  apellido: "lopez",
  huesped: "López",
  roomId: "room-204",
  desde: "2026-08-15",
  hasta: "2026-08-19",
  huespedes: 2,
  plan: "bb",
  folioId: "folio-demo-204",
  estado: "in-house",
});

say("\n--- buscarEstancia ---");

await caso("sin sesión, rechazada", async () => {
  await signOut(auth);
  await falla(
    httpsCallable(fns, "buscarEstancia")({ habitacion: "204", apellido: "Lopez" }),
    "functions/unauthenticated",
  );
});

await caso("acierto: escribe los claims que leen las reglas", async () => {
  const llamar = await entrar("u-estancia-ok");
  const { data } = await llamar("buscarEstancia", {
    habitacion: "204",
    apellido: "Lopez",
  });
  iguales(data.estancia.roomId, "room-204", "roomId devuelto");
  const u = await adminAuth.getUser("u-estancia-ok");
  iguales(u.customClaims.roomId, "room-204", "claim roomId");
  cierto(u.customClaims.scope.includes("order"), "el claim scope trae 'order'");
  cierto(u.customClaims.sexp > Date.now(), "el permiso vence en el futuro");
});

await caso("el apellido va sin distinguir mayúsculas", async () => {
  const llamar = await entrar("u-estancia-mayus");
  const { data } = await llamar("buscarEstancia", {
    habitacion: "204",
    apellido: "  LOPEZ  ",
  });
  iguales(data.estancia.roomId, "room-204", "roomId con mayúsculas y espacios");
});

await caso("apellido equivocado: no encontrado", async () => {
  const llamar = await entrar("u-estancia-mal");
  await falla(
    llamar("buscarEstancia", { habitacion: "204", apellido: "Perez" }),
    "functions/not-found",
  );
});

await caso("una estancia con check-out NO da permiso", async () => {
  await adminDb.collection("stays").doc("stay-ido").set({
    habitacion: "999",
    apellido: "ido",
    roomId: "room-999",
    desde: "2026-01-01",
    hasta: "2026-01-02",
    huespedes: 1,
    plan: "bb",
    folioId: "f-ido",
    estado: "checked-out",
  });
  const llamar = await entrar("u-checkout");
  await falla(
    llamar("buscarEstancia", { habitacion: "999", apellido: "ido" }),
    "functions/not-found",
  );
});

await caso("al tercer intento fallido, freno del SERVIDOR", async () => {
  const llamar = await entrar("u-freno");
  await falla(llamar("buscarEstancia", { habitacion: "204", apellido: "a" }));
  await falla(llamar("buscarEstancia", { habitacion: "204", apellido: "b" }));
  // El tercero ya bloquea, y a partir de ahí ni el acierto sirve.
  await falla(
    llamar("buscarEstancia", { habitacion: "204", apellido: "c" }),
    "functions/resource-exhausted",
  );
  await falla(
    llamar("buscarEstancia", { habitacion: "204", apellido: "Lopez" }),
    "functions/resource-exhausted",
  );
});

await caso("el acierto borra el contador de intentos", async () => {
  const llamar = await entrar("u-freno-limpio");
  await falla(llamar("buscarEstancia", { habitacion: "204", apellido: "x" }));
  await llamar("buscarEstancia", { habitacion: "204", apellido: "Lopez" });
  const doc = await adminDb.collection("intentosEstancia").doc("u-freno-limpio").get();
  iguales(doc.get("intentos"), 0, "intentos tras acertar");
});

await caso("no conserva claims ajenos por accidente: staff sobrevive", async () => {
  const llamar = await entrar("u-staff-estancia", { staff: true });
  await llamar("buscarEstancia", { habitacion: "204", apellido: "Lopez" });
  const u = await adminAuth.getUser("u-staff-estancia");
  iguales(u.customClaims.staff, true, "claim staff tras buscar estancia");
  iguales(u.customClaims.roomId, "room-204", "claim roomId");
});

say("\n--- identidadAppleExiste ---");

await caso("sin sesión, rechazada", async () => {
  await signOut(auth);
  await falla(
    httpsCallable(fns, "identidadAppleExiste")({ appleUserId: "000750.abc" }),
    "functions/unauthenticated",
  );
});

await caso("identificador muy corto: argumento inválido", async () => {
  const llamar = await entrar("u-apple-corto");
  await falla(
    llamar("identidadAppleExiste", { appleUserId: "x" }),
    "functions/invalid-argument",
  );
});

await caso("identidad desconocida: existe = false", async () => {
  const llamar = await entrar("u-apple-no");
  const { data } = await llamar("identidadAppleExiste", {
    appleUserId: "000750.noexiste.0000",
  });
  iguales(data.existe, false, "existe");
});

say("\n--- avanzarPedido ---");

const nuevoPedido = async (id, uid, totalCents = 1500) => {
  await adminDb.collection("orders").doc(id).set({
    uid,
    roomId: "room-204",
    lineas: [],
    totalCents,
    estado: "received",
    idempotencyKey: `k-${id}`,
    createdAt: new Date().toISOString(),
  });
};

await caso("un huésped NO puede avanzar pedidos", async () => {
  await nuevoPedido("o-guest", "u-huesped");
  const llamar = await entrar("u-huesped");
  await falla(
    llamar("avanzarPedido", { orderId: "o-guest" }),
    "functions/permission-denied",
  );
});

await caso("el personal avanza received → preparing → on-way → delivered", async () => {
  await nuevoPedido("o-avance", "u-cliente-1");
  const llamar = await entrar("u-cocina", { staff: true });
  iguales((await llamar("avanzarPedido", { orderId: "o-avance" })).data.estado, "preparing", "1er avance");
  iguales((await llamar("avanzarPedido", { orderId: "o-avance" })).data.estado, "on-way", "2do avance");
  iguales((await llamar("avanzarPedido", { orderId: "o-avance" })).data.estado, "delivered", "3er avance");
});

await caso("un pedido entregado ya no avanza más", async () => {
  const llamar = await entrar("u-cocina", { staff: true });
  await falla(
    llamar("avanzarPedido", { orderId: "o-avance" }),
    "functions/failed-precondition",
  );
});

await caso("al entregar, el cargo aparece en el folio", async () => {
  await nuevoPedido("o-cargo", "u-cliente-2", 2500);
  const llamar = await entrar("u-cocina", { staff: true });
  for (let i = 0; i < 3; i += 1) await llamar("avanzarPedido", { orderId: "o-cargo" });
  const folios = await adminDb
    .collection("folios")
    .where("uid", "==", "u-cliente-2")
    .get();
  iguales(folios.size, 1, "folios del cliente");
  const f = folios.docs[0];
  iguales(f.get("saldoCents"), 2500, "saldo del folio");
  iguales(f.get("lineas")[0].idempotencyKey, "order:o-cargo", "clave de idempotencia");
});

await caso("el cargo NO se duplica sobre un folio que ya lo tiene", async () => {
  // Se fuerza el caso: el pedido vuelve a 'on-way' y se entrega otra vez.
  // Es lo que pasaria con un reintento de la cocina por mala señal.
  await adminDb.collection("orders").doc("o-cargo").update({ estado: "on-way" });
  const llamar = await entrar("u-cocina", { staff: true });
  await llamar("avanzarPedido", { orderId: "o-cargo" });
  const folios = await adminDb
    .collection("folios")
    .where("uid", "==", "u-cliente-2")
    .get();
  iguales(folios.docs[0].get("saldoCents"), 2500, "saldo tras reentrega");
  iguales(folios.docs[0].get("lineas").length, 1, "líneas del folio");
});

await caso("pedido inexistente: not-found", async () => {
  const llamar = await entrar("u-cocina", { staff: true });
  await falla(
    llamar("avanzarPedido", { orderId: "no-existe" }),
    "functions/not-found",
  );
});

say("\n--- eliminarCuenta ---");

await caso("con folio abierto y saldo, se niega", async () => {
  const llamar = await entrar("u-borrar-con-saldo");
  await adminDb.collection("folios").doc("f-con-saldo").set({
    uid: "u-borrar-con-saldo",
    lineas: [],
    saldoCents: 4200,
    estado: "open",
  });
  await falla(llamar("eliminarCuenta"), "functions/failed-precondition");
  cierto(await adminAuth.getUser("u-borrar-con-saldo"), "el usuario sigue existiendo");
});

await caso("borra perfil, sesiones y ledger, y anonimiza el folio liquidado", async () => {
  const uid = "u-borrar-ok";
  const llamar = await entrar(uid);
  await adminDb.collection("profiles").doc(uid).set({ nombre: "X" });
  await adminDb.collection("sessions").doc(uid).set({ uid, spotId: "bed-1" });
  await adminDb.collection("ledger").doc("l-1").set({ uid, delta: 100 });
  await adminDb.collection("folios").doc("f-liquidado").set({
    uid,
    lineas: [],
    saldoCents: 0,
    estado: "settled",
  });

  await llamar("eliminarCuenta");

  iguales((await adminDb.collection("profiles").doc(uid).get()).exists, false, "perfil");
  iguales((await adminDb.collection("sessions").doc(uid).get()).exists, false, "sesión");
  iguales((await adminDb.collection("ledger").doc("l-1").get()).exists, false, "ledger");
  const folio = await adminDb.collection("folios").doc("f-liquidado").get();
  cierto(folio.exists, "el folio liquidado SIGUE existiendo (es contabilidad)");
  iguales(folio.get("uid"), "deleted", "el folio quedó anonimizado");
  const u = await adminAuth.getUser(uid).catch(() => null);
  iguales(u, null, "el usuario de Auth ya no existe");
});

say("\n--- liberarHold ---");

await caso("sin sesión, rechazada", async () => {
  await signOut(auth);
  await falla(
    httpsCallable(fns, "liberarHold")({ holdId: "h-x" }),
    "functions/unauthenticated",
  );
});

await caso("nadie libera el camastro de OTRO huésped", async () => {
  await adminDb.collection("spotHolds").doc("h-ajeno").set({
    uid: "u-dueno-hold",
    spotId: "bed-30",
    arrivalAt: "12:00",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    state: "active",
  });
  const llamar = await entrar("u-intruso");
  await falla(
    llamar("liberarHold", { holdId: "h-ajeno" }),
    "functions/permission-denied",
  );
  const h = await adminDb.collection("spotHolds").doc("h-ajeno").get();
  iguales(h.get("state"), "active", "el hold sigue activo");
});

await caso("el dueño libera el suyo y el lugar vuelve a estar libre", async () => {
  await adminDb.collection("spots").doc("bed-31").set({ id: "bed-31", state: "held" });
  await adminDb.collection("spotHolds").doc("h-propio").set({
    uid: "u-dueno-2",
    spotId: "bed-31",
    arrivalAt: "12:00",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    state: "active",
  });
  const llamar = await entrar("u-dueno-2");
  await llamar("liberarHold", { holdId: "h-propio" });
  iguales(
    (await adminDb.collection("spotHolds").doc("h-propio").get()).get("state"),
    "released",
    "estado del hold",
  );
  iguales(
    (await adminDb.collection("spots").doc("bed-31").get()).get("state"),
    "free",
    "el camastro quedó libre",
  );
});

await caso("el personal SÍ libera el de cualquiera", async () => {
  await adminDb.collection("spots").doc("bed-32").set({ id: "bed-32", state: "held" });
  await adminDb.collection("spotHolds").doc("h-staff").set({
    uid: "u-cualquiera",
    spotId: "bed-32",
    arrivalAt: "12:00",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    state: "active",
  });
  const llamar = await entrar("u-cocina", { staff: true });
  await llamar("liberarHold", { holdId: "h-staff" });
  iguales(
    (await adminDb.collection("spotHolds").doc("h-staff").get()).get("state"),
    "released",
    "estado del hold",
  );
});

say("\n--- cerrarFolio ---");

const nuevoFolio = async (id, uid, saldoCents, estado = "open") =>
  adminDb.collection("folios").doc(id).set({
    uid,
    lineas: [{ idempotencyKey: "x", precioCents: saldoCents, cantidad: 1 }],
    saldoCents,
    estado,
  });

await caso("sin sesión, rechazada", async () => {
  await signOut(auth);
  await falla(
    httpsCallable(fns, "cerrarFolio")({ folioId: "f", idempotencyKey: "k" }),
    "functions/unauthenticated",
  );
});

await caso("no se liquida la cuenta de OTRO", async () => {
  await nuevoFolio("f-ajeno", "u-dueno-folio", 5000);
  const llamar = await entrar("u-intruso-folio");
  await falla(
    llamar("cerrarFolio", { folioId: "f-ajeno", idempotencyKey: "k1" }),
    "functions/permission-denied",
  );
  iguales(
    (await adminDb.collection("folios").doc("f-ajeno").get()).get("estado"),
    "open",
    "el folio ajeno sigue abierto",
  );
});

await caso("el dueño liquida, y el saldo se CONSERVA para cuadrar con Stripe", async () => {
  await nuevoFolio("f-mio", "u-paga", 7300);
  const llamar = await entrar("u-paga");
  const { data } = await llamar("cerrarFolio", {
    folioId: "f-mio",
    idempotencyKey: "k-pago-1",
    metodo: "stripe_test",
    paymentIntentId: "pi_123",
  });
  iguales(data.saldoCents, 7300, "saldo devuelto");
  const f = await adminDb.collection("folios").doc("f-mio").get();
  iguales(f.get("estado"), "settled", "estado");
  iguales(f.get("saldoCents"), 7300, "el saldo NO se pone en cero");
  iguales(f.get("pago").paymentIntentId, "pi_123", "referencia del pago");
});

await caso("pagar dos veces no vuelve a liquidar", async () => {
  const llamar = await entrar("u-paga");
  const { data } = await llamar("cerrarFolio", {
    folioId: "f-mio",
    idempotencyKey: "k-pago-1",
  });
  iguales(data.yaEstaba, true, "yaEstaba");
});

say("\n--- acreditarOlas ---");

await adminDb.doc("config/olas").set({
  porDolar: { arena: 1, marea: 2, cenote: 3, "circulo-interior": 5 },
  bonoPorReferido: 500,
});

await caso("sin sesión, rechazada", async () => {
  await signOut(auth);
  await falla(
    httpsCallable(fns, "acreditarOlas")({ motivo: "referido", idempotencyKey: "k" }),
    "functions/unauthenticated",
  );
});

await caso("el cliente NO decide cuántas Olas se lleva", async () => {
  await nuevoFolio("f-olas", "u-olas", 10000, "settled");
  const llamar = await entrar("u-olas");
  // Se manda un delta absurdo: la function ni lo mira.
  const { data } = await llamar("acreditarOlas", {
    motivo: "folio-liquidado",
    refId: "f-olas",
    idempotencyKey: "k-olas-1",
    delta: 999999,
  });
  // $100 de consumo × tasa 1 (nivel arena, sin perfil) = 100 Olas.
  iguales(data.delta, 100, "delta calculado por el servidor");
});

await caso("el nivel del miembro cambia la tasa", async () => {
  await adminDb.collection("members").doc("u-olas-vip").set({ tier: "cenote" });
  await nuevoFolio("f-olas-vip", "u-olas-vip", 10000, "settled");
  const llamar = await entrar("u-olas-vip");
  const { data } = await llamar("acreditarOlas", {
    motivo: "folio-liquidado",
    refId: "f-olas-vip",
    idempotencyKey: "k-olas-vip",
  });
  iguales(data.delta, 300, "delta con tasa de cenote");
});

await caso("la misma clave no acredita dos veces", async () => {
  const llamar = await entrar("u-olas");
  const { data } = await llamar("acreditarOlas", {
    motivo: "folio-liquidado",
    refId: "f-olas",
    idempotencyKey: "k-olas-1",
  });
  iguales(data.repetido, true, "repetido");
  const asientos = await adminDb
    .collection("ledger")
    .where("uid", "==", "u-olas")
    .get();
  iguales(asientos.size, 1, "asientos en el ledger");
});

await caso("no se acreditan Olas por el folio de otro", async () => {
  const llamar = await entrar("u-olas-ladron");
  await falla(
    llamar("acreditarOlas", {
      motivo: "folio-liquidado",
      refId: "f-olas",
      idempotencyKey: "k-robo",
    }),
    "functions/permission-denied",
  );
});

await caso("un motivo inventado se rechaza", async () => {
  const llamar = await entrar("u-olas");
  await falla(
    llamar("acreditarOlas", { motivo: "regalo", idempotencyKey: "k-regalo" }),
    "functions/invalid-argument",
  );
});

await caso("el bono por referido sale de la configuración", async () => {
  const llamar = await entrar("u-referido");
  const { data } = await llamar("acreditarOlas", {
    motivo: "referido",
    refId: "u-amigo",
    idempotencyKey: "k-ref-1",
  });
  iguales(data.delta, 500, "bono");
});

say("\n--- crearPedido ---");

await adminDb.collection("menuItems").doc("pulpo").set({
  nombre: { es: "Pulpo", en: "Octopus" },
  precioCents: 2800,
});
await adminDb.collection("menuItems").doc("desayuno").set({
  nombre: { es: "Desayuno", en: "Breakfast" },
  precioCents: null, // incluido en el plan
});

const CLAIMS_HUESPED = {
  roomId: "room-204",
  spotId: "bed-14",
  scope: ["order", "hold", "book"],
  sexp: Date.now() + 3600_000,
};

await caso("sin sesión, rechazado", async () => {
  await signOut(auth);
  await falla(
    httpsCallable(fns, "crearPedido")({ idempotencyKey: "k", items: [] }),
    "functions/unauthenticated",
  );
});

await caso("sin scope de pedir, rechazado", async () => {
  const llamar = await entrar("u-sin-scope-pedido");
  await falla(
    llamar("crearPedido", {
      roomId: "room-204",
      idempotencyKey: "k-sin",
      items: [{ menuItemId: "pulpo", cantidad: 1 }],
    }),
    "functions/permission-denied",
  );
});

await caso("con la sesión vencida, rechazado", async () => {
  const llamar = await entrar("u-vencido-pedido", {
    ...CLAIMS_HUESPED,
    sexp: Date.now() - 1000,
  });
  await falla(
    llamar("crearPedido", {
      roomId: "room-204",
      idempotencyKey: "k-vencido",
      items: [{ menuItemId: "pulpo", cantidad: 1 }],
    }),
    "functions/permission-denied",
  );
});

await caso("no se pide a la habitación de otro", async () => {
  const llamar = await entrar("u-pide-ajeno", CLAIMS_HUESPED);
  await falla(
    llamar("crearPedido", {
      roomId: "room-999",
      idempotencyKey: "k-ajeno",
      items: [{ menuItemId: "pulpo", cantidad: 1 }],
    }),
    "functions/permission-denied",
  );
});

await caso("el huésped pide a SU suite estando en el camastro", async () => {
  const llamar = await entrar("u-pide-ok", CLAIMS_HUESPED);
  const { data } = await llamar("crearPedido", {
    roomId: "room-204",
    idempotencyKey: "k-ok-1",
    items: [{ menuItemId: "pulpo", cantidad: 2 }],
  });
  iguales(data.totalCents, 5600, "total calculado por el servidor");
  iguales(data.estado, "received", "estado inicial");
  iguales(data.roomId, "room-204", "destino");
});

await caso("el precio lo pone el CATÁLOGO, no el teléfono", async () => {
  const llamar = await entrar("u-precio-falso", CLAIMS_HUESPED);
  const { data } = await llamar("crearPedido", {
    roomId: "room-204",
    idempotencyKey: "k-falso",
    // Se manda un precio de un centavo: la function ni lo mira.
    items: [{ menuItemId: "pulpo", cantidad: 1, precioCents: 1 }],
  });
  iguales(data.totalCents, 2800, "total con el precio real");
  iguales(data.lineas[0].precioCents, 2800, "precio congelado de la línea");
});

await caso("lo incluido en el plan no genera cargo, y se marca", async () => {
  const llamar = await entrar("u-incluido", CLAIMS_HUESPED);
  const { data } = await llamar("crearPedido", {
    roomId: "room-204",
    idempotencyKey: "k-incluido",
    items: [{ menuItemId: "desayuno", cantidad: 1 }],
  });
  iguales(data.totalCents, 0, "total");
  iguales(data.lineas[0].incluido, true, "marcado como incluido");
});

await caso("un platillo inventado se rechaza", async () => {
  const llamar = await entrar("u-inventado", CLAIMS_HUESPED);
  await falla(
    llamar("crearPedido", {
      roomId: "room-204",
      idempotencyKey: "k-inventado",
      items: [{ menuItemId: "caviar-imaginario", cantidad: 1 }],
    }),
    "functions/not-found",
  );
});

await caso("un pedido vacío se rechaza", async () => {
  const llamar = await entrar("u-vacio", CLAIMS_HUESPED);
  await falla(
    llamar("crearPedido", {
      roomId: "room-204",
      idempotencyKey: "k-vacio",
      items: [],
    }),
    "functions/invalid-argument",
  );
});

await caso("el doble toque no crea dos pedidos", async () => {
  const llamar = await entrar("u-doble", CLAIMS_HUESPED);
  const uno = await llamar("crearPedido", {
    roomId: "room-204",
    idempotencyKey: "k-doble",
    items: [{ menuItemId: "pulpo", cantidad: 1 }],
  });
  const dos = await llamar("crearPedido", {
    roomId: "room-204",
    idempotencyKey: "k-doble",
    items: [{ menuItemId: "pulpo", cantidad: 1 }],
  });
  iguales(dos.data.repetido, true, "el segundo es el mismo");
  iguales(dos.data.id, uno.data.id, "mismo id");
  const todos = await adminDb
    .collection("orders")
    .where("uid", "==", "u-doble")
    .get();
  iguales(todos.size, 1, "pedidos en la base");
});

// ---------- cierre ----------
say("");
say(`${corridos} casos, ${fallas} fallas`);
process.exit(fallas > 0 ? 1 : 0);
