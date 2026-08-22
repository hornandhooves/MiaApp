/**
 * Las Olas, contra Firestore. Append-only.
 *
 * El saldo SIEMPRE se deriva sumando los asientos; no existe un contador
 * editable en ninguna parte. Una promoción mal aplicada se corrige con
 * un asiento en contra y queda auditada, en vez de con un número que
 * alguien sobrescribe y nadie puede reconstruir.
 *
 * El cliente **no manda cuántas Olas se lleva**: manda el motivo y la
 * referencia, y `acreditarOlas` calcula el delta con las tasas de
 * `config/olas`. Si el teléfono mandara el número, se regalaría el nivel
 * máximo. Escribir aquí está prohibido por las reglas.
 */
import { collection, getDocs, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../lib/firebase";
import { rastro } from "../../../lib/errorTecnico";
import { sondear } from "../../../lib/red";
import type { LedgerPort } from "../../ports/LedgerPort";
import type { LedgerEntry } from "../../types";

const COL = "ledger";

function aAsiento(id: string, d: Record<string, unknown>): LedgerEntry {
  return {
    id,
    uid: String(d.uid ?? ""),
    delta: Number(d.delta ?? 0),
    motivo: String(d.motivo ?? ""),
    refId: String(d.refId ?? ""),
    createdAt: String(d.createdAt ?? new Date().toISOString()),
  };
}

export class FirestoreLedgerAdapter implements LedgerPort {
  async acreditar(q: {
    uid: string;
    delta: number;
    motivo: string;
    refId: string;
    idempotencyKey: string;
  }): Promise<LedgerEntry> {
    // `q.delta` llega del cálculo optimista de la pantalla y se ignora a
    // propósito: manda el del servidor.
    const fn = httpsCallable<
      { motivo: string; refId: string; idempotencyKey: string },
      { id: string | null; delta: number; repetido: boolean }
    >(functions(), "acreditarOlas");
    const { data } = await fn({
      motivo: q.motivo,
      refId: q.refId,
      idempotencyKey: q.idempotencyKey,
    });
    return {
      id: data.id ?? "",
      uid: q.uid,
      delta: data.delta,
      motivo: q.motivo,
      refId: q.refId,
      createdAt: new Date().toISOString(),
    };
  }

  async saldo(uid: string): Promise<number> {
    const asientos = await this.asientos(uid);
    return asientos.reduce((s, a) => s + a.delta, 0);
  }

  async asientos(uid: string): Promise<LedgerEntry[]> {
    // Sin `orderBy` en la consulta: combinado con el filtro por uid
    // exigiría un índice compuesto, y un asiento del ledger es
    // pequeño. Se ordena aquí.
    const snap = await getDocs(
      query(collection(db(), COL), where("uid", "==", uid)),
    );
    return snap.docs
      .map((d) => aAsiento(d.id, d.data()))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  suscribirSaldo(uid: string, cb: (saldo: number) => void): () => void {
    // Por sondeo, por lo mismo que el resto: la respuesta del canal de
    // escucha no llega. Ver packages/lib/red.ts.
    return sondear(
      () => this.saldo(uid),
      (saldo) => {
        rastro("mis olas", saldo);
        cb(saldo);
      },
      { cadaMs: 10_000, etiqueta: "mis-olas", onError: () => cb(0) },
    );
  }
}
