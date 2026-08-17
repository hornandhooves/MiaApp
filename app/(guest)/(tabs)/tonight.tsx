/**
 * Hoy en Mía — pantalla 14 del prototipo.
 * Fondo tinta, tarjeta del set de atardecer con cuenta regresiva en
 * hora de Tulum, line-up del día, la semana, y el CTA al menú.
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { lx, useLineup } from "../../../packages/lib/content";
import { SCREEN_ROUTES } from "../../../packages/lib/routes";
import { minutesUntil, todayLabel } from "../../../packages/lib/tulum";
import { useUiStore } from "../../../packages/lib/uiStore";
import { IMG } from "../../../packages/ui/images";
import { ListState } from "../../../packages/ui/ListState";
import { SheetButton } from "../../../packages/ui/SheetButton";
import { T } from "../../../packages/ui/T";
import {
  color,
  hit,
  radius,
  space,
  whiteAlpha,
} from "../../../packages/ui/tokens";

const GLYPH_DINE = "◑";
const GLYPH_CHEV = "›";

export default function Tonight() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const lineup = useLineup();

  // Cuenta regresiva viva (se refresca cada minuto)
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const sunset = lineup.data?.sunsetSet;
  const mins = sunset ? minutesUntil(sunset.hora) : -1;
  const countdown =
    mins > 59
      ? t("startsInTpl", { h: Math.floor(mins / 60), m: mins % 60 })
      : mins > 0
        ? t("startsInMinTpl", { m: mins })
        : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.ink }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + space.xs,
          paddingBottom: 132,
        }}
      >
        <View
          style={{
            paddingHorizontal: space.gutter,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <SheetButton label={t("menuLabel")} onPress={openSheet} onDark />
          <T v="title" c={color.white} style={{ flex: 1, fontSize: 26 }}>
            {t("tonightTitle")}
          </T>
          <T v="caption" c={whiteAlpha(0.45)}>
            {todayLabel()}
          </T>
        </View>

        <ListState
          loading={lineup.isPending}
          error={lineup.isError}
          empty={!lineup.isPending && !lineup.data}
          emptyText={t("listEmpty")}
          errorText={t("listError")}
          retryLabel={t("retry")}
          onRetry={() => void lineup.refetch()}
          onDark
        />

        {sunset ? (
          <View
            style={{
              marginTop: space.xl,
              marginHorizontal: space.gutter,
              height: 300,
              borderRadius: radius.card + 2,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: IMG.aerial2 }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            <LinearGradient
              colors={[
                "rgba(11,11,12,.2)",
                "rgba(11,11,12,0)",
                "rgba(11,11,12,.92)",
              ]}
              locations={[0, 0.4, 1]}
              style={{ position: "absolute", width: "100%", height: "100%" }}
            />
            {countdown ? (
              <View
                style={{
                  position: "absolute",
                  top: space.l,
                  left: space.l,
                  backgroundColor: color.accent,
                  borderRadius: radius.pill,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <T v="labelSmall" c={color.white}>
                  {countdown}
                </T>
              </View>
            ) : null}
            <View
              style={{
                position: "absolute",
                left: space.xl,
                right: space.xl,
                bottom: space.xl,
              }}
            >
              <T v="hero" c={color.white} style={{ fontSize: 31 }}>
                {lx(sunset.nombre)}
              </T>
              <T v="small" c={whiteAlpha(0.7)} style={{ marginTop: 8 }}>
                {lx(sunset.nota)}
              </T>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: space.xxl, paddingHorizontal: space.gutter }}>
          <T v="labelSmall" c={whiteAlpha(0.42)}>
            {t("lineup")}
          </T>
          {(lineup.data?.today ?? []).map((row) => {
            const isSunset = row.hora === sunset?.hora;
            return (
              <View
                key={`${row.hora}-${row.nombre.en}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: whiteAlpha(0.09),
                }}
              >
                <T
                  v="bodyMedium"
                  c={isSunset ? color.accent : whiteAlpha(0.5)}
                  style={{ width: 52, fontSize: 12 }}
                >
                  {row.hora}
                </T>
                <View style={{ flex: 1 }}>
                  <T v="subheading" c={color.white} style={{ fontSize: 17 }}>
                    {lx(row.nombre)}
                  </T>
                  <T
                    v="caption"
                    c={whiteAlpha(0.42)}
                    style={{ marginTop: 4 }}
                  >
                    {lx(row.detalle)}
                  </T>
                </View>
                <T v="body" c={whiteAlpha(0.28)} style={{ fontSize: 18 }}>
                  {GLYPH_CHEV}
                </T>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: space.xxl, paddingHorizontal: space.gutter }}>
          <T v="labelSmall" c={whiteAlpha(0.42)}>
            {t("weekTitle")}
          </T>
          <View style={{ gap: space.s, marginTop: 13 }}>
            {(lineup.data?.week ?? []).map((w) => (
              <View
                key={w.nombre.en}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  borderWidth: 1,
                  borderColor: whiteAlpha(0.14),
                  borderRadius: radius.tile,
                  paddingVertical: 13,
                  paddingHorizontal: 15,
                }}
              >
                <T
                  v="bodyMedium"
                  c={color.accent}
                  style={{ width: 32, fontSize: 11.5, letterSpacing: 0.7 }}
                >
                  {lx(w.dia)}
                </T>
                <T v="body" c={color.white} style={{ flex: 1 }}>
                  {lx(w.nombre)}
                </T>
                <T v="small" c={whiteAlpha(0.45)} style={{ fontSize: 12 }}>
                  {w.hora}
                </T>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => router.push(SCREEN_ROUTES.dine)}
          accessibilityRole="button"
          accessibilityLabel={t("dineTitle")}
          style={{
            marginTop: 22,
            marginHorizontal: space.gutter,
            borderWidth: 1,
            borderColor: whiteAlpha(0.16),
            borderRadius: radius.cardSmall,
            padding: space.l,
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
            minHeight: hit.minHeight,
          }}
        >
          <T v="body" c={color.accent} style={{ fontSize: 18 }}>
            {GLYPH_DINE}
          </T>
          <View style={{ flex: 1 }}>
            <T v="body" c={color.white} style={{ fontSize: 14.5 }}>
              {t("dineTitle")}
            </T>
            <T v="caption" c={whiteAlpha(0.45)} style={{ marginTop: 4 }}>
              {t("orderFromHere")}
            </T>
          </View>
          <T v="body" c={whiteAlpha(0.3)} style={{ fontSize: 18 }}>
            {GLYPH_CHEV}
          </T>
        </Pressable>
      </ScrollView>
    </View>
  );
}
