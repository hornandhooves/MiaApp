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
  /**
   * Lugar APARTADO, que no es lo mismo que el lugar donde estás.
   *
   * `lugarTipo`/`lugarNum` salen de los claims, y los claims solo los
   * escribe validarQR al escanear el sticker: significan "estoy aquí y
   * puedo pedir a este lugar". Un hold significa "me lo guardan para las
   * 12:00". Mezclarlos daría permiso de pedir a un camastro donde el
   * huésped todavía no está, así que son campos distintos a propósito.
   */
  reservado: { tipo: "bed" | "table"; num: string } | null;
  /** Hora de llegada del hold ("12:00"), tal cual la eligió el huésped */
  horaLlegada: string | null;
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

  // El hold se relee cada vez que cambia el mapa de lugares.
  //
  // Antes era una sola lectura al montar, con `spotId` como dependencia.
  // Pero apartar un camastro NO cambia `spotId` —eso solo lo hace
  // escanear el QR— así que el efecto no se volvía a ejecutar y la barra
  // seguía sin enterarse del hold que el huésped acababa de hacer.
  // Apartar sí cambia el estado del lugar a "held", y de eso ya hay un
  // canal en tiempo real: se cuelga de ahí en vez de inventar otro.
  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    const releer = () => {
      void getPorts()
        .spot.holdActivo(uid)
        .then((h) => {
          if (vivo) setHold(h);
        })
        .catch(() => {
          // Sin hold o sin red: la barra no muestra el contador.
        });
    };
    releer();
    const cancelar = getPorts().spot.suscribir(releer);
    return () => {
      vivo = false;
      cancelar();
    };
  }, [uid]);

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

  const activo = hold && hold.state === "active" ? hold : null;
  const reservado: SesionDia["reservado"] = activo
    ? {
        tipo: activo.spotId.startsWith("table") ? "table" : "bed",
        num: activo.spotId.split("-")[1] ?? activo.spotId,
      }
    : null;

  return {
    activa: Boolean(
      spotId || roomId || reservado || saldoCents > 0 || enCurso.length > 0,
    ),
    lugarTipo,
    lugarNum,
    saldoCents,
    folio,
    pedidos: ordenados,
    enCurso,
    hold,
    minutosHold,
    reservado,
    horaLlegada: activo?.arrivalAt ?? null,
  };
}
