import { Tabs, usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  SCREEN_ROUTES,
  TAB_ICONS,
  TAB_KEYS,
} from "../../../packages/lib/routes";
import { TabBar, type TabItem } from "../../../packages/ui/TabBar";

const HIDDEN = [
  "weddings",
  "wellness",
  "experiences",
  "tonight",
  "contact",
  "blog",
] as const;

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
      tabBar={() => <TabBar items={items} />}
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
