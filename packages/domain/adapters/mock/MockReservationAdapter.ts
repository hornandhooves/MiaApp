/**
 * Reservas en memoria, idempotentes por clave.
 */
import type { ReservationPort } from "../../ports/ReservationPort";
import type { Reservation } from "../../types";

export class MockReservationAdapter implements ReservationPort {
  private byKey = new Map<string, Reservation>();
  private seq = 0;

  async crear(
    q: Omit<Reservation, "id" | "createdAt">,
  ): Promise<Reservation> {
    const previa = this.byKey.get(q.idempotencyKey);
    if (previa) return { ...previa };
    if (q.totalCents <= 0) throw new Error("total-invalido");
    this.seq += 1;
    const res: Reservation = {
      ...q,
      id: `res-${this.seq}`,
      createdAt: new Date().toISOString(),
    };
    this.byKey.set(q.idempotencyKey, res);
    return { ...res };
  }

  async delUsuario(uid: string): Promise<Reservation[]> {
    return [...this.byKey.values()]
      .filter((r) => r.uid === uid)
      .map((r) => ({ ...r }));
  }
}
