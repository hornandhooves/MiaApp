/**
 * Firma y validación del QR de camastro/mesa.
 * El sticker lleva: mia://spot/<spotId>?t=<fecha>.<firma>
 * La firma es HMAC-SHA256(spotId + "." + fecha, secretoDelDia).
 * El secreto rota a diario: se deriva de un secreto maestro + fecha,
 * así que "rotar" no requiere reimprimir nada en el servidor.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface QrPayload {
  spotId: string;
  /** Fecha del token, YYYY-MM-DD en hora de Tulum */
  fecha: string;
}

const TULUM_TZ = "America/Cancun";

export const hoyEnTulum = (now: Date = new Date()): string => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TULUM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // en-CA → YYYY-MM-DD
};

export const secretoDelDia = (master: string, fecha: string): string =>
  createHmac("sha256", master).update(`day:${fecha}`).digest("hex");

export const firmarToken = (
  master: string,
  spotId: string,
  fecha: string,
): string => {
  const daily = secretoDelDia(master, fecha);
  const sig = createHmac("sha256", daily)
    .update(`${spotId}.${fecha}`)
    .digest("base64url");
  return `${fecha}.${sig}`;
};

export interface ValidacionQr {
  ok: boolean;
  motivo?: "formato" | "vencido" | "firma";
  payload?: QrPayload;
}

export const validarToken = (
  master: string,
  spotId: string,
  token: string,
  now: Date = new Date(),
): ValidacionQr => {
  const dot = token.indexOf(".");
  if (dot <= 0) return { ok: false, motivo: "formato" };
  const fecha = token.slice(0, dot);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, motivo: "formato" };

  // Un QR de un día anterior se rechaza (con mensaje útil en la app)
  if (fecha !== hoyEnTulum(now)) return { ok: false, motivo: "vencido" };

  const esperado = firmarToken(master, spotId, fecha);
  const a = Buffer.from(token);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, motivo: "firma" };
  }
  return { ok: true, payload: { spotId, fecha } };
};

/** Fin del día en Tulum (medianoche siguiente), en ms epoch */
export const cierreDelDiaMs = (now: Date = new Date()): number => {
  const fecha = hoyEnTulum(now);
  // Tulum (America/Cancun) es UTC-5 fijo, sin horario de verano
  return Date.parse(`${fecha}T23:59:59.999-05:00`) + 1;
};
