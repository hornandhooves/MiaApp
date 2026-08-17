import type { LedgerEntry } from "../types";

/**
 * Ledger de Olas — APPEND-ONLY.
 * El saldo SIEMPRE se deriva de la suma de asientos; jamás existe un
 * contador editable. Una promoción mal aplicada se revierte con un
 * asiento en contra y queda auditada.
 */
export interface LedgerPort {
  acreditar(q: {
    uid: string;
    delta: number;
    motivo: string;
    refId: string;
    idempotencyKey: string;
  }): Promise<LedgerEntry>;
  /** Saldo derivado: suma de todos los asientos del uid */
  saldo(uid: string): Promise<number>;
  asientos(uid: string): Promise<LedgerEntry[]>;
  suscribirSaldo(uid: string, cb: (saldo: number) => void): () => void;
}
