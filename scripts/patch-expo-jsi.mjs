/**
 * Parche de expo-modules-jsi aplicado por postinstall.
 *
 * Por qué así y no con `pnpm patch`: patchedDependencies depende de que
 * el gestor lea la configuración del lugar correcto, y eso cambió entre
 * versiones de pnpm (el campo "pnpm" de package.json dejó de leerse).
 * Eso rompió el build de EAS con ERR_PNPM_LOCKFILE_CONFIG_MISMATCH.
 * Un script de postinstall funciona igual en cualquier gestor y en
 * cualquier CI, y es idempotente: si ya está aplicado, no hace nada.
 *
 * Qué arregla: Swift 6.2.3 (Xcode 26.2) marca `abs(...)` como ambiguo
 * dentro de este archivo por la interoperabilidad con C++. `Swift.abs`
 * desambigua sin cambiar el comportamiento.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

/** Salida sin console: el contrato del repo prohibe console.log. */
const say = (m) => process.stdout.write(`${m}\n`);

const REL =
  "apple/Sources/ExpoModulesJSI/Coding/JavaScriptCodable+Date.swift";

/**
 * Con node-linker=hoisted el paquete vive en node_modules/, pero con el
 * enlazado por defecto vive bajo node_modules/.pnpm/<pkg>/node_modules/.
 * En EAS el script reportaba "archivo ausente" por buscar solo la
 * primera ruta. Probamos ambas.
 */
function resolverArchivo() {
  const directo = `node_modules/expo-modules-jsi/${REL}`;
  if (existsSync(directo)) return directo;
  const store = "node_modules/.pnpm";
  if (!existsSync(store)) return null;
  for (const dir of readdirSync(store)) {
    if (!dir.startsWith("expo-modules-jsi@")) continue;
    const p = `${store}/${dir}/node_modules/expo-modules-jsi/${REL}`;
    if (existsSync(p)) return p;
  }
  return null;
}

const FILE = resolverArchivo();
const FROM = "guard milliseconds.isFinite, abs(milliseconds)";
const TO = "guard milliseconds.isFinite, Swift.abs(milliseconds)";

if (!FILE) {
  // En CI de Android o instalaciones parciales el archivo puede no estar.
  say("[patch-expo-jsi] archivo ausente, nada que hacer");
  process.exit(0);
}

const src = readFileSync(FILE, "utf8");

if (src.includes(TO)) {
  say("[patch-expo-jsi] ya aplicado");
  process.exit(0);
}

if (!src.includes(FROM)) {
  say(
    "[patch-expo-jsi] AVISO: no encontré el patrón esperado; " +
      "quizá expo-modules-jsi cambió y el parche ya no hace falta",
  );
  process.exit(0);
}

writeFileSync(FILE, src.replace(FROM, TO), "utf8");
say("[patch-expo-jsi] aplicado");
