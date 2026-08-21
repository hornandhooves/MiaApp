/**
 * `useSesionDia` es la espina: de él salen la barra de sesión y Tu día.
 * En un solo día dio dos bugs que llegaron al teléfono —el hold que
 * nunca se releía y el lugar apartado confundido con el lugar donde
 * estás—, así que aquí queda su red.
 *
 * Se simulan `session` y `di` para no arrastrar el SDK de Firebase ni
 * los módulos nativos de Expo: lo que se prueba es la lógica del hook,
 * no la red.
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";

const mockEstado = {
  uid: "u1" as string | null,
  spotId: null as string | null,
  roomId: null as string | null,
};

let mockHold: unknown = null;
let mockNotificar: (() => void) | null = null;
let mockPedidos: unknown[] = [];
let mockFolio: unknown = null;

jest.mock("../session", () => ({
  useSession: (selector: (s: typeof mockEstado) => unknown) =>
    selector(mockEstado),
}));

jest.mock("../../domain/di", () => ({
  getPorts: () => ({
    folio: {
      suscribir: (_uid: string, cb: (f: unknown) => void) => {
        cb(mockFolio);
        return () => {};
      },
    },
    order: {
      suscribirMios: (_uid: string, cb: (o: unknown[]) => void) => {
        cb(mockPedidos);
        return () => {};
      },
    },
    spot: {
      holdActivo: async () => mockHold,
      suscribir: (cb: () => void) => {
        mockNotificar = cb;
        cb();
        return () => {
          mockNotificar = null;
        };
      },
    },
  }),
}));

// Va DESPUES de los jest.mock a proposito: importarlo antes cargaria
// session.ts y con el el SDK de Firebase, que es justo lo que estos
// mocks evitan.
/* eslint-disable-next-line import/first */
import { minutosDesde, minutosRestantes, useSesionDia } from "../sesionDia";

const AHORA = Date.parse("2026-08-20T18:00:00.000Z");
const enMinutos = (n: number) => new Date(AHORA + n * 60_000).toISOString();

const pedido = (estado: string, minAtras = 0) => ({
  id: `o-${estado}-${minAtras}`,
  uid: "u1",
  lineas: [],
  totalCents: 100,
  estado,
  idempotencyKey: "k",
  createdAt: new Date(AHORA - minAtras * 60_000).toISOString(),
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(AHORA);
  mockEstado.uid = "u1";
  mockEstado.spotId = null;
  mockEstado.roomId = null;
  mockHold = null;
  mockPedidos = [];
  mockFolio = null;
  mockNotificar = null;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("minutosRestantes / minutosDesde", () => {
  it("redondea hacia arriba lo que falta", () => {
    // 30 s restantes siguen siendo "1 min": decir 0 sería mentir.
    expect(minutosRestantes(enMinutos(0.5), AHORA)).toBe(1);
  });

  it("nunca devuelve negativos", () => {
    expect(minutosRestantes(enMinutos(-90), AHORA)).toBe(0);
  });

  it("redondea hacia abajo lo transcurrido", () => {
    // "hace 1 min" a los 119 s: no se presume más antigüedad de la real.
    expect(minutosDesde(new Date(AHORA - 119_000).toISOString(), AHORA)).toBe(1);
  });

  it("un pedido del futuro cuenta como recién hecho", () => {
    expect(minutosDesde(enMinutos(5), AHORA)).toBe(0);
  });
});

describe("useSesionDia", () => {
  it("sin nada que decir, la sesión no está activa", async () => {
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.activa).toBe(false));
    expect(result.current.lugarTipo).toBeNull();
  });

  it("con habitación, el lugar es la suite", async () => {
    mockEstado.roomId = "room-204";
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.activa).toBe(true));
    expect(result.current.lugarTipo).toBe("room");
    expect(result.current.lugarNum).toBe("204");
  });

  it("el spot escaneado gana sobre la habitación", async () => {
    mockEstado.roomId = "room-204";
    mockEstado.spotId = "bed-14";
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.lugarTipo).toBe("bed"));
    expect(result.current.lugarNum).toBe("14");
  });

  it("distingue mesa de camastro por el id", async () => {
    mockEstado.spotId = "table-6";
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.lugarTipo).toBe("table"));
  });

  it("apartar NO es estar: el hold llena `reservado`, no `lugarTipo`", async () => {
    // Este era el bug: la barra decía la suite y el camastro apartado no
    // existía para nadie. Mezclarlos daría permiso de pedir a un lugar
    // donde el huésped todavía no está.
    mockHold = {
      id: "h1",
      spotId: "bed-14",
      uid: "u1",
      arrivalAt: "12:00",
      expiresAt: enMinutos(45),
      state: "active",
    };
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.reservado).not.toBeNull());
    expect(result.current.reservado).toEqual({ tipo: "bed", num: "14" });
    expect(result.current.lugarTipo).toBeNull();
    expect(result.current.horaLlegada).toBe("12:00");
    expect(result.current.activa).toBe(true);
  });

  it("un hold liberado no cuenta como reservado", async () => {
    mockHold = {
      id: "h1",
      spotId: "bed-14",
      uid: "u1",
      arrivalAt: "12:00",
      expiresAt: enMinutos(-5),
      state: "released",
    };
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.hold).not.toBeNull());
    expect(result.current.reservado).toBeNull();
    expect(result.current.minutosHold).toBeNull();
  });

  it("el hold se relee cuando cambia el mapa de lugares", async () => {
    // El bug original: `holdActivo` se leía una sola vez y apartar un
    // camastro no cambia `spotId`, así que la barra nunca se enteraba.
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.reservado).toBeNull());

    mockHold = {
      id: "h2",
      spotId: "bed-7",
      uid: "u1",
      arrivalAt: "13:00",
      expiresAt: enMinutos(45),
      state: "active",
    };
    await act(async () => {
      mockNotificar?.();
    });
    await waitFor(() =>
      expect(result.current.reservado).toEqual({ tipo: "bed", num: "7" }),
    );
  });

  it("el contador de hold baja con el reloj compartido", async () => {
    mockHold = {
      id: "h3",
      spotId: "bed-1",
      uid: "u1",
      arrivalAt: "12:00",
      expiresAt: enMinutos(20),
      state: "active",
    };
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.minutosHold).toBe(20));

    // Un solo reloj de 30 s para toda la app; a los 6 min quedan 14 —
    // el umbral en el que la barra pinta el aviso en acento.
    await act(async () => {
      jest.advanceTimersByTime(6 * 60_000);
    });
    await waitFor(() => expect(result.current.minutosHold).toBe(14));
  });

  it("separa los pedidos en curso de los terminados y los ordena", async () => {
    mockPedidos = [
      pedido("delivered", 30),
      pedido("received", 2),
      pedido("on-way", 10),
      pedido("cancelled", 60),
    ];
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.pedidos.length).toBe(4));
    expect(result.current.enCurso.map((o) => o.estado)).toEqual([
      "received",
      "on-way",
    ]);
    // El más reciente primero: es el que el huésped está esperando.
    expect(result.current.pedidos[0]?.estado).toBe("received");
  });

  it("un pedido vivo activa la sesión aunque no haya lugar ni saldo", async () => {
    mockPedidos = [pedido("preparing", 1)];
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.activa).toBe(true));
  });

  it("un saldo mayor que cero activa la sesión", async () => {
    mockFolio = { id: "f1", uid: "u1", lineas: [], saldoCents: 900, estado: "open" };
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.saldoCents).toBe(900));
    expect(result.current.activa).toBe(true);
  });

  it("sin uid no se suscribe a nada", async () => {
    mockEstado.uid = null;
    const { result } = await renderHook(() => useSesionDia());
    await waitFor(() => expect(result.current.activa).toBe(false));
    expect(result.current.saldoCents).toBe(0);
    expect(result.current.pedidos).toEqual([]);
  });
});
