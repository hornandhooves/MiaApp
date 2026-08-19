/**
 * Bloque de "Tu día": un encabezado y su contenido, con estado vacío
 * propio. Existe para que los cuatro bloques de la pantalla se vean
 * como un sistema y no como cuatro invenciones distintas.
 */
import type { ReactNode } from "react";
import { View } from "react-native";
import { T } from "./T";
import { inkAlpha, space } from "./tokens";

export function DaySection({
  title,
  empty,
  children,
}: {
  title: string;
  /** Texto de estado vacío; si se pasa, se muestra en vez de children */
  empty?: string | null;
  children?: ReactNode;
}) {
  return (
    <View style={{ marginTop: 28, paddingHorizontal: space.gutter }}>
      <T v="label" c={inkAlpha(0.45)}>
        {title}
      </T>
      <View style={{ marginTop: space.m }}>
        {empty ? (
          <T v="small" c={inkAlpha(0.4)}>
            {empty}
          </T>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
