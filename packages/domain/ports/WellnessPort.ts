import type { WellnessSlot } from "../types";

export interface ShuttleSlot {
  id: string;
  hora: string;
  asientos: number;
  tomados: number;
}

/**
 * Bienestar y shuttle al cenote. El cupo se decrementa
 * TRANSACCIONALMENTE: dos reservas simultáneas del último lugar
 * producen un solo ganador. Idempotente por usuario+slot.
 */
export interface WellnessPort {
  /** Sesiones visibles HOY (el temazcal solo existe jueves y domingo) */
  sesionesHoy(diaSemana: number): Promise<WellnessSlot[]>;
  reservarSesion(slotId: string, uid: string): Promise<WellnessSlot>;
  shuttles(): Promise<ShuttleSlot[]>;
  apartarShuttle(
    shuttleId: string,
    uid: string,
    asientos: number,
  ): Promise<ShuttleSlot>;
}
