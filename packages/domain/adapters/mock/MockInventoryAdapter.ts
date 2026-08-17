/**
 * Adaptador mock de inventario — lo que corre en el demo.
 * Lee el catálogo sembrado y aplica reglas deterministas para que la
 * disponibilidad no sea trivial (un demo donde todo está libre no
 * convence a nadie). Las reglas viven AQUÍ, no en el seed.
 */
import {
  MEAL_PLAN_FBE_PER_NIGHT_CENTS,
  TAX_RATE,
} from "../../PLACEHOLDER_PRICES";
import type { InventoryPort } from "../../ports/InventoryPort";
import type {
  Disponibilidad,
  ISODate,
  MealPlanId,
  RoomType,
  Tarifa,
} from "../../types";

const DAY_MS = 86_400_000;
const SCARCE_UNITS = 3;
/** A más de 90 días, todo disponible — como un PMS real */
const FAR_WINDOW_DAYS = 90;

export const parseISO = (d: ISODate): Date => new Date(`${d}T12:00:00Z`);

export const nightsBetween = (desde: ISODate, hasta: ISODate): number =>
  Math.max(0, Math.round((+parseISO(hasta) - +parseISO(desde)) / DAY_MS));

/** ¿La estancia incluye una noche de viernes o sábado? (UTC del mediodía) */
export const includesWeekendNight = (desde: ISODate, hasta: ISODate): boolean => {
  const n = nightsBetween(desde, hasta);
  for (let i = 0; i < n; i++) {
    const day = new Date(+parseISO(desde) + i * DAY_MS).getUTCDay();
    if (day === 5 || day === 6) return true;
  }
  return false;
};

export class MockInventoryAdapter implements InventoryPort {
  constructor(
    private readonly catalogo: () => Promise<RoomType[]>,
    private readonly hoy: () => Date = () => new Date(),
  ) {}

  async buscarDisponibilidad(q: {
    desde: ISODate;
    hasta: ISODate;
    huespedes: number;
  }): Promise<Disponibilidad[]> {
    const rooms = await this.catalogo();
    const farOut =
      +parseISO(q.desde) - +this.hoy() > FAR_WINDOW_DAYS * DAY_MS;

    return rooms
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((roomType) => {
        if (farOut) {
          return {
            roomType,
            disponible: true,
            unidadesRestantes: roomType.units,
            escaso: false,
          };
        }
        // Regla: la Suite Premium no está disponible viernes ni sábado
        const premiumBlocked =
          roomType.id === "suite-premium-ocean-jacuzzi" &&
          includesWeekendNight(q.desde, q.hasta);

        return {
          roomType,
          disponible: !premiumBlocked && roomType.units > 0,
          unidadesRestantes: premiumBlocked ? 0 : roomType.units,
          escaso: !premiumBlocked && roomType.units <= SCARCE_UNITS,
        };
      });
  }

  async obtenerTarifa(q: {
    roomTypeId: string;
    desde: ISODate;
    hasta: ISODate;
    plan: MealPlanId;
  }): Promise<Tarifa> {
    const rooms = await this.catalogo();
    const room = rooms.find((r) => r.id === q.roomTypeId);
    if (!room) throw new Error(`roomType desconocido: ${q.roomTypeId}`);

    const noches = nightsBetween(q.desde, q.hasta);
    if (noches === 0) throw new Error("Rango de fechas vacío");

    const planPorNocheCents =
      q.plan === "fbe" ? MEAL_PLAN_FBE_PER_NIGHT_CENTS : 0;
    const subtotalCents = (room.nightly + planPorNocheCents) * noches;
    const impuestosCents = Math.round(subtotalCents * TAX_RATE);

    return {
      roomTypeId: q.roomTypeId,
      desde: q.desde,
      hasta: q.hasta,
      plan: q.plan,
      noches,
      porNocheCents: room.nightly,
      planPorNocheCents,
      subtotalCents,
      impuestosCents,
      totalCents: subtotalCents + impuestosCents,
    };
  }
}
