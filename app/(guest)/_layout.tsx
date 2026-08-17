import { Stack, usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  SCREEN_ROUTES,
  SHEET_APP_KEYS,
  SHEET_SITE_KEYS,
  type ScreenKey,
} from "../../packages/lib/routes";
import { useUiStore } from "../../packages/lib/uiStore";
import { NavSheet, type SheetEntry } from "../../packages/ui/NavSheet";

function SheetHost() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const sheetOpen = useUiStore((s) => s.sheetOpen);
  const closeSheet = useUiStore((s) => s.closeSheet);

  const entry = (key: ScreenKey): SheetEntry => ({
    key,
    label: t(`screenNames.${key}`),
    active: pathname === SCREEN_ROUTES[key],
    onPress: () => {
      closeSheet();
      router.push(SCREEN_ROUTES[key]);
    },
  });

  return (
    <NavSheet
      open={sheetOpen}
      onClose={closeSheet}
      title={t("sheetTitle")}
      siteTitle={t("sheetSite")}
      appTitle={t("sheetApp")}
      closeLabel={t("sheetClose")}
      site={SHEET_SITE_KEYS.map(entry)}
      app={SHEET_APP_KEYS.map(entry)}
    />
  );
}

export default function GuestLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <SheetHost />
    </>
  );
}
