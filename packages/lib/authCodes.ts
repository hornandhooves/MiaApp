/**
 * Códigos con los que Firebase dice "esa identidad ya tiene cuenta".
 *
 * Vive en su propio módulo, sin importar nada, para que se pueda probar
 * sin arrastrar el SDK de Firebase ni los módulos nativos de Expo.
 *
 * Cuál de estos códigos llega depende de un ajuste de consola —
 * Authentication → Settings → User account linking. `miaapp-30191` está
 * en "Link accounts that use the same email", que manda
 * `auth/email-already-in-use`. Contemplar uno solo hace que el
 * comportamiento de la app dependa de una casilla que nadie relee.
 */
export const YA_TIENE_CUENTA = new Set([
  "auth/credential-already-in-use",
  "auth/email-already-in-use",
  "auth/account-exists-with-different-credential",
  "auth/provider-already-linked",
]);
