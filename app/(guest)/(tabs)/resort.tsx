/**
 * Resort — pantalla 07 del prototipo.
 * Héroe, "toda estancia incluye", tarjeta de fechas/huéspedes, y las
 * trece categorías en el orden del sitio con disponibilidad NO
 * trivial (InventoryPort: Suite Premium bloqueada en fin de semana,
 * avisos de escasez en acento).
 */
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../../packages/domain/di";
import { lx } from "../../../packages/lib/content";
import { currentLang } from "../../../packages/i18n";
import { rangeLabel, useBooking } from "../../../packages/lib/bookingStore";
import { moneyUsd } from "../../../packages/lib/tulum";
import { useUiStore } from "../../../packages/lib/uiStore";
import { IMG } from "../../../packages/ui/images";
import { ListState } from "../../../packages/ui/ListState";
import { SheetButton } from "../../../packages/ui/SheetButton";
import { T } from "../../../packages/ui/T";
import {
  color,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../../packages/ui/tokens";

interface IncludeRow {
  0: string;
  1: string;
  2: string;
}

export default function Resort() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const desde = useBooking((s) => s.desde);
  const hasta = useBooking((s) => s.hasta);
  const huespedes = useBooking((s) => s.huespedes);
  const setRoom = useBooking((s) => s.setRoom);
  const openSheet = useUiStore((s) => s.openSheet);

  const disponibilidad = useQuery({
    queryKey: ["disponibilidad", desde, hasta, huespedes],
    queryFn: () =>
      getPorts().inventory.buscarDisponibilidad({ desde, hasta, huespedes }),
  });

  const includes = t("stayIncludes", {
    returnObjects: true,
  }) as IncludeRow[];
  const locale = currentLang() === "es" ? "es-MX" : "en-US";

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {/* Héroe */}
        <View style={{ height: 300 }}>
          <Image
            source={{ uri: IMG.roomsHero }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.48)", "rgba(0,0,0,0)", "rgba(0,0,0,.78)"]}
            locations={[0, 0.36, 1]}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <View
            style={{
              marginTop: insets.top + space.xs,
              paddingHorizontal: space.gutter,
              flexDirection: "row",
            }}
          >
            <SheetButton label={t("menuLabel")} onPress={openSheet} onDark />
          </View>
          <View
            style={{
              position: "absolute",
              left: space.gutter,
              right: space.gutter,
              bottom: space.gutter,
            }}
          >
            <T v="hero" c={color.white}>
              {t("resortTitle")}
            </T>
            <T v="small" c={whiteAlpha(0.74)} style={{ marginTop: 11 }}>
              {t("resortSub")}
            </T>
          </View>
        </View>

        {/* Toda estancia incluye */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("stayIncTitle")}
          </T>
          <View style={{ marginTop: space.m }}>
            {includes.map((s) => (
              <View
                key={s[1]}
                style={{
                  flexDirection: "row",
                  gap: 13,
                  paddingVertical: space.m,
                  borderBottomWidth: 1,
                  borderBottomColor: inkAlpha(0.08),
                }}
              >
                <T
                  v="body"
                  c={color.accent}
                  style={{ width: 26, fontSize: 15 }}
                >
                  {s[0]}
                </T>
                <View style={{ flex: 1 }}>
                  <T v="body" style={{ fontSize: 14.5, lineHeight: 17 }}>
                    {s[1]}
                  </T>
                  <T
                    v="small"
                    c={inkAlpha(0.52)}
                    style={{ marginTop: 5, fontSize: 12 }}
                  >
                    {s[2]}
                  </T>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Fechas y huéspedes */}
        <View
          style={{
            marginTop: 22,
            marginHorizontal: space.gutter,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: inkAlpha(0.09),
            borderRadius: radius.cardSmall,
            padding: 15,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space.m,
          }}
        >
          <View>
            <T v="label" c={inkAlpha(0.45)}>
              {t("dates")}
            </T>
            <T v="body" style={{ marginTop: 7, fontSize: 15 }}>
              {rangeLabel(desde, hasta, locale)}
            </T>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T v="label" c={inkAlpha(0.45)}>
              {t("guests")}
            </T>
            <T v="body" style={{ marginTop: 7, fontSize: 15 }}>
              {t("guestsN", { count: huespedes })}
            </T>
          </View>
        </View>
        <T
          v="small"
          c={color.accent}
          style={{
            marginTop: 8,
            paddingHorizontal: space.gutter,
            fontSize: 12,
          }}
        >
          {t("directRate")}
        </T>

        {/* Las trece categorías */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: space.l }}>
          <ListState
            loading={disponibilidad.isPending}
            error={disponibilidad.isError}
            empty={
              !disponibilidad.isPending &&
              (disponibilidad.data?.length ?? 0) === 0
            }
            emptyText={t("listEmpty")}
            errorText={t("listError")}
            retryLabel={t("retry")}
            onRetry={() => void disponibilidad.refetch()}
          />
          {(disponibilidad.data ?? []).map((d) => {
            const disabled = !d.disponible;
            return (
              <Pressable
                key={d.roomType.id}
                disabled={disabled}
                onPress={() => {
                  setRoom(d.roomType.id);
                  router.push("/room");
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                accessibilityLabel={lx(d.roomType.name)}
                style={{
                  marginBottom: 15,
                  backgroundColor: color.white,
                  borderWidth: 1,
                  borderColor: inkAlpha(0.09),
                  borderRadius: radius.card,
                  overflow: "hidden",
                  opacity: disabled ? 0.55 : 1,
                }}
              >
                <Image
                  source={{ uri: IMG[d.roomType.image] }}
                  style={{ width: "100%", height: 168 }}
                  contentFit="cover"
                />
                <View style={{ padding: 15 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: space.m,
                    }}
                  >
                    <T v="subheading" style={{ flex: 1 }}>
                      {lx(d.roomType.name)}
                    </T>
                    <View style={{ alignItems: "flex-end" }}>
                      <T v="bodyMedium" style={{ fontSize: 16 }}>
                        {moneyUsd(d.roomType.nightly)}
                      </T>
                      <T v="caption" c={inkAlpha(0.45)}>
                        {t("perNight")}
                      </T>
                    </View>
                  </View>
                  <T
                    v="small"
                    c={inkAlpha(0.5)}
                    style={{ marginTop: 6, fontSize: 12 }}
                  >
                    {lx(d.roomType.meta)}
                  </T>
                  <T
                    v="small"
                    c={
                      disabled
                        ? inkAlpha(0.42)
                        : d.escaso
                          ? color.accent
                          : inkAlpha(0.42)
                    }
                    style={{ marginTop: 8, fontSize: 12 }}
                  >
                    {disabled
                      ? t("availNone")
                      : d.escaso
                        ? t("availLeftTpl", { n: d.unidadesRestantes })
                        : t("availAvailable")}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Grupos */}
        <View
          style={{
            marginHorizontal: space.gutter,
            backgroundColor: color.ink,
            borderRadius: radius.card,
            padding: space.xl,
          }}
        >
          <T v="heading" c={color.white}>
            {t("groupTitle")}
          </T>
          <T
            v="small"
            c={whiteAlpha(0.6)}
            style={{ marginTop: 8 }}
          >
            {t("groupBody")}
          </T>
          <Pressable
            onPress={() => router.push("/chat")}
            accessibilityRole="button"
            accessibilityLabel={t("groupCta")}
            style={{
              marginTop: space.l,
              alignSelf: "flex-start",
              backgroundColor: color.white,
              borderRadius: radius.pill,
              paddingVertical: 12,
              paddingHorizontal: 20,
              minHeight: hit.minHeight - 4,
              justifyContent: "center",
            }}
          >
            <T v="bodyMedium">{t("groupCta")}</T>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
