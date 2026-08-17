/**
 * Prorrateo del cambio de plan a media estancia — lógica pura.
 * El upgrade a Full Board cobra SOLO las noches restantes; la vuelta
 * a B&B se revierte con un asiento en contra (auditable), nunca
 * sobrescribiendo.
 */
import { MEAL_PLAN_FBE_PER_NIGHT_CENTS } from "./PLACEHOLDER_PRICES";
import type { ISODate } from "./types";

const DAY_MS = 86_400_000;

/** Noches restantes de la estancia contando desde hoy (min 0) */
export function nochesRestantes(
  desde: ISODate,
  hasta: ISODate,
  hoy: Date = new Date(),
): number {
  const inicio = Math.max(
    hoy.getTime(),
    new Date(`${desde}T12:00:00Z`).getTime(),
  );
  const fin = new Date(`${hasta}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((fin - inicio) / DAY_MS));
}

/** Cargo del upgrade a FBE por las noches restantes, en centavos */
export function prorrateoUpgradeFbe(
  desde: ISODate,
  hasta: ISODate,
  hoy: Date = new Date(),
): { noches: number; cargoCents: number } {
  const noches = nochesRestantes(desde, hasta, hoy);
  return { noches, cargoCents: noches * MEAL_PLAN_FBE_PER_NIGHT_CENTS };
}
