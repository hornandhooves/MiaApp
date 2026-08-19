/**
 * ⚠️ PRECIOS — LAS CIFRAS NO VIVEN AQUÍ ⚠️
 *
 * Todos los números están en `config/precios.json`, que es un archivo
 * plano y editable sin tocar código. Este módulo solo lo lee, le pone
 * tipos y lo expone al resto de la app.
 *
 * Por qué así: para cambiar el precio de un camastro no debería hacer
 * falta abrir TypeScript ni entender el proyecto. Carlos —o quien sea
 * dueño de tarifas en Mía— edita el JSON, corre `pnpm seed:check`, y
 * listo.
 *
 * ESTADO: todas las cifras siguen siendo PLACEHOLDER. Vienen del
 * prototipo de diseño y NO han sido confirmadas por Mía Tulum.
 *
 * Regla de CLAUDE.md: ninguna otra parte del código escribe una cifra de
 * dinero o de Olas. Ni este archivo ni el JSON se editan sin avisarlo
 * explícitamente en la respuesta.
 *
 * Unidades: CENTAVOS enteros. USD salvo donde diga MXN.
 */
import precios from "../../config/precios.json";

/** Impuesto aplicado a hospedaje en el checkout */
export const TAX_RATE: number = precios.impuesto.tasa;

/** Tarifas por noche por categoría, USD centavos */
export const ROOM_NIGHTLY_CENTS: Record<string, number> =
  precios.habitaciones_por_noche_usd_centavos;

/** Full Board Experience: cargo por noche adicional, USD centavos */
export const MEAL_PLAN_FBE_PER_NIGHT_CENTS: number =
  precios.plan_full_board_por_noche_usd_centavos;

/** Admisiones del beach club, MXN centavos, por persona por día */
export const ADMISSION_MXN_CENTS = {
  vip: precios.admision_beach_club_mxn_centavos.vip,
  traditional: precios.admision_beach_club_mxn_centavos.traditional,
  residentes: precios.admision_beach_club_mxn_centavos.residentes,
} as const;

/** Camastro primera fila (hold), USD centavos — regresa en consumo */
export const SUNBED_FRONT_ROW_CENTS: number =
  precios.camastro_primera_fila_usd_centavos;

/** Menú — USD centavos. null = incluido. Índices: [categoría][platillo] */
export const MENU_PRICES_CENTS: (number | null)[][] = [
  precios.menu_usd_centavos.beach_menu,
  precios.menu_usd_centavos.desayuno,
  precios.menu_usd_centavos.bebidas,
  precios.menu_usd_centavos.cava,
  precios.menu_usd_centavos.chefs_table,
];

/** Bienestar — USD centavos. null = incluido. */
export const WELLNESS_PRICES_CENTS = {
  sunriseYoga: precios.bienestar_usd_centavos.sunriseYoga,
  dailyYoga: precios.bienestar_usd_centavos.dailyYoga,
  massage: precios.bienestar_usd_centavos.massage,
  temazcal: precios.bienestar_usd_centavos.temazcal,
} as const;

/** Mía Círculo — tasas y canjes (concepto, sin valor contable) */
export const OLAS = {
  /** Olas por dólar según nivel */
  ratePerUsd: precios.olas.por_dolar_gastado,
  /** Bono por referir a alguien que se hospeda */
  referralBonus: precios.olas.bono_por_referido,
  /** Canjes */
  redeem: precios.olas.canjes,
  /** Umbrales de nivel (noches o day passes) */
  tiers: precios.olas.umbrales_nivel,
  /**
   * Meses hasta que caducan las Olas. `null` = no caducan.
   * Mía no ha decidido esta política; mientras siga en null, la app NO
   * muestra ningún contador de vencimiento — inventarlo comprometería al
   * hotel con una regla que nadie aprobó.
   */
  caducidadMeses: precios.olas.caducidad_meses as number | null,
} as const;

/** Reglas de tiempo, en minutos */
export const HOLD_MINUTES_PAST_ARRIVAL: number =
  precios.tiempos.hold_minutos_despues_de_llegada;
export const HOLD_WARN_MINUTES_BEFORE_RELEASE: number =
  precios.tiempos.hold_aviso_minutos_antes;
export const ORDER_ETA = {
  minMin: precios.tiempos.pedido_eta_min,
  maxMin: precios.tiempos.pedido_eta_max,
} as const;
