/**
 * Servicio de holds: crea el apartado vía SpotPort (transaccional),
 * y programa la notificación local de aviso 10 minutos antes de la
 * liberación. En producción el aviso lo dispara Cloud Tasks + push.
 */
import * as Notifications from "expo-notifications";
import { getPorts } from "../domain/di";
import {
  HOLD_WARN_MINUTES_BEFORE_RELEASE,
} from "../domain/PLACEHOLDER_PRICES";
import type { SpotHold } from "../domain/types";

export async function crearHoldConAviso(q: {
  uid: string;
  spotId: string;
  arrival: string;
  warnTitle: string;
  warnBody: string;
}): Promise<SpotHold> {
  const hold = await getPorts().spot.crearHold({
    uid: q.uid,
    spotId: q.spotId,
    arrival: q.arrival,
  });

  const warnAtMs =
    new Date(hold.expiresAt).getTime() -
    HOLD_WARN_MINUTES_BEFORE_RELEASE * 60_000;
  const seconds = Math.floor((warnAtMs - Date.now()) / 1000);
  if (seconds > 0) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: q.warnTitle, body: q.warnBody },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });
    } catch {
      // Sin permiso de notificaciones: el hold vive igual
    }
  }
  return hold;
}
