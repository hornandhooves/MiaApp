/**
 * Cobros simulados del demo — SIEMPRE marcados como simulado:true.
 * Cuando las functions estén desplegadas con STRIPE_TEST_KEY, el
 * adaptador real (crearPago + PaymentSheet) sustituye a éste en di.ts
 * sin tocar pantallas. Idempotente por clave.
 */
import type {
  PagoResultado,
  PassPort,
  PaymentPort,
} from "../../ports/PaymentPort";
import type { DayPass } from "../../types";

export class MockPaymentAdapter implements PaymentPort {
  private porClave = new Map<string, PagoResultado>();

  async pagar(q: {
    montoCents: number;
    currency: "usd" | "mxn";
    concepto: string;
    idempotencyKey: string;
    uid: string;
  }): Promise<PagoResultado> {
    if (q.montoCents <= 0) throw new Error("monto-invalido");
    const previo = this.porClave.get(q.idempotencyKey);
    if (previo) return previo;
    const res: PagoResultado = {
      paymentIntentId: `pi_demo_${q.idempotencyKey}`,
      simulado: true,
    };
    this.porClave.set(q.idempotencyKey, res);
    return res;
  }
}

export class MockPassAdapter implements PassPort {
  private passes = new Map<string, DayPass>();

  async emitir(q: {
    uid: string;
    admission: DayPass["admission"];
    fecha: string;
    personas: number;
    montoCents: number;
    paymentIntentId: string;
    idempotencyKey: string;
  }): Promise<DayPass> {
    const existente = [...this.passes.values()].find(
      (p) => p.qrCode.endsWith(q.idempotencyKey),
    );
    if (existente) return { ...existente };
    const pass: DayPass = {
      id: `pass-${this.passes.size + 1}`,
      uid: q.uid,
      admission: q.admission,
      fecha: q.fecha,
      personas: q.personas,
      montoCents: q.montoCents,
      // La promesa del modelo: lo pagado regresa como saldo consumible
      saldoConsumibleCents: q.montoCents,
      qrCode: `mia-pass.${q.fecha}.${q.admission}.${q.idempotencyKey}`,
      estado: "active",
    };
    this.passes.set(pass.id, pass);
    return { ...pass };
  }

  async delUsuario(uid: string): Promise<DayPass[]> {
    return [...this.passes.values()]
      .filter((p) => p.uid === uid)
      .map((p) => ({ ...p }));
  }
}
