/**
 * Datos de la pantalla de Confirmación (variantes del prototipo:
 * room · bed · order · well · shuttle · pass · join · wed).
 * La pantalla lee de aquí; quien navega, escribe antes.
 */
import { create } from "zustand";

export type ConfirmKind =
  | "room"
  | "bed"
  | "order"
  | "well"
  | "shuttle"
  | "pass"
  | "join"
  | "wed";

export interface ConfirmRow {
  k: string;
  v: string;
}

interface ConfirmState {
  kind: ConfirmKind;
  rows: ConfirmRow[];
  /** Contenido del QR (day pass) — null si la variante no lleva */
  qr: string | null;
  /** Nota adicional (p. ej. "modo de prueba") */
  note: string | null;
  setConfirm: (q: {
    kind: ConfirmKind;
    rows: ConfirmRow[];
    qr?: string;
    note?: string;
  }) => void;
}

export const useConfirmStore = create<ConfirmState>()((set) => ({
  kind: "room",
  rows: [],
  qr: null,
  note: null,
  setConfirm: ({ kind, rows, qr, note }) =>
    set({ kind, rows, qr: qr ?? null, note: note ?? null }),
}));

export const CONFIRM_KEYS: Record<
  ConfirmKind,
  { title: string; body: string }
> = {
  room: { title: "cTitleRoom", body: "cBodyRoom" },
  bed: { title: "cTitleBed", body: "cBodyBed" },
  order: { title: "cTitleOrder", body: "cBodyOrder" },
  well: { title: "cTitleWell", body: "cBodyWell" },
  shuttle: { title: "cTitleShuttle", body: "cBodyShuttle" },
  pass: { title: "cTitlePass", body: "cBodyPass" },
  join: { title: "cTitleJoin", body: "cBodyJoin" },
  wed: { title: "cTitleWed", body: "cBodyWed" },
};
