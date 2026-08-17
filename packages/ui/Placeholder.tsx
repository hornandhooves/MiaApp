/**
 * Pantalla de andamiaje de la semana 1: título real de la pantalla,
 * nota de construcción, y acceso al nav sheet. Se reemplaza pantalla
 * por pantalla en las semanas 2–7.
 */
import { Pressable, View } from "react-native";
import { Screen } from "./Screen";
import { T } from "./T";
import { color, hit, inkAlpha, radius, space } from "./tokens";

const MENU_GLYPH = "\u2261";

interface PlaceholderProps {
  title: string;
  note: string;
  menuLabel: string;
  onMenu: () => void;
  tabbed?: boolean;
}

export function Placeholder({
  title,
  note,
  menuLabel,
  onMenu,
  tabbed = true,
}: PlaceholderProps) {
  return (
    <Screen tabbed={tabbed}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: space.m,
        }}
      >
        <T v="title">{title}</T>
        <Pressable
          onPress={onMenu}
          accessibilityRole="button"
          accessibilityLabel={menuLabel}
          style={{
            minHeight: hit.minHeight,
            minWidth: hit.minWidth,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: inkAlpha(0.2),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T v="bodyMedium">{MENU_GLYPH}</T>
        </Pressable>
      </View>
      <View
        style={{
          marginTop: space.xxl,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: inkAlpha(0.09),
          backgroundColor: color.white,
          padding: space.xl,
        }}
      >
        <T v="small" c={inkAlpha(0.5)}>
          {note}
        </T>
      </View>
    </Screen>
  );
}
