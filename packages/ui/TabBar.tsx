/**
 * Tab bar del prototipo: barra oscura flotante, cinco destinos,
 * píldora blanca en el activo. Objetivos táctiles ≥44 pt.
 */
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./T";
import { color, hit, inkAlpha, radius, space, whiteAlpha } from "./tokens";

export interface TabItem {
  key: string;
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}

export function TabBar({ items }: { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        left: space.l,
        right: space.l,
        bottom: Math.max(insets.bottom, space.m),
        backgroundColor: color.ink,
        borderRadius: radius.pill,
        flexDirection: "row",
        padding: space.xs,
        shadowColor: color.ink,
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      {items.map((it) => (
        <Pressable
          key={it.key}
          onPress={it.onPress}
          accessibilityRole="tab"
          accessibilityState={{ selected: it.active }}
          accessibilityLabel={it.label}
          style={{
            flex: 1,
            minHeight: hit.minHeight,
            borderRadius: radius.pill,
            backgroundColor: it.active ? color.white : inkAlpha(0),
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: space.s,
          }}
        >
          <T
            v="bodyMedium"
            c={it.active ? color.ink : whiteAlpha(0.6)}
            style={{ fontSize: 15, lineHeight: 17 }}
          >
            {it.icon}
          </T>
          <T
            v="labelSmall"
            c={it.active ? color.ink : whiteAlpha(0.6)}
            style={{ marginTop: 2 }}
          >
            {it.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
