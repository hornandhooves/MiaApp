/**
 * Botón píldora del prototipo. Tres variantes:
 *  - solid: fondo blanco, texto tinta (CTA sobre foto oscura)
 *  - outline: transparente con borde (sobre foto oscura)
 *  - dark: fondo tinta, texto blanco (sobre fondo claro)
 *  - accent: fondo terracota (CTA principal sobre claro)
 */
import { ActivityIndicator, Pressable } from "react-native";
import { T } from "./T";
import { color, hit, inkAlpha, radius, whiteAlpha } from "./tokens";

type Variant = "solid" | "outline" | "dark" | "accent" | "outlineDark";

const styles: Record<
  Variant,
  { bg: string; fg: string; bd: string }
> = {
  solid: { bg: color.white, fg: color.ink, bd: color.white },
  outline: { bg: inkAlpha(0), fg: color.white, bd: whiteAlpha(0.34) },
  dark: { bg: color.ink, fg: color.white, bd: color.ink },
  accent: { bg: color.accent, fg: color.white, bd: color.accent },
  outlineDark: { bg: inkAlpha(0), fg: color.ink, bd: inkAlpha(0.2) },
};

export function Button({
  label,
  onPress,
  variant = "dark",
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
}) {
  const s = styles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy }}
      style={({ pressed }) => ({
        minHeight: hit.minHeight,
        borderRadius: radius.pill,
        backgroundColor: s.bg,
        borderWidth: 1,
        borderColor: s.bd,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={s.fg} />
      ) : (
        <T v="bodyMedium" c={s.fg}>
          {label}
        </T>
      )}
    </Pressable>
  );
}
