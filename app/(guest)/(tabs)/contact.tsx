/**
 * Contacto — pantalla 18 del prototipo.
 * Héroe corto, tarjeta de canales, "bueno saber" y redes.
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { lx, useContact } from "../../../packages/lib/content";
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

const ICONS = ["◐", "◇", "✦", "○", "◈"];

export default function Contact() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const contact = useContact();

  const labels = t("contactLabels", { returnObjects: true }) as string[];
  const c = contact.data;

  const openMaps = (direccion: string) =>
    void Linking.openURL(
      `https://maps.apple.com/?q=${encodeURIComponent(direccion)}`,
    );


  const rows = c
    ? [
        { v: c.telefono, open: () => Linking.openURL(`tel:${c.telefono}`) },
        {
          v: c.whatsapp,
          open: () =>
            Linking.openURL(
              `https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}`,
            ),
        },
        {
          v: c.conciergeEmail,
          open: () => Linking.openURL(`mailto:${c.conciergeEmail}`),
        },
        {
          v: c.generalEmail,
          open: () => Linking.openURL(`mailto:${c.generalEmail}`),
        },
        { v: c.direccion, open: () => openMaps(c.direccion) },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        <View style={{ height: 230 }}>
          <Image
            source={{ uri: IMG.aerial }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.44)", "rgba(0,0,0,0)", "rgba(0,0,0,.72)"]}
            locations={[0, 0.4, 1]}
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
              bottom: 22,
            }}
          >
            <T v="hero" c={color.white} style={{ fontSize: 32 }}>
              {t("contactTitle")}
            </T>
            <T v="small" c={whiteAlpha(0.7)} style={{ marginTop: 9 }}>
              {t("contactSub")}
            </T>
          </View>
        </View>

        <ListState
          loading={contact.isPending}
          error={contact.isError}
          empty={!contact.isPending && !contact.data}
          emptyText={t("listEmpty")}
          errorText={t("listError")}
          retryLabel={t("retry")}
          onRetry={() => void contact.refetch()}
        />

        {c ? (
          <View style={{ paddingHorizontal: space.gutter }}>
            <View
              style={{
                marginTop: space.xl,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: inkAlpha(0.09),
                borderRadius: radius.card,
                paddingHorizontal: 18,
                paddingVertical: 4,
              }}
            >
              {rows.map((row, i) => (
                <Pressable
                  key={labels[i] ?? String(i)}
                  onPress={row.open}
                  accessibilityRole="button"
                  accessibilityLabel={`${labels[i] ?? ""}: ${row.v}`}
                  style={{
                    flexDirection: "row",
                    gap: 14,
                    paddingVertical: 15,
                    borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                    borderBottomColor: inkAlpha(0.07),
                    minHeight: hit.minHeight,
                  }}
                >
                  <T
                    v="body"
                    c={color.accent}
                    style={{ width: 22, fontSize: 15 }}
                  >
                    {ICONS[i] ?? ""}
                  </T>
                  <View style={{ flex: 1 }}>
                    <T v="labelSmall" c={inkAlpha(0.45)}>
                      {labels[i] ?? ""}
                    </T>
                    <T v="body" style={{ marginTop: 7, fontSize: 14 }}>
                      {row.v}
                    </T>
                  </View>
                </Pressable>
              ))}
            </View>

            <T v="label" c={inkAlpha(0.45)} style={{ marginTop: 22 }}>
              {t("contactHoursTitle")}
            </T>
            <View style={{ marginTop: space.m }}>
              {c.horarios.map((h) => (
                <View
                  key={h.k.en}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: inkAlpha(0.08),
                  }}
                >
                  <T v="small" c={inkAlpha(0.6)}>
                    {lx(h.k)}
                  </T>
                  <T v="body" style={{ fontSize: 13.5 }}>
                    {h.v}
                  </T>
                </View>
              ))}
            </View>

            <T v="label" c={inkAlpha(0.45)} style={{ marginTop: 22 }}>
              {t("contactSocial")}
            </T>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 7,
                marginTop: space.m,
              }}
            >
              {c.redes.map((red) => (
                <View
                  key={red}
                  style={{
                    borderWidth: 1,
                    borderColor: inkAlpha(0.14),
                    borderRadius: radius.pill,
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                  }}
                >
                  <T v="small" c={inkAlpha(0.7)} style={{ fontSize: 12 }}>
                    {red}
                  </T>
                </View>
              ))}
            </View>

            <View style={{ marginTop: space.xxl }}>
              <Button
                label={t("contactMapCta")}
                onPress={() => openMaps(c.direccion)}
                variant="outlineDark"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
