/**
 * Detalle de habitación — pantalla 08 del prototipo.
 * Foto de héroe con hoja redondeada encima, descripción,
 * características, plan de comidas con el TOTAL DEL PIE recalculando
 * en vivo (obtenerTarifa), y Reservar.
 */
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import type { MealPlanId } from "../../packages/domain/types";
import { lx } from "../../packages/lib/content";
import { useBooking } from "../../packages/lib/bookingStore";
import { moneyUsd } from "../../packages/lib/tulum";
import { IMG } from "../../packages/ui/images";
import { T } from "../../packages/ui/T";
import {
  canvasAlpha,
  color,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

const BACK = "‹";

interface PlanRow {
  0: string;
  1: string;
  2: string;
}

export default function Room() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const roomTypeId = useBooking((s) => s.roomTypeId);
  const desde = useBooking((s) => s.desde);
  const hasta = useBooking((s) => s.hasta);
  const plan = useBooking((s) => s.plan);
  const setPlan = useBooking((s) => s.setPlan);
  const huespedes = useBooking((s) => s.huespedes);

  // Mismo query key que Resort: cache de react-query, cero lecturas
  // extra. La pantalla solo conoce el port.
  const disponibilidad = useQuery({
    queryKey: ["disponibilidad", desde, hasta, huespedes],
    queryFn: () =>
      getPorts().inventory.buscarDisponibilidad({ desde, hasta, huespedes }),
  });
  const room = disponibilidad.data?.find(
    (d) => d.roomType.id === roomTypeId,
  )?.roomType;

  const tarifa = useQuery({
    queryKey: ["tarifa", roomTypeId, desde, hasta, plan],
    enabled: !!roomTypeId,
    queryFn: () =>
      getPorts().inventory.obtenerTarifa({
        roomTypeId: roomTypeId ?? "",
        desde,
        hasta,
        plan,
      }),
  });

  if (!disponibilidad.isPending && !room) {
    return <Redirect href="/resort" />;
  }
  if (!room) return null;

  const features = t("features", { returnObjects: true }) as [
    string,
    string,
  ][];
  const plans = t("plans", { returnObjects: true }) as PlanRow[];
  const planIds: MealPlanId[] = ["bb", "fbe"];

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View style={{ height: 340 }}>
          <Image
            source={{ uri: IMG[room.image] ?? IMG.roomsHero }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.42)", "rgba(0,0,0,0)"]}
            locations={[0, 0.4]}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            style={{
              marginTop: insets.top + space.s,
              marginLeft: space.gutter,
              width: hit.minWidth,
              height: hit.minHeight,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: canvasAlpha(0.92),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T v="body" style={{ fontSize: 17 }}>
                {BACK}
              </T>
            </View>
          </Pressable>
        </View>

        {/* Hoja redondeada */}
        <View
          style={{
            marginTop: -26,
            backgroundColor: color.canvas,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: 26,
            paddingHorizontal: space.gutter,
          }}
        >
          <T v="title" style={{ fontSize: 29 }}>
            {lx(room.name)}
          </T>
          <T v="small" c={inkAlpha(0.5)} style={{ marginTop: 9 }}>
            {lx(room.meta)}
          </T>
          <T
            v="small"
            c={inkAlpha(0.65)}
            style={{ marginTop: 14, fontSize: 13, lineHeight: 21 }}
          >
            {lx(room.description)}
          </T>

          {/* Características */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: space.xl,
            }}
          >
            {features.map((f) => (
              <View
                key={f[1]}
                style={{
                  width: "48%",
                  backgroundColor: color.white,
                  borderWidth: 1,
                  borderColor: inkAlpha(0.08),
                  borderRadius: 13,
                  padding: 13,
                }}
              >
                <T v="body" c={color.accent} style={{ fontSize: 16 }}>
                  {f[0]}
                </T>
                <T v="body" style={{ marginTop: 9, fontSize: 13 }}>
                  {f[1]}
                </T>
              </View>
            ))}
          </View>

          {/* Plan de comidas */}
          <T v="label" c={inkAlpha(0.45)} style={{ marginTop: space.xxl }}>
            {t("mealPlan")}
          </T>
          <View style={{ gap: 9, marginTop: space.m }}>
            {plans.map((p, i) => {
              const id = planIds[i] ?? "bb";
              const active = plan === id;
              return (
                <Pressable
                  key={p[0]}
                  onPress={() => setPlan(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={p[0]}
                  style={{
                    borderWidth: 1.5,
                    borderColor: active ? color.ink : inkAlpha(0.1),
                    backgroundColor: active
                      ? color.white
                      : whiteAlpha(0.5),
                    borderRadius: 15,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 13,
                    minHeight: hit.minHeight,
                  }}
                >
                  <View
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: active ? color.ink : inkAlpha(0.25),
                      backgroundColor: active ? color.ink : inkAlpha(0),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {active ? (
                      <T
                        v="caption"
                        c={color.white}
                        style={{ fontSize: 10, lineHeight: 12 }}
                      >
                        {"✓"}
                      </T>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="body" style={{ fontSize: 15 }}>
                      {p[0]}
                    </T>
                    <T
                      v="small"
                      c={inkAlpha(0.52)}
                      style={{ marginTop: 4, fontSize: 12 }}
                    >
                      {p[1]}
                    </T>
                  </View>
                  <T v="bodyMedium">{p[2]}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Pie: total recalculando en vivo */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: canvasAlpha(0.96),
          borderTopWidth: 1,
          borderTopColor: inkAlpha(0.09),
          paddingHorizontal: space.gutter,
          paddingTop: 14,
          paddingBottom: insets.bottom + space.m,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <T v="bodyMedium" style={{ fontSize: 20 }}>
            {tarifa.data ? moneyUsd(tarifa.data.totalCents) : "…"}
          </T>
          <T v="caption" c={inkAlpha(0.5)} style={{ marginTop: 5 }}>
            {t("totalNights")}
          </T>
        </View>
        <Pressable
          onPress={() => router.push("/checkout")}
          disabled={!tarifa.data}
          accessibilityRole="button"
          accessibilityLabel={t("reserve")}
          accessibilityState={{ disabled: !tarifa.data }}
          style={{
            backgroundColor: color.ink,
            opacity: tarifa.data ? 1 : 0.4,
            borderRadius: radius.pill,
            paddingVertical: 15,
            paddingHorizontal: 28,
            minHeight: hit.minHeight,
            justifyContent: "center",
          }}
        >
          <T v="bodyMedium" c={color.white}>
            {t("reserve")}
          </T>
        </Pressable>
      </View>
    </View>
  );
}
