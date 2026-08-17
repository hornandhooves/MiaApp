/**
 * Contenedor base de pantalla: fondo marfil, safe area, scroll opcional.
 */
import type { PropsWithChildren } from "react";
import { ScrollView, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, space } from "./tokens";

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  dark?: boolean;
  padded?: boolean;
  /** Deja aire para la tab bar flotante */
  tabbed?: boolean;
}

export function Screen({
  children,
  scroll = true,
  dark = false,
  padded = true,
  tabbed = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const base: ViewStyle = {
    flex: 1,
    backgroundColor: dark ? color.ink : color.canvas,
  };
  const pad: ViewStyle = {
    paddingTop: insets.top,
    paddingHorizontal: padded ? space.gutter : 0,
    paddingBottom: tabbed ? 110 : insets.bottom + space.screenBottom,
  };
  if (!scroll) {
    return <View style={[base, pad]}>{children}</View>;
  }
  return (
    <View style={base}>
      <ScrollView
        contentContainerStyle={pad}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
