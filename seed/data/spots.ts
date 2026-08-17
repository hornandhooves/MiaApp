/**
 * Mapa de camastros y mesas — la geometría exacta del prototipo.
 * Ocupación sembrada creíble (regla del mock): primera fila casi llena,
 * sombra de palapa libre. Ocupados según el prototipo: 11,15,21,24,32,33,63,72.
 */
import type { Spot, SpotRow } from "../../packages/domain/types";

const TAKEN = new Set([11, 15, 21, 24, 32, 33, 63, 72]);

const mk = (kind: Spot["kind"], row: SpotRow, numbers: number[]): Spot[] =>
  numbers.map((n) => ({
    id: `${kind}-${n}`,
    kind,
    row,
    number: n,
    state: TAKEN.has(n) ? "taken" : "free",
  }));

export const spots: Spot[] = [
  ...mk("bed", "front", [11, 12, 13, 14, 15, 16]),
  ...mk("bed", "second", [21, 22, 23, 24, 25, 26]),
  ...mk("bed", "palapa", [31, 32, 33, 34, 35, 36]),
  ...mk("table", "sand-tables", [61, 62, 63, 64]),
  ...mk("table", "deck-tables", [71, 72, 73, 74]),
];
