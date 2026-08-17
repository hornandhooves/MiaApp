import type { ISODate, MealPlanId, Reservation } from "../types";

/**
 * Contrato de reservas de habitación.
 * crear() es idempotente por clave: un doble toque en "Confirmar y
 * pagar" no genera dos reservas.
 */
export interface ReservationPort {
  crear(q: {
    uid: string;
    roomTypeId: string;
    desde: ISODate;
    hasta: ISODate;
    huespedes: number;
    plan: MealPlanId;
    totalCents: number;
    paymentIntentId: string;
    idempotencyKey: string;
  }): Promise<Reservation>;
  delUsuario(uid: string): Promise<Reservation[]>;
}
