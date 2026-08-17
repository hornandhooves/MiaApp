import { useTranslation } from "react-i18next";
import { Screen } from "../../packages/ui/Screen";
import { T } from "../../packages/ui/T";
import { color, space, whiteAlpha } from "../../packages/ui/tokens";

/** Mapa de staff (semana 4): ocupar y liberar camastros en un toque. */
export default function BeachMap() {
  const { t } = useTranslation();
  return (
    <Screen dark tabbed={false}>
      <T v="title" c={color.white} style={{ marginTop: space.xxl }}>
        {t("staffBeachTitle")}
      </T>
      <T v="small" c={whiteAlpha(0.5)} style={{ marginTop: space.m }}>
        {t("wip")}
      </T>
    </Screen>
  );
}
