import type { Folio, LineaCargo, ReferenciaPago } from "../types";

/**
 * Contrato del folio (la cuenta).
 * El precio de cada línea llega ya congelado — este port nunca consulta
 * un catálogo para cobrar.
 */
export interface FolioPort {
  abrir(ref: { uid: string; spotId?: string; roomId?: string }): Promise<Folio>;
  agregarCargo(folioId: string, linea: LineaCargo): Promise<Folio>;
  cerrar(folioId: string, pago: ReferenciaPago): Promise<Folio>;
  /** Folio abierto del usuario, o null */
  obtenerAbierto(uid: string): Promise<Folio | null>;
  /** Tiempo real del folio abierto del usuario */
  suscribir(uid: string, cb: (folio: Folio | null) => void): () => void;
}
