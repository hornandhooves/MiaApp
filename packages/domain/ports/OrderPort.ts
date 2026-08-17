import type { Order, OrderLine, OrderState } from "../types";

/**
 * Contrato de pedidos.
 * - El precio de cada línea llega YA CONGELADO (se fijó al agregar al
 *   carrito); este port jamás consulta el catálogo.
 * - crear() es idempotente por idempotencyKey: un pedido reenviado
 *   por mala señal no se cobra dos veces.
 * - La cola offline vive en el adaptador: sin red, el pedido se
 *   encola y se sincroniza al reconectar, sin duplicar.
 */
export interface OrderPort {
  crear(q: {
    uid: string;
    spotId?: string;
    roomId?: string;
    lineas: OrderLine[];
    idempotencyKey: string;
  }): Promise<Order>;
  /** Pedidos del usuario (tiempo real) */
  suscribirMios(uid: string, cb: (orders: Order[]) => void): () => void;
  /** Cocina: todos los pedidos vivos (tiempo real) */
  suscribirCocina(cb: (orders: Order[]) => void): () => void;
  /** Staff: avanzar estado */
  avanzar(orderId: string): Promise<Order>;
  /** Simulación de red del demo (y de tests) */
  setOnline(online: boolean): void;
}

export const NEXT_STATE: Record<OrderState, OrderState | null> = {
  received: "preparing",
  preparing: "on-way",
  "on-way": "delivered",
  delivered: null,
};
