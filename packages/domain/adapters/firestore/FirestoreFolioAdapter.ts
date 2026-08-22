/**
 * La cuenta del día, contra Firestore.
 *
 * Por qué existe: con `pedidosReales` encendido, el cargo de un pedido
 * entregado lo escribe `avanzarPedido` en la colección `folios`. La app
 * seguía leyendo un folio en memoria, así que **eran dos cuentas
 * distintas que nunca se hablaban**: el servidor apuntaba el cargo y en
 * la pantalla del huésped no aparecía nada.
 *
 * Reparto de responsabilidades, y no es negociable: **el cliente LEE, el
 * servidor ESCRIBE.** Las reglas de Firestore prohíben toda escritura a
 * `folios` desde la app (`allow write: if false`), así que estos métodos
 * de escritura pasan por functions o no existen. Un teléfono no decide
 * cuánto debe.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../lib/firebase";
import { rastro } from "../../../lib/errorTecnico";
import { sondear } from "../../../lib/red";
import type { FolioPort } from "../../ports/FolioPort";
import type { Folio, LineaCargo, ReferenciaPago } from "../../types";

const COL = "folios";

function aFolio(id: string, d: Record<string, unknown>): Folio {
  return {
    id,
    uid: String(d.uid ?? ""),
    ...(d.spotId ? { spotId: String(d.spotId) } : {}),
    ...(d.roomId ? { roomId: String(d.roomId) } : {}),
    lineas: (d.lineas ?? []) as LineaCargo[],
    saldoCents: Number(d.saldoCents ?? 0),
    estado: (d.estado ?? "open") as Folio["estado"],
  };
}

export class FirestoreFolioAdapter implements FolioPort {
  async abrir(): Promise<Folio> {
    // El folio lo abre el servidor al escribir el primer cargo. Que la
    // app pudiera abrirlo sería darle la llave de la caja: bastaría con
    // abrir uno nuevo para dejar atrás el que ya tiene consumo.
    throw new Error("folio-lo-abre-el-servidor");
  }

  async agregarCargo(): Promise<Folio> {
    // Solo `avanzarPedido`, y en la misma transacción que marca el
    // pedido como entregado. Cobrar y entregar no pueden separarse.
    throw new Error("cargo-lo-escribe-el-servidor");
  }

  async cerrar(folioId: string, pago: ReferenciaPago): Promise<Folio> {
    const fn = httpsCallable<
      {
        folioId: string;
        idempotencyKey: string;
        metodo: string;
        paymentIntentId?: string;
      },
      { ok: boolean; yaEstaba: boolean; saldoCents: number }
    >(functions(), "cerrarFolio");
    await fn({
      folioId,
      idempotencyKey: pago.idempotencyKey,
      metodo: pago.metodo,
      ...(pago.paymentIntentId
        ? { paymentIntentId: pago.paymentIntentId }
        : {}),
    });
    const snap = await getDoc(doc(db(), COL, folioId));
    if (!snap.exists()) throw new Error("folio-inexistente");
    return aFolio(snap.id, snap.data());
  }

  async obtenerAbierto(uid: string): Promise<Folio | null> {
    const snap = await getDocs(
      query(
        collection(db(), COL),
        where("uid", "==", uid),
        where("estado", "==", "open"),
        limit(1),
      ),
    );
    const d = snap.docs[0];
    return d ? aFolio(d.id, d.data()) : null;
  }

  suscribir(uid: string, cb: (folio: Folio | null) => void): () => void {
    // Por sondeo: el canal de escucha de Firestore entrega la primera
    // respuesta desde la caché —vacía— y la del servidor no llega
    // nunca. Era la razón de que la cuenta del día saliera en blanco
    // aunque el servidor acabara de escribir el cargo del pedido.
    return sondear(
      () => this.obtenerAbierto(uid),
      (folio) => {
        rastro("mi cuenta", folio ? folio.saldoCents : null);
        cb(folio);
      },
      { cadaMs: 6_000, etiqueta: "mi-cuenta", onError: () => cb(null) },
    );
  }
}
