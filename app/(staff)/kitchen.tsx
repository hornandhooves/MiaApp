import { useTranslation } from "react-i18next";
import { Screen } from "../../packages/ui/Screen";
import { T } from "../../packages/ui/T";
import { color, space, whiteAlpha } from "../../packages/ui/tokens";

/** Pantalla de cocina (semana 5): pedidos por lugar y antigüedad. */
export default function Kitchen() {
  const { t } = useTranslation();
  return (
    <Screen dark tabbed={false}>
      <T v="title" c={color.white} style={{ marginTop: space.xxl }}>
        {t("staffKitchenTitle")}
      </T>
      <T v="small" c={whiteAlpha(0.5)} style={{ marginTop: space.m }}>
        {t("wip")}
      </T>
    </Screen>
  );
}
