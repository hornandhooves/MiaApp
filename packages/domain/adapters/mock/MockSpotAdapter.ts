/**
 * Mapa de camastros en memoria con semántica transaccional.
 * JS es de un solo hilo: la sección crítica de crearHold es atómica
 * dentro del tick, así que dos crearHold simultáneos sobre el mismo
 * lugar producen exactamente un ganador — igual que la transacción
 * de Firestore que lo sustituirá al desplegar functions.
 */
import { HOLD_MINUTES_PAST_ARRIVAL } from "../../PLACEHOLDER_PRICES";
import type { SpotPort } from "../../ports/SpotPort";
import type { Spot, SpotHold, SpotState } from "../../types";

type Listener = (spots: Spot[]) => void;

export class MockSpotAdapter implements SpotPort {
  private spots: Map<string, Spot>;
  private holds = new Map<string, SpotHold>();
  private listeners = new Set<Listener>();
  private seq = 0;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    seedSpots: Spot[],
    private readonly holdMinutes: number = HOLD_MINUTES_PAST_ARRIVAL,
    /** Inyectable para tests; el demo usa timers reales */
    private readonly scheduleRelease: boolean = true,
  ) {
    this.spots = new Map(seedSpots.map((s) => [s.id, { ...s }]));
  }

  private snapshot(): Spot[] {
    return [...this.spots.values()].map((s) => ({ ...s }));
  }

  private notify() {
    const snap = this.snapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  async listar(): Promise<Spot[]> {
    return this.snapshot();
  }

  suscribir(cb: Listener): () => void {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => this.listeners.delete(cb);
  }

  async crearHold(q: {
    uid: string;
    spotId: string;
    arrival: string;
  }): Promise<SpotHold> {
    // —— sección crítica (atómica en el tick) ——
    const spot = this.spots.get(q.spotId);
    if (!spot) throw new Error("spot-inexistente");
    if (spot.state !== "free") throw new Error("spot-ocupado");

    // Un hold activo por usuario: el anterior se libera
    const previo = [...this.holds.values()].find(
      (h) => h.uid === q.uid && h.state === "active",
    );
    if (previo) this.release(previo.id);

    spot.state = "held";
    this.seq += 1;
    const arrivalAt = q.arrival;
    const expiresAt = this.expiryIso(q.arrival);
    const hold: SpotHold = {
      id: `hold-${this.seq}`,
      spotId: q.spotId,
      uid: q.uid,
      arrivalAt,
      expiresAt,
      state: "active",
    };
    this.holds.set(hold.id, hold);
    // —— fin de sección crítica ——

    if (this.scheduleRelease) {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms > 0) {
        this.timers.set(
          hold.id,
          setTimeout(() => this.release(hold.id), ms),
        );
      }
    }
    this.notify();
    return { ...hold };
  }

  private expiryIso(arrivalHHmm: string): string {
    // La liberación ocurre holdMinutes después de la hora de llegada
    // (hora de Tulum, UTC-5 fijo)
    const [h, m] = arrivalHHmm.split(":").map(Number);
    const now = new Date();
    const target = new Date(now);
    // construir hoy a la hora de llegada en UTC-5
    const utcHour = (h ?? 12) + 5;
    target.setUTCHours(utcHour, m ?? 0, 0, 0);
    if (target.getTime() < now.getTime()) {
      // llegada "pasada": el hold cuenta desde ahora
      target.setTime(now.getTime());
    }
    return new Date(
      target.getTime() + this.holdMinutes * 60_000,
    ).toISOString();
  }

  private release(holdId: string) {
    const hold = this.holds.get(holdId);
    if (!hold || hold.state !== "active") return;
    hold.state = "released";
    const spot = this.spots.get(hold.spotId);
    if (spot && spot.state === "held") spot.state = "free";
    const timer = this.timers.get(holdId);
    if (timer) clearTimeout(timer);
    this.timers.delete(holdId);
    this.notify();
  }

  async liberarHold(holdId: string): Promise<void> {
    this.release(holdId);
  }

  async setEstado(spotId: string, estado: SpotState): Promise<void> {
    const spot = this.spots.get(spotId);
    if (!spot) throw new Error("spot-inexistente");
    spot.state = estado;
    this.notify();
  }

  async holdActivo(uid: string): Promise<SpotHold | null> {
    const hold = [...this.holds.values()].find(
      (h) => h.uid === uid && h.state === "active",
    );
    return hold ? { ...hold } : null;
  }
}
