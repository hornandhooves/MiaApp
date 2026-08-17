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

type FolioListener = { uid: string; cb: (folio: Folio | null) => void };

export class MockFolioAdapter implements FolioPort {
  private folios = new Map<string, Folio>();
  private seq = 0;
  private listeners = new Set<FolioListener>();

  private abierto(uid: string): Folio | null {
    return (
      [...this.folios.values()].find(
        (f) => f.uid === uid && f.estado === "open",
      ) ?? null
    );
  }

  private copy(f: Folio | null): Folio | null {
    return f ? { ...f, lineas: f.lineas.map((l) => ({ ...l })) } : null;
  }

  private notify(uid: string) {
    const folio = this.copy(this.abierto(uid));
    this.listeners.forEach((l) => {
      if (l.uid === uid) l.cb(folio);
    });
  }

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
      this.notify(folio.uid);
    }
    return folio;
  }

  async obtenerAbierto(uid: string): Promise<Folio | null> {
    return this.copy(this.abierto(uid));
  }

  suscribir(uid: string, cb: (folio: Folio | null) => void): () => void {
    const entry = { uid, cb };
    this.listeners.add(entry);
    cb(this.copy(this.abierto(uid)));
    return () => this.listeners.delete(entry);
  }

  async cerrar(folioId: string, pago: ReferenciaPago): Promise<Folio> {
    const folio = this.folios.get(folioId);
    if (!folio) throw new Error(`Folio inexistente: ${folioId}`);
    if (!pago.idempotencyKey) throw new Error("Falta clave de idempotencia");
    folio.estado = "settled";
    this.notify(folio.uid);
    return folio;
  }
}
