/**
 * Punto único de armado de ports. Las pantallas piden aquí sus
 * dependencias; cambiar mock→pms es cambiar este archivo, no pantallas.
 */
import { MockFolioAdapter } from "./adapters/mock/MockFolioAdapter";
import { MockGuestAdapter } from "./adapters/mock/MockGuestAdapter";
import { MockInventoryAdapter } from "./adapters/mock/MockInventoryAdapter";
import type { FolioPort, GuestPort, InventoryPort } from "./ports";
import type { RoomType } from "./types";

// En el demo el catálogo del mock viene del seed local (el mismo
// contenido que se siembra a Firestore).
import { roomTypes } from "../../seed/data/rooms";

interface Ports {
  inventory: InventoryPort;
  folio: FolioPort;
  guest: GuestPort;
}

let ports: Ports | undefined;

const catalogo = async (): Promise<RoomType[]> => roomTypes;

export function getPorts(): Ports {
  if (!ports) {
    ports = {
      inventory: new MockInventoryAdapter(catalogo),
      folio: new MockFolioAdapter(),
      guest: new MockGuestAdapter(),
    };
  }
  return ports;
}
