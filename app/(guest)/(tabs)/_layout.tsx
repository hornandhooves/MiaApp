import { Tabs, usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  SCREEN_ROUTES,
  TAB_ICONS,
  TAB_KEYS,
} from "../../../packages/lib/routes";
import { useSesionDia } from "../../../packages/lib/sesionDia";
import { moneyUsd } from "../../../packages/lib/tulum";
import { SessionBar } from "../../../packages/ui/SessionBar";
import { TabBar, type TabItem } from "../../../packages/ui/TabBar";

const HIDDEN = [
  "weddings",
  "wellness",
  "experiences",
  "tonight",
  "contact",
  "blog",
] as const;

const HELD_KEY = {
  bed: "sbHeldBed",
  table: "sbHeldTable",
} as const;

const LUGAR_KEY = {
  bed: "sbBed",
  table: "sbTable",
  room: "sbRoom",
} as const;

/**
 * La barra de sesión vive aquí, junto a la tab bar, para que el contexto
 * del huésped —dónde está, cuánto lleva, qué viene en camino— acompañe
 * TODAS las pantallas en vez de existir solo dentro de Tu día.
 */
function BarraDeSesion() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const s = useSesionDia();

  // Dentro de Tu día la información ya está en pantalla: la barra sobra.
  if (!s.activa || pathname === SCREEN_ROUTES.stay) return null;

  // Estar en un lugar y tener uno apartado son cosas distintas, y la
  // barra lo dice con palabras distintas. Si el huésped ya escaneó el
  // QR manda el lugar donde está; si sólo apartó, se muestra el
  // apartado con su hora de llegada — que era justo lo que faltaba:
  // apartar un camastro no cambiaba nada en pantalla.
  const lugar =
    s.lugarTipo && s.lugarNum
      ? t(LUGAR_KEY[s.lugarTipo], { n: s.lugarNum })
      : s.reservado
        ? t(HELD_KEY[s.reservado.tipo], {
            n: s.reservado.num,
            when: s.horaLlegada ?? "",
          })
        : null;

  return (
    <SessionBar
      lugar={lugar}
      cuenta={s.saldoCents > 0 ? moneyUsd(s.saldoCents) : null}
      enCamino={
        s.enCurso.length > 0 ? t("sbOnWay", { n: s.enCurso.length }) : null
      }
      aviso={
        s.minutosHold !== null && s.minutosHold <= 15
          ? t("sbHoldLeft", { n: s.minutosHold })
          : null
      }
      label={t("sessionBarLabel")}
      onPress={() => router.navigate(SCREEN_ROUTES.stay)}
    />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const labels = t("tabs", { returnObjects: true }) as [string, string][];

  const items: TabItem[] = TAB_KEYS.map((key, i) => ({
    key,
    label: labels[i]?.[0] ?? "",
    icon: labels[i]?.[1] ?? TAB_ICONS[key] ?? "",
    active: pathname === SCREEN_ROUTES[key],
    onPress: () => router.navigate(SCREEN_ROUTES[key]),
  }));

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <>
          <BarraDeSesion />
          <TabBar items={items} />
        </>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="beach" />
      <Tabs.Screen name="resort" />
      <Tabs.Screen name="circulo" />
      <Tabs.Screen name="stay" />
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
