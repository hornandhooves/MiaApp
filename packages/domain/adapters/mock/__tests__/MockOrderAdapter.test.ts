import { MockFolioAdapter } from "../MockFolioAdapter";
import { MockOrderAdapter } from "../MockOrderAdapter";
import type { Order, OrderLine } from "../../../types";

const linea = (id: string, precio: number): OrderLine => ({
  menuItemId: id,
  nombre: { es: id, en: id },
  precioCents: precio,
  cantidad: 1,
  incluido: false,
});

const base = {
  uid: "u1",
  spotId: "bed-14",
  lineas: [linea("ceviche-verde", 2400), linea("coco-frio", 900)],
};

describe("MockOrderAdapter — idempotencia y cola offline", () => {
  it("el mismo pedido enviado dos veces no se duplica", async () => {
    const port = new MockOrderAdapter(async () => {}, false);
    const a = await port.crear({ ...base, idempotencyKey: "k1" });
    const b = await port.crear({ ...base, idempotencyKey: "k1" });
    expect(b.id).toBe(a.id);
    let count = 0;
    const off = port.suscribirMios("u1", (o) => {
      count = o.length;
    });
    expect(count).toBe(1);
    off();
  });

  it("sin red el pedido se encola; al reconectar se sincroniza sin duplicar", async () => {
    const port = new MockOrderAdapter(async () => {}, false);
    port.setOnline(false);
    await port.crear({ ...base, idempotencyKey: "k1" });
    // reintento del cliente con la misma clave, aún sin red
    await port.crear({ ...base, idempotencyKey: "k1" });

    let visibles: Order[] = [];
    const off = port.suscribirMios("u1", (o) => {
      visibles = o;
    });
    expect(visibles).toHaveLength(0); // todavía no sincroniza

    port.setOnline(true);
    expect(visibles).toHaveLength(1); // uno, no dos
    off();
  });

  it("el total congela los precios de las líneas", async () => {
    const port = new MockOrderAdapter(async () => {}, false);
    const o = await port.crear({ ...base, idempotencyKey: "k2" });
    expect(o.totalCents).toBe(3300);
    expect(o.estado).toBe("received");
  });

  it("avanzar recorre los estados y al entregar dispara onDelivered", async () => {
    const entregados: Order[] = [];
    const port = new MockOrderAdapter(async (o) => {
      entregados.push(o);
    }, false);
    const o = await port.crear({ ...base, idempotencyKey: "k3" });
    await port.avanzar(o.id); // preparing
    await port.avanzar(o.id); // on-way
    await port.avanzar(o.id); // delivered
    expect(entregados).toHaveLength(1);
    expect(entregados[0]?.estado).toBe("delivered");
    // avanzar de nuevo es inocuo
    await port.avanzar(o.id);
    expect(entregados).toHaveLength(1);
  });

  it("entregado sale de la vista de cocina", async () => {
    const port = new MockOrderAdapter(async () => {}, false);
    const o = await port.crear({ ...base, idempotencyKey: "k4" });
    let cocina: Order[] = [];
    const off = port.suscribirCocina((all) => {
      cocina = all;
    });
    expect(cocina).toHaveLength(1);
    await port.avanzar(o.id);
    await port.avanzar(o.id);
    await port.avanzar(o.id);
    expect(cocina).toHaveLength(0);
    off();
  });
});

describe("entrega → folio (cableo de di)", () => {
  it("cada línea entra al folio una sola vez aunque se entregue con reintento", async () => {
    const folio = new MockFolioAdapter();
    const port = new MockOrderAdapter(async (o) => {
      const f = await folio.abrir({ uid: o.uid, spotId: o.spotId ?? "" });
      for (const l of o.lineas) {
        await folio.agregarCargo(f.id, {
          idempotencyKey: `${o.idempotencyKey}:${l.menuItemId}`,
          concepto: l.nombre,
          precioCents: l.precioCents,
          cantidad: l.cantidad,
          origen: "order",
          refId: o.id,
          createdAt: new Date().toISOString(),
        });
      }
    }, false);
    const o = await port.crear({ ...base, idempotencyKey: "k5" });
    await port.avanzar(o.id);
    await port.avanzar(o.id);
    await port.avanzar(o.id);
    const f = await folio.obtenerAbierto("u1");
    expect(f?.lineas).toHaveLength(2);
    expect(f?.saldoCents).toBe(3300);
  });
});
