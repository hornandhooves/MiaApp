/**
 * Botón circular de 36 pt visual con objetivo táctil de 44 pt
 * (back, menú, concierge). Glifos del prototipo.
 */
import { Pressable, View } from "react-native";
import { T } from "./T";
import { color, hit, inkAlpha, whiteAlpha } from "./tokens";

export function CircleButton({
  glyph,
  label,
  onPress,
  onDark = false,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  onDark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={{
        minWidth: hit.minWidth,
        minHeight: hit.minHeight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: onDark ? whiteAlpha(0.45) : inkAlpha(0.18),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T
          v="body"
          c={onDark ? color.white : color.ink}
          style={{ fontSize: 17, lineHeight: 19 }}
        >
          {glyph}
        </T>
      </View>
    </Pressable>
  );
}

export const GLYPH = {
  back: "‹", // ‹
  chat: "◇", // ◇
  scan: "⌗", // ⌗-ish (prototipo usa ⌗)
  hash: "⌗",
} as const;
