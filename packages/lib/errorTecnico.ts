/**
 * Convierte un error en una pista que se pueda diagnosticar.
 *
 * Por qué existe: cada `catch` de la app mostraba el mismo texto
 * amable — "no pudimos conectar, revisa tu señal" — sin importar si la
 * causa era la red, un permiso de Firestore, una sesión vencida o una
 * configuración mal puesta. Un mensaje que culpa a la señal cuando el
 * problema es de configuración manda al usuario a reiniciar el WiFi y
 * nos cuesta una tarde. El error se veía manejado, no resuelto.
 *
 * Con `FLAGS.diagnostico` activo (beta) el aviso lleva el código real
 * entre paréntesis. En producción se apaga y el huésped solo ve el
 * texto amable.
 */
import { FLAGS } from "../domain/flags";

/** El código más específico que traiga el error, o su mensaje. */
export function codigoDeError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  const code = err?.code;
  if (typeof code === "string" && code.length > 0) return code;
  const msg = err?.message;
  if (typeof msg === "string" && msg.length > 0) return msg.slice(0, 120);
  return "sin-codigo";
}

/**
 * Texto para el Alert: el mensaje amable y, en beta, el código real.
 * Siempre deja rastro en la consola, que es lo que se lee con Xcode
 * conectado al aparato.
 */
export function mensajeConPista(amable: string, e: unknown): string {
  const codigo = codigoDeError(e);
  // Rastro para Console.app / Xcode aunque el flag esté apagado. Es la
  // única consola permitida del repo: sin ella, un fallo en un aparato
  // real no deja evidencia de ninguna clase.
  // eslint-disable-next-line no-console
  console.error(`[mia] ${amable} :: ${codigo}`, e);
  return FLAGS.diagnostico ? `${amable}\n\n(${codigo})` : amable;
}
