/**
 * Regresión de un bug que costó una tarde.
 *
 * Al enlazar una cuenta de Apple sobre un usuario anónimo, el catch solo
 * contemplaba `auth/credential-already-in-use`. Pero el código que
 * Firebase manda depende de un ajuste de consola —Authentication →
 * Settings → User account linking— y `miaapp-30191` está en "Link
 * accounts that use the same email", que manda
 * `auth/email-already-in-use`. El error se relanzaba y la pantalla lo
 * mostraba como falla de red: "revisa tu señal", con la señal perfecta.
 *
 * Si alguien recorta esta lista, esta prueba se cae.
 */
import { YA_TIENE_CUENTA } from "../authCodes";

describe("códigos de 'esa identidad ya tiene cuenta'", () => {
  const esperados = [
    "auth/credential-already-in-use",
    "auth/email-already-in-use",
    "auth/account-exists-with-different-credential",
    "auth/provider-already-linked",
  ];

  for (const code of esperados) {
    it(`contempla ${code}`, () => {
      expect(YA_TIENE_CUENTA.has(code)).toBe(true);
    });
  }

  it("no traga cualquier error de auth", () => {
    // Un fallo de red o una credencial inválida SÍ deben propagarse:
    // tragárselos convertiría un error real en un login silencioso.
    expect(YA_TIENE_CUENTA.has("auth/network-request-failed")).toBe(false);
    expect(YA_TIENE_CUENTA.has("auth/invalid-credential")).toBe(false);
  });
});
