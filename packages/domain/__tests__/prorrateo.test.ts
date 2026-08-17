import { nochesRestantes, prorrateoUpgradeFbe } from "../prorrateo";
import { MEAL_PLAN_FBE_PER_NIGHT_CENTS } from "../PLACEHOLDER_PRICES";
import { MockReservationAdapter } from "../adapters/mock/MockReservationAdapter";

describe("prorrateo del plan de comidas", () => {
  it("a media estancia solo cobra las noches restantes", () => {
    // Estancia 15–19 (4 noches), hoy es el día 2 (16 ago): quedan 3
    const hoy = new Date("2026-08-16T18:00:00Z");
    const r = prorrateoUpgradeFbe("2026-08-15", "2026-08-19", hoy);
    expect(r.noches).toBe(3);
    expect(r.cargoCents).toBe(3 * MEAL_PLAN_FBE_PER_NIGHT_CENTS);
  });

  it("antes de llegar cobra la estancia completa", () => {
    const hoy = new Date("2026-08-10T12:00:00Z");
    expect(nochesRestantes("2026-08-15", "2026-08-19", hoy)).toBe(4);
  });

  it("después del checkout no cobra nada", () => {
    const hoy = new Date("2026-08-25T12:00:00Z");
    const r = prorrateoUpgradeFbe("2026-08-15", "2026-08-19", hoy);
    expect(r.noches).toBe(0);
    expect(r.cargoCents).toBe(0);
  });
});

describe("MockReservationAdapter — idempotencia", () => {
  const base = {
    uid: "u1",
    roomTypeId: "studio",
    desde: "2026-09-01",
    hasta: "2026-09-05",
    huespedes: 2,
    plan: "bb" as const,
    totalCents: 74240,
    paymentIntentId: "pi_demo_x",
    idempotencyKey: "kR1",
  };

  it("doble toque en pagar no genera dos reservas", async () => {
    const port = new MockReservationAdapter();
    const [a, b] = await Promise.all([port.crear(base), port.crear(base)]);
    // La segunda llamada puede ganar la carrera, pero al final hay UNA
    const todas = await port.delUsuario("u1");
    expect(todas).toHaveLength(1);
    expect(a.idempotencyKey).toBe(b.idempotencyKey);
  });

  it("claves distintas crean reservas distintas", async () => {
    const port = new MockReservationAdapter();
    await port.crear(base);
    await port.crear({ ...base, idempotencyKey: "kR2" });
    expect(await port.delUsuario("u1")).toHaveLength(2);
  });
});
