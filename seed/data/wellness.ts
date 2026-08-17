/**
 * Sesiones de bienestar del prototipo.
 * Reglas deterministas: el temazcal solo existe jueves (4) y domingo (0);
 * el yoga de las 9:00 queda con dos lugares.
 */
import { WELLNESS_PRICES_CENTS } from "../../packages/domain/PLACEHOLDER_PRICES";
import type { WellnessSlot } from "../../packages/domain/types";

export const wellnessSlots: WellnessSlot[] = [
  {
    id: "sunrise-yoga-0700",
    hora: "07:00",
    duracionMin: 45,
    nombre: { en: "Sunrise yoga", es: "Yoga al amanecer" },
    lugar: { en: "Palapa, ocean side", es: "Palapa, lado del mar" },
    precioCents: WELLNESS_PRICES_CENTS.sunriseYoga,
    capacidad: 12,
    tomados: 6,
    dias: [],
  },
  {
    id: "daily-yoga-0900",
    hora: "09:00",
    duracionMin: 45,
    nombre: { en: "Daily yoga", es: "Yoga diario" },
    lugar: { en: "Palapa, ocean side", es: "Palapa, lado del mar" },
    precioCents: WELLNESS_PRICES_CENTS.dailyYoga,
    capacidad: 12,
    tomados: 10, // quedan 2 — regla determinista del demo
    dias: [],
  },
  {
    id: "massage-1500",
    hora: "15:00",
    duracionMin: 50,
    nombre: { en: "Massage by the sea", es: "Masaje junto al mar" },
    lugar: { en: "Cabana on the sand", es: "Cabaña en la arena" },
    precioCents: WELLNESS_PRICES_CENTS.massage,
    capacidad: 6,
    tomados: 1,
    dias: [],
  },
  {
    id: "temazcal-1800",
    hora: "18:00",
    duracionMin: 90,
    nombre: { en: "Temazcal ritual", es: "Ritual de temazcal" },
    lugar: { en: "Thu & Sun only", es: "Solo jueves y domingo" },
    precioCents: WELLNESS_PRICES_CENTS.temazcal,
    capacidad: 10,
    tomados: 6,
    dias: [4, 0], // jueves y domingo
  },
];

/** Salidas de shuttle al cenote (acceso incluido, solo se aparta asiento) */
export const cenoteShuttles = [
  { id: "shuttle-0900", hora: "09:00", asientos: 10, tomados: 4 },
  { id: "shuttle-1130", hora: "11:30", asientos: 10, tomados: 7 },
  { id: "shuttle-1400", hora: "14:00", asientos: 10, tomados: 2 },
];
