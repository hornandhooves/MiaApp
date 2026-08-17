import { Redirect, Stack } from "expo-router";
import { FLAGS } from "../../packages/domain/flags";

/**
 * Rutas de staff (cocina y mapa de playa) — detrás de bandera.
 * Con la bandera apagada, cualquier intento aterriza en Home.
 */
export default function StaffLayout() {
  if (!FLAGS.staff) {
    return <Redirect href="/" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
