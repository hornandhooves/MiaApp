/**
 * Punto único de armado de ports. Las pantallas piden aquí sus
 * dependencias; cambiar mock→pms es cambiar este archivo, no pantallas.
 */
import { MockChatAdapter } from "./adapters/mock/MockChatAdapter";
import { MockContentAdapter } from "./adapters/mock/MockContentAdapter";
import { MockFolioAdapter } from "./adapters/mock/MockFolioAdapter";
import { MockGuestAdapter } from "./adapters/mock/MockGuestAdapter";
import { MockInventoryAdapter } from "./adapters/mock/MockInventoryAdapter";
import { MockOrderAdapter } from "./adapters/mock/MockOrderAdapter";
import {
  MockPassAdapter,
  MockPaymentAdapter,
} from "./adapters/mock/MockPaymentAdapter";
import { MockLedgerAdapter } from "./adapters/mock/MockLedgerAdapter";
import { MockReservationAdapter } from "./adapters/mock/MockReservationAdapter";
import { MockSpotAdapter } from "./adapters/mock/MockSpotAdapter";
import { MockWellnessAdapter } from "./adapters/mock/MockWellnessAdapter";
import type { FolioPort, GuestPort, InventoryPort } from "./ports";
import type { ContentPort } from "./ports/ContentPort";
import type { PassPort, PaymentPort } from "./ports/PaymentPort";
import type { SpotPort } from "./ports/SpotPort";
import type { OrderPort } from "./ports/OrderPort";
import type { ReservationPort } from "./ports/ReservationPort";
import type { WellnessPort } from "./ports/WellnessPort";
import type { LedgerPort } from "./ports/LedgerPort";
import type { ChatPort } from "./ports/ChatPort";
import type { RoomType } from "./types";

// En el demo el catálogo del mock viene del seed local (el mismo
// contenido que se siembra a Firestore).
import { roomTypes } from "../../seed/data/rooms";
import { spots } from "../../seed/data/spots";
import { wellnessSlots, cenoteShuttles } from "../../seed/data/wellness";

interface Ports {
  inventory: InventoryPort;
  folio: FolioPort;
  guest: GuestPort;
  content: ContentPort;
  spot: SpotPort;
  payment: PaymentPort;
  pass: PassPort;
  order: OrderPort;
  reservation: ReservationPort;
  wellness: WellnessPort;
  ledger: LedgerPort;
  chat: ChatPort;
}

let ports: Ports | undefined;

/** Textos del concierge del demo — la app los inyecta desde i18n
 *  ANTES del primer getPorts() (el dominio no conoce i18n). */
let chatTexts = { saludo: "", respuestas: [] as string[] };
export function setChatTexts(saludo: string, respuestas: string[]): void {
  chatTexts = { saludo, respuestas };
}

const catalogo = async (): Promise<RoomType[]> => roomTypes;

export function getPorts(): Ports {
  if (!ports) {
    const folio = new MockFolioAdapter();
    // Al entregar un pedido, su cargo (con precio YA congelado) entra
    // al folio del día. Una sola vez: agregarCargo es idempotente.
    const order = new MockOrderAdapter(async (o) => {
      const f = await folio.abrir({
        uid: o.uid,
        ...(o.spotId !== undefined ? { spotId: o.spotId } : {}),
        ...(o.roomId !== undefined ? { roomId: o.roomId } : {}),
      });
      for (const linea of o.lineas) {
        await folio.agregarCargo(f.id, {
          idempotencyKey: `${o.idempotencyKey}:${linea.menuItemId}`,
          concepto: linea.nombre,
          precioCents: linea.precioCents,
          cantidad: linea.cantidad,
          origen: "order",
          refId: o.id,
          createdAt: new Date().toISOString(),
        });
      }
    });
    ports = {
      inventory: new MockInventoryAdapter(catalogo),
      folio,
      guest: new MockGuestAdapter(),
      content: new MockContentAdapter(),
      spot: new MockSpotAdapter(spots),
      payment: new MockPaymentAdapter(),
      pass: new MockPassAdapter(),
      order,
      reservation: new MockReservationAdapter(),
      wellness: new MockWellnessAdapter(wellnessSlots, cenoteShuttles),
      ledger: new MockLedgerAdapter(),
      chat: new MockChatAdapter(chatTexts.saludo, chatTexts.respuestas),
    };
  }
  return ports;
}
