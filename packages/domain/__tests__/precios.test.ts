/**
 * Red de seguridad del archivo de precios.
 *
 * `config/precios.json` lo edita una persona, no el código. Un cero de
 * más, una coma faltante o un `0` donde iba `null` se convierten en un
 * cobro equivocado a un huésped real. Estas pruebas corren en cada
 * commit y atrapan lo que un humano se equivoca al teclear.
 */
import {
  ADMISSION_MXN_CENTS,
  MENU_PRICES_CENTS,
  OLAS,
  ORDER_ETA,
  ROOM_NIGHTLY_CENTS,
  SUNBED_FRONT_ROW_CENTS,
  TAX_RATE,
  WELLNESS_PRICES_CENTS,
  HOLD_MINUTES_PAST_ARRIVAL,
  MEAL_PLAN_FBE_PER_NIGHT_CENTS,
} from "../PLACEHOLDER_PRICES";

/** Todo importe en centavos debe ser entero: 0.5 centavos no existe. */
const esCentavosValidos = (n: number) => Number.isInteger(n) && n >= 0;

describe("config/precios.json", () => {
  it("el impuesto es una fracción, no un porcentaje", () => {
    // 16 en vez de 0.16 multiplicaría la cuenta por cien.
    expect(TAX_RATE).toBeGreaterThan(0);
    expect(TAX_RATE).toBeLessThan(1);
  });

  it("toda tarifa de habitación es un entero positivo", () => {
    const tarifas = Object.values(ROOM_NIGHTLY_CENTS);
    expect(tarifas.length).toBeGreaterThan(0);
    for (const t of tarifas) expect(esCentavosValidos(t)).toBe(true);
  });

  it("las admisiones respetan su orden de valor", () => {
    // Si alguien invierte VIP y residentes, el beach club regala el VIP.
    expect(ADMISSION_MXN_CENTS.vip).toBeGreaterThan(
      ADMISSION_MXN_CENTS.traditional,
    );
    expect(ADMISSION_MXN_CENTS.traditional).toBeGreaterThan(
      ADMISSION_MXN_CENTS.residentes,
    );
  });

  it("el menú usa null para incluido, nunca 0", () => {
    for (const categoria of MENU_PRICES_CENTS) {
      expect(Array.isArray(categoria)).toBe(true);
      for (const p of categoria) {
        if (p === null) continue;
        expect(esCentavosValidos(p)).toBe(true);
        // 0 sería "gratis" y se cobraría como línea de $0; lo incluido
        // se marca con null para que ni siquiera genere cargo.
        expect(p).toBeGreaterThan(0);
      }
    }
  });

  it("bienestar y camastro son coherentes", () => {
    expect(esCentavosValidos(SUNBED_FRONT_ROW_CENTS)).toBe(true);
    for (const p of Object.values(WELLNESS_PRICES_CENTS)) {
      if (p === null) continue;
      expect(p).toBeGreaterThan(0);
    }
    expect(esCentavosValidos(MEAL_PLAN_FBE_PER_NIGHT_CENTS)).toBe(true);
  });

  it("las Olas suben con el nivel", () => {
    const r = OLAS.ratePerUsd;
    expect(r.arena).toBeLessThan(r.marea);
    expect(r.marea).toBeLessThan(r.cenote);
    expect(r.cenote).toBeLessThan(r["circulo-interior"]);
  });

  it("los umbrales de nivel son crecientes", () => {
    const u = OLAS.tiers;
    expect(u.marea).toBeLessThan(u.cenote);
    expect(u.cenote).toBeLessThan(u["circulo-interior"]);
  });

  it("la caducidad de Olas es null o un número de meses sensato", () => {
    // Mientras siga en null la app no muestra contador de vencimiento.
    if (OLAS.caducidadMeses === null) return;
    expect(Number.isInteger(OLAS.caducidadMeses)).toBe(true);
    expect(OLAS.caducidadMeses).toBeGreaterThan(0);
  });

  it("el ETA del pedido tiene sentido", () => {
    expect(ORDER_ETA.minMin).toBeGreaterThan(0);
    expect(ORDER_ETA.minMin).toBeLessThanOrEqual(ORDER_ETA.maxMin);
    expect(HOLD_MINUTES_PAST_ARRIVAL).toBeGreaterThan(0);
  });
});
