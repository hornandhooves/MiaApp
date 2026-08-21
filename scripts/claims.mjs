/**
 * Qué claims trae cada usuario. Los claims son la llave real: las
 * reglas de Firestore leen esto, no lo que diga la app.
 *
 * Sirve para separar dos cosas que se ven iguales desde el teléfono:
 * "la app cree que encontró tu estancia" y "el servidor te dio permiso".
 *
 * Uso: node scripts/claims.mjs
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROYECTO = "miaapp-30191";
const say = (m) => process.stdout.write(`${m}\n`);

initializeApp({ credential: applicationDefault(), projectId: PROYECTO });
const auth = getAuth();

const res = await auth.listUsers(1000);
const orden = [...res.users].sort(
  (a, b) =>
    Date.parse(a.metadata.creationTime) - Date.parse(b.metadata.creationTime),
);

say(`Usuarios (${orden.length}), del mas viejo al mas nuevo:\n`);
for (const u of orden) {
  const quien = u.email ?? (u.providerData.length === 0 ? "anonimo" : "sin correo");
  const c = u.customClaims ?? {};
  say(`${u.uid}  ${quien}`);
  say(`  creado : ${new Date(u.metadata.creationTime).toLocaleString("es-MX")}`);
  if (Object.keys(c).length === 0) {
    say(`  claims : NINGUNO  <-- sin permiso de pedir ni de nada`);
  } else {
    say(`  roomId : ${c.roomId ?? "—"}`);
    say(`  spotId : ${c.spotId ?? "—"}`);
    say(`  scope  : ${Array.isArray(c.scope) ? c.scope.join(",") : "—"}`);
    if (typeof c.sexp === "number") {
      const vigente = c.sexp > Date.now();
      say(
        `  vence  : ${new Date(c.sexp).toLocaleString("es-MX")}  ${
          vigente ? "(vigente)" : "(VENCIDO — por eso se deniega)"
        }`,
      );
    } else {
      say(`  vence  : — (sin sexp, tieneScope() siempre es false)`);
    }
    if (c.staff === true) say(`  PERSONAL`);
  }
  say("");
}
