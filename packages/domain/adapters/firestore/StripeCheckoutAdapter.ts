/**
 * Cobros reales con Stripe Checkout.
 *
 * Flujo: la function crea la sesión, se abre la página de Stripe en el
 * navegador del teléfono, el huésped paga, y al volver la app le
 * PREGUNTA AL SERVIDOR si el cobro ocurrió. Nunca al navegador.
 *
 * Esa última parte es la importante: que la página haya regresado con
 * "ok" no prueba nada — el usuario pudo cerrar la pestaña, perder la red
 * o manipular la URL de retorno. La única fuente de verdad es Stripe, y
 * solo el servidor puede consultarla. Un `200` prueba que llegó, no que
 * se cobró.
 *
 * Se eligió Checkout sobre el SDK nativo porque este último colgó
 * `pod install` dos veces; además, la tarjeta nunca pasa por nuestra app.
 */
import { httpsCallable } from "firebase/functions";
import * as WebBrowser from "expo-web-browser";
import { functions } from "../../../lib/firebase";
import type { PagoResultado, PaymentPort } from "../../ports/PaymentPort";

interface RespuestaCheckout {
  sessionId: string;
  url: string | null;
}

interface RespuestaVerificacion {
  pagado: boolean;
  paymentIntentId: string;
}

export class StripeCheckoutAdapter implements PaymentPort {
  async pagar(q: {
    montoCents: number;
    currency: "usd" | "mxn";
    concepto: string;
    idempotencyKey: string;
    uid: string;
  }): Promise<PagoResultado> {
    const crear = httpsCallable<
      {
        montoCents: number;
        currency: string;
        concepto: string;
        idempotencyKey: string;
      },
      RespuestaCheckout
    >(functions(), "crearCheckout");

    const { data } = await crear({
      montoCents: q.montoCents,
      currency: q.currency,
      concepto: q.concepto,
      idempotencyKey: q.idempotencyKey,
    });
    if (!data.url) throw new Error("checkout-sin-url");

    // Vuelve cuando el usuario cierra la página o regresa por deep link.
    await WebBrowser.openAuthSessionAsync(data.url, "mia://pago");

    const verificar = httpsCallable<
      { sessionId: string },
      RespuestaVerificacion
    >(functions(), "verificarPago");
    const { data: v } = await verificar({ sessionId: data.sessionId });

    if (!v.pagado) throw new Error("pago-no-confirmado");
    return { paymentIntentId: v.paymentIntentId, simulado: false };
  }
}
