/**
 * Chequeo de salud del proyecto REAL (miaapp-30191).
 *
 * Responde dos preguntas que ninguna prueba local puede responder:
 *
 *   1. ¿Las functions se pueden LLAMAR? El 20-ago-2026 las once decían
 *      `ACTIVE` y Cloud Run rechazaba las llamadas con 401 antes de
 *      ejecutar una línea. Aquí se distinguen los dos casos sin
 *      credenciales de nadie: se llama a cada function **sin sesión**.
 *        · Si responde el error `UNAUTHENTICATED` en JSON, el código
 *          CORRIÓ — la function vive y el permiso de invocación existe.
 *        · Si responde 401/403 sin cuerpo JSON, el rechazo es de Cloud
 *          Run: falta `roles/run.invoker` para `allUsers`.
 *        · Cualquier 500 es la function reventando de verdad.
 *      Nunca se manda un token: este chequeo no puede cambiar nada.
 *
 *   2. ¿El contenido sembrado sigue completo? Requiere credenciales de
 *      administrador (`gcloud auth application-default login`).
 *
 * Uso:
 *   node scripts/salud.mjs            (todo)
 *   node scripts/salud.mjs functions  (solo lo que no necesita permisos)
 */
const PROYECTO = "miaapp-30191";
const REGION = "us-central1";
const say = (m) => process.stdout.write(`${m}\n`);

const FUNCTIONS = [
  "validarQR",
  "buscarEstancia",
  "crearPago",
  "cerrarFolio",
  "liberarHold",
  "acreditarOlas",
  "eliminarCuenta",
  "avanzarPedido",
  "crearCheckout",
  "verificarPago",
  "identidadAppleExiste",
  "crearPedido",
];

/** Lo que el seed debe dejar. Si cambia el seed, se cambia aquí. */
const ESPERADO = {
  roomTypes: 13,
  ratePlans: 2,
  spots: 26,
  menuItems: 20,
  wellnessSlots: 4,
  shuttles: 3,
  content: 7,
  config: 2,
  stays: 1,
};

let fallas = 0;

async function revisarFunctions() {
  say("== ¿Se pueden llamar las functions? ==");
  for (const f of FUNCTIONS) {
    const url = `https://${REGION}-${PROYECTO}.cloudfunctions.net/${f}`;
    let veredicto;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {} }),
      });
      const cuerpo = await r.text();
      const esJson = cuerpo.trim().startsWith("{");
      if (esJson && cuerpo.includes("UNAUTHENTICATED")) {
        veredicto = "ok  · viva y exigiendo sesión";
      } else if (esJson && r.status === 500) {
        veredicto = `FALLA · revienta al correr (500): ${cuerpo.slice(0, 90)}`;
      } else if (!esJson && (r.status === 401 || r.status === 403)) {
        veredicto = `FALLA · Cloud Run la rechaza (${r.status}); falta permiso de invocación`;
      } else if (esJson) {
        // Alguna function podría validar argumentos antes que la sesión.
        veredicto = `ok? · respondió JSON ${r.status}: ${cuerpo.slice(0, 70)}`;
      } else {
        veredicto = `FALLA · respuesta inesperada ${r.status}: ${cuerpo.slice(0, 70)}`;
      }
    } catch (e) {
      veredicto = `FALLA · no respondió: ${e.message}`;
    }
    if (veredicto.startsWith("FALLA")) fallas += 1;
    say(`  ${f.padEnd(22)} ${veredicto}`);
  }
  say("");
}

async function revisarSeed() {
  say("== ¿Sigue completo el contenido sembrado? ==");
  let getFirestore, initializeApp, applicationDefault;
  try {
    ({ initializeApp, applicationDefault } = await import("firebase-admin/app"));
    ({ getFirestore } = await import("firebase-admin/firestore"));
  } catch {
    say("  (omitido: falta firebase-admin)");
    return;
  }
  try {
    initializeApp({ credential: applicationDefault(), projectId: PROYECTO });
  } catch {
    // ya inicializado
  }
  const db = getFirestore();
  for (const [col, n] of Object.entries(ESPERADO)) {
    try {
      const snap = await db.collection(col).count().get();
      const hay = snap.data().count;
      const ok = hay === n;
      if (!ok) fallas += 1;
      say(`  ${col.padEnd(16)} ${hay}/${n}  ${ok ? "ok" : "FALLA"}`);
    } catch (e) {
      fallas += 1;
      say(`  ${col.padEnd(16)} FALLA · ${e.message.slice(0, 80)}`);
    }
  }
  say("");
}

const solo = process.argv[2] ?? "";
await revisarFunctions();
if (solo !== "functions") await revisarSeed();

say(fallas === 0 ? "Todo en orden." : `${fallas} problema(s). Nada se modificó.`);
process.exit(fallas > 0 ? 1 : 0);
