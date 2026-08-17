/**
 * Hooks de lectura de contenido — react-query sobre el ContentPort.
 * Las pantallas consumen estos hooks; nunca Firestore ni el seed
 * directamente.
 */
import { useQuery } from "@tanstack/react-query";
import { getPorts } from "../domain/di";
import { currentLang } from "../i18n";
import type { LText } from "../domain/types";

const content = () => getPorts().content;

export const useKitchen = () =>
  useQuery({ queryKey: ["kitchen"], queryFn: () => content().kitchen() });

export const useAdmissions = () =>
  useQuery({ queryKey: ["admissions"], queryFn: () => content().admissions() });

export const useLineup = () =>
  useQuery({ queryKey: ["lineup"], queryFn: () => content().lineup() });

export const useExperiences = () =>
  useQuery({
    queryKey: ["experiences"],
    queryFn: () => content().experiences(),
  });

export const useJournal = () =>
  useQuery({ queryKey: ["journal"], queryFn: () => content().journal() });

export const useContact = () =>
  useQuery({ queryKey: ["contact"], queryFn: () => content().contact() });

export const useDayEvents = () =>
  useQuery({ queryKey: ["dayEvents"], queryFn: () => content().dayEvents() });

export const useDiscover = () =>
  useQuery({ queryKey: ["discover"], queryFn: () => content().discover() });

/** Texto bilingüe → idioma activo */
export const lx = (t: LText): string => t[currentLang()];
