import type { Disponibilidad, ISODate, MealPlanId, Tarifa } from "../types";

/**
 * Contrato de disponibilidad y tarifas.
 * Las pantallas solo conocen esta interfaz — nunca Firestore ni un PMS.
 * En el demo la implementa adapters/mock; en producción, adapters/pms.
 */
export interface InventoryPort {
  buscarDisponibilidad(q: {
    desde: ISODate;
    hasta: ISODate;
    huespedes: number;
  }): Promise<Disponibilidad[]>;

  obtenerTarifa(q: {
    roomTypeId: string;
    desde: ISODate;
    hasta: ISODate;
    plan: MealPlanId;
  }): Promise<Tarifa>;
}
