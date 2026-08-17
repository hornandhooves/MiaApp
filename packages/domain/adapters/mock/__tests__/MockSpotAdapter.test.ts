import { MockSpotAdapter } from "../MockSpotAdapter";
import {
  MockPassAdapter,
  MockPaymentAdapter,
} from "../MockPaymentAdapter";
import { spots } from "../../../../../seed/data/spots";

const mk = () => new MockSpotAdapter(spots, 45, false);

describe("MockSpotAdapter — semántica transaccional", () => {
  it("dos apartados simultáneos del mismo lugar: exactamente un ganador", async () => {
    const port = mk();
    const results = await Promise.allSettled([
      port.crearHold({ uid: "a", spotId: "bed-14", arrival: "12:00" }),
      port.crearHold({ uid: "b", spotId: "bed-14", arrival: "12:00" }),
    ]);
    const ganados = results.filter((r) => r.status === "fulfilled");
    const perdidos = results.filter((r) => r.status === "rejected");
    expect(ganados).toHaveLength(1);
    expect(perdidos).toHaveLength(1);
  });

  it("no se aparta un lugar ocupado del seed", async () => {
    const port = mk();
    await expect(
      port.crearHold({ uid: "a", spotId: "bed-11", arrival: "12:00" }),
    ).rejects.toThrow("spot-ocupado");
  });

  it("el hold marca el lugar como held y se refleja en la suscripción", async () => {
    const port = mk();
    let last: string | undefined;
    const off = port.suscribir((all) => {
      last = all.find((s) => s.id === "bed-14")?.state;
    });
    await port.crearHold({ uid: "a", spotId: "bed-14", arrival: "12:00" });
    expect(last).toBe("held");
    off();
  });

  it("liberar el hold devuelve el lugar a libre", async () => {
    const port = mk();
    const hold = await port.crearHold({
      uid: "a",
      spotId: "bed-14",
      arrival: "12:00",
    });
    await port.liberarHold(hold.id);
    const all = await port.listar();
    expect(all.find((s) => s.id === "bed-14")?.state).toBe("free");
    expect(await port.holdActivo("a")).toBeNull();
  });

  it("un nuevo hold del mismo usuario libera el anterior", async () => {
    const port = mk();
    await port.crearHold({ uid: "a", spotId: "bed-14", arrival: "12:00" });
    await port.crearHold({ uid: "a", spotId: "bed-16", arrival: "12:00" });
    const all = await port.listar();
    expect(all.find((s) => s.id === "bed-14")?.state).toBe("free");
    expect(all.find((s) => s.id === "bed-16")?.state).toBe("held");
  });

  it("staff puede ocupar y liberar en un toque", async () => {
    const port = mk();
    await port.setEstado("bed-13", "taken");
    expect(
      (await port.listar()).find((s) => s.id === "bed-13")?.state,
    ).toBe("taken");
    await port.setEstado("bed-13", "free");
    expect(
      (await port.listar()).find((s) => s.id === "bed-13")?.state,
    ).toBe("free");
  });
});

describe("MockPayment/Pass — idempotencia", () => {
  it("la misma clave no cobra dos veces ni emite dos passes", async () => {
    const pay = new MockPaymentAdapter();
    const pass = new MockPassAdapter();
    const q = {
      montoCents: 100000,
      currency: "mxn" as const,
      concepto: "Day pass",
      idempotencyKey: "k1",
      uid: "u1",
    };
    const a = await pay.pagar(q);
    const b = await pay.pagar(q);
    expect(a.paymentIntentId).toBe(b.paymentIntentId);
    expect(a.simulado).toBe(true);

    const e = {
      uid: "u1",
      admission: "traditional" as const,
      fecha: "2026-08-17",
      personas: 2,
      montoCents: 100000,
      paymentIntentId: a.paymentIntentId,
      idempotencyKey: "k1",
    };
    const p1 = await pass.emitir(e);
    const p2 = await pass.emitir(e);
    expect(p1.id).toBe(p2.id);
    expect(p1.saldoConsumibleCents).toBe(100000);
    expect((await pass.delUsuario("u1")).length).toBe(1);
  });
});
