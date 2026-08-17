/**
 * Adaptador mock del folio.
 * En memoria por ahora (semana 1); en la semana 5 el almacenamiento
 * pasa a Firestore vía Cloud Functions sin cambiar el contrato.
 * Invariantes que ya se cumplen aquí:
 *  - el precio de cada línea llega congelado; este adaptador jamás
 *    consulta un catálogo
 *  - agregarCargo es idempotente por idempotencyKey
 */
import type { FolioPort } from "../../ports/FolioPort";
import type { Folio, LineaCargo, ReferenciaPago } from "../../types";

export class MockFolioAdapter implements FolioPort {
  private folios = new Map<string, Folio>();
  private seq = 0;

  async abrir(ref: {
    uid: string;
    spotId?: string;
    roomId?: string;
  }): Promise<Folio> {
    const existente = [...this.folios.values()].find(
      (f) => f.uid === ref.uid && f.estado === "open",
    );
    if (existente) return existente;

    this.seq += 1;
    const folio: Folio = {
      id: `folio-${this.seq}`,
      uid: ref.uid,
      ...(ref.spotId !== undefined ? { spotId: ref.spotId } : {}),
      ...(ref.roomId !== undefined ? { roomId: ref.roomId } : {}),
      lineas: [],
      saldoCents: 0,
      estado: "open",
    };
    this.folios.set(folio.id, folio);
    return folio;
  }

  async agregarCargo(folioId: string, linea: LineaCargo): Promise<Folio> {
    const folio = this.folios.get(folioId);
    if (!folio) throw new Error(`Folio inexistente: ${folioId}`);
    if (folio.estado !== "open") throw new Error("El folio ya está liquidado");

    const dup = folio.lineas.some(
      (l) => l.idempotencyKey === linea.idempotencyKey,
    );
    if (!dup) {
      folio.lineas.push(linea);
      folio.saldoCents += linea.precioCents * linea.cantidad;
    }
    return folio;
  }

  async cerrar(folioId: string, pago: ReferenciaPago): Promise<Folio> {
    const folio = this.folios.get(folioId);
    if (!folio) throw new Error(`Folio inexistente: ${folioId}`);
    if (!pago.idempotencyKey) throw new Error("Falta clave de idempotencia");
    folio.estado = "settled";
    return folio;
  }
}
