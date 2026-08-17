import { MockLedgerAdapter } from "../MockLedgerAdapter";
import { MockWellnessAdapter } from "../MockWellnessAdapter";
import { cenoteShuttles, wellnessSlots } from "../../../../../seed/data/wellness";

describe("MockWellnessAdapter — cupo transaccional", () => {
  it("el temazcal solo existe jueves (4) y domingo (0)", async () => {
    const port = new MockWellnessAdapter(wellnessSlots, cenoteShuttles);
    const jueves = await port.sesionesHoy(4);
    const lunes = await port.sesionesHoy(1);
    expect(jueves.some((s) => s.id === "temazcal-1800")).toBe(true);
    expect(lunes.some((s) => s.id === "temazcal-1800")).toBe(false);
  });

  it("dos reservas simultáneas del último lugar: un solo ganador", async () => {
    const port = new MockWellnessAdapter(
      [
        {
          id: "x",
          hora: "09:00",
          duracionMin: 45,
          nombre: { es: "x", en: "x" },
          lugar: { es: "x", en: "x" },
          precioCents: null,
          capacidad: 1,
          tomados: 0,
          dias: [],
        },
      ],
      [],
    );
    const res = await Promise.allSettled([
      port.reservarSesion("x", "a"),
      port.reservarSesion("x", "b"),
    ]);
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("reservar dos veces con el mismo uid no consume dos lugares", async () => {
    const port = new MockWellnessAdapter(wellnessSlots, cenoteShuttles);
    await port.reservarSesion("massage-1500", "a");
    const slot = await port.reservarSesion("massage-1500", "a");
    expect(slot.tomados).toBe(2); // seed traía 1 tomado
  });

  it("el shuttle respeta los asientos disponibles", async () => {
    const port = new MockWellnessAdapter(wellnessSlots, cenoteShuttles);
    // shuttle-1130: 10 asientos, 7 tomados → caben 2, no 4
    await expect(
      port.apartarShuttle("shuttle-1130", "a", 4),
    ).rejects.toThrow("sin-asientos");
    const ok = await port.apartarShuttle("shuttle-1130", "b", 2);
    expect(ok.tomados).toBe(9);
  });
});

describe("MockLedgerAdapter — append-only, saldo derivado", () => {
  it("el saldo es la suma de asientos y una reversión es un asiento en contra", async () => {
    const port = new MockLedgerAdapter();
    await port.acreditar({
      uid: "u1",
      delta: 1840,
      motivo: "consumo-dia",
      refId: "folio-1",
      idempotencyKey: "L1",
    });
    await port.acreditar({
      uid: "u1",
      delta: 500,
      motivo: "promo",
      refId: "promo-1",
      idempotencyKey: "L2",
    });
    // Promoción mal aplicada: se REVIERTE con asiento en contra
    await port.acreditar({
      uid: "u1",
      delta: -500,
      motivo: "reverso-promo",
      refId: "promo-1",
      idempotencyKey: "L3",
    });
    expect(await port.saldo("u1")).toBe(1840);
    // Los tres asientos siguen ahí — auditables, nada se sobrescribió
    expect(await port.asientos("u1")).toHaveLength(3);
  });

  it("acreditar es idempotente por clave", async () => {
    const port = new MockLedgerAdapter();
    const q = {
      uid: "u1",
      delta: 100,
      motivo: "x",
      refId: "r",
      idempotencyKey: "L1",
    };
    await port.acreditar(q);
    await port.acreditar(q);
    expect(await port.saldo("u1")).toBe(100);
    expect(await port.asientos("u1")).toHaveLength(1);
  });

  it("la suscripción entrega el saldo derivado en cada asiento", async () => {
    const port = new MockLedgerAdapter();
    const vistos: number[] = [];
    const off = port.suscribirSaldo("u1", (s) => vistos.push(s));
    await port.acreditar({
      uid: "u1",
      delta: 10,
      motivo: "a",
      refId: "r",
      idempotencyKey: "k1",
    });
    await port.acreditar({
      uid: "u1",
      delta: 5,
      motivo: "b",
      refId: "r",
      idempotencyKey: "k2",
    });
    expect(vistos).toEqual([0, 10, 15]);
    off();
  });
});
