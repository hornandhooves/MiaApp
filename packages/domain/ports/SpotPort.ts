import type { Spot, SpotHold, SpotState } from "../types";

/**
 * Contrato del mapa de camastros y mesas.
 * crearHold es TRANSACCIONAL: dos personas no pueden ganar el mismo
 * lugar. En el demo lo garantiza el mock (sección crítica síncrona);
 * en producción, una transacción de Firestore en una function.
 */
export interface SpotPort {
  listar(): Promise<Spot[]>;
  /** Tiempo real: el callback recibe el mapa completo en cada cambio */
  suscribir(cb: (spots: Spot[]) => void): () => void;
  crearHold(q: {
    uid: string;
    spotId: string;
    /** Hora de llegada "12:00" (hora de Tulum) */
    arrival: string;
  }): Promise<SpotHold>;
  liberarHold(holdId: string): Promise<void>;
  /** Staff: ocupar/liberar en un toque */
  setEstado(spotId: string, estado: SpotState): Promise<void>;
  holdActivo(uid: string): Promise<SpotHold | null>;
}
