/**
 * Ledger en memoria — append-only, saldo derivado, idempotente.
 * En producción el único escritor es la function acreditarOlas.
 */
import type { LedgerPort } from "../../ports/LedgerPort";
import type { LedgerEntry } from "../../types";

export class MockLedgerAdapter implements LedgerPort {
  private entries: LedgerEntry[] = [];
  private byKey = new Set<string>();
  private listeners = new Set<{ uid: string; cb: (s: number) => void }>();
  private seq = 0;

  private derive(uid: string): number {
    return this.entries
      .filter((e) => e.uid === uid)
      .reduce((s, e) => s + e.delta, 0);
  }

  private notify(uid: string) {
    const saldo = this.derive(uid);
    this.listeners.forEach((l) => {
      if (l.uid === uid) l.cb(saldo);
    });
  }

  async acreditar(q: {
    uid: string;
    delta: number;
    motivo: string;
    refId: string;
    idempotencyKey: string;
  }): Promise<LedgerEntry> {
    if (this.byKey.has(q.idempotencyKey)) {
      const previo = this.entries.find(
        (e) => e.id === `led-${q.idempotencyKey}`,
      );
      if (previo) return { ...previo };
    }
    this.seq += 1;
    const entry: LedgerEntry = {
      id: `led-${q.idempotencyKey}`,
      uid: q.uid,
      delta: q.delta,
      motivo: q.motivo,
      refId: q.refId,
      createdAt: new Date().toISOString(),
    };
    this.entries.push(entry); // append-only: nunca se edita ni borra
    this.byKey.add(q.idempotencyKey);
    this.notify(q.uid);
    return { ...entry };
  }

  async saldo(uid: string): Promise<number> {
    return this.derive(uid);
  }

  async asientos(uid: string): Promise<LedgerEntry[]> {
    return this.entries.filter((e) => e.uid === uid).map((e) => ({ ...e }));
  }

  suscribirSaldo(uid: string, cb: (saldo: number) => void): () => void {
    const entry = { uid, cb };
    this.listeners.add(entry);
    cb(this.derive(uid));
    return () => this.listeners.delete(entry);
  }
}
