/**
 * Contrato de contenido editorial (line-up, cocina, journal, contacto,
 * eventos del día, admisiones, experiencias). En el demo lo sirve el
 * adaptador mock desde el seed; en producción, Firestore content/*
 * editado desde la consola de staff.
 */
import type { LText } from "../types";
import type {
  Admission,
  BlogPost,
  DayEvent,
  DiscoverCard,
  Experience,
  KitchenService,
  LineupRow,
} from "../../../seed/data/content";

export type {
  Admission,
  BlogPost,
  DayEvent,
  DiscoverCard,
  Experience,
  KitchenService,
  LineupRow,
};

export interface WeekRow {
  dia: LText;
  nombre: LText;
  hora: string;
}

export interface SunsetSet {
  hora: string;
  nombre: LText;
  nota: LText;
}

export interface LineupData {
  today: LineupRow[];
  week: WeekRow[];
  sunsetSet: SunsetSet;
}

export interface ContactData {
  telefono: string;
  whatsapp: string;
  conciergeEmail: string;
  generalEmail: string;
  direccion: string;
  horarios: { k: { es: string; en: string }; v: string }[];
  redes: string[];
}

export interface ContentPort {
  kitchen(): Promise<KitchenService[]>;
  admissions(): Promise<Admission[]>;
  lineup(): Promise<LineupData>;
  experiences(): Promise<Experience[]>;
  journal(): Promise<BlogPost[]>;
  contact(): Promise<ContactData>;
  dayEvents(): Promise<DayEvent[]>;
  discover(): Promise<DiscoverCard[][]>;
}
