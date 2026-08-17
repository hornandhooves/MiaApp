/**
 * Confirmación — pantalla 20 del prototipo.
 * Fondo tinta, palomita en acento, título serif, filas clave-valor,
 * y las salidas "Volver a mi día" / "Preguntar". Con QR cuando la
 * variante lo lleva (day pass).
 */
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import {
  CONFIRM_KEYS,
  useConfirmStore,
} from "../../packages/lib/confirmStore";
import { Button } from "../../packages/ui/Button";
import { T } from "../../packages/ui/T";
import {
  color,
  hit,
  radius,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

const CHECK = "✓";

export default function Confirm() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const kind = useConfirmStore((s) => s.kind);
  const rows = useConfirmStore((s) => s.rows);
  const qr = useConfirmStore((s) => s.qr);
  const note = useConfirmStore((s) => s.note);

  const keys = CONFIRM_KEYS[kind];

  return (
    <View style={{ flex: 1, backgroundColor: color.ink }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.xxxl,
          paddingHorizontal: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            borderWidth: 1.5,
            borderColor: color.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T v="body" c={color.accent} style={{ fontSize: 26, lineHeight: 30 }}>
            {CHECK}
          </T>
        </View>
        <T v="display" c={color.white} style={{ marginTop: 26, fontSize: 36 }}>
          {t(keys.title)}
        </T>
        <T
          v="body"
          c={whiteAlpha(0.6)}
          style={{ marginTop: 14, lineHeight: 22 }}
        >
          {t(keys.body)}
        </T>

        {qr ? (
          <View
            style={{
              marginTop: 26,
              alignSelf: "flex-start",
              backgroundColor: color.white,
              borderRadius: radius.cardSmall,
              padding: space.l,
              alignItems: "center",
              gap: space.m,
            }}
          >
            <QRCode value={qr} size={148} color={color.ink} />
            <T v="caption" c={color.ink}>
              {t("passQrHint")}
            </T>
          </View>
        ) : null}

        <View
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTopWidth: 1,
            borderTopColor: whiteAlpha(0.13),
            gap: 14,
          }}
        >
          {rows.map((r) => (
            <View
              key={r.k}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <T v="labelSmall" c={whiteAlpha(0.4)}>
                {r.k}
              </T>
              <T
                v="body"
                c={color.white}
                style={{ fontSize: 15, textAlign: "right", flex: 1 }}
              >
                {r.v}
              </T>
            </View>
          ))}
          {note ? (
            <T v="caption" c={whiteAlpha(0.45)}>
              {note}
            </T>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 32 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("backToDay")}
              onPress={() => router.dismissTo("/")}
              variant="solid"
            />
          </View>
          <View style={{ minWidth: hit.minWidth }}>
            <Button
              label={t("ask")}
              onPress={() => router.push("/chat")}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
