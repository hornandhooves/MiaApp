/**
 * Adaptador mock de estancias.
 * En el demo la verificación real vive en la function buscarEstancia
 * (semana 2) para que la app nunca reciba la lista de huéspedes; este
 * mock existe para tests y para la sesión sembrada de demostración.
 */
import type { GuestPort } from "../../ports/GuestPort";
import type { Estancia } from "../../types";

const ESTANCIAS_DEMO: (Estancia & { habitacion: string })[] = [
  {
    habitacion: "204",
    apellido: "lopez",
    roomId: "room-204",
    desde: "2026-08-15",
    hasta: "2026-08-19",
    huespedes: 2,
    plan: "bb",
    folioId: "folio-demo-204",
  },
];

export class MockGuestAdapter implements GuestPort {
  async buscarPorHabitacionYApellido(
    habitacion: string,
    apellido: string,
  ): Promise<Estancia | null> {
    const hit = ESTANCIAS_DEMO.find(
      (e) =>
        e.habitacion === habitacion.trim() &&
        e.apellido === apellido.trim().toLowerCase(),
    );
    if (!hit) return null;
    const { habitacion: _hab, ...estancia } = hit;
    return estancia;
  }
}
