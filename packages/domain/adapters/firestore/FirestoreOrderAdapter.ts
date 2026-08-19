/**
 * Pedidos contra Firestore real. Mismo contrato que el mock, así que
 * ninguna pantalla cambia: solo se cambia el cableado en di.ts.
 *
 * Diferencias con el mock, todas deliberadas:
 *
 * - Los pedidos SOBREVIVEN al cierre de la app. Ese era el motivo de
 *   existir de este adaptador: "Tus pedidos" se vaciaba cada vez.
 * - El estado NO avanza solo con un timer. Lo mueve el personal desde la
 *   pantalla de cocina, que llama a `avanzarPedido` — la function es el
 *   único camino, porque al entregar dispara el cargo al folio.
 * - La cola offline la resuelve la persistencia de Firestore: una
 *   escritura sin red queda pendiente y se sincroniza sola, con la misma
 *   clave de idempotencia, así que no duplica.
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../lib/firebase";
import type { OrderPort } from "../../ports/OrderPort";
import type { Order, OrderLine } from "../../types";

const COL = "orders";

/** Firestore devuelve `unknown`; esto le da forma sin usar `any`. */
function aOrder(id: string, d: Record<string, unknown>): Order {
  return {
    id,
    uid: String(d.uid ?? ""),
    ...(d.spotId ? { spotId: String(d.spotId) } : {}),
    ...(d.roomId ? { roomId: String(d.roomId) } : {}),
    lineas: (d.lineas ?? []) as OrderLine[],
    totalCents: Number(d.totalCents ?? 0),
    estado: (d.estado ?? "received") as Order["estado"],
    idempotencyKey: String(d.idempotencyKey ?? ""),
    createdAt: String(d.createdAt ?? new Date().toISOString()),
  };
}

export class FirestoreOrderAdapter implements OrderPort {
  async crear(q: {
    uid: string;
    spotId?: string;
    roomId?: string;
    lineas: OrderLine[];
    idempotencyKey: string;
  }): Promise<Order> {
    // Idempotencia: si la clave ya existe, se devuelve el pedido que ya
    // hay. Un reenvío por mala señal no cobra dos veces.
    const previos = await getDocs(
      query(
        collection(db(), COL),
        where("uid", "==", q.uid),
        where("idempotencyKey", "==", q.idempotencyKey),
        limit(1),
      ),
    );
    const yaEsta = previos.docs[0];
    if (yaEsta) return aOrder(yaEsta.id, yaEsta.data());

    const totalCents = q.lineas.reduce(
      (s, l) => s + l.precioCents * l.cantidad,
      0,
    );
    const datos = {
      uid: q.uid,
      ...(q.spotId ? { spotId: q.spotId } : {}),
      ...(q.roomId ? { roomId: q.roomId } : {}),
      lineas: q.lineas,
      totalCents,
      estado: "received" as const,
      idempotencyKey: q.idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db(), COL), datos);
    return aOrder(ref.id, datos);
  }

  suscribirMios(uid: string, cb: (orders: Order[]) => void): () => void {
    return onSnapshot(
      query(collection(db(), COL), where("uid", "==", uid)),
      (snap) => cb(snap.docs.map((d) => aOrder(d.id, d.data()))),
      // Sin red o sin permiso: se entrega lista vacía en vez de romper
      // la pantalla. La UI ya tiene su estado vacío.
      () => cb([]),
    );
  }

  suscribirCocina(cb: (orders: Order[]) => void): () => void {
    // Requiere el claim `staff`; las reglas lo verifican.
    return onSnapshot(
      collection(db(), COL),
      (snap) => cb(snap.docs.map((d) => aOrder(d.id, d.data()))),
      () => cb([]),
    );
  }

  async avanzar(orderId: string): Promise<Order> {
    // El cliente NUNCA escribe el estado: lo mueve la function, que
    // además dispara el cargo al folio en la misma transacción.
    await httpsCallable(functions(), "avanzarPedido")({ orderId });
    const snap = await getDocs(
      query(collection(db(), COL), where("__name__", "==", orderId), limit(1)),
    );
    const d = snap.docs[0];
    if (!d) throw new Error("pedido-inexistente");
    return aOrder(d.id, d.data());
  }

  setOnline(): void {
    // La red la maneja Firestore: no hay simulación que forzar aquí.
    // Existe para cumplir el contrato del port.
    void doc;
  }
}
