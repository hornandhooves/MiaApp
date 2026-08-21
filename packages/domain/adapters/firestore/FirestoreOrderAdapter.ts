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
import { rastro } from "../../../lib/errorTecnico";
import { conLimite } from "../../../lib/red";
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
    // La app NO escribe el pedido: se lo pide al servidor.
    //
    // Dos razones, y la segunda es la que importa. La técnica: el canal
    // de escritura de Firestore se cuelga en React Native — la promesa
    // no resuelve ni falla, y el botón se queda muerto. Esta llamada usa
    // el mismo HTTPS que ya funciona para todo lo demás.
    //
    // La de fondo: el precio se congela en el SERVIDOR, leyéndolo del
    // catálogo en ese instante. Si el teléfono mandara los precios,
    // bastaría con editarlos para cenar gratis. Aquí solo se mandan qué
    // platillo y cuántos.
    const fn = httpsCallable<
      {
        spotId?: string;
        roomId?: string;
        idempotencyKey: string;
        items: { menuItemId: string; cantidad: number }[];
      },
      Order & { repetido: boolean }
    >(functions(), "crearPedido");

    const { data } = await conLimite(
      fn({
        ...(q.spotId ? { spotId: q.spotId } : {}),
        ...(q.roomId ? { roomId: q.roomId } : {}),
        idempotencyKey: q.idempotencyKey,
        items: q.lineas.map((l) => ({
          menuItemId: l.menuItemId,
          cantidad: l.cantidad,
        })),
      }),
      20_000,
      "crear-pedido",
    );
    rastro("pedido: creado", { id: data.id, repetido: data.repetido });
    return {
      id: data.id,
      uid: data.uid,
      ...(data.spotId ? { spotId: data.spotId } : {}),
      ...(data.roomId ? { roomId: data.roomId } : {}),
      lineas: data.lineas,
      totalCents: data.totalCents,
      estado: data.estado,
      idempotencyKey: data.idempotencyKey,
      createdAt: data.createdAt,
    };
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
