/**
 * i18n — bilingüe desde el primer commit.
 * Idioma inicial por locale del sistema; cambio manual persistente.
 * Nada de texto literal en JSX: todo pasa por t('clave').
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";
import type { Lang } from "../domain/types";

const STORAGE_KEY = "mia.lang";

export const initialLang = (): Lang => {
  const code = getLocales()[0]?.languageCode;
  return code === "es" ? "es" : "en";
};

export async function initI18n(): Promise<typeof i18n> {
  let lang: Lang = initialLang();
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") lang = saved;
  } catch {
    // sin storage disponible: se queda el locale del sistema
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: lang,
    fallbackLng: "en",
    returnObjects: true,
    interpolation: { escapeValue: false },
  });
  return i18n;
}

export async function setLang(lang: Lang): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // no bloquear el cambio de idioma por un fallo de storage
  }
}

export const currentLang = (): Lang => (i18n.language === "es" ? "es" : "en");

export default i18n;
