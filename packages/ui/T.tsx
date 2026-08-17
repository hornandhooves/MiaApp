/**
 * Primitiva de texto — todo texto de la app pasa por aquí.
 * Estilos desde tokens; el contenido siempre viene de t('clave')
 * o de datos sembrados.
 */
import { Text, type TextProps, type TextStyle } from "react-native";
import { color, type } from "./tokens";

export type Variant = keyof typeof type;

export interface TProps extends TextProps {
  v?: Variant;
  c?: string;
  center?: boolean;
}

export function T({ v = "body", c = color.ink, center, style, ...rest }: TProps) {
  const base: TextStyle = { ...type[v], color: c };
  return (
    <Text
      {...rest}
      style={[base, center ? { textAlign: "center" } : null, style]}
    />
  );
}
