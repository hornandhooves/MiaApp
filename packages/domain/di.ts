/**
 * Punto único de armado de ports. Las pantallas piden aquí sus
 * dependencias; cambiar mock→pms es cambiar este archivo, no pantallas.
 */
import { MockContentAdapter } from "./adapters/mock/MockContentAdapter";
import { MockFolioAdapter } from "./adapters/mock/MockFolioAdapter";
import { MockGuestAdapter } from "./adapters/mock/MockGuestAdapter";
import { MockInventoryAdapter } from "./adapters/mock/MockInventoryAdapter";
import {
  MockPassAdapter,
  MockPaymentAdapter,
} from "./adapters/mock/MockPaymentAdapter";
import { MockSpotAdapter } from "./adapters/mock/MockSpotAdapter";
import type { FolioPort, GuestPort, InventoryPort } from "./ports";
import type { ContentPort } from "./ports/ContentPort";
import type { PassPort, PaymentPort } from "./ports/PaymentPort";
import type { SpotPort } from "./ports/SpotPort";
import type { RoomType } from "./types";

// En el demo el catálogo del mock viene del seed local (el mismo
// contenido que se siembra a Firestore).
import { roomTypes } from "../../seed/data/rooms";
import { spots } from "../../seed/data/spots";

interface Ports {
  inventory: InventoryPort;
  folio: FolioPort;
  guest: GuestPort;
  content: ContentPort;
  spot: SpotPort;
  payment: PaymentPort;
  pass: PassPort;
}

let ports: Ports | undefined;

const catalogo = async (): Promise<RoomType[]> => roomTypes;

export function getPorts(): Ports {
  if (!ports) {
    ports = {
      inventory: new MockInventoryAdapter(catalogo),
      folio: new MockFolioAdapter(),
      guest: new MockGuestAdapter(),
      content: new MockContentAdapter(),
      spot: new MockSpotAdapter(spots),
      payment: new MockPaymentAdapter(),
      pass: new MockPassAdapter(),
    };
  }
  return ports;
}
