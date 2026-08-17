/**
 * Las trece categorías del sitio, en su orden y con su lenguaje.
 * Copy en español: BORRADOR derivado del inglés del prototipo —
 * lo revisa Carlos (el copy bilingüe es suyo por reparto).
 * Precios: SOLO por referencia a PLACEHOLDER_PRICES.
 */
import { ROOM_NIGHTLY_CENTS } from "../../packages/domain/PLACEHOLDER_PRICES";
import type { RoomType } from "../../packages/domain/types";

const r = (
  id: string,
  order: number,
  en: [string, string, string],
  es: [string, string, string],
  image: string,
  units: number,
): RoomType => {
  const nightly = ROOM_NIGHTLY_CENTS[id];
  if (nightly === undefined) {
    throw new Error(`Sin tarifa placeholder para roomType ${id}`);
  }
  return {
    id,
    order,
    name: { en: en[0], es: es[0] },
    meta: { en: en[1], es: es[1] },
    description: { en: en[2], es: es[2] },
    nightly,
    image,
    units,
  };
};

export const roomTypes: RoomType[] = [
  r(
    "suite-premium-ocean-jacuzzi",
    0,
    [
      "Suite Premium, Ocean View with Jacuzzi",
      "30 m² · Private jacuzzi · King · Ocean view",
      "The most immersive stay at Mía, opening toward the Caribbean with a private jacuzzi that makes the horizon feel like yours alone.",
    ],
    [
      "Suite Premium, vista al mar con jacuzzi",
      "30 m² · Jacuzzi privado · King · Vista al mar",
      "La estancia más inmersiva de Mía, abierta al Caribe con un jacuzzi privado que hace sentir el horizonte solo tuyo.",
    ],
    "suite1",
    2,
  ),
  r(
    "suite-deluxe-ocean-jacuzzi",
    1,
    [
      "Suite Deluxe, Ocean View with Jacuzzi",
      "Ocean view · King · Jacuzzi · Breakfast bar",
      "A majestic direct view of the Caribbean and a private whirlpool tub. Ideal for couples with the sound of the waves as company.",
    ],
    [
      "Suite Deluxe, vista al mar con jacuzzi",
      "Vista al mar · King · Jacuzzi · Barra de desayuno",
      "Una vista majestuosa y directa al Caribe con tina de hidromasaje privada. Ideal para parejas, con el sonido de las olas de compañía.",
    ],
    "suite2",
    4,
  ),
  r(
    "king-deluxe-ocean",
    2,
    [
      "King Deluxe, Ocean View",
      "Ocean view · King · Private balcony · Minibar",
      "Wake to an uninterrupted view of the Caribbean and let the sea breeze in from your private balcony.",
    ],
    [
      "King Deluxe, vista al mar",
      "Vista al mar · King · Balcón privado · Minibar",
      "Despierta con una vista ininterrumpida del Caribe y deja entrar la brisa desde tu balcón privado.",
    ],
    "suite3",
    5,
  ),
  r(
    "deluxe-partial-ocean",
    3,
    [
      "Deluxe, Partial Ocean View",
      "Partial ocean view · King · Balcony · AC",
      "A sanctuary of peace where luxury blends with the freshness of the natural surroundings.",
    ],
    [
      "Deluxe, vista parcial al mar",
      "Vista parcial al mar · King · Balcón · A/C",
      "Un santuario de paz donde el lujo se mezcla con la frescura del entorno natural.",
    ],
    "suite2",
    6,
  ),
  r(
    "double-partial-ocean",
    4,
    [
      "Double Partial, Ocean View",
      "2 full + 2 single beds · Balcony · AC",
      "Designed for families or groups sharing unique moments, with a charming partial view of the Caribbean.",
    ],
    [
      "Doble, vista parcial al mar",
      "2 matrimoniales + 2 individuales · Balcón · A/C",
      "Pensada para familias o grupos que comparten momentos únicos, con una encantadora vista parcial al Caribe.",
    ],
    "roomsHero",
    3,
  ),
  r(
    "suite-garden",
    5,
    [
      "Suite Garden View",
      "Garden view · King · Balcony · AC",
      "An intimate retreat overlooking the tropical garden, with the sounds of the Mayan jungle from your balcony.",
    ],
    [
      "Suite vista al jardín",
      "Vista al jardín · King · Balcón · A/C",
      "Un retiro íntimo sobre el jardín tropical, con los sonidos de la selva maya desde tu balcón.",
    ],
    "pathNice",
    5,
  ),
  r(
    "family-4",
    6,
    [
      "Family, 4 beds",
      "25 m² · 4 singles · En-suite · Breakfast for all",
      "Individual beds in a private setting — for friends, retreats and travelers who want social but exclusive.",
    ],
    [
      "Familiar, 4 camas",
      "25 m² · 4 individuales · Baño propio · Desayuno para todos",
      "Camas individuales en un entorno privado — para amistades, retiros y viajeros que quieren lo social sin perder lo exclusivo.",
    ],
    "roomsHero",
    4,
  ),
  r(
    "family-6",
    7,
    [
      "Family, 6 beds",
      "25 m² · 6 singles · En-suite · Breakfast for all",
      "Everyone gets their own space while the group stays together. One breakfast. One yoga class. One beach.",
    ],
    [
      "Familiar, 6 camas",
      "25 m² · 6 individuales · Baño propio · Desayuno para todos",
      "Cada quien con su espacio y el grupo junto. Un desayuno. Una clase de yoga. Una playa.",
    ],
    "suite2",
    1,
  ),
  r(
    "family-8",
    8,
    [
      "Family, 8 beds",
      "25 m² · 8 singles · En-suite · Breakfast for all",
      "Configured for larger groups without sacrificing the atmosphere that defines the property.",
    ],
    [
      "Familiar, 8 camas",
      "25 m² · 8 individuales · Baño propio · Desayuno para todos",
      "Configurada para grupos grandes sin sacrificar la atmósfera que define la propiedad.",
    ],
    "suite3",
    3,
  ),
  r(
    "studio-terrace",
    9,
    [
      "Studio with Terrace",
      "16 m² + terrace · Shared bathroom · Breakfast included",
      "Everything the Studio offers, plus your own outdoor space for morning coffee and afternoon shade.",
    ],
    [
      "Estudio con terraza",
      "16 m² + terraza · Baño compartido · Desayuno incluido",
      "Todo lo del Estudio, más tu propio espacio exterior para el café de la mañana y la sombra de la tarde.",
    ],
    "suite3",
    4,
  ),
  r(
    "studio",
    10,
    [
      "Studio",
      "16 m² · Shared bathroom · Ideal for solo travelers",
      "Smart and efficiently laid out — everything you need for a genuinely great stay, without anything you don't.",
    ],
    [
      "Estudio",
      "16 m² · Baño compartido · Ideal para quien viaja solo",
      "Inteligente y eficiente — todo lo que necesitas para una gran estancia, sin nada que no.",
    ],
    "suite1",
    6,
  ),
  r(
    "teepee-partial-ocean",
    11,
    [
      "Teepee, Partial Ocean View",
      "10 m² · Shared bathroom · Best value at Mía",
      "Intimate, personal and full of character. Intentionally minimal, for travelers who know the room isn't where the day happens.",
    ],
    [
      "Teepee, vista parcial al mar",
      "10 m² · Baño compartido · El mejor valor de Mía",
      "Íntimo, personal y con carácter. Minimalista a propósito, para quien sabe que el día no pasa en la habitación.",
    ],
    "beach",
    1,
  ),
  r(
    "teepee-garden",
    12,
    [
      "Teepee Garden View",
      "Garden view · Shared bathroom · Beach club access",
      "Tucked into Mía's tropical grounds, surrounded by the vegetation that makes Tulum what it is.",
    ],
    [
      "Teepee vista al jardín",
      "Vista al jardín · Baño compartido · Acceso al beach club",
      "Escondido en los jardines de Mía, rodeado de la vegetación que hace a Tulum lo que es.",
    ],
    "palmLeaf",
    5,
  ),
];
