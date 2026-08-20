/**
 * Tests de firestore.rules — uno por cada prohibición.
 * Corren contra el emulador:
 *   pnpm test:rules
 * (equivale a: firebase emulators:exec --only firestore "node functions/test/rules.mjs")
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

const here = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(join(here, "../../firestore.rules"), "utf8");

const env = await initializeTestEnvironment({
  projectId: "miaapp-30191",
  firestore: { rules },
});

const EN_UNA_HORA = Date.now() + 3600_000;
const HACE_UNA_HORA = Date.now() - 3600_000;

/** Invitado con claims vigentes ligado a bed-14 */
const invitado = env
  .authenticatedContext("uid-invitado", {
    spotId: "bed-14",
    scope: ["order", "hold", "book"],
    sexp: EN_UNA_HORA,
  })
  .firestore();

/**
 * Huésped de hotel: encontró su estancia (claim roomId) Y escaneó el
 * camastro (claim spotId). Es el caso que el producto permite: estar en
 * el camastro 14 y pedir a la suite 204.
 */
const huesped = env
  .authenticatedContext("uid-huesped", {
    spotId: "bed-14",
    roomId: "room-204",
    scope: ["order", "hold", "book"],
    sexp: EN_UNA_HORA,
  })
  .firestore();

/** Usuario autenticado SIN scope (anónimo sin escanear) */
const sinScope = env.authenticatedContext("uid-sin-scope", {}).firestore();

/** Invitado con sesión VENCIDA */
const vencido = env
  .authenticatedContext("uid-vencido", {
    spotId: "bed-14",
    scope: ["order", "hold", "book"],
    sexp: HACE_UNA_HORA,
  })
  .firestore();

/** Otro usuario cualquiera */
const otro = env
  .authenticatedContext("uid-otro", {
    spotId: "bed-22",
    scope: ["order", "hold", "book"],
    sexp: EN_UNA_HORA,
  })
  .firestore();

const anon = env.unauthenticatedContext().firestore();

/** Personal de cocina: claim staff, sin scope de invitado. */
const staff = env.authenticatedContext("uid-staff", { staff: true }).firestore();

let fallas = 0;
let corridos = 0;
const caso = async (nombre, promesa) => {
  corridos += 1;
  try {
    await promesa;
    process.stdout.write(`  ok  ${nombre}\n`);
  } catch (e) {
    fallas += 1;
    process.stderr.write(`FALLA ${nombre}\n      ${e.message}\n`);
  }
};

const orderAHabitacion = (uid, roomId) => ({
  uid,
  roomId,
  lineas: [],
  totalCents: 0,
  estado: "received",
  idempotencyKey: "k-room",
  createdAt: new Date().toISOString(),
});

const orderSinDestino = (uid) => ({
  uid,
  lineas: [],
  totalCents: 0,
  estado: "received",
  idempotencyKey: "k-sin",
  createdAt: new Date().toISOString(),
});

const orderValida = (uid, spotId) => ({
  uid,
  spotId,
  lineas: [],
  totalCents: 0,
  estado: "received",
  idempotencyKey: "k1",
  createdAt: new Date().toISOString(),
});

// ---------- Catálogos ----------
await caso(
  "cualquiera lee roomTypes",
  assertSucceeds(anon.collection("roomTypes").doc("studio").get()),
);
await caso(
  "nadie escribe roomTypes desde el cliente",
  assertFails(
    invitado.collection("roomTypes").doc("studio").set({ nightly: 1 }),
  ),
);
await caso(
  "nadie escribe spots desde el cliente",
  assertFails(
    invitado.collection("spots").doc("bed-14").set({ state: "free" }),
  ),
);

// ---------- Orders ----------
await caso(
  "invitado con scope crea order en SU spot",
  assertSucceeds(
    invitado
      .collection("orders")
      .doc("o1")
      .set(orderValida("uid-invitado", "bed-14")),
  ),
);
await caso(
  "sin scope no se crea order",
  assertFails(
    sinScope
      .collection("orders")
      .doc("o2")
      .set(orderValida("uid-sin-scope", "bed-14")),
  ),
);
await caso(
  "sesión vencida no crea order",
  assertFails(
    vencido
      .collection("orders")
      .doc("o3")
      .set(orderValida("uid-vencido", "bed-14")),
  ),
);
await caso(
  "no se puede pedir al spot de OTRO",
  assertFails(
    invitado
      .collection("orders")
      .doc("o4")
      .set(orderValida("uid-invitado", "bed-22")),
  ),
);
await caso(
  "no se puede crear order a nombre de otro uid",
  assertFails(
    invitado
      .collection("orders")
      .doc("o5")
      .set(orderValida("uid-otro", "bed-14")),
  ),
);
await caso(
  "el huésped pide a SU habitación estando en el camastro",
  assertSucceeds(
    huesped
      .collection("orders")
      .doc("o-room-ok")
      .set(orderAHabitacion("uid-huesped", "room-204")),
  ),
);
await caso(
  "no se puede pedir a la habitación de OTRO",
  assertFails(
    huesped
      .collection("orders")
      .doc("o-room-ajena")
      .set(orderAHabitacion("uid-huesped", "room-311")),
  ),
);
await caso(
  "sin habitación en el token no se pide a ninguna habitación",
  assertFails(
    invitado
      .collection("orders")
      .doc("o-room-sin-claim")
      .set(orderAHabitacion("uid-invitado", "room-204")),
  ),
);
await caso(
  "una order sin destino se rechaza",
  assertFails(
    huesped
      .collection("orders")
      .doc("o-sin-destino")
      .set(orderSinDestino("uid-huesped")),
  ),
);
await caso(
  "el dueño lee su order",
  assertSucceeds(invitado.collection("orders").doc("o1").get()),
);
await caso(
  "otro uid NO lee la order ajena",
  assertFails(otro.collection("orders").doc("o1").get()),
);
await caso(
  "el cliente no actualiza orders (solo functions)",
  assertFails(
    invitado.collection("orders").doc("o1").update({ estado: "delivered" }),
  ),
);
await caso(
  "el cliente no borra orders",
  assertFails(invitado.collection("orders").doc("o1").delete()),
);

// ---------- Holds ----------
await caso(
  "invitado con scope crea hold propio",
  assertSucceeds(
    invitado.collection("spotHolds").doc("h1").set({
      uid: "uid-invitado",
      spotId: "bed-14",
      arrivalAt: new Date().toISOString(),
      expiresAt: new Date(EN_UNA_HORA).toISOString(),
      state: "active",
    }),
  ),
);
await caso(
  "sin scope no hay hold",
  assertFails(
    sinScope.collection("spotHolds").doc("h2").set({
      uid: "uid-sin-scope",
      spotId: "bed-14",
      state: "active",
    }),
  ),
);
await caso(
  "el cliente no libera holds a mano (solo liberarHold)",
  assertFails(
    invitado.collection("spotHolds").doc("h1").update({ state: "released" }),
  ),
);

// ---------- Ledger ----------
await caso(
  "NADIE escribe el ledger desde el cliente",
  assertFails(
    invitado.collection("ledger").doc("l1").set({
      uid: "uid-invitado",
      delta: 999999,
      motivo: "hack",
    }),
  ),
);

// ---------- Perfiles y sesiones ----------
await caso(
  "cada quien escribe SOLO su perfil",
  assertFails(
    invitado.collection("guests").doc("uid-otro").set({ idioma: "es" }),
  ),
);
await caso(
  "perfil propio sí",
  assertSucceeds(
    invitado.collection("guests").doc("uid-invitado").set({ idioma: "es" }),
  ),
);
await caso(
  "el cliente no escribe sessions (las emite validarQR)",
  assertFails(
    invitado.collection("sessions").doc("uid-invitado").set({ spotId: "x" }),
  ),
);

// ---------- Personal (claim staff) ----------
await caso(
  "la cocina lee pedidos de cualquiera",
  assertSucceeds(staff.collection("orders").doc("o-1").get()),
);
await caso(
  "el staff NO avanza pedidos escribiendo directo (es de avanzarPedido)",
  assertFails(
    staff.collection("orders").doc("o-1").update({ estado: "delivered" }),
  ),
);
await caso(
  "el staff NO lee folios ajenos",
  assertFails(staff.collection("folios").doc("f-otro").get()),
);
await caso(
  "el staff NO escribe el ledger",
  assertFails(staff.collection("ledger").doc("l-1").set({ delta: 9999 })),
);
await caso(
  "un invitado NO puede leer pedidos ajenos aunque se diga staff",
  assertFails(sinScope.collection("orders").doc("o-1").get()),
);

// ---------- Lo no listado ----------
await caso(
  "la lista de huéspedes (stays) NO se lee desde el cliente",
  assertFails(huesped.collection("stays").doc("stay-204-lopez").get()),
);
await caso(
  "nadie escribe su propio contador de intentos",
  assertFails(
    huesped.collection("intentosEstancia").doc("uid-huesped").set({ intentos: 0 }),
  ),
);
await caso(
  "colección desconocida: prohibida",
  assertFails(invitado.collection("loQueSea").doc("x").set({ a: 1 })),
);

await env.cleanup();
process.stdout.write(`\n${corridos} casos, ${fallas} fallas\n`);
process.exit(fallas > 0 ? 1 : 0);
