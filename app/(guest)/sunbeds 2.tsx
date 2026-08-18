/**
 * Mapa de camastros — pantalla 05 del prototipo.
 * Geometría exacta: filas 11–16 / 21–26 / 31–36 y mesas 61–64 / 71–74,
 * mapa oscuro con leyenda, toggle camastros/mesas, selector de hora
 * de llegada y pie fijo con resumen + Apartar (hold transaccional).
 */
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import { SUNBED_FRONT_ROW_CENTS } from "../../packages/domain/PLACEHOLDER_PRICES";
import type { Spot, SpotRow } from "../../packages/domain/types";
import { useConfirmStore } from "../../packages/lib/confirmStore";
import { crearHoldConAviso } from "../../packages/lib/holds";
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

const BED_ROWS: { row: SpotRow; labelIdx: number }[] = [
  { row: "front", labelIdx: 0 },
  { row: "second", labelIdx: 1 },
  { row: "palapa", labelIdx: 2 },
];
const TABLE_ROWS: { row: SpotRow; labelIdx: number }[] = [
  { row: "sand-tables", labelIdx: 0 },
  { row: "deck-tables", labelIdx: 1 },
];

export default function Sunbeds() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useSession((s) => s.uid);
  const setConfirm = useConfirmStore((s) => s.setConfirm);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [kind, setKind] = useState<"bed" | "table">("bed");
  const [selected, setSelected] = useState<string | null>("bed-14");
  const [timeIdx, setTimeIdx] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => getPorts().spot.suscribir(setSpots), []);

  const rowLabels = t(
    kind === "bed" ? "rowLabels" : "tableLabels",
    { returnObjects: true },
  ) as string[];
  const spotModes = t("spotModes", { returnObjects: true }) as string[];
  const legend = t("legend", { returnObjects: true }) as string[];
  const bedTimes = t("bedTimes", { returnObjects: true }) as string[];

  const rows = kind === "bed" ? BED_ROWS : TABLE_ROWS;
  const byRow = useMemo(() => {
    const m = new Map<SpotRow, Spot[]>();
    for (const s of spots) {
      const list = m.get(s.row) ?? [];
      list.push(s);
      m.set(s.row, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.number - b.number);
    return m;
  }, [spots]);

  const sel = spots.find((s) => s.id === selected);
  const summary = sel
    ? `${t(sel.kind === "bed" ? "bedPick" : "tablePick")} ${sel.number} · ${bedTimes[timeIdx] ?? ""}`
    : t("bedNone");
  const summarySub = sel
    ? t("bedFromTpl", { price: moneyUsd(SUNBED_FRONT_ROW_CENTS) })
    : t("bedTap");

  const onHold = async () => {
    if (!sel || !uid) return;
    setBusy(true);
    try {
      await crearHoldConAviso({
        uid,
        spotId: sel.id,
        arrival: bedTimes[timeIdx] ?? "12:00",
        warnTitle: t("holdWarnTitle"),
        warnBody: t("holdWarnBody", { n: sel.number }),
      });
      setConfirm({
        kind: "bed",
        rows: [
          { k: t("kBed"), v: `#${sel.number}` },
          { k: t("kWhen"), v: bedTimes[timeIdx] ?? "" },
          { k: t("kTotal"), v: moneyUsd(SUNBED_FRONT_ROW_CENTS) },
        ],
      });
      router.push("/confirm");
    } catch (e) {
      const msg = (e as Error).message;
      Alert.alert(msg === "spot-ocupado" ? t("holdTaken") : t("errAuth"));
    } finally {
      setBusy(false);
    }
  };

  const legendSwatches = [
    { bg: whiteAlpha(0.13), bd: whiteAlpha(0.16) },
    { bg: color.accent, bd: color.accent },
    { bg: whiteAlpha(0.05), bd: whiteAlpha(0.06) },
  ];

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
          <T v="title">{t("beachTitle")}</T>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: space.s,
            paddingHorizontal: space.gutter,
            paddingTop: space.l,
          }}
        >
          {spotModes.map((label, i) => {
            const active = (i === 0) === (kind === "bed");
            return (
              <Pressable
                key={label}
                onPress={() => {
                  setKind(i === 0 ? "bed" : "table");
                  setSelected(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                style={{
                  minHeight: hit.minHeight - 8,
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: active ? color.ink : inkAlpha(0.2),
                  backgroundColor: active ? color.ink : inkAlpha(0),
                  borderRadius: radius.pill,
                  paddingHorizontal: 16,
                }}
              >
                <T
                  v="body"
                  c={active ? color.white : inkAlpha(0.7)}
                  style={{ fontSize: 13 }}
                >
                  {label}
                </T>
              </Pressable>
            );
          })}
        </View>

        {/* Mapa oscuro */}
        <View
          style={{
            marginTop: 18,
            marginHorizontal: space.gutter,
            backgroundColor: color.ink,
            borderRadius: radius.card + 2,
            padding: 18,
            paddingTop: space.xl,
          }}
        >
          <T v="labelSmall" c={whiteAlpha(0.4)}>
            {t("seaSide")}
          </T>
          <View style={{ gap: 9, marginTop: 14 }}>
            {rows.map(({ row, labelIdx }) => (
              <View key={row}>
                <T
                  v="labelSmall"
                  c={whiteAlpha(0.32)}
                  style={{ marginBottom: 7, letterSpacing: 1.5 }}
                >
                  {rowLabels[labelIdx] ?? ""}
                </T>
                <View style={{ flexDirection: "row", gap: 7 }}>
                  {(byRow.get(row) ?? []).map((s) => {
                    const mine = s.id === selected;
                    const taken = s.state !== "free" && !mine;
                    return (
                      <Pressable
                        key={s.id}
                        disabled={taken}
                        onPress={() => setSelected(s.id)}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: mine,
                          disabled: taken,
                        }}
                        accessibilityLabel={`${t(s.kind === "bed" ? "bedPick" : "tablePick")} ${s.number}`}
                        style={{
                          flex: 1,
                          height: hit.minHeight,
                          borderRadius: 9,
                          backgroundColor: mine
                            ? color.accent
                            : taken
                              ? whiteAlpha(0.05)
                              : whiteAlpha(0.13),
                          borderWidth: 1,
                          borderColor: mine
                            ? color.accent
                            : taken
                              ? whiteAlpha(0.06)
                              : whiteAlpha(0.16),
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <T
                          v="bodyMedium"
                          c={
                            mine
                              ? color.white
                              : taken
                                ? whiteAlpha(0.22)
                                : whiteAlpha(0.8)
                          }
                          style={{ fontSize: 11.5 }}
                        >
                          {String(s.number)}
                        </T>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: space.l,
              marginTop: 18,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: whiteAlpha(0.1),
            }}
          >
            {legend.map((label, i) => (
              <View
                key={label}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    backgroundColor: legendSwatches[i]?.bg,
                    borderWidth: 1,
                    borderColor: legendSwatches[i]?.bd,
                  }}
                />
                <T v="caption" c={whiteAlpha(0.5)} style={{ fontSize: 10.5 }}>
                  {label}
                </T>
              </View>
            ))}
          </View>
        </View>

        {/* Hora de llegada */}
        <View style={{ marginTop: 18, paddingHorizontal: space.gutter }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("arrival")}
          </T>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.s, paddingTop: space.m }}
          >
            {bedTimes.map((label, i) => {
              const active = i === timeIdx;
              return (
                <Pressable
                  key={label}
                  onPress={() => setTimeIdx(i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                  style={{
                    minHeight: hit.minHeight - 4,
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: active ? color.ink : inkAlpha(0.2),
                    backgroundColor: active ? color.ink : inkAlpha(0),
                    borderRadius: radius.pill,
                    paddingHorizontal: 16,
                  }}
                >
                  <T
                    v="body"
                    c={active ? color.white : inkAlpha(0.7)}
                    style={{ fontSize: 13 }}
                  >
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
          <T v="caption" c={inkAlpha(0.45)} style={{ marginTop: space.l }}>
            {t("qrNote")}
          </T>
        </View>
      </ScrollView>

      {/* Pie fijo */}
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
            {summary}
          </T>
          <T v="caption" c={inkAlpha(0.5)} style={{ marginTop: 5 }}>
            {summarySub}
          </T>
        </View>
        <Pressable
          onPress={() => void onHold()}
          disabled={!sel || busy}
          accessibilityRole="button"
          accessibilityLabel={t("hold")}
          accessibilityState={{ disabled: !sel || busy }}
          style={{
            backgroundColor: color.ink,
            opacity: !sel || busy ? 0.4 : 1,
            borderRadius: radius.pill,
            paddingVertical: 15,
            paddingHorizontal: 26,
            minHeight: hit.minHeight,
            justifyContent: "center",
          }}
        >
          <T v="bodyMedium" c={color.white}>
            {t("hold")}
          </T>
        </Pressable>
      </View>
    </View>
  );
}
