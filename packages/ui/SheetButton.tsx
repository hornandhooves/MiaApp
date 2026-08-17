/**
 * Botón del nav sheet — círculo con dos líneas (glifo del prototipo).
 */
import { Pressable, View } from "react-native";
import { color, hit, inkAlpha, whiteAlpha } from "./tokens";

export function SheetButton({
  label,
  onPress,
  onDark = false,
}: {
  label: string;
  onPress: () => void;
  onDark?: boolean;
}) {
  const line = onDark ? color.white : color.ink;
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
          gap: 4,
        }}
      >
        <View style={{ width: 14, height: 1, backgroundColor: line }} />
        <View style={{ width: 14, height: 1, backgroundColor: line }} />
      </View>
    </Pressable>
  );
}
