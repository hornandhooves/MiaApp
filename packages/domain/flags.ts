/**
 * Banderas del demo. En producción esto migra a Remote Config.
 */
export const FLAGS = {
  /** Mía Círculo — hipótesis, rotulada como concepto en la UI */
  circulo: true,
  /** Rutas de staff (cocina y mapa de playa) dentro de la misma app */
  staff: false,
  /** Llave digital — SIEMPRE false en el demo (no hay SDK de cerraduras) */
  digitalKey: false,
} as const;

export type FlagName = keyof typeof FLAGS;
