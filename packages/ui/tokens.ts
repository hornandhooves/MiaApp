/**
 * Tokens de diseño — extraídos de docs/prototipo.dc.html (Mía Tulum Prototype v2).
 * Única fuente de color, tipo, radio y espaciado de la app.
 * Regla de CLAUDE.md: ningún valor visual vive fuera de este archivo.
 */

export const color = {
  /** Tinta principal — texto y superficies oscuras */
  ink: "#0B0B0C",
  /** Acento terracota — CTAs, selección, marca */
  accent: "#E2593F",
  /** Fondo de pantalla (marfil cálido) */
  canvas: "#F4EFE7",
  /** Fondo del entorno / splash (arena) */
  sand: "#DAD3C7",
  /** Superficie alterna (tarjetas suaves) */
  stone: "#DED8CE",
  /** Fondo oscuro de fotos antes de cargar */
  photo: "#1A1A1C",
  /** Blanco puro — superficies y texto sobre oscuro */
  white: "#FFFFFF",
  /** Éxito (estado disponible / confirmado) */
  success: "#3FAE6A",
  successBright: "#5BD08A",
} as const;

/** Tinta con opacidad — la escala real que usa el prototipo sobre fondo claro */
export const inkAlpha = (a: number) => `rgba(11,11,12,${a})`;
/** Blanco con opacidad — sobre fotos y fondos oscuros */
export const whiteAlpha = (a: number) => `rgba(255,255,255,${a})`;
/** Acento con opacidad (anillos de foco, halos) */
export const accentAlpha = (a: number) => `rgba(226,89,63,${a})`;
/** Marfil translúcido — barras y sheets con blur */
export const canvasAlpha = (a: number) => `rgba(244,239,231,${a})`;

export const font = {
  /** Display serif — títulos. Peso único 400. */
  serif: "BodoniModa_400Regular",
  /** Sans — todo lo demás */
  sansLight: "Jost_300Light",
  sans: "Jost_400Regular",
  sansMedium: "Jost_500Medium",
} as const;

/**
 * Escala tipográfica del prototipo.
 * serif: display 38/1.04 · title 27/1.1 · heading 22/1.1 · sub 18/1.15
 * sans: body 14 · small 12.5 · caption 11.5 · micro 10 (labels .2em upper)
 */
export const type = {
  display: { fontFamily: font.serif, fontSize: 38, lineHeight: 40 },
  hero: { fontFamily: font.serif, fontSize: 34, lineHeight: 36 },
  title: { fontFamily: font.serif, fontSize: 27, lineHeight: 30 },
  heading: { fontFamily: font.serif, fontSize: 22, lineHeight: 24 },
  subheading: { fontFamily: font.serif, fontSize: 18, lineHeight: 21 },
  body: { fontFamily: font.sansLight, fontSize: 14, lineHeight: 22 },
  bodyMedium: { fontFamily: font.sansMedium, fontSize: 14, lineHeight: 18 },
  small: { fontFamily: font.sansLight, fontSize: 12.5, lineHeight: 18 },
  caption: { fontFamily: font.sansLight, fontSize: 11.5, lineHeight: 16 },
  /** Eyebrows y labels — MAYÚSCULAS con tracking .2em */
  label: {
    fontFamily: font.sans,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  labelSmall: {
    fontFamily: font.sans,
    fontSize: 9.5,
    lineHeight: 11,
    letterSpacing: 1.9,
    textTransform: "uppercase" as const,
  },
} as const;

/** Escala de espaciado (px). El prototipo usa múltiplos de esta base. */
export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  gutter: 24,
  screenBottom: 34,
} as const;

export const radius = {
  /** Chips, botones, pills */
  pill: 999,
  /** Tarjetas grandes */
  card: 18,
  /** Tarjetas medianas */
  cardSmall: 16,
  /** Imágenes y tiles */
  tile: 14,
  /** Controles pequeños */
  control: 12,
  /** Sheets (esquinas superiores) */
  sheet: 26,
  /** Marco del teléfono en el prototipo — no se usa en la app */
  device: 36,
} as const;

/** Objetivo táctil mínimo (CLAUDE.md) */
export const hit = { minHeight: 44, minWidth: 44 } as const;

export const shadow = {
  card: {
    shadowColor: color.ink,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

/** Gradiente estándar sobre fotos de héroe (top → bottom) */
export const heroGradient = [
  "rgba(11,11,12,.45)",
  "rgba(11,11,12,.15)",
  "rgba(11,11,12,.9)",
  "rgba(11,11,12,.97)",
] as const;

export const tokens = {
  color,
  font,
  type,
  space,
  radius,
  hit,
  shadow,
  inkAlpha,
  whiteAlpha,
  accentAlpha,
  canvasAlpha,
} as const;

export default tokens;
