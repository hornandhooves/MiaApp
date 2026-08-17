/**
 * ⚠️ PRECIOS PLACEHOLDER — TODO NÚMERO AQUÍ ES INVENTADO ⚠️
 *
 * Ninguna cifra de este archivo ha sido confirmada por Mía Tulum.
 * Provienen del prototipo de diseño (docs/prototipo.dc.html) y existen
 * solo para que el demo se sienta real.
 *
 * Responsable de confirmar los reales: PENDIENTE — no existe todavía
 * la persona en Mía que sea dueña de tarifas y precios.
 *
 * Regla de CLAUDE.md: ninguna otra parte del código escribe una cifra
 * de dinero o de Olas. Este archivo no se edita sin avisar a Carlos
 * explícitamente en la respuesta.
 *
 * Unidades: dinero en CENTAVOS (USD salvo que se indique MXN).
 */

/** Impuesto aplicado a hospedaje en el checkout del prototipo */
export const TAX_RATE = 0.16;

/** Tarifas por noche por categoría, USD centavos — orden del sitio */
export const ROOM_NIGHTLY_CENTS: Record<string, number> = {
  "suite-premium-ocean-jacuzzi": 48000,
  "suite-deluxe-ocean-jacuzzi": 42000,
  "king-deluxe-ocean": 36000,
  "deluxe-partial-ocean": 31000,
  "double-partial-ocean": 34000,
  "suite-garden": 28000,
  "family-4": 26000,
  "family-6": 32000,
  "family-8": 38000,
  "studio-terrace": 17500,
  studio: 16000,
  "teepee-partial-ocean": 15000,
  "teepee-garden": 13000,
};

/** Full Board Experience: cargo por noche adicional, USD centavos */
export const MEAL_PLAN_FBE_PER_NIGHT_CENTS = 9500;

/** Admisiones del beach club, MXN centavos, por persona por día */
export const ADMISSION_MXN_CENTS = {
  vip: 150000,
  traditional: 100000,
  residentes: 60000,
} as const;

/** Camastro primera fila (hold), USD centavos — regresa en consumo */
export const SUNBED_FRONT_ROW_CENTS = 6000;

/** Menú — USD centavos. null = incluido. Índices: [categoría][platillo] */
export const MENU_PRICES_CENTS: (number | null)[][] = [
  // Beach menu
  [2400, 2800, 1900, 1400, 5200],
  // Breakfast (incluidos con estancia) + cold brew
  [null, null, null, 600],
  // Drinks (immunity shot incluido con admisión)
  [1600, 1400, 900, null],
  // Wine cellar
  [6800, 1300, 14000, 3800],
  // Chef's table
  [9500, 4500, null],
];

/** Bienestar — USD centavos. null = incluido. */
export const WELLNESS_PRICES_CENTS = {
  sunriseYoga: null,
  dailyYoga: null,
  massage: 11000,
  temazcal: 8500,
} as const;

/** Mía Círculo — tasas y canjes (concepto, sin valor contable) */
export const OLAS = {
  /** Olas por dólar según nivel */
  ratePerUsd: { arena: 10, marea: 12, cenote: 15, "circulo-interior": 20 },
  /** Bono por referir a alguien que se hospeda */
  referralBonus: 2000,
  /** Canjes */
  redeem: {
    freeNightOcean: 12000,
    dayPassTraditional: 3500,
    massage: 4500,
    temazcal: 3000,
    chefsTableSeat: 8000,
  },
  /** Umbrales de nivel (noches o day passes) */
  tiers: { marea: 5, cenote: 15, "circulo-interior": 30 },
} as const;

/** Reglas de tiempo que el prototipo fija en copy */
export const HOLD_MINUTES_PAST_ARRIVAL = 45;
export const HOLD_WARN_MINUTES_BEFORE_RELEASE = 10;
export const ORDER_ETA = { minMin: 12, maxMin: 18 } as const;
