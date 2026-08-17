/**
 * Ruta de andamiaje: resuelve título e i18n para una de las veinte
 * pantallas y abre el nav sheet. Se sustituye en las semanas 2–7.
 */
import { useTranslation } from "react-i18next";
import { useUiStore } from "../lib/uiStore";
import type { ScreenKey } from "../lib/routes";
import { Placeholder } from "./Placeholder";

export function PlaceholderRoute({
  k,
  tabbed = true,
}: {
  k: ScreenKey;
  tabbed?: boolean;
}) {
  const { t } = useTranslation();
  const openSheet = useUiStore((s) => s.openSheet);
  return (
    <Placeholder
      title={t(`screenNames.${k}`)}
      note={t("wip")}
      menuLabel={t("menuLabel")}
      onMenu={openSheet}
      tabbed={tabbed}
    />
  );
}
