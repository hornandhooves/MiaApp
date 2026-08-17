import {
  MockInventoryAdapter,
  includesWeekendNight,
  nightsBetween,
} from "../MockInventoryAdapter";
import {
  MEAL_PLAN_FBE_PER_NIGHT_CENTS,
  ROOM_NIGHTLY_CENTS,
  TAX_RATE,
} from "../../../PLACEHOLDER_PRICES";
import type { RoomType } from "../../../types";

const room = (id: string, units: number, order = 0): RoomType => ({
  id,
  order,
  name: { es: id, en: id },
  meta: { es: "", en: "" },
  description: { es: "", en: "" },
  nightly: ROOM_NIGHTLY_CENTS[id] ?? 10000,
  image: "beach",
  units,
});

const CATALOG: RoomType[] = [
  room("suite-premium-ocean-jacuzzi", 2, 0),
  room("family-6", 1, 1),
  room("teepee-partial-ocean", 1, 2),
  room("studio", 6, 3),
];

// "Hoy" congelado: sábado 15 ago 2026 (UTC)
const HOY = () => new Date("2026-08-15T12:00:00Z");

const adapter = new MockInventoryAdapter(async () => CATALOG, HOY);

describe("nightsBetween / includesWeekendNight", () => {
  it("cuenta noches correctamente", () => {
    expect(nightsBetween("2026-08-15", "2026-08-19")).toBe(4);
  });
  it("detecta noche de viernes en la estancia", () => {
    // 2026-08-21 es viernes
    expect(includesWeekendNight("2026-08-21", "2026-08-22")).toBe(true);
  });
  it("una estancia solo entre semana no incluye fin de semana", () => {
    // lunes 2026-08-17 a jueves 2026-08-20 (noches: lun, mar, mié)
    expect(includesWeekendNight("2026-08-17", "2026-08-20")).toBe(false);
  });
});

describe("regla: Suite Premium no disponible viernes ni sábado", () => {
  it("bloquea la Suite Premium cuando la estancia toca sábado", async () => {
    const res = await adapter.buscarDisponibilidad({
      desde: "2026-08-22", // sábado
      hasta: "2026-08-23",
      huespedes: 2,
    });
    const premium = res.find(
      (r) => r.roomType.id === "suite-premium-ocean-jacuzzi",
    );
    expect(premium?.disponible).toBe(false);
    expect(premium?.unidadesRestantes).toBe(0);
  });

  it("la deja disponible entre semana", async () => {
    const res = await adapter.buscarDisponibilidad({
      desde: "2026-08-17",
      hasta: "2026-08-20",
      huespedes: 2,
    });
    const premium = res.find(
      (r) => r.roomType.id === "suite-premium-ocean-jacuzzi",
    );
    expect(premium?.disponible).toBe(true);
  });
});

describe("regla: escasez con una sola unidad", () => {
  it("marca escasas las categorías con pocas unidades", async () => {
    const res = await adapter.buscarDisponibilidad({
      desde: "2026-08-17",
      hasta: "2026-08-20",
      huespedes: 2,
    });
    expect(res.find((r) => r.roomType.id === "family-6")?.escaso).toBe(true);
    expect(
      res.find((r) => r.roomType.id === "teepee-partial-ocean")?.escaso,
    ).toBe(true);
    expect(res.find((r) => r.roomType.id === "studio")?.escaso).toBe(false);
  });
});

describe("regla: a más de 90 días todo disponible", () => {
  it("no aplica bloqueos lejos en el futuro, aunque sea fin de semana", async () => {
    const res = await adapter.buscarDisponibilidad({
      desde: "2026-12-19", // sábado, a >90 días del 15 ago
      hasta: "2026-12-20",
      huespedes: 2,
    });
    const premium = res.find(
      (r) => r.roomType.id === "suite-premium-ocean-jacuzzi",
    );
    expect(premium?.disponible).toBe(true);
    expect(res.every((r) => r.disponible)).toBe(true);
    expect(res.every((r) => !r.escaso)).toBe(true);
  });
});

describe("obtenerTarifa", () => {
  it("calcula noches, plan e impuestos sin flotantes sueltos", async () => {
    const t = await adapter.obtenerTarifa({
      roomTypeId: "suite-premium-ocean-jacuzzi",
      desde: "2026-08-17",
      hasta: "2026-08-21",
      plan: "fbe",
    });
    const nightly = ROOM_NIGHTLY_CENTS["suite-premium-ocean-jacuzzi"] ?? 0;
    const subtotal = (nightly + MEAL_PLAN_FBE_PER_NIGHT_CENTS) * 4;
    expect(t.noches).toBe(4);
    expect(t.subtotalCents).toBe(subtotal);
    expect(t.impuestosCents).toBe(Math.round(subtotal * TAX_RATE));
    expect(t.totalCents).toBe(t.subtotalCents + t.impuestosCents);
  });

  it("plan bb no agrega cargo por noche", async () => {
    const t = await adapter.obtenerTarifa({
      roomTypeId: "studio",
      desde: "2026-08-17",
      hasta: "2026-08-19",
      plan: "bb",
    });
    expect(t.planPorNocheCents).toBe(0);
  });

  it("rechaza rango vacío", async () => {
    await expect(
      adapter.obtenerTarifa({
        roomTypeId: "studio",
        desde: "2026-08-17",
        hasta: "2026-08-17",
        plan: "bb",
      }),
    ).rejects.toThrow();
  });
});
