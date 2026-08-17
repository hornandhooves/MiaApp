import { hhmmToMinutes, minutesUntil, stayDay } from "../tulum";

describe("hhmmToMinutes", () => {
  it("convierte horas del día a minutos", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("17:30")).toBe(1050);
    expect(hhmmToMinutes("18:41")).toBe(1121);
  });
});

describe("minutesUntil (hora fija de Tulum, UTC-5)", () => {
  it("calcula lo que falta para el set de las 17:30", () => {
    // 20:00 UTC = 15:00 en Tulum → faltan 150 min
    const now = new Date("2026-08-15T20:00:00Z");
    expect(minutesUntil("17:30", now)).toBe(150);
  });
  it("es negativo cuando ya pasó", () => {
    const now = new Date("2026-08-16T00:00:00Z"); // 19:00 en Tulum
    expect(minutesUntil("17:30", now)).toBeLessThan(0);
  });
});

describe("stayDay", () => {
  it("día 2 de 4 en la estancia demo", () => {
    const now = new Date("2026-08-16T18:00:00Z");
    expect(stayDay("2026-08-15", "2026-08-19", now)).toEqual({
      day: 2,
      total: 4,
    });
  });
  it("null fuera del rango", () => {
    const now = new Date("2026-08-25T12:00:00Z");
    expect(stayDay("2026-08-15", "2026-08-19", now)).toBeNull();
  });
});
