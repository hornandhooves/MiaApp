/**
 * Bienestar — pantalla 11 del prototipo.
 * Héroe, manifiesto, tres pilares, y reserva de sesiones con cupo
 * transaccional. El temazcal solo aparece jueves y domingo (día real
 * de Tulum); el yoga de las 9:00 queda con dos lugares.
 */
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../../packages/domain/di";
import { lx } from "../../../packages/lib/content";
import { useConfirmStore } from "../../../packages/lib/confirmStore";
import { useSession } from "../../../packages/lib/session";
import { moneyUsd, weekdayInTulum } from "../../../packages/lib/tulum";
import { useUiStore } from "../../../packages/lib/uiStore";
import { Button } from "../../../packages/ui/Button";
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

interface Pillar {
  0: string; // name
  1: string; // body
  2: string; // note
  3: string; // img key
}

export default function Wellness() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const uid = useSession((s) => s.uid);
  const setConfirm = useConfirmStore((s) => s.setConfirm);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const weekday = weekdayInTulum();
  const sesiones = useQuery({
    queryKey: ["wellness", weekday],
    queryFn: () => getPorts().wellness.sesionesHoy(weekday),
  });

  const pillars = t("wellPillars", { returnObjects: true }) as Pillar[];
  const sel = sesiones.data?.find((s) => s.id === selected);

  const book = async () => {
    if (!sel || !uid) return;
    setBusy(true);
    try {
      await getPorts().wellness.reservarSesion(sel.id, uid);
      setConfirm({
        kind: "well",
        rows: [
          { k: t("kWhen"), v: sel.hora },
          { k: t("kWhere"), v: lx(sel.lugar) },
          {
            k: t("kTotal"),
            v:
              sel.precioCents === null
                ? t("included")
                : moneyUsd(sel.precioCents),
          },
        ],
        note: sel.precioCents !== null ? t("payDemoNote") : undefined,
      });
      router.push("/confirm");
    } catch (e) {
      Alert.alert(
        (e as Error).message === "cupo-lleno" ? t("soldOut") : t("errAuth"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        <View style={{ height: 340 }}>
          <Image
            source={{ uri: IMG.backbend }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.42)", "rgba(0,0,0,0)", "rgba(0,0,0,.78)"]}
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
            <T v="hero" c={color.white} style={{ fontSize: 36 }}>
              {t("wellTitle")}
            </T>
            <T v="small" c={whiteAlpha(0.74)} style={{ marginTop: 11 }}>
              {t("wellSub")}
            </T>
          </View>
        </View>

        <T
          v="small"
          c={inkAlpha(0.66)}
          style={{
            padding: space.gutter,
            paddingBottom: 0,
            fontSize: 13.5,
            lineHeight: 22,
          }}
        >
          {t("wellBody")}
        </T>

        {/* Pilares */}
        <View
          style={{ paddingHorizontal: space.gutter, paddingTop: space.xl, gap: 14 }}
        >
          {pillars.map((p) => (
            <View
              key={p[0]}
              style={{
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: inkAlpha(0.09),
                borderRadius: radius.card,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: IMG[p[3]] }}
                style={{ width: "100%", height: 150 }}
                contentFit="cover"
                accessibilityLabel={p[0]}
              />
              <View style={{ padding: 16 }}>
                <T v="heading">{p[0]}</T>
                <T v="small" c={inkAlpha(0.6)} style={{ marginTop: 9 }}>
                  {p[1]}
                </T>
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 11,
                    borderTopWidth: 1,
                    borderTopColor: inkAlpha(0.08),
                  }}
                >
                  <T
                    v="caption"
                    c={color.accent}
                    style={{ fontSize: 11, lineHeight: 15 }}
                  >
                    {p[2]}
                  </T>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Reservar sesión */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 26 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("wellBookTitle")}
          </T>
          <ListState
            loading={sesiones.isPending}
            error={sesiones.isError}
            empty={!sesiones.isPending && (sesiones.data?.length ?? 0) === 0}
            emptyText={t("listEmpty")}
            errorText={t("listError")}
            retryLabel={t("retry")}
            onRetry={() => void sesiones.refetch()}
          />
          <View style={{ gap: 10, marginTop: space.m }}>
            {(sesiones.data ?? []).map((s) => {
              const active = s.id === selected;
              const left = s.capacidad - s.tomados;
              const full = left <= 0;
              return (
                <Pressable
                  key={s.id}
                  disabled={full}
                  onPress={() => setSelected(s.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: full }}
                  accessibilityLabel={lx(s.nombre)}
                  style={{
                    backgroundColor: active
                      ? color.white
                      : whiteAlpha(0.5),
                    borderWidth: 1,
                    borderColor: active ? color.ink : inkAlpha(0.09),
                    borderRadius: 15,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 13,
                    minHeight: hit.minHeight,
                    opacity: full ? 0.5 : 1,
                  }}
                >
                  <View style={{ width: 52 }}>
                    <T
                      v="bodyMedium"
                      c={active ? color.accent : color.ink}
                      style={{ fontSize: 13 }}
                    >
                      {s.hora}
                    </T>
                    <T
                      v="caption"
                      c={inkAlpha(0.45)}
                      style={{ marginTop: 3 }}
                    >
                      {t("minTpl", { m: s.duracionMin })}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="subheading" style={{ fontSize: 17 }}>
                      {lx(s.nombre)}
                    </T>
                    <T
                      v="caption"
                      c={inkAlpha(0.5)}
                      style={{ marginTop: 4 }}
                    >
                      {lx(s.lugar)}
                    </T>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <T v="bodyMedium" style={{ fontSize: 13 }}>
                      {s.precioCents === null
                        ? t("included")
                        : moneyUsd(s.precioCents)}
                    </T>
                    <T
                      v="caption"
                      c={left <= 2 ? color.accent : inkAlpha(0.42)}
                      style={{ marginTop: 4 }}
                    >
                      {full ? t("soldOut") : t("wellLeftTpl", { n: left })}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {sel ? (
            <View style={{ marginTop: space.l, gap: space.s }}>
              <T v="small" c={inkAlpha(0.6)} center>
                {`${lx(sel.nombre)} · ${sel.hora}`}
              </T>
              <Button
                label={t("wellBookTitle")}
                onPress={() => void book()}
                variant="dark"
                busy={busy}
              />
            </View>
          ) : null}
          <T v="caption" c={inkAlpha(0.5)} style={{ marginTop: space.l }}>
            {t("wellGroup")}
          </T>
        </View>
      </ScrollView>
    </View>
  );
}
