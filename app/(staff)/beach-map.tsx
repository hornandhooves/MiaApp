/**
 * Staff · mapa de playa — tras bandera (FLAGS.staff).
 * MIA-132: marcar ocupado o libre un camastro en un toque, para que
 * el mapa de la app no mienta. Cambios visibles en tiempo real vía
 * la suscripción del SpotPort.
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import type { Spot, SpotRow } from "../../packages/domain/types";
import { T } from "../../packages/ui/T";
import {
  color,
  hit,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

const ROWS: SpotRow[] = [
  "front",
  "second",
  "palapa",
  "sand-tables",
  "deck-tables",
];

export default function BeachMap() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => getPorts().spot.suscribir(setSpots), []);

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

  const toggle = (s: Spot) =>
    void getPorts().spot.setEstado(
      s.id,
      s.state === "taken" ? "free" : "taken",
    );

  const bedLabels = t("rowLabels", { returnObjects: true }) as string[];
  const tableLabels = t("tableLabels", { returnObjects: true }) as string[];
  const labelFor = (row: SpotRow): string => {
    switch (row) {
      case "front":
        return bedLabels[0] ?? "";
      case "second":
        return bedLabels[1] ?? "";
      case "palapa":
        return bedLabels[2] ?? "";
      case "sand-tables":
        return tableLabels[0] ?? "";
      case "deck-tables":
        return tableLabels[1] ?? "";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ink }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.l,
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <T v="title" c={color.white}>
          {t("staffBeachTitle")}
        </T>
        <T v="caption" c={whiteAlpha(0.5)} style={{ marginTop: 6 }}>
          {t("staffHint")}
        </T>
        <View style={{ gap: space.l, marginTop: space.xxl }}>
          {ROWS.map((row) => (
            <View key={row}>
              <T
                v="labelSmall"
                c={whiteAlpha(0.35)}
                style={{ marginBottom: 8 }}
              >
                {labelFor(row)}
              </T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(byRow.get(row) ?? []).map((s) => {
                  const taken = s.state === "taken";
                  const held = s.state === "held";
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggle(s)}
                      accessibilityRole="button"
                      accessibilityLabel={`${s.id} · ${taken ? t("staffTaken") : t("staffFree")}`}
                      style={{
                        width: 72,
                        minHeight: hit.minHeight + 8,
                        borderRadius: 10,
                        backgroundColor: taken
                          ? color.accent
                          : held
                            ? whiteAlpha(0.28)
                            : whiteAlpha(0.1),
                        borderWidth: 1,
                        borderColor: taken
                          ? color.accent
                          : whiteAlpha(0.18),
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3,
                      }}
                    >
                      <T v="bodyMedium" c={color.white}>
                        {String(s.number)}
                      </T>
                      <T
                        v="labelSmall"
                        c={whiteAlpha(0.7)}
                        style={{ fontSize: 8.5, letterSpacing: 1.2 }}
                      >
                        {taken
                          ? t("staffTaken")
                          : held
                            ? t("hold")
                            : t("staffFree")}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
