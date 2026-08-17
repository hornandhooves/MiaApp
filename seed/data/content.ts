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
export interface DayEvent {
  id: string;
  hora: string;
  titulo: LText;
  lugar: LText;
  tag: LText;
  cuerpo: LText;
  cta: LText;
  image: string;
  destino: "dine" | "wellness" | "tonight" | "sunbeds";
}

export const dayEvents: DayEvent[] = [
  {
    id: "breakfast",
    hora: "08:00",
    titulo: { en: "Breakfast", es: "Desayuno" },
    lugar: { en: "Restaurant, beach side", es: "Restaurante, lado del mar" },
    tag: { en: "Included", es: "Incluido" },
    cuerpo: {
      en: "Fresh fruit, local ingredients, real coffee. Served steps from the sea, included in every stay, no exceptions.",
      es: "Fruta fresca, ingredientes locales, café de verdad. A pasos del mar, incluido en toda estancia, sin excepciones.",
    },
    cta: { en: "See the menu", es: "Ver el menú" },
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
    tag: { en: "6 left", es: "Quedan 6" },
    cuerpo: {
      en: "Led by experienced instructors and open to every level. Included in your stay. The only requirement is showing up.",
      es: "Con instructores con experiencia y abierto a todos los niveles. Incluido en tu estancia. El único requisito es llegar.",
    },
    cta: { en: "Reserve a mat", es: "Apartar un mat" },
    image: "yogaPal",
    destino: "wellness",
  },
  {
    id: "sunset",
    hora: "18:41",
    titulo: { en: "Sunset", es: "Atardecer" },
    lugar: { en: "Best from the north deck", es: "Mejor desde el deck norte" },
    tag: { en: "Free", es: "Libre" },
    cuerpo: {
      en: "Kalimba plays the sunset set on the sand from 17:30. No cover for guests staying with us.",
      es: "Kalimba toca el set de atardecer en la arena desde las 17:30. Sin cover para huéspedes.",
    },
    cta: { en: "See today's line-up", es: "Ver el line-up de hoy" },
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
    tag: { en: "Book", es: "Reservar" },
    cuerpo: {
      en: "One menu, six seats, cooked in front of you. Mezcal pairing optional.",
      es: "Un menú, seis lugares, cocinado frente a ti. Maridaje de mezcal opcional.",
    },
    cta: { en: "Book a seat", es: "Reservar un lugar" },
    image: "rest",
    destino: "dine",
  },
];

/** Tarjetas "discover" de Home, tres por modo (Hospedaje/Beach Club/Explorar) */
export interface DiscoverCard {
  id: string;
  chip: LText;
  titulo: LText;
  meta: LText;
  image: string;
  destino: "wellness" | "cenote" | "sunbeds" | "tonight" | "beach" | "weddings" | "experiences";
}

export const discover: DiscoverCard[][] = [
  [
    {
      id: "massage",
      chip: { en: "15:00", es: "15:00" },
      titulo: { en: "Massage by the sea", es: "Masaje junto al mar" },
      meta: { en: "50 or 80 min", es: "50 u 80 min" },
      image: "massage",
      destino: "wellness",
    },
    {
      id: "cenote",
      chip: { en: "25 min", es: "25 min" },
      titulo: { en: "Cenote Casa Tortuga", es: "Cenote Casa Tortuga" },
      meta: { en: "Included with your stay", es: "Incluido en tu estancia" },
      image: "cenote",
      destino: "cenote",
    },
    {
      id: "temazcal",
      chip: { en: "Thu · Sun", es: "Jue · Dom" },
      titulo: { en: "Temazcal ritual", es: "Ritual de temazcal" },
      meta: { en: "Mayan sweat lodge at dusk", es: "Temazcal maya al atardecer" },
      image: "temazcal1",
      destino: "wellness",
    },
  ],
  [
    {
      id: "sunbeds",
      chip: { en: "12:00", es: "12:00" },
      titulo: { en: "Sun beds", es: "Camastros" },
      meta: { en: "Front row from $60", es: "Primera fila desde $60" },
      image: "loungers",
      destino: "sunbeds",
    },
    {
      id: "sunset-set",
      chip: { en: "17:30", es: "17:30" },
      titulo: { en: "Sunset set", es: "Set de atardecer" },
      meta: { en: "Live DJ on the sand", es: "DJ en vivo en la arena" },
      image: "aerial2",
      destino: "tonight",
    },
    {
      id: "day-pass",
      chip: { en: "Day pass", es: "Day pass" },
      titulo: { en: "VIP Backstage", es: "VIP Backstage" },
      meta: { en: "From $600 MXN", es: "Desde $600 MXN" },
      image: "bcGirls",
      destino: "beach",
    },
  ],
  [
    {
      id: "cenote-x",
      chip: { en: "25 min", es: "25 min" },
      titulo: { en: "Cenote Casa Tortuga", es: "Cenote Casa Tortuga" },
      meta: { en: "Included with your stay", es: "Incluido en tu estancia" },
      image: "cenote",
      destino: "cenote",
    },
    {
      id: "weddings",
      chip: { en: "Any date", es: "Cualquier fecha" },
      titulo: { en: "Beachfront weddings", es: "Bodas frente al mar" },
      meta: { en: "No venue rental fee", es: "Sin renta de venue" },
      image: "wedAisle",
      destino: "weddings",
    },
    {
      id: "private-dinners",
      chip: { en: "Groups", es: "Grupos" },
      titulo: { en: "Private dinners", es: "Cenas privadas" },
      meta: { en: "A table set on the sand", es: "Una mesa puesta en la arena" },
      image: "wedTable",
      destino: "experiences",
    },
  ],
];
