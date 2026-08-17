import type { DayPass } from "../types";

/**
 * Contrato de cobros (Stripe modo test) y emisión de day pass.
 * Toda operación lleva clave de idempotencia: un doble toque no
 * cobra dos veces.
 */
export interface PagoResultado {
  paymentIntentId: string;
  /** true cuando el cobro fue simulado por el adaptador mock */
  simulado: boolean;
}

export interface PaymentPort {
  pagar(q: {
    montoCents: number;
    currency: "usd" | "mxn";
    concepto: string;
    idempotencyKey: string;
    uid: string;
  }): Promise<PagoResultado>;
}

export interface PassPort {
  emitir(q: {
    uid: string;
    admission: DayPass["admission"];
    fecha: string;
    personas: number;
    montoCents: number;
    paymentIntentId: string;
    idempotencyKey: string;
  }): Promise<DayPass>;
  delUsuario(uid: string): Promise<DayPass[]>;
}
