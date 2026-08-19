/**
 * La espina del app: una sola fuente para "mi día en Mía".
 *
 * Antes cada pantalla preguntaba por su cuenta dónde estaba el huésped y
 * cuánto debía, y ninguna sabía lo que sabían las demás — de ahí la
 * sensación de pantallas sueltas. Este hook concentra el contexto de la
 * sesión y lo consumen tanto la barra persistente como Tu día.
 *
 * No lee Firestore: todo pasa por los ports, como manda el contrato.
 */
import { useEffect, useState } from "react";
import { getPorts } from "../domain/di";
import type { Folio, Order, SpotHold } from "../domain/types";
import { useSession } from "./session";

/** Estados en los que un pedido todavía está en curso. */
const EN_CURSO: readonly string[] = ["received", "preparing", "on-way"];

export interface SesionDia {
  /** Hay algo que mostrar (lugar, cuenta o pedidos vivos) */
  activa: boolean;
  /** Tipo de lugar ligado; la UI decide la palabra (i18n) */
  lugarTipo: "bed" | "table" | "room" | null;
  /** Número del lugar ("14", "204") */
  lugarNum: string | null;
  /** Cuenta del día, en centavos */
  saldoCents: number;
  folio: Folio | null;
  /** Pedidos del día, el más reciente primero */
  pedidos: Order[];
  /** Solo los que siguen en curso */
  enCurso: Order[];
  /** Hold vigente del camastro/mesa, si lo hay */
  hold: SpotHold | null;
  /** Minutos que faltan para que se libere el lugar; null si no aplica */
  minutosHold: number | null;
}

/**
 * Minutos restantes hasta `expiresAt`. Se calcula con el reloj del
 * dispositivo contra un ISO en UTC, así que no depende de la zona.
 */
export function minutosRestantes(expiresAt: string, ahora: number): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - ahora) / 60_000));
}

/** Minutos transcurridos desde que se creó el pedido. */
export function minutosDesde(createdAt: string, ahora: number): number {
  return Math.max(0, Math.floor((ahora - new Date(createdAt).getTime()) / 60_000));
}

export function useSesionDia(): SesionDia {
  const uid = useSession((s) => s.uid);
  const spotId = useSession((s) => s.spotId);
  const roomId = useSession((s) => s.roomId);

  const [folio, setFolio] = useState<Folio | null>(null);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [hold, setHold] = useState<SpotHold | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!uid) return;
    return getPorts().folio.suscribir(uid, setFolio);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return getPorts().order.suscribirMios(uid, setPedidos);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    void getPorts()
      .spot.holdActivo(uid)
      .then((h) => {
        if (vivo) setHold(h);
      })
      .catch(() => {
        // Sin hold o sin red: la barra simplemente no muestra el contador.
      });
    return () => {
      vivo = false;
    };
  }, [uid, spotId]);

  // Un solo reloj para toda la app: los contadores de "hace N min" y
  // "quedan N min" avanzan juntos en vez de cada pantalla con el suyo.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const ordenados = [...pedidos].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const enCurso = ordenados.filter((o) => EN_CURSO.includes(o.estado));
  const saldoCents = folio?.saldoCents ?? 0;
  const minutosHold =
    hold && hold.state === "active" ? minutosRestantes(hold.expiresAt, ahora) : null;

  // El hook no traduce: devuelve tipo y numero, la UI pone la palabra.
  const lugarTipo: SesionDia["lugarTipo"] = spotId
    ? spotId.startsWith("table")
      ? "table"
      : "bed"
    : roomId
      ? "room"
      : null;
  const lugarNum = spotId
    ? (spotId.split("-")[1] ?? null)
    : roomId
      ? (roomId.split("-")[1] ?? roomId)
      : null;

  return {
    activa: Boolean(spotId || roomId || saldoCents > 0 || enCurso.length > 0),
    lugarTipo,
    lugarNum,
    saldoCents,
    folio,
    pedidos: ordenados,
    enCurso,
    hold,
    minutosHold,
  };
}
