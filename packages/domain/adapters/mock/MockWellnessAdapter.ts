/**
 * Cupos de bienestar y shuttle en memoria, con sección crítica
 * síncrona (misma garantía que la transacción de Firestore que lo
 * sustituirá). Idempotente: reservar dos veces el mismo slot con el
 * mismo uid no consume dos lugares.
 */
import type {
  ReservaBienestar,
  ShuttleSlot,
  WellnessPort,
} from "../../ports/WellnessPort";
import type { WellnessSlot } from "../../types";

export class MockWellnessAdapter implements WellnessPort {
  private slots: Map<string, WellnessSlot>;
  private shuttleSlots: Map<string, ShuttleSlot>;
  private reservas = new Set<string>(); // `${uid}:${slotId}`
  /** Asientos apartados por uid+shuttle, para poder listarlos despues */
  private asientosPorReserva = new Map<string, number>();

  constructor(seedSlots: WellnessSlot[], seedShuttles: ShuttleSlot[]) {
    this.slots = new Map(seedSlots.map((s) => [s.id, { ...s }]));
    this.shuttleSlots = new Map(seedShuttles.map((s) => [s.id, { ...s }]));
  }

  async sesionesHoy(diaSemana: number): Promise<WellnessSlot[]> {
    return [...this.slots.values()]
      .filter((s) => s.dias.length === 0 || s.dias.includes(diaSemana))
      .map((s) => ({ ...s }));
  }

  async reservarSesion(slotId: string, uid: string): Promise<WellnessSlot> {
    const key = `${uid}:${slotId}`;
    const slot = this.slots.get(slotId);
    if (!slot) throw new Error("slot-inexistente");
    if (this.reservas.has(key)) return { ...slot }; // idempotente
    if (slot.tomados >= slot.capacidad) throw new Error("cupo-lleno");
    slot.tomados += 1;
    this.reservas.add(key);
    return { ...slot };
  }

  async shuttles(): Promise<ShuttleSlot[]> {
    return [...this.shuttleSlots.values()].map((s) => ({ ...s }));
  }

  async apartarShuttle(
    shuttleId: string,
    uid: string,
    asientos: number,
  ): Promise<ShuttleSlot> {
    const key = `${uid}:${shuttleId}`;
    const slot = this.shuttleSlots.get(shuttleId);
    if (!slot) throw new Error("shuttle-inexistente");
    if (this.reservas.has(key)) return { ...slot };
    if (slot.tomados + asientos > slot.asientos) {
      throw new Error("sin-asientos");
    }
    slot.tomados += asientos;
    this.reservas.add(key);
    this.asientosPorReserva.set(key, asientos);
    return { ...slot };
  }

  async misReservas(uid: string): Promise<ReservaBienestar[]> {
    const mias: ReservaBienestar[] = [];
    for (const key of this.reservas) {
      const [dueno, id] = key.split(":");
      if (dueno !== uid || !id) continue;
      const ses = this.slots.get(id);
      if (ses) {
        mias.push({
          id,
          tipo: "session",
          nombre: ses.nombre,
          hora: ses.hora,
        });
        continue;
      }
      const sh = this.shuttleSlots.get(id);
      if (sh) {
        mias.push({
          id,
          tipo: "shuttle",
          // El nombre del shuttle lo pone la UI: aqui solo va la hora.
          nombre: { es: "", en: "" },
          hora: sh.hora,
          asientos: this.asientosPorReserva.get(key) ?? 1,
        });
      }
    }
    return mias.sort((a, b) => a.hora.localeCompare(b.hora));
  }
}
