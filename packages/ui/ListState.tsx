/**
 * Estados de carga, error y vacío para toda lista (regla de CLAUDE.md).
 */
import { ActivityIndicator, Pressable, View } from "react-native";
import { T } from "./T";
import { color, hit, inkAlpha, radius, space, whiteAlpha } from "./tokens";

export function ListState({
  loading,
  error,
  empty,
  emptyText,
  errorText,
  retryLabel,
  onRetry,
  onDark = false,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyText: string;
  errorText: string;
  retryLabel: string;
  onRetry?: () => void;
  onDark?: boolean;
}) {
  if (!loading && !error && !empty) return null;
  const fg = onDark ? whiteAlpha(0.55) : inkAlpha(0.5);
  return (
    <View
      style={{
        paddingVertical: space.xxxl,
        alignItems: "center",
        gap: space.m,
      }}
    >
      {loading ? (
        <ActivityIndicator color={onDark ? color.white : color.ink} />
      ) : (
        <T v="small" c={fg} center>
          {error ? errorText : emptyText}
        </T>
      )}
      {error && onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          style={{
            minHeight: hit.minHeight,
            justifyContent: "center",
            borderWidth: 1,
            borderColor: onDark ? whiteAlpha(0.34) : inkAlpha(0.2),
            borderRadius: radius.pill,
            paddingHorizontal: space.xl,
          }}
        >
          <T v="bodyMedium" c={onDark ? color.white : color.ink}>
            {retryLabel}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
