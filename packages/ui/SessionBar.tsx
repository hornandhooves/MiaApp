/**
 * Barra de sesión: el contexto del huésped, siempre a la vista.
 *
 * Se apoya sobre la tab bar y responde tres cosas sin que nadie tenga que
 * navegar: dónde estoy, cuánto llevo gastado, y si algo viene en camino.
 * Tocarla lleva a Tu día.
 *
 * No aparece si no hay nada que decir: sin lugar ligado, sin cuenta y sin
 * pedidos vivos, la barra no existe y no roba pantalla.
 */
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./T";
import { color, hit, radius, space, whiteAlpha } from "./tokens";

export interface SessionBarProps {
  /** Texto del lugar ya traducido ("bed 14", "suite 204") */
  lugar: string | null;
  /** Cuenta del día, ya formateada */
  cuenta: string | null;
  /** Estado de lo que viene en camino, ya traducido */
  enCamino: string | null;
  /** Minutos que faltan para liberar el lugar, ya traducido */
  aviso: string | null;
  label: string;
  onPress: () => void;
}

/** Altura que las pantallas deben dejar libre al final del scroll. */
export const SESSION_BAR_HEIGHT = 44;

export function SessionBar({
  lugar,
  cuenta,
  enCamino,
  aviso,
  label,
  onPress,
}: SessionBarProps) {
  const insets = useSafeAreaInsets();
  const partes = [lugar, cuenta, enCamino].filter(Boolean) as string[];
  if (partes.length === 0) return null;
  // El separador se arma en JS: en JSX seria texto literal y el contrato
  // del repo lo prohibe (todo pasa por t()).
  const resto = partes.slice(1).join(" \u00b7 ");

  return (
    <View
      style={{
        position: "absolute",
        left: space.l,
        right: space.l,
        // Se apoya justo encima de la tab bar flotante.
        bottom: Math.max(insets.bottom, space.m) + 58,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.s,
          backgroundColor: color.ink,
          borderRadius: radius.pill,
          paddingHorizontal: space.l,
          minHeight: hit.minHeight,
          borderWidth: 1,
          borderColor: whiteAlpha(0.14),
        }}
      >
        <T v="small" c={color.white}>
          {partes[0]}
        </T>
        {resto ? (
          <T v="small" c={whiteAlpha(0.7)}>
            {resto}
          </T>
        ) : null}
        {aviso ? (
          <T v="small" c={color.accent} style={{ marginLeft: space.xs }}>
            {aviso}
          </T>
        ) : null}
      </Pressable>
    </View>
  );
}
