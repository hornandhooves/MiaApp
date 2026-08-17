/**
 * Validación estática del seed — corre sin Firestore.
 * Comprueba los invariantes que el demo promete antes de sembrar.
 * Uso: pnpm seed:check
 */
import { roomTypes } from "./data/rooms";
import { menuItems } from "./data/menu";
import { spots } from "./data/spots";
import { wellnessSlots, cenoteShuttles } from "./data/wellness";
import {
  admissions,
  blogPosts,
  experiences,
  kitchen,
  lineup,
} from "./data/content";
import { ROOM_NIGHTLY_CENTS } from "../packages/domain/PLACEHOLDER_PRICES";

let fallas = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) {
    fallas += 1;
    process.stderr.write(`FALLA: ${msg}\n`);
  }
};

// Las trece categorías del sitio, orden completo y sin huecos
check(roomTypes.length === 13, `roomTypes: ${roomTypes.length} ≠ 13`);
const orders = roomTypes.map((r) => r.order).sort((a, b) => a - b);
check(
  orders.every((o, i) => o === i),
  "roomTypes: el orden del sitio tiene huecos o duplicados",
);
check(
  roomTypes.every((r) => ROOM_NIGHTLY_CENTS[r.id] !== undefined),
  "roomTypes: hay categoría sin precio en PLACEHOLDER_PRICES",
);
check(
  Object.keys(ROOM_NIGHTLY_CENTS).length === 13,
  "PLACEHOLDER_PRICES: tarifas de habitación ≠ 13",
);

// Reglas deterministas del demo
check(
  roomTypes.filter((r) => r.units === 1).length === 2,
  "Deben existir exactamente dos categorías con una sola unidad",
);

// Menú: cinco categorías, precios alineados por índice
const cats = new Set(menuItems.map((m) => m.categoria));
check(cats.size === 5, `menú: ${cats.size} categorías ≠ 5`);
check(menuItems.length === 20, `menú: ${menuItems.length} platillos ≠ 20`);

// Mapa: 18 camastros + 8 mesas, primera fila casi llena, palapa libre
check(spots.length === 26, `spots: ${spots.length} ≠ 26`);
const front = spots.filter((s) => s.row === "front");
check(
  front.filter((s) => s.state === "taken").length >= 2,
  "spots: la primera fila debe verse demandada",
);
const palapa = spots.filter((s) => s.row === "palapa");
check(
  palapa.filter((s) => s.state === "free").length >= 4,
  "spots: la sombra de palapa debe estar mayormente libre",
);

// Bienestar: temazcal solo jueves y domingo; yoga 9:00 con dos lugares
const temazcal = wellnessSlots.find((w) => w.id === "temazcal-1800");
check(
  JSON.stringify(temazcal?.dias) === JSON.stringify([4, 0]),
  "temazcal: debe existir solo jueves y domingo",
);
const yoga9 = wellnessSlots.find((w) => w.id === "daily-yoga-0900");
check(
  (yoga9?.capacidad ?? 0) - (yoga9?.tomados ?? 0) === 2,
  "yoga 9:00: deben quedar exactamente dos lugares",
);

// Contenido
check(admissions.length === 3, "admisiones ≠ 3");
check(experiences.length === 9, "experiencias ≠ 9 (las nueve del sitio)");
check(kitchen.length === 4, "cocina: servicios ≠ 4");
check(lineup.length === 5, "line-up del día ≠ 5 filas");
check(blogPosts.length === 4, "journal ≠ 4 posts");
check(cenoteShuttles.length === 3, "shuttles ≠ 3 salidas");

// Bilingüe: nada vacío
const bilingues = [
  ...roomTypes.flatMap((r) => [r.name, r.meta, r.description]),
  ...menuItems.flatMap((m) => [m.nombre, m.descripcion]),
  ...wellnessSlots.flatMap((w) => [w.nombre, w.lugar]),
];
check(
  bilingues.every((t) => t.es.trim() && t.en.trim()),
  "hay textos bilingües vacíos en el seed",
);

if (fallas > 0) {
  process.stderr.write(`\n${fallas} invariantes rotos.\n`);
  process.exit(1);
}
process.stdout.write("Seed válido: todos los invariantes se cumplen.\n");
