/** Tipos del dominio. Las pantallas solo conocen estos tipos y los ports. */

export type ISODate = string; // "2026-08-15"

export type MealPlanId = "bb" | "fbe";

export type Lang = "es" | "en";

/** Texto bilingüe. El seed guarda ambas; la UI elige por idioma. */
export interface LText {
  es: string;
  en: string;
}

export interface RoomType {
  id: string;
  /** Orden del sitio — se respeta en la lista del Resort */
  order: number;
  name: LText;
  meta: LText;
  description: LText;
  /** Tarifa base por noche en USD — viene de PLACEHOLDER_PRICES vía seed */
  nightly: number;
  image: string;
  units: number;
}

export interface Tarifa {
  roomTypeId: string;
  desde: ISODate;
  hasta: ISODate;
  plan: MealPlanId;
  noches: number;
  /** Todo en centavos USD para no acarrear flotantes */
  porNocheCents: number;
  planPorNocheCents: number;
  subtotalCents: number;
  impuestosCents: number;
  totalCents: number;
}

export interface Disponibilidad {
  roomType: RoomType;
  disponible: boolean;
  unidadesRestantes: number;
  /** Aviso de escasez ("2 left at this rate") */
  escaso: boolean;
}

export type SpotKind = "bed" | "table";
export type SpotRow =
  | "front"
  | "second"
  | "palapa"
  | "sand-tables"
  | "deck-tables";
export type SpotState = "free" | "held" | "taken";

export interface Spot {
  id: string; // "bed-14", "table-62"
  kind: SpotKind;
  row: SpotRow;
  number: number;
  state: SpotState;
}

export interface SpotHold {
  id: string;
  spotId: string;
  uid: string;
  arrivalAt: string; // ISO datetime
  expiresAt: string;
  state: "active" | "released" | "consumed";
}

export interface LineaCargo {
  /** Clave de idempotencia — obligatoria en toda escritura que cuesta dinero */
  idempotencyKey: string;
  concepto: LText;
  /** Precio congelado al agregar. Nunca se relee del catálogo. */
  precioCents: number;
  cantidad: number;
  origen: "order" | "daypass" | "wellness" | "room" | "adjust";
  refId?: string;
  createdAt: string;
}

export interface Folio {
  id: string;
  uid: string;
  spotId?: string;
  roomId?: string;
  lineas: LineaCargo[];
  saldoCents: number;
  estado: "open" | "settled";
}

export interface ReferenciaPago {
  metodo: "stripe_test" | "on_property";
  paymentIntentId?: string;
  idempotencyKey: string;
}

export interface Estancia {
  roomId: string;
  apellido: string;
  desde: ISODate;
  hasta: ISODate;
  huespedes: number;
  plan: MealPlanId;
  folioId: string;
}

export type OrderState = "received" | "preparing" | "on-way" | "delivered";

export interface OrderLine {
  menuItemId: string;
  nombre: LText;
  precioCents: number; // congelado al agregar
  cantidad: number;
  incluido: boolean;
}

export interface Order {
  id: string;
  uid: string;
  spotId?: string;
  roomId?: string;
  lineas: OrderLine[];
  totalCents: number;
  estado: OrderState;
  idempotencyKey: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  categoria: number; // índice de la categoría del prototipo (0–4)
  nombre: LText;
  descripcion: LText;
  /** null = incluido (según plan o admisión) */
  precioCents: number | null;
  tag: LText | null;
  /** Con qué plan resulta incluido, si aplica */
  incluidoCon?: MealPlanId | "admission";
}

export interface WellnessSlot {
  id: string;
  hora: string; // "09:00"
  duracionMin: number;
  nombre: LText;
  lugar: LText;
  /** null = incluido */
  precioCents: number | null;
  capacidad: number;
  tomados: number;
  /** Días en que existe: 0=Dom … 6=Sáb. Vacío = todos. */
  dias: number[];
}

export interface DayPass {
  id: string;
  uid: string;
  admission: "vip" | "traditional" | "residentes";
  fecha: ISODate;
  personas: number;
  montoCents: number;
  saldoConsumibleCents: number;
  qrCode: string;
  estado: "active" | "used" | "expired";
}

export interface LedgerEntry {
  id: string;
  uid: string;
  delta: number; // Olas, con signo
  motivo: string;
  refId: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  uid: string;
  roomTypeId: string;
  desde: ISODate;
  hasta: ISODate;
  huespedes: number;
  plan: MealPlanId;
  totalCents: number;
  paymentIntentId: string;
  idempotencyKey: string;
  createdAt: string;
}

export type Tier = "arena" | "marea" | "cenote" | "circulo-interior";

export interface Member {
  uid: string;
  tier: Tier;
  nochesAcumuladas: number;
  passesAcumulados: number;
  esResidente: boolean;
}

export interface SessionClaims {
  spotId?: string;
  roomId?: string;
  scope: ("order" | "hold" | "book")[];
  /** Vencimiento de sesión en ms epoch. Va en el claim 'sexp' porque
   * 'exp' es claim reservado del JWT y Firebase lo rechaza. */
  sexp: number;
}
