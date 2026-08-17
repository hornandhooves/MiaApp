/**
 * Cenote — pantalla 13 del prototipo.
 * Casa Tortuga incluido con la estancia; solo se aparta el asiento
 * del shuttle (transaccional) y llega recordatorio 20 min antes.
 */
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import { useConfirmStore } from "../../packages/lib/confirmStore";
import { useSession } from "../../packages/lib/session";
import { minutesUntil } from "../../packages/lib/tulum";
import { Button } from "../../packages/ui/Button";
import { IMG } from "../../packages/ui/images";
import { ListState } from "../../packages/ui/ListState";
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
const CENOTE_NAME = "Cenote Casa Tortuga";
const REMINDER_MIN = 20;

export default function Cenote() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useSession((s) => s.uid);
  const setConfirm = useConfirmStore((s) => s.setConfirm);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shuttles = useQuery({
    queryKey: ["shuttles"],
    queryFn: () => getPorts().wellness.shuttles(),
  });

  const facts = t("cenoteFacts", { returnObjects: true }) as [
    string,
    string,
  ][];
  const sel = shuttles.data?.find((s) => s.id === selected);
  const PERSONAS = 2;

  const book = async () => {
    if (!sel || !uid) return;
    setBusy(true);
    try {
      await getPorts().wellness.apartarShuttle(sel.id, uid, PERSONAS);
      // Recordatorio local 20 min antes de la salida (si aún aplica)
      const mins = minutesUntil(sel.hora);
      if (mins > REMINDER_MIN) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: CENOTE_NAME,
              body: t("cBodyShuttle"),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: (mins - REMINDER_MIN) * 60,
            },
          });
        } catch {
          // sin permiso de notificaciones: la reserva vive igual
        }
      }
      setConfirm({
        kind: "shuttle",
        rows: [
          { k: t("kWhen"), v: sel.hora },
          { k: t("kSeats"), v: String(PERSONAS) },
          { k: t("kTotal"), v: t("free") },
        ],
      });
      router.push("/confirm");
    } catch (e) {
      Alert.alert(
        (e as Error).message === "sin-asientos"
          ? t("soldOut")
          : t("errAuth"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={{ height: 330 }}>
          <Image
            source={{ uri: IMG.cenote }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.4)", "rgba(0,0,0,0)", "rgba(0,0,0,.62)"]}
            locations={[0, 0.42, 1]}
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
          <View
            style={{
              position: "absolute",
              left: space.gutter,
              right: space.gutter,
              bottom: 22,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: color.accent,
                borderRadius: radius.pill,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <T v="labelSmall" c={color.white}>
                {t("included")}
              </T>
            </View>
            <T v="hero" c={color.white} style={{ marginTop: 12, fontSize: 33 }}>
              {CENOTE_NAME}
            </T>
          </View>
        </View>

        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <T
            v="small"
            c={inkAlpha(0.66)}
            style={{ fontSize: 13.5, lineHeight: 22 }}
          >
            {t("cenoteBody")}
          </T>
          <View
            style={{
              flexDirection: "row",
              gap: 26,
              marginTop: space.xl,
              paddingVertical: space.l,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: inkAlpha(0.1),
            }}
          >
            {facts.map((f) => (
              <View key={f[0]}>
                <T v="labelSmall" c={inkAlpha(0.42)}>
                  {f[0]}
                </T>
                <T v="body" style={{ marginTop: 7, fontSize: 15 }}>
                  {f[1]}
                </T>
              </View>
            ))}
          </View>

          <T v="label" c={inkAlpha(0.45)} style={{ marginTop: 22 }}>
            {t("shuttle")}
          </T>
          <ListState
            loading={shuttles.isPending}
            error={shuttles.isError}
            empty={!shuttles.isPending && (shuttles.data?.length ?? 0) === 0}
            emptyText={t("listEmpty")}
            errorText={t("listError")}
            retryLabel={t("retry")}
            onRetry={() => void shuttles.refetch()}
          />
          <View style={{ gap: 9, marginTop: space.m }}>
            {(shuttles.data ?? []).map((s) => {
              const active = s.id === selected;
              const left = s.asientos - s.tomados;
              const full = left < PERSONAS;
              return (
                <Pressable
                  key={s.id}
                  disabled={full}
                  onPress={() => setSelected(s.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: full }}
                  accessibilityLabel={`${s.hora} · ${t("seatsTpl", { n: left })}`}
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
                    opacity: full ? 0.5 : 1,
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
                  <T v="body" style={{ flex: 1, fontSize: 15 }}>
                    {s.hora}
                  </T>
                  <T
                    v="small"
                    c={left <= 3 ? color.accent : inkAlpha(0.5)}
                    style={{ fontSize: 12.5 }}
                  >
                    {full ? t("soldOut") : t("seatsTpl", { n: left })}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
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
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <T v="bodyMedium" style={{ fontSize: 16 }}>
            {sel
              ? `${sel.hora} · ${t("seatsTpl", { n: PERSONAS })}`
              : t("shuttleNone")}
          </T>
          <T v="caption" c={inkAlpha(0.5)} style={{ marginTop: 5 }}>
            {t("free")}
          </T>
        </View>
        <View>
          <Button
            label={t("hold")}
            onPress={() => void book()}
            variant="dark"
            busy={busy}
            disabled={!sel}
          />
        </View>
      </View>
    </View>
  );
}
