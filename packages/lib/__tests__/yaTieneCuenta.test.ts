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
import { NONCE_INVALIDO, YA_TIENE_CUENTA } from "../authCodes";

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

describe("códigos de nonce inválido", () => {
  it("contempla missing-or-invalid-nonce", () => {
    // Es el que apareció al reutilizar el mismo OAuthCredential en dos
    // llamadas del SDK: enlazar falla, y entrar con el mismo objeto
    // devuelve esto aunque la credencial original fuera válida.
    expect(NONCE_INVALIDO.has("auth/missing-or-invalid-nonce")).toBe(true);
  });

  it("contempla invalid-credential", () => {
    expect(NONCE_INVALIDO.has("auth/invalid-credential")).toBe(true);
  });

  it("no se traga un fallo de red", () => {
    // Reintentar con una identidad nueva de Apple ante un fallo de red
    // sacaría la hoja de Apple por nada.
    expect(NONCE_INVALIDO.has("auth/network-request-failed")).toBe(false);
  });

  it("los dos conjuntos no se pisan", () => {
    for (const c of NONCE_INVALIDO) expect(YA_TIENE_CUENTA.has(c)).toBe(false);
  });
});
