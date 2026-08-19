/**
 * Banderas del demo. En producción esto migra a Remote Config.
 */
export const FLAGS = {
  /** Mía Círculo — hipótesis, rotulada como concepto en la UI */
  circulo: true,
  /** Rutas de staff (cocina y mapa de playa) dentro de la misma app */
  staff: true,
  /** Llave digital — SIEMPRE false en el demo (no hay SDK de cerraduras) */
  digitalKey: false,
  /**
   * Pedidos contra Firestore real en vez del mock en memoria.
   *
   * true  → los pedidos sobreviven al cierre de la app y la cocina los
   *         avanza de verdad. Requiere functions desplegadas y, para el
   *         personal, el claim `staff` (scripts/staff.mjs).
   * false → mock: el estado avanza solo cada 25 s y todo se pierde al
   *         cerrar. Útil para enseñar el flujo sin backend.
   */
  pedidosReales: true,
  /**
   * Cobros reales con Stripe Checkout en vez del mock.
   *
   * true  → abre la pagina de Stripe en el navegador del telefono y el
   *         SERVIDOR confirma el cobro. Sigue siendo modo TEST: usa la
   *         tarjeta 4242 4242 4242 4242, cualquier fecha futura y CVC.
   * false → mock rotulado "modo de prueba", sin red.
   */
  pagosReales: true,
} as const;

export type FlagName = keyof typeof FLAGS;
