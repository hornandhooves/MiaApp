/**
 * Mapa de las veinte pantallas del prototipo a rutas de Expo Router.
 * Las claves son los ids de pantalla del prototipo (SCREENS) y de los
 * catálogos i18n (screenNames.*).
 */
export const SCREEN_ROUTES = {
  login: "/login",
  guest: "/guest",
  home: "/",
  beach: "/beach",
  sunbeds: "/sunbeds",
  dine: "/dine",
  resort: "/resort",
  room: "/room",
  checkout: "/checkout",
  weddings: "/weddings",
  wellness: "/wellness",
  experiences: "/experiences",
  cenote: "/cenote",
  tonight: "/tonight",
  chat: "/chat",
  stay: "/stay",
  circulo: "/circulo",
  contact: "/contact",
  blog: "/blog",
  confirm: "/confirm",
} as const;

export type ScreenKey = keyof typeof SCREEN_ROUTES;

/** Secciones del sitio en el nav sheet (orden del prototipo) */
export const SHEET_SITE_KEYS: ScreenKey[] = [
  "home",
  "beach",
  "resort",
  "weddings",
  "wellness",
  "experiences",
  "blog",
  "contact",
];

/** Herramientas de la visita en el nav sheet */
export const SHEET_APP_KEYS: ScreenKey[] = [
  "tonight",
  "dine",
  "sunbeds",
  "chat",
  "stay",
  "circulo",
];

/** Los cinco del tab bar, en orden */
export const TAB_KEYS: ScreenKey[] = [
  "home",
  "beach",
  "resort",
  "circulo",
  "stay",
];

/** Glifos del prototipo para el tab bar */
export const TAB_ICONS: Record<string, string> = {
  home: "◈",
  beach: "≋",
  resort: "◫",
  circulo: "✦",
  stay: "○",
};
