/**
 * Otorga o retira el rol de personal de Mía.
 *
 * Por qué un script y no una pantalla en la app: conceder `staff` es
 * conceder acceso a los pedidos de TODOS los huéspedes. Si existiera una
 * function que lo otorgue, existiría una vía para escalar privilegios
 * desde el teléfono. Aquí solo puede correrlo alguien que ya tiene las
 * credenciales de administrador del proyecto.
 *
 * Uso:
 *   gcloud auth application-default login        (una vez)
 *   node scripts/staff.mjs usuarios              (quien existe y su uid)
 *   node scripts/staff.mjs listar                (quien ya es personal)
 *   node scripts/staff.mjs dar    <correo o uid>
 *   node scripts/staff.mjs quitar <correo o uid>
 *
 * Acepta UID ademas de correo porque un usuario anonimo NO tiene correo:
 * si el personal entra sin cuenta, la unica forma de identificarlo es su
 * uid, que sale de `usuarios`.
 *
 * El usuario debe existir ya en Firebase Auth. Tras el cambio, esa
 * persona tiene que cerrar sesión y volver a entrar: los claims viajan
 * dentro del token y el suyo aún no lo trae.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROYECTO = "miaapp-30191";
const say = (m) => process.stdout.write(`${m}\n`);

initializeApp({ credential: applicationDefault(), projectId: PROYECTO });
const auth = getAuth();

const [, , accion, correo] = process.argv;

async function listar() {
  const res = await auth.listUsers(1000);
  const staff = res.users.filter((u) => u.customClaims?.staff === true);
  if (staff.length === 0) {
    say("No hay nadie con rol de personal.");
    return;
  }
  say(`Personal de Mía (${staff.length}):`);
  for (const u of staff) say(`  ${u.email ?? u.uid}`);
}

async function usuarios() {
  const res = await auth.listUsers(1000);
  if (res.users.length === 0) {
    say("No hay ningun usuario todavia. Abre la app al menos una vez.");
    return;
  }
  say(`Usuarios (${res.users.length}):`);
  for (const u of res.users) {
    const como = u.email ?? (u.providerData.length === 0 ? "anonimo" : "sin correo");
    const rol = u.customClaims?.staff === true ? "  [PERSONAL]" : "";
    say(`  ${u.uid}  ${como}${rol}`);
  }
  say("");
  say("Para dar el rol usa el correo, o el uid si es anonimo:");
  say("  node scripts/staff.mjs dar <uid>");
}

async function marcar(valor) {
  if (!correo) {
    say("Falta el correo. Ej: node scripts/staff.mjs dar cocina@miatulum.com");
    process.exit(1);
  }
  // Acepta correo o uid: los usuarios anonimos no tienen correo.
  const u = correo.includes("@")
    ? await auth.getUserByEmail(correo).catch(() => null)
    : await auth.getUser(correo).catch(() => null);
  if (!u) {
    say(`No encontre a "${correo}" ni por correo ni por uid.`);
    say("Corre primero:  node scripts/staff.mjs usuarios");
    process.exit(1);
  }
  // Se conservan los demás claims: sobrescribir todo borraría el
  // vínculo de sesión de un invitado que además sea staff.
  const previos = u.customClaims ?? {};
  await auth.setCustomUserClaims(u.uid, { ...previos, staff: valor });
  say(valor ? `Rol de personal otorgado a ${u.email ?? u.uid}.` : `Rol retirado a ${u.email ?? u.uid}.`);
  say("Debe cerrar sesión y volver a entrar para que su token lo traiga.");
}

const acciones = {
  usuarios,
  listar,
  dar: () => marcar(true),
  quitar: () => marcar(false),
};

const fn = acciones[accion ?? ""];
if (!fn) {
  say("Acciones: usuarios | listar | dar <correo|uid> | quitar <correo|uid>");
  process.exit(1);
}
await fn();
