/**
 * Menú del prototipo — cinco categorías. Precios por referencia a
 * PLACEHOLDER_PRICES (índice [categoría][platillo]).
 * Copy es: BORRADOR para revisión de Carlos.
 */
import { MENU_PRICES_CENTS } from "../../packages/domain/PLACEHOLDER_PRICES";
import type { MenuItem } from "../../packages/domain/types";

type Row = {
  id: string;
  en: [string, string];
  es: [string, string];
  tagEn?: string;
  tagEs?: string;
  incluidoCon?: MenuItem["incluidoCon"];
};

const CATS: Row[][] = [
  [
    {
      id: "ceviche-verde",
      en: ["Ceviche verde", "Catch of the day, serrano, lime, avocado"],
      es: ["Ceviche verde", "Pesca del día, serrano, limón, aguacate"],
      tagEn: "Chef's pick",
      tagEs: "Elección del chef",
    },
    {
      id: "grilled-octopus",
      en: ["Grilled octopus", "Charred, chile de árbol, potato"],
      es: ["Pulpo a la parrilla", "Tatemado, chile de árbol, papa"],
    },
    {
      id: "tuna-tostadas",
      en: ["Tuna tostadas", "Three, chipotle mayo, sesame"],
      es: ["Tostadas de atún", "Tres, mayonesa de chipotle, ajonjolí"],
    },
    {
      id: "watermelon-feta",
      en: ["Watermelon & feta", "Mint, lime, chile salt"],
      es: ["Sandía con feta", "Menta, limón, sal de chile"],
      tagEn: "Vegetarian",
      tagEs: "Vegetariano",
    },
    {
      id: "whole-fish",
      en: ["Whole fish", "For two, salsa macha, tortillas"],
      es: ["Pescado entero", "Para dos, salsa macha, tortillas"],
    },
  ],
  [
    {
      id: "chilaquiles-verdes",
      en: ["Chilaquiles verdes", "Egg, crema, queso fresco"],
      es: ["Chilaquiles verdes", "Huevo, crema, queso fresco"],
      tagEn: "In your stay",
      tagEs: "En tu estancia",
      incluidoCon: "bb",
    },
    {
      id: "seasonal-fruit",
      en: ["Seasonal fruit", "Papaya, melon, lime"],
      es: ["Fruta de temporada", "Papaya, melón, limón"],
      tagEn: "In your stay",
      tagEs: "En tu estancia",
      incluidoCon: "bb",
    },
    {
      id: "huevos-rancheros",
      en: ["Huevos rancheros", "Two eggs, black beans, salsa"],
      es: ["Huevos rancheros", "Dos huevos, frijoles negros, salsa"],
      tagEn: "In your stay",
      tagEs: "En tu estancia",
      incluidoCon: "bb",
    },
    {
      id: "cold-brew",
      en: ["Cold brew", "House blend, over ice"],
      es: ["Cold brew", "Mezcla de la casa, con hielo"],
    },
  ],
  [
    {
      id: "mezcal-negroni",
      en: ["Mezcal negroni", "Espadín, campari, sweet vermouth"],
      es: ["Negroni de mezcal", "Espadín, campari, vermut dulce"],
      tagEn: "House",
      tagEs: "De la casa",
    },
    {
      id: "tulum-spritz",
      en: ["Tulum spritz", "Hibiscus, prosecco, soda"],
      es: ["Tulum spritz", "Jamaica, prosecco, soda"],
    },
    {
      id: "coco-frio",
      en: ["Coco frío", "Straight from the coconut"],
      es: ["Coco frío", "Directo del coco"],
    },
    {
      id: "immunity-shot",
      en: ["Immunity shot", "Ginger, turmeric, citrus"],
      es: ["Shot de inmunidad", "Jengibre, cúrcuma, cítricos"],
      tagEn: "With admission",
      tagEs: "Con tu admisión",
      incluidoCon: "admission",
    },
  ],
  [
    {
      id: "valle-red",
      en: ["Valle de Guadalupe, red", "Nebbiolo, Baja California"],
      es: ["Valle de Guadalupe, tinto", "Nebbiolo, Baja California"],
      tagEn: "Bottle",
      tagEs: "Botella",
    },
    {
      id: "natural-glass",
      en: ["Natural wine, glass", "Ask for today's pour"],
      es: ["Vino natural, copa", "Pregunta por el de hoy"],
    },
    {
      id: "champagne-brut",
      en: ["Champagne, brut", "Reims, France"],
      es: ["Champaña, brut", "Reims, Francia"],
      tagEn: "Bottle",
      tagEs: "Botella",
    },
    {
      id: "mezcal-flight",
      en: ["Mezcal flight", "Three pours, guided"],
      es: ["Cata de mezcal", "Tres tiempos, guiada"],
    },
  ],
  [
    {
      id: "chefs-table-seat",
      en: ["Chef's table, per seat", "Six courses, Mexican tasting"],
      es: ["Mesa del chef, por lugar", "Seis tiempos, degustación mexicana"],
      tagEn: "6 seats",
      tagEs: "6 lugares",
    },
    {
      id: "mezcal-pairing",
      en: ["Mezcal pairing", "Four pours, guided"],
      es: ["Maridaje de mezcal", "Cuatro tiempos, guiado"],
    },
    {
      id: "private-dinner-sand",
      en: ["Private dinner on the sand", "Designed with you, from 2 guests"],
      es: ["Cena privada en la arena", "Diseñada contigo, desde 2 personas"],
      tagEn: "By request",
      tagEs: "Bajo pedido",
    },
  ],
];

export const menuItems: MenuItem[] = CATS.flatMap((rows, cat) =>
  rows.map((row, i) => {
    const catPrices = MENU_PRICES_CENTS[cat];
    if (!catPrices || catPrices.length !== rows.length) {
      throw new Error(`PLACEHOLDER_PRICES desalineado en categoría ${cat}`);
    }
    return {
      id: row.id,
      categoria: cat,
      nombre: { en: row.en[0], es: row.es[0] },
      descripcion: { en: row.en[1], es: row.es[1] },
      precioCents: catPrices[i] ?? null,
      tag: row.tagEn ? { en: row.tagEn, es: row.tagEs ?? row.tagEn } : null,
      ...(row.incluidoCon ? { incluidoCon: row.incluidoCon } : {}),
    };
  }),
);
