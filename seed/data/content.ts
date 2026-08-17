/**
 * Contenido editorial del demo: line-up, semana, horarios de cocina,
 * experiencias, journal, contacto, admisiones y eventos del día.
 * Este archivo ES el editor de contenido del demo: Carlos lo edita,
 * corre `pnpm seed`, y la app lo refleja. Copy es: BORRADOR.
 */
import { ADMISSION_MXN_CENTS } from "../../packages/domain/PLACEHOLDER_PRICES";
import type { LText } from "../../packages/domain/types";

export interface KitchenService {
  id: string;
  nombre: LText;
  horario: string;
  descripcion: LText;
  image: string;
}

export const kitchen: KitchenService[] = [
  {
    id: "breakfast",
    nombre: { en: "Breakfast", es: "Desayuno" },
    horario: "8:00 – 11:00",
    descripcion: {
      en: "Fresh fruit, local ingredients, real coffee. Served steps from the sea, included in every stay.",
      es: "Fruta fresca, ingredientes locales, café de verdad. Servido a pasos del mar, incluido en toda estancia.",
    },
    image: "rest",
  },
  {
    id: "lunch",
    nombre: { en: "Lunch", es: "Comida" },
    horario: "11:30 – 18:00",
    descripcion: {
      en: "Ceviche, catch of the day off the grill and the beach club classics, brought to your bed.",
      es: "Ceviche, pesca del día a la parrilla y los clásicos del beach club, llevados a tu camastro.",
    },
    image: "bcGirls",
  },
  {
    id: "dinner",
    nombre: { en: "Dinner", es: "Cena" },
    horario: "18:00 – tarde",
    descripcion: {
      en: "Candlelight on the sand, a kitchen that stays serious, and music that builds as the night does.",
      es: "Velas en la arena, una cocina que se mantiene seria, y música que crece con la noche.",
    },
    image: "wedTable",
  },
  {
    id: "cellar",
    nombre: { en: "Wine cellar", es: "Cava" },
    horario: "Todo el día",
    descripcion: {
      en: "Labels from Mexico, France and further afield, plus mezcal chosen by the house.",
      es: "Etiquetas de México, Francia y más allá, y mezcal elegido por la casa.",
    },
    image: "neonRoom",
  },
];

export interface Admission {
  id: "vip" | "traditional" | "residentes";
  nombre: LText;
  precioMxnCents: number;
  descripcion: LText;
  perks: LText[];
}

const p = (en: string, es: string): LText => ({ en, es });

export const admissions: Admission[] = [
  {
    id: "vip",
    nombre: { en: "VIP Backstage", es: "VIP Backstage" },
    precioMxnCents: ADMISSION_MXN_CENTS.vip,
    descripcion: {
      en: "Front row bed, the best table at sunset, and a host who stays with you all day.",
      es: "Camastro en primera fila, la mejor mesa al atardecer, y un anfitrión contigo todo el día.",
    },
    perks: [
      p("Front row bed, guaranteed", "Camastro en primera fila, garantizado"),
      p("Reserved table for sunset", "Mesa reservada para el atardecer"),
      p("Dedicated host", "Anfitrión dedicado"),
      p("Priority kitchen and bar", "Prioridad en cocina y barra"),
      p("Fully consumable", "Totalmente consumible"),
    ],
  },
  {
    id: "traditional",
    nombre: { en: "Traditional", es: "Traditional" },
    precioMxnCents: ADMISSION_MXN_CENTS.traditional,
    descripcion: {
      en: "The whole beach club — bed, pool, music and kitchen, with your spend coming back on the plate.",
      es: "Todo el beach club — camastro, alberca, música y cocina, con tu consumo de regreso en el plato.",
    },
    perks: [
      p("Sun bed by availability", "Camastro por disponibilidad"),
      p("Pool access", "Acceso a la alberca"),
      p("Towel service", "Servicio de toallas"),
      p("Fully consumable", "Totalmente consumible"),
    ],
  },
  {
    id: "residentes",
    nombre: { en: "Residentes", es: "Residentes" },
    precioMxnCents: ADMISSION_MXN_CENTS.residentes,
    descripcion: {
      en: "For Quintana Roo residents. Same beach, same music, local rate — bring ID.",
      es: "Para residentes de Quintana Roo. La misma playa, la misma música, tarifa local — trae tu identificación.",
    },
    perks: [
      p("Sun bed by availability", "Camastro por disponibilidad"),
      p("Pool access", "Acceso a la alberca"),
      p("Fully consumable", "Totalmente consumible"),
      p(
        "Valid QR resident ID required",
        "Identificación vigente de Q. Roo requerida",
      ),
    ],
  },
];

export interface LineupRow {
  hora: string;
  nombre: LText;
  detalle: LText;
}

export const lineup: LineupRow[] = [
  {
    hora: "09:00",
    nombre: { en: "Daily yoga", es: "Yoga diario" },
    detalle: { en: "Palapa · included", es: "Palapa · incluido" },
  },
  {
    hora: "17:30",
    nombre: { en: "Kalimba", es: "Kalimba" },
    detalle: { en: "Organic house", es: "Organic house" },
  },
  {
    hora: "20:00",
    nombre: { en: "Sofía Vera", es: "Sofía Vera" },
    detalle: { en: "Downtempo", es: "Downtempo" },
  },
  {
    hora: "22:30",
    nombre: { en: "Residents", es: "Residentes" },
    detalle: { en: "Afro house", es: "Afro house" },
  },
  {
    hora: "01:00",
    nombre: { en: "Close", es: "Cierre" },
    detalle: { en: "Slow burn", es: "Slow burn" },
  },
];

export const week = [
  {
    dia: { en: "Thu", es: "Jue" },
    nombre: { en: "Temazcal at dusk", es: "Temazcal al atardecer" },
    hora: "18:00",
  },
  {
    dia: { en: "Fri", es: "Vie" },
    nombre: { en: "Afterbeach session", es: "Sesión afterbeach" },
    hora: "16:00",
  },
  {
    dia: { en: "Sun", es: "Dom" },
    nombre: { en: "Live band, full moon", es: "Banda en vivo, luna llena" },
    hora: "19:00",
  },
];

/** Set principal del atardecer (cuenta regresiva en Hoy en Mía) */
export const sunsetSet = {
  hora: "17:30",
  nombre: { en: "Kalimba — sunset set", es: "Kalimba — set de atardecer" },
  nota: {
    en: "On the sand · no cover for guests",
    es: "En la arena · sin cover para huéspedes",
  },
};

export interface Experience {
  id: string;
  nombre: LText;
  descripcion: LText;
  image: string;
  destino: "chat" | "weddings" | "tonight" | "cenote";
}

export const experiences: Experience[] = [
  {
    id: "bachelorette",
    nombre: { en: "Bachelorette Party", es: "Despedida de soltera" },
    descripcion: {
      en: "Reserved VIP beach area exclusively for your group.",
      es: "Área VIP de playa reservada en exclusiva para tu grupo.",
    },
    image: "bcGirls",
    destino: "chat",
  },
  {
    id: "group-beach-day",
    nombre: { en: "Group Beach Day", es: "Día de playa en grupo" },
    descripcion: {
      en: "Reserved sun bed sections, dedicated service and group menus, organized before you arrive.",
      es: "Secciones de camastros reservadas, servicio dedicado y menús de grupo, organizados antes de llegar.",
    },
    image: "lying",
    destino: "chat",
  },
  {
    id: "private-dinners",
    nombre: { en: "Private Dinners", es: "Cenas privadas" },
    descripcion: {
      en: "A table set just for you, on the sand, with candlelight and the sound of the Caribbean.",
      es: "Una mesa puesta solo para ti, en la arena, con velas y el sonido del Caribe.",
    },
    image: "wedTable",
    destino: "chat",
  },
  {
    id: "romantic-dinner",
    nombre: { en: "Romantic Dinner", es: "Cena romántica" },
    descripcion: {
      en: "Two people. The Caribbean. The rest figures itself out.",
      es: "Dos personas. El Caribe. El resto se resuelve solo.",
    },
    image: "wedDining",
    destino: "chat",
  },
  {
    id: "proposals",
    nombre: { en: "Marriage Proposals", es: "Propuestas de matrimonio" },
    descripcion: {
      en: "Completely personal, completely private, completely unexpected — planned to the last detail.",
      es: "Completamente personal, privada e inesperada — planeada al último detalle.",
    },
    image: "sunsetHands",
    destino: "chat",
  },
  {
    id: "beachfront-ceremonies",
    nombre: { en: "Beachfront Ceremonies", es: "Ceremonias frente al mar" },
    descripcion: {
      en: "The sea as your witness. Intimate ceremonies for twenty to celebrations for three hundred.",
      es: "El mar como testigo. De ceremonias íntimas de veinte a celebraciones de trescientos.",
    },
    image: "wedAisle",
    destino: "weddings",
  },
  {
    id: "corporate",
    nombre: { en: "Corporate Groups", es: "Grupos corporativos" },
    descripcion: {
      en: "Private venue spaces, custom catering, wellness programming and a dedicated host.",
      es: "Espacios privados, catering a medida, programa de bienestar y anfitrión dedicado.",
    },
    image: "aerial3",
    destino: "chat",
  },
  {
    id: "music-community",
    nombre: { en: "Music & Community", es: "Música y comunidad" },
    descripcion: {
      en: "Live sessions, afterbeach events and gatherings. Come alone, leave with a table full of people.",
      es: "Sesiones en vivo, afterbeach y encuentros. Llega solo, vete con una mesa llena de gente.",
    },
    image: "aerial2",
    destino: "tonight",
  },
  {
    id: "cenotes-nature",
    nombre: { en: "Cenotes & Nature", es: "Cenotes y naturaleza" },
    descripcion: {
      en: "Complimentary access to Cenote Casa Tortuga, plus excursions to the wider cenote network.",
      es: "Acceso incluido al Cenote Casa Tortuga, más excursiones a la red de cenotes.",
    },
    image: "cenote",
    destino: "cenote",
  },
];

export interface BlogPost {
  id: string;
  titulo: LText;
  sub: LText;
  minutos: number;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "cenotes-guide",
    titulo: {
      en: "A guide to Tulum's cenotes, starting with the one you already have",
      es: "Guía de los cenotes de Tulum, empezando por el que ya tienes",
    },
    sub: {
      en: "Casa Tortuga, and where to go after it",
      es: "Casa Tortuga, y a dónde ir después",
    },
    minutos: 6,
    image: "cenote",
  },
  {
    id: "temazcal-explained",
    titulo: {
      en: "What actually happens in a temazcal",
      es: "Qué pasa de verdad en un temazcal",
    },
    sub: {
      en: "Heat, herbs and the part nobody warns you about",
      es: "Calor, hierbas y la parte de la que nadie te avisa",
    },
    minutos: 4,
    image: "temazcal1",
  },
  {
    id: "sunset-set",
    titulo: {
      en: "The sunset set, explained",
      es: "El set del atardecer, explicado",
    },
    sub: {
      en: "How the music at Mía is built, hour by hour",
      es: "Cómo se construye la música de Mía, hora por hora",
    },
    minutos: 5,
    image: "aerial2",
  },
  {
    id: "tulum-with-dog",
    titulo: {
      en: "Traveling to Tulum with your dog",
      es: "Viajar a Tulum con tu perro",
    },
    sub: {
      en: "What to pack and where they're welcome",
      es: "Qué empacar y dónde son bienvenidos",
    },
    minutos: 3,
    image: "pathNice",
  },
];

export const contact = {
  telefono: "+52 984 167 9090",
  whatsapp: "+52 984 167 9090",
  conciergeEmail: "concierge@miatulum.com",
  generalEmail: "info@miatulum.com",
  direccion:
    "Carretera Tulum Boca-Paila km 7.5, Zona Hotelera, 77760 Tulum, Q.R.",
  horarios: [
    { k: { en: "Breakfast", es: "Desayuno" }, v: "desde 8:00 AM" },
    { k: { en: "Check-in", es: "Check-in" }, v: "3:00 PM" },
    { k: { en: "Check-out", es: "Check-out" }, v: "11:00 AM" },
    { k: { en: "Beach club", es: "Beach club" }, v: "8:00 AM – tarde" },
  ],
  redes: ["Instagram", "Facebook", "TikTok", "YouTube"],
};

/** Eventos fijos del día que alimentan la línea de tiempo de Home */
export const dayEvents = [
  {
    id: "breakfast",
    hora: "08:00",
    titulo: { en: "Breakfast", es: "Desayuno" },
    lugar: { en: "Restaurant, beach side", es: "Restaurante, lado del mar" },
    image: "rest",
    destino: "dine",
  },
  {
    id: "daily-yoga",
    hora: "09:00",
    titulo: { en: "Daily yoga", es: "Yoga diario" },
    lugar: {
      en: "Palapa, ocean side · all levels",
      es: "Palapa, lado del mar · todos los niveles",
    },
    image: "yogaPal",
    destino: "wellness",
  },
  {
    id: "sunset",
    hora: "18:41",
    titulo: { en: "Sunset", es: "Atardecer" },
    lugar: { en: "Best from the north deck", es: "Mejor desde el deck norte" },
    image: "aerial2",
    destino: "tonight",
  },
  {
    id: "chefs-table",
    hora: "21:00",
    titulo: { en: "Chef's table", es: "Mesa del chef" },
    lugar: {
      en: "Six seats · Mexican tasting",
      es: "Seis lugares · degustación mexicana",
    },
    image: "rest",
    destino: "dine",
  },
];
