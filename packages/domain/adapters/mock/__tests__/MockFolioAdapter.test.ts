import { MockFolioAdapter } from "../MockFolioAdapter";
import type { LineaCargo } from "../../../types";

const linea = (key: string, precioCents: number): LineaCargo => ({
  idempotencyKey: key,
  concepto: { es: "Negroni de mezcal", en: "Mezcal negroni" },
  precioCents,
  cantidad: 1,
  origen: "order",
  createdAt: "2026-08-15T19:40:00Z",
});

describe("MockFolioAdapter", () => {
  it("abrir es idempotente por uid mientras el folio siga abierto", async () => {
    const port = new MockFolioAdapter();
    const a = await port.abrir({ uid: "u1", spotId: "bed-14" });
    const b = await port.abrir({ uid: "u1" });
    expect(b.id).toBe(a.id);
  });

  it("agregarCargo suma al saldo con el precio congelado", async () => {
    const port = new MockFolioAdapter();
    const f = await port.abrir({ uid: "u1" });
    await port.agregarCargo(f.id, linea("k1", 1600));
    const updated = await port.agregarCargo(f.id, linea("k2", 900));
    expect(updated.saldoCents).toBe(2500);
    expect(updated.lineas).toHaveLength(2);
  });

  it("la misma clave de idempotencia no cobra dos veces", async () => {
    const port = new MockFolioAdapter();
    const f = await port.abrir({ uid: "u1" });
    await port.agregarCargo(f.id, linea("k1", 1600));
    const updated = await port.agregarCargo(f.id, linea("k1", 1600));
    expect(updated.saldoCents).toBe(1600);
    expect(updated.lineas).toHaveLength(1);
  });

  it("no se puede cargar a un folio liquidado", async () => {
    const port = new MockFolioAdapter();
    const f = await port.abrir({ uid: "u1" });
    await port.cerrar(f.id, { metodo: "stripe_test", idempotencyKey: "p1" });
    await expect(port.agregarCargo(f.id, linea("k9", 100))).rejects.toThrow();
  });
});
