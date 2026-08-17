/**
 * Bodas — pantalla 10 del prototipo.
 * Héroe con "sin renta de venue", manifiesto, los cuatro puntos,
 * galería horizontal, testimonial, y la solicitud de fecha que abre
 * una conversación (sin CRM en el demo).
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../../../packages/lib/confirmStore";
import { useUiStore } from "../../../packages/lib/uiStore";
import { Button } from "../../../packages/ui/Button";
import { IMG } from "../../../packages/ui/images";
import { SheetButton } from "../../../packages/ui/SheetButton";
import { T } from "../../../packages/ui/T";
import {
  color,
  font,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../../packages/ui/tokens";

const GALLERY = ["wedAisle", "wedTable", "wedWomen", "wedDining", "neonRoom"];
const QUOTE_L = "“";
const QUOTE_R = "”";

function Field({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={inkAlpha(0.35)}
      style={{
        minHeight: hit.minHeight,
        borderWidth: 1,
        borderColor: inkAlpha(0.18),
        borderRadius: radius.control,
        paddingHorizontal: space.l,
        fontFamily: font.sans,
        fontSize: 14,
        color: color.ink,
        backgroundColor: color.white,
      }}
      accessibilityLabel={placeholder}
    />
  );
}

export default function Weddings() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const setConfirm = useConfirmStore((s) => s.setConfirm);
  const [fecha, setFecha] = useState("");
  const [invitados, setInvitados] = useState("");
  const [tipo, setTipo] = useState("");

  const points = t("wedPoints", { returnObjects: true }) as [
    string,
    string,
  ][];
  const testi = t("wedTesti", { returnObjects: true }) as [string, string];

  const send = () => {
    setConfirm({
      kind: "wed",
      rows: [
        { k: t("wedDate"), v: fecha },
        { k: t("wedGuests"), v: invitados },
        { k: t("wedType"), v: tipo },
      ].filter((r) => r.v.trim().length > 0),
    });
    router.push("/confirm");
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        <View style={{ height: 400 }}>
          <Image
            source={{ uri: IMG.wedAisle }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.42)", "rgba(0,0,0,0)", "rgba(0,0,0,.8)"]}
            locations={[0, 0.34, 1]}
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
              bottom: 26,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                borderWidth: 1,
                borderColor: whiteAlpha(0.5),
                borderRadius: radius.pill,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <T v="labelSmall" c={color.white}>
                {t("wedNoFee")}
              </T>
            </View>
            <T
              v="display"
              c={color.white}
              style={{ marginTop: 14, fontSize: 40 }}
            >
              {t("wedTitle")}
            </T>
            <T v="small" c={whiteAlpha(0.72)} style={{ marginTop: 11 }}>
              {t("wedSub")}
            </T>
          </View>
        </View>

        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <T
            v="small"
            c={inkAlpha(0.66)}
            style={{ fontSize: 13.5, lineHeight: 22 }}
          >
            {t("wedBody")}
          </T>
          <View style={{ marginTop: 22 }}>
            {points.map((p) => (
              <View
                key={p[0]}
                style={{
                  flexDirection: "row",
                  gap: 15,
                  alignItems: "baseline",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: inkAlpha(0.09),
                }}
              >
                <T
                  v="heading"
                  c={color.accent}
                  style={{ width: 26, fontSize: 22 }}
                >
                  {p[0]}
                </T>
                <T v="body" style={{ flex: 1, fontSize: 14.5 }}>
                  {p[1]}
                </T>
              </View>
            ))}
          </View>
        </View>

        {/* Galería */}
        <T
          v="label"
          c={inkAlpha(0.45)}
          style={{ marginTop: 24, paddingHorizontal: space.gutter }}
        >
          {t("wedGalleryTitle")}
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 11,
            paddingHorizontal: space.gutter,
            paddingTop: 14,
          }}
        >
          {GALLERY.map((k) => (
            <Image
              key={k}
              source={{ uri: IMG[k] }}
              style={{
                width: 172,
                height: 230,
                borderRadius: radius.tile,
                backgroundColor: color.stone,
              }}
              contentFit="cover"
              accessibilityLabel={t("wedGalleryTitle")}
            />
          ))}
        </ScrollView>

        {/* Testimonial */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("wedTestiTitle")}
          </T>
          <T
            v="subheading"
            style={{ marginTop: space.m, fontSize: 19, lineHeight: 26 }}
          >
            {`${QUOTE_L}${testi[0]}${QUOTE_R}`}
          </T>
          <T v="small" c={inkAlpha(0.5)} style={{ marginTop: 8 }}>
            {`— ${testi[1]}`}
          </T>
        </View>

        {/* Solicitud */}
        <View
          style={{
            marginTop: 26,
            marginHorizontal: space.gutter,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: inkAlpha(0.09),
            borderRadius: radius.card,
            padding: space.xl,
            gap: space.s,
          }}
        >
          <T v="heading">{t("wedCta")}</T>
          <T v="caption" c={inkAlpha(0.5)} style={{ marginBottom: space.s }}>
            {t("wedCtaSub")}
          </T>
          <Field
            value={fecha}
            onChange={setFecha}
            placeholder={t("wedDate")}
          />
          <Field
            value={invitados}
            onChange={setInvitados}
            placeholder={t("wedGuests")}
          />
          <Field value={tipo} onChange={setTipo} placeholder={t("wedType")} />
          <View style={{ marginTop: space.s }}>
            <Button
              label={t("wedSend")}
              onPress={send}
              variant="dark"
              disabled={!fecha.trim()}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
