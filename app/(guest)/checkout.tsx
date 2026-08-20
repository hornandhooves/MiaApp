/**
 * Pago — pantalla 09 del prototipo.
 * Resumen de la estancia, desglose línea por línea con impuestos,
 * método de pago, "vas a acumular X Olas", y Confirmar y pagar con
 * clave de idempotencia: un doble toque no genera dos reservas.
 */
import { useQuery } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { Redirect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { mensajeConPista } from "../../packages/lib/errorTecnico";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import { OLAS } from "../../packages/domain/PLACEHOLDER_PRICES";
import { lx } from "../../packages/lib/content";
import { currentLang } from "../../packages/i18n";
import { rangeLabel, useBooking } from "../../packages/lib/bookingStore";
import { useConfirmStore } from "../../packages/lib/confirmStore";
import { useSession } from "../../packages/lib/session";
import { moneyUsd } from "../../packages/lib/tulum";
import { CircleButton, GLYPH } from "../../packages/ui/CircleButton";
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

interface PayRow {
  0: string;
  1: string;
}

/** Cómo se expresa lo acumulado (réplica de la lógica del prototipo) */
function earnSub(
  olas: number,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const night = OLAS.redeem.freeNightOcean;
  const pass = OLAS.redeem.dayPassTraditional;
  if (olas >= night) {
    const n = Math.floor(olas / night);
    return n === 1
      ? `${t("cirPoints")} — ${t("coEarnNight")}`
      : `${t("cirPoints")} — ${n} ${t("coEarnNights")}`;
  }
  if (olas >= pass) {
    return `${t("cirPoints")} — ${Math.floor(olas / pass)} ${t("coEarnPasses")}`;
  }
  return `${t("cirPoints")} — ${t("coEarnToward")}`;
}

export default function Checkout() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useSession((s) => s.uid);
  const desde = useBooking((s) => s.desde);
  const hasta = useBooking((s) => s.hasta);
  const huespedes = useBooking((s) => s.huespedes);
  const roomTypeId = useBooking((s) => s.roomTypeId);
  const plan = useBooking((s) => s.plan);
  const payMethod = useBooking((s) => s.payMethod);
  const setPayMethod = useBooking((s) => s.setPayMethod);
  const setConfirm = useConfirmStore((s) => s.setConfirm);
  const [busy, setBusy] = useState(false);
  // UNA clave por intento de checkout: el doble toque reusa la misma
  const idemKey = useRef(Crypto.randomUUID());

  const disponibilidad = useQuery({
    queryKey: ["disponibilidad", desde, hasta, huespedes],
    queryFn: () =>
      getPorts().inventory.buscarDisponibilidad({ desde, hasta, huespedes }),
  });
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

  const room = disponibilidad.data?.find(
    (d) => d.roomType.id === roomTypeId,
  )?.roomType;

  if (!roomTypeId) return <Redirect href="/resort" />;

  const plans = t("plans", { returnObjects: true }) as [string, string, string][];
  const pays = t("coPays", { returnObjects: true }) as PayRow[];
  const locale = currentLang() === "es" ? "es-MX" : "en-US";
  const planName = plans[plan === "bb" ? 0 : 1]?.[0] ?? "";
  const tf = tarifa.data;
  const olas = tf
    ? Math.round((tf.totalCents / 100) * OLAS.ratePerUsd.marea)
    : 0;

  const pagar = async () => {
    if (!uid || !tf || !room) return;
    setBusy(true);
    try {
      const key = idemKey.current;
      const pago = await getPorts().payment.pagar({
        montoCents: tf.totalCents,
        currency: "usd",
        concepto: lx(room.name),
        idempotencyKey: key,
        uid,
      });
      await getPorts().reservation.crear({
        uid,
        roomTypeId: room.id,
        desde,
        hasta,
        huespedes,
        plan,
        totalCents: tf.totalCents,
        paymentIntentId: pago.paymentIntentId,
        idempotencyKey: key,
      });
      setConfirm({
        kind: "room",
        rows: [
          { k: t("kWhen"), v: rangeLabel(desde, hasta, locale) },
          { k: t("kWhere"), v: lx(room.name) },
          { k: t("kPlan"), v: planName },
          { k: t("kTotal"), v: moneyUsd(tf.totalCents) },
          { k: t("kOlas"), v: olas.toLocaleString(locale) },
        ],
        note: pago.simulado ? t("payDemoNote") : undefined,
      });
      router.push("/confirm");
    } catch (e) {
      Alert.alert(mensajeConPista(t("errAuth"), e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + space.xs,
          paddingBottom: 140,
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
          <CircleButton
            glyph={GLYPH.back}
            label={t("back")}
            onPress={() => router.back()}
          />
          <T v="title">{t("coTitle")}</T>
        </View>

        {/* Tu estancia */}
        <View
          style={{
            marginTop: space.xl,
            marginHorizontal: space.gutter,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: inkAlpha(0.09),
            borderRadius: radius.card,
            paddingHorizontal: 18,
            paddingVertical: 6,
          }}
        >
          {[
            { k: t("dates"), v: rangeLabel(desde, hasta, locale) },
            { k: t("guests"), v: t("guestsN", { count: huespedes }) },
            { k: t("coRoom"), v: room ? lx(room.name) : "…" },
            { k: t("mealPlan"), v: planName },
          ].map((r, i, arr) => (
            <View
              key={r.k}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
                paddingVertical: 13,
                borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                borderBottomColor: inkAlpha(0.07),
              }}
            >
              <T v="labelSmall" c={inkAlpha(0.45)}>
                {r.k}
              </T>
              <T
                v="body"
                style={{ fontSize: 14, textAlign: "right", flex: 1 }}
              >
                {r.v}
              </T>
            </View>
          ))}
        </View>

        {/* Precio */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("coBreak")}
          </T>
          <View style={{ marginTop: space.m }}>
            {tf && room
              ? [
                  {
                    k: `${lx(room.name)} × ${tf.noches}`,
                    v: moneyUsd(tf.porNocheCents * tf.noches),
                  },
                  {
                    k: planName,
                    v:
                      tf.planPorNocheCents > 0
                        ? moneyUsd(tf.planPorNocheCents * tf.noches)
                        : t("included"),
                  },
                  { k: t("coTaxes"), v: moneyUsd(tf.impuestosCents) },
                  { k: t("kTotal"), v: moneyUsd(tf.totalCents) },
                ].map((l) => (
                  <View
                    key={l.k}
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 14,
                      paddingVertical: 11,
                      borderBottomWidth: 1,
                      borderBottomColor: inkAlpha(0.08),
                    }}
                  >
                    <T v="small" c={inkAlpha(0.68)} style={{ fontSize: 13.5 }}>
                      {l.k}
                    </T>
                    <T v="bodyMedium" style={{ fontSize: 14.5 }}>
                      {l.v}
                    </T>
                  </View>
                ))
              : null}
          </View>
        </View>

        {/* Método de pago */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("coPayTitle")}
          </T>
          <View style={{ gap: 9, marginTop: space.m }}>
            {pays.map((p, i) => {
              const active = i === payMethod;
              return (
                <Pressable
                  key={p[0]}
                  onPress={() => setPayMethod(i)}
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
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Olas */}
        <View
          style={{
            marginTop: 22,
            marginHorizontal: space.gutter,
            backgroundColor: color.ink,
            borderRadius: radius.card,
            padding: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 9,
            }}
          >
            <T v="caption" c={whiteAlpha(0.55)}>
              {t("coEarn")}
            </T>
            <T v="title" c={color.white} style={{ fontSize: 26 }}>
              {olas.toLocaleString(locale)}
            </T>
          </View>
          <T
            v="small"
            c={color.accent}
            style={{ marginTop: 8, fontSize: 12 }}
          >
            {earnSub(olas, t)}
          </T>
        </View>
        <T
          v="caption"
          c={inkAlpha(0.5)}
          style={{ marginTop: 14, paddingHorizontal: space.gutter }}
        >
          {t("coPolicy")}
        </T>
      </ScrollView>

      {/* Pie */}
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
        }}
      >
        <Pressable
          onPress={() => void pagar()}
          disabled={busy || !tf}
          accessibilityRole="button"
          accessibilityLabel={t("coBtn")}
          accessibilityState={{ disabled: busy || !tf }}
          style={{
            backgroundColor: color.ink,
            opacity: busy || !tf ? 0.5 : 1,
            borderRadius: radius.pill,
            minHeight: hit.minHeight + 6,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T v="bodyMedium" c={color.white}>
            {t("coBtn")}
          </T>
        </Pressable>
      </View>
    </View>
  );
}
