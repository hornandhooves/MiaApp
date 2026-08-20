/**
 * Seed de Firestore — fuente de verdad del contenido del demo.
 *
 * Idempotente: cada documento se escribe con ID fijo vía set(),
 * así que correrlo dos veces no duplica nada.
 *
 * Uso:
 *   pnpm seed                  → contra el emulador (FIRESTORE_EMULATOR_HOST
 *                                o localhost:8080 por defecto)
 *   pnpm seed:demo             → contra el proyecto miaapp-30191
 *                                (requiere `gcloud auth application-default login`)
 */
import { cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { roomTypes } from "./data/rooms";
import { menuItems } from "./data/menu";
import { spots } from "./data/spots";
import { stays } from "./data/stays";
import { wellnessSlots, cenoteShuttles } from "./data/wellness";
import {
  admissions,
  blogPosts,
  contact,
  dayEvents,
  experiences,
  kitchen,
  lineup,
  sunsetSet,
  week,
} from "./data/content";
import { MEAL_PLAN_FBE_PER_NIGHT_CENTS, TAX_RATE } from "../packages/domain/PLACEHOLDER_PRICES";

const argProject = process.argv.indexOf("--project");
const projectId =
  argProject > -1 ? process.argv[argProject + 1] : "miaapp-30191";

if (argProject === -1 && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
}

const svcAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
initializeApp({
  projectId,
  credential:
    argProject > -1
      ? svcAccount
        ? cert(svcAccount)
        : applicationDefault()
      : undefined,
});

const db = getFirestore();

async function seedCollection<T extends { id: string }>(
  name: string,
  docs: T[],
): Promise<number> {
  const batch = db.batch();
  for (const d of docs) {
    const { id, ...data } = d;
    batch.set(db.collection(name).doc(id), data);
  }
  await batch.commit();
  return docs.length;
}

async function main() {
  const target = process.env.FIRESTORE_EMULATOR_HOST
    ? `emulador (${process.env.FIRESTORE_EMULATOR_HOST})`
    : `proyecto ${projectId}`;
  process.stdout.write(`Sembrando contra ${target}\n`);

  const counts: Record<string, number> = {};

  counts.roomTypes = await seedCollection("roomTypes", roomTypes);
  counts.ratePlans = await seedCollection("ratePlans", [
    {
      id: "bb",
      nombre: { en: "Bed & Breakfast", es: "Bed & Breakfast" },
      detalle: {
        en: "Main dish, coffee, juice, fruit",
        es: "Plato fuerte, café, jugo, fruta",
      },
      porNocheCents: 0,
    },
    {
      id: "fbe",
      nombre: { en: "Full Board Experience", es: "Full Board Experience" },
      detalle: {
        en: "Breakfast, lunch and dinner, drinks in",
        es: "Desayuno, comida y cena, bebidas incluidas",
      },
      porNocheCents: MEAL_PLAN_FBE_PER_NIGHT_CENTS,
    },
  ]);
  counts.spots = await seedCollection("spots", spots);
  // Estancias: la lista de huéspedes. Sin regla en firestore.rules —
  // cae en el deny por defecto — porque sólo la function buscarEstancia
  // debe poder consultarla.
  counts.stays = await seedCollection("stays", stays);
  counts.menuItems = await seedCollection("menuItems", menuItems);
  counts.wellnessSlots = await seedCollection("wellnessSlots", wellnessSlots);
  counts.shuttles = await seedCollection("shuttles", cenoteShuttles);

  // Contenido editorial bajo content/*
  const content = db.collection("content");
  await content.doc("kitchen").set({ services: kitchen });
  await content.doc("admissions").set({ admissions });
  await content.doc("lineup").set({ today: lineup, week, sunsetSet });
  await content.doc("experiences").set({ items: experiences });
  await content.doc("journal").set({ posts: blogPosts });
  await content.doc("contact").set(contact);
  await content.doc("dayEvents").set({ events: dayEvents });
  counts.content = 7;

  // Configuración global del demo
  await db.doc("config/pricing").set({ taxRate: TAX_RATE });
  counts.config = 1;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(counts)) {
    process.stdout.write(`  ${k}: ${v}\n`);
  }
  process.stdout.write(`Listo — ${total} documentos escritos (idempotente).\n`);
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
});
