/**
 * Estado del flujo de reserva (Resort → Detalle → Checkout).
 * Las fechas del demo: llegada en una semana, cuatro noches.
 */
import { create } from "zustand";
import type { ISODate, MealPlanId } from "../domain/types";
import { hoyISOTulum } from "./tulum";

const DAY_MS = 86_400_000;

function plusDays(iso: ISODate, days: number): ISODate {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

interface BookingState {
  desde: ISODate;
  hasta: ISODate;
  huespedes: number;
  roomTypeId: string | null;
  plan: MealPlanId;
  payMethod: number;
  setRoom: (roomTypeId: string) => void;
  setPlan: (plan: MealPlanId) => void;
  setPayMethod: (i: number) => void;
}

const desde = plusDays(hoyISOTulum(), 7);

export const useBooking = create<BookingState>()((set) => ({
  desde,
  hasta: plusDays(desde, 4),
  huespedes: 2,
  roomTypeId: null,
  plan: "bb",
  payMethod: 0,
  setRoom: (roomTypeId) => set({ roomTypeId }),
  setPlan: (plan) => set({ plan }),
  setPayMethod: (payMethod) => set({ payMethod }),
}));

/** "15–19 Ago" con Intl por fecha (sin cadenas armadas a mano) */
export function rangeLabel(
  desdeIso: ISODate,
  hastaIso: ISODate,
  locale: string,
): string {
  const d1 = new Date(`${desdeIso}T12:00:00Z`);
  const d2 = new Date(`${hastaIso}T12:00:00Z`);
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone: "UTC",
  });
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const sameMonth = d1.getUTCMonth() === d2.getUTCMonth();
  const left = sameMonth ? day.format(d1) : dayMonth.format(d1);
  return `${left}–${dayMonth.format(d2)}`.replace(/\./g, "");
}
