/**
 * Estancias — el espejo de lo que mañana vendrá del PMS del hotel.
 *
 * Esta colección **nunca la lee el cliente**. No tiene regla en
 * `firestore.rules` a propósito: cae en el deny por defecto. Es la lista
 * de huéspedes del hotel, con nombre y habitación; que la app pudiera
 * consultarla sería entregarla entera.
 *
 * Sólo `buscarEstancia` la consulta, con el SDK de administrador, y
 * responde una estancia a la vez a quien acierte habitación + apellido.
 *
 * `apellido` va en minúsculas porque la comparación es exacta: Firestore
 * no tiene búsqueda insensible a mayúsculas, así que se normaliza al
 * escribir y al consultar.
 */
export interface Stay {
  id: string;
  habitacion: string;
  /** Siempre en minúsculas y sin espacios alrededor */
  apellido: string;
  huesped: string;
  roomId: string;
  desde: string;
  hasta: string;
  huespedes: number;
  plan: "bb" | "fbe";
  folioId: string;
  /** in-house = está hospedado ahora; sólo estos pueden cargar consumo */
  estado: "in-house" | "checked-out";
}

export const stays: Stay[] = [
  {
    id: "stay-204-lopez",
    habitacion: "204",
    apellido: "lopez",
    huesped: "López",
    roomId: "room-204",
    desde: "2026-08-15",
    hasta: "2026-08-19",
    huespedes: 2,
    plan: "bb",
    folioId: "folio-demo-204",
    estado: "in-house",
  },
];
