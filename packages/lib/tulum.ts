/**
 * Hora y formato local — Tulum vive en America/Cancun (UTC-5 fijo).
 * Fechas, horas y moneda SIEMPRE con Intl, nunca cadenas armadas a mano.
 */
import { currentLang } from "../i18n";

export const TULUM_TZ = "America/Cancun";

const localeTag = (): string => (currentLang() === "es" ? "es-MX" : "en-US");

/** "Sáb 15 Ago" / "Sat 15 Aug" — la etiqueta de fecha de Home */
export function todayLabel(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat(localeTag(), {
    timeZone: TULUM_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return fmt
    .format(now)
    .replace(/[.,]/g, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Minutos transcurridos del día en Tulum (para atenuar lo pasado) */
export function minutesNowInTulum(now: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TULUM_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const [h, m] = fmt.format(now).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** "18:41" → minutos del día */
export const hhmmToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Minutos que faltan para una hora del día en Tulum; negativo = ya pasó */
export const minutesUntil = (hhmm: string, now: Date = new Date()): number =>
  hhmmToMinutes(hhmm) - minutesNowInTulum(now);

/** Dinero en centavos USD → "$480" (sin decimales, como el prototipo) */
export function moneyUsd(cents: number): string {
  return new Intl.NumberFormat(localeTag(), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Dinero en centavos MXN → "$1,500" (la pantalla añade "MXN") */
export function moneyMxn(cents: number): string {
  return new Intl.NumberFormat(localeTag(), {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Fecha de hoy en Tulum, YYYY-MM-DD */
export function hoyISOTulum(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TULUM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Día N de M de una estancia; null si hoy cae fuera del rango */
export function stayDay(
  desde: string,
  hasta: string,
  now: Date = new Date(),
): { day: number; total: number } | null {
  const desdeMs = new Date(`${desde}T12:00:00Z`).getTime();
  const hastaMs = new Date(`${hasta}T12:00:00Z`).getTime();
  const day = Math.floor((now.getTime() - desdeMs) / 86400000) + 1;
  const total = Math.round((hastaMs - desdeMs) / 86400000);
  return day >= 1 && day <= total ? { day, total } : null;
}

/** Día de la semana en Tulum: 0=Dom … 6=Sáb */
export function weekdayInTulum(now: Date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: TULUM_TZ,
    weekday: "short",
  }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}
