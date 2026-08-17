/**
 * Pedidos en memoria con la semántica que el demo debe demostrar:
 *  - idempotencia por clave (reenvío ≠ doble cobro)
 *  - cola offline: sin red se encola; al reconectar se sincroniza
 *    sin duplicar
 *  - avance de estados (timers en el demo, tap del staff en cocina)
 *  - al entregar, dispara onDelivered — ahí se congela el cargo al
 *    folio (lo cablea di.ts, este adaptador no conoce el FolioPort)
 */
import { NEXT_STATE, type OrderPort } from "../../ports/OrderPort";
import type { Order, OrderLine } from "../../types";

type Listener = (orders: Order[]) => void;

const ADVANCE_MS = 25_000;

export class MockOrderAdapter implements OrderPort {
  private orders = new Map<string, Order>();
  private byKey = new Map<string, string>();
  private queue: Order[] = [];
  private online = true;
  private seq = 0;
  private listeners = new Set<Listener>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly onDelivered: (o: Order) => Promise<void> = async () => {},
    private readonly autoAdvance: boolean = true,
  ) {}

  private snapshot(): Order[] {
    return [...this.orders.values()]
      .map((o) => ({ ...o, lineas: o.lineas.map((l) => ({ ...l })) }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private notify() {
    const snap = this.snapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  private scheduleAdvance(orderId: string) {
    if (!this.autoAdvance) return;
    this.timers.set(
      orderId,
      setTimeout(() => {
        void this.avanzar(orderId).catch(() => {});
      }, ADVANCE_MS),
    );
  }

  async crear(q: {
    uid: string;
    spotId?: string;
    roomId?: string;
    lineas: OrderLine[];
    idempotencyKey: string;
  }): Promise<Order> {
    // Idempotencia: la misma clave regresa el pedido original
    const existingId = this.byKey.get(q.idempotencyKey);
    if (existingId) {
      const existing = this.orders.get(existingId);
      if (existing) return { ...existing };
    }
    const queued = this.queue.find(
      (o) => o.idempotencyKey === q.idempotencyKey,
    );
    if (queued) return { ...queued };

    if (q.lineas.length === 0) throw new Error("pedido-vacio");

    this.seq += 1;
    const totalCents = q.lineas.reduce(
      (s, l) => s + l.precioCents * l.cantidad,
      0,
    );
    const order: Order = {
      id: `order-${this.seq}`,
      uid: q.uid,
      ...(q.spotId !== undefined ? { spotId: q.spotId } : {}),
      ...(q.roomId !== undefined ? { roomId: q.roomId } : {}),
      lineas: q.lineas.map((l) => ({ ...l })),
      totalCents,
      estado: "received",
      idempotencyKey: q.idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    if (!this.online) {
      // Sin red: encolado local. La UI lo puede mostrar como enviado;
      // se sincroniza al reconectar SIN duplicar.
      this.queue.push(order);
      return { ...order };
    }

    this.commit(order);
    return { ...order };
  }

  private commit(order: Order) {
    this.orders.set(order.id, order);
    this.byKey.set(order.idempotencyKey, order.id);
    this.scheduleAdvance(order.id);
    this.notify();
  }

  setOnline(online: boolean): void {
    this.online = online;
    if (online && this.queue.length > 0) {
      const pending = this.queue;
      this.queue = [];
      for (const order of pending) {
        if (!this.byKey.has(order.idempotencyKey)) this.commit(order);
      }
    }
  }

  suscribirMios(uid: string, cb: Listener): () => void {
    const wrapped: Listener = (all) =>
      cb(all.filter((o) => o.uid === uid));
    this.listeners.add(wrapped);
    wrapped(this.snapshot());
    return () => this.listeners.delete(wrapped);
  }

  suscribirCocina(cb: Listener): () => void {
    const wrapped: Listener = (all) =>
      cb(all.filter((o) => o.estado !== "delivered"));
    this.listeners.add(wrapped);
    wrapped(this.snapshot());
    return () => this.listeners.delete(wrapped);
  }

  async avanzar(orderId: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("pedido-inexistente");
    const next = NEXT_STATE[order.estado];
    if (!next) return { ...order };
    order.estado = next;
    const timer = this.timers.get(orderId);
    if (timer) clearTimeout(timer);
    this.timers.delete(orderId);
    if (next === "delivered") {
      await this.onDelivered({ ...order });
    } else {
      this.scheduleAdvance(orderId);
    }
    this.notify();
    return { ...order };
  }
}
