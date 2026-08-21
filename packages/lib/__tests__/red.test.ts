/**
 * El límite de tiempo existe por un fallo real: el transporte de
 * Firestore en React Native se colgó sin rechazar nunca la promesa, y
 * el botón de "Ordenar" se quedó gris para siempre. Un sistema roto que
 * se ve sano es peor que uno roto que se ve roto.
 */
import { conLimite, SIN_RESPUESTA } from "../red";

describe("conLimite", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("deja pasar lo que responde a tiempo", async () => {
    await expect(conLimite(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });

  it("propaga el error real sin disfrazarlo", async () => {
    const real = new Error("permission-denied");
    await expect(conLimite(Promise.reject(real), 1000)).rejects.toThrow(
      "permission-denied",
    );
  });

  it("convierte un cuelgue en un error con código", async () => {
    const colgada = new Promise(() => {
      // nunca resuelve: es exactamente el fallo que motivó esto
    });
    const p = conLimite(colgada, 12_000, "consulta-idempotencia");
    // La promesa debe estar pendiente antes del límite...
    jest.advanceTimersByTime(11_000);
    let resuelta = false;
    void p.catch(() => {
      resuelta = true;
    });
    await Promise.resolve();
    expect(resuelta).toBe(false);
    // ...y fallar después.
    jest.advanceTimersByTime(2_000);
    await expect(p).rejects.toMatchObject({ code: SIN_RESPUESTA });
  });

  it("el error dice QUÉ operación se colgó", async () => {
    const p = conLimite(new Promise(() => {}), 100, "escritura-pedido");
    jest.advanceTimersByTime(200);
    await expect(p).rejects.toThrow("escritura-pedido");
  });

  it("no deja temporizadores vivos cuando responde", async () => {
    await conLimite(Promise.resolve(1), 5000);
    expect(jest.getTimerCount()).toBe(0);
  });
});
