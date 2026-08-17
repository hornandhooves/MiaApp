/**
 * Acceso sin cuenta — pantalla 02 del prototipo.
 * Tres rutas de entrada: escanear el código del lugar, habitación y
 * apellido, y código de reserva. Más la caja de límites del invitado
 * renderizada desde la misma lista del prototipo.
 *
 * Decisiones fuera del prototipo (registradas): los formularios de
 * habitación/apellido son diseño mínimo propio (el prototipo no los
 * define); el código de reserva se activa con las reservas (semana 6).
 */
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Modal, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { parseSpotLink } from "../../packages/lib/spotLink";
import { useSession } from "../../packages/lib/session";
import { Button } from "../../packages/ui/Button";
import { CircleButton, GLYPH } from "../../packages/ui/CircleButton";
import { Screen } from "../../packages/ui/Screen";
import { T } from "../../packages/ui/T";
import {
  color,
  font,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

type PathMode = "scan" | "stay" | "code";

interface GuestPath {
  0: string; // icon
  1: string; // title
  2: string; // sub
  3: string; // cta
}

function Field({
  value,
  onChange,
  placeholder,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={inkAlpha(0.35)}
      autoFocus={autoFocus}
      autoCapitalize="none"
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

export default function GuestAccess() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bindSpot = useSession((s) => s.bindSpot);
  const findStay = useSession((s) => s.findStay);

  const [mode, setMode] = useState<PathMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [habitacion, setHabitacion] = useState("");
  const [apellido, setApellido] = useState("");
  const scanned = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();

  const paths = t("guestPaths", { returnObjects: true }) as GuestPath[];
  const limits = t("guestLimits", { returnObjects: true }) as [
    string,
    number,
  ][];

  const openPath = async (i: number) => {
    setErr(null);
    if (i === 0) {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert(t("scanPermTitle"), t("scanPermBody"));
          return;
        }
      }
      scanned.current = false;
      setMode("scan");
    } else if (i === 1) {
      setMode(mode === "stay" ? null : "stay");
    } else {
      // Código de reserva: llega con las reservas de la semana 6
      Alert.alert(t("demoOnlyApple"));
    }
  };

  const onScanned = async (data: string) => {
    if (scanned.current) return;
    const link = parseSpotLink(data);
    if (!link) return; // QR ajeno: seguir escaneando
    scanned.current = true;
    setBusy(true);
    try {
      await bindSpot(link.spotId, link.token);
      setMode(null);
      router.replace("/");
    } catch (e) {
      const msg = (e as Error).message ?? "";
      setMode(null);
      Alert.alert(
        msg.includes("qr-vencido")
          ? t("errQrExpired")
          : msg.includes("qr-invalido")
            ? t("errQrInvalid")
            : t("errAuth"),
      );
      scanned.current = false;
    } finally {
      setBusy(false);
    }
  };

  const onFindStay = async () => {
    setBusy(true);
    setErr(null);
    try {
      const ok = await findStay(habitacion, apellido);
      if (ok) {
        router.replace("/");
      } else {
        setErr(t("errStayNotFound"));
      }
    } catch (e) {
      setErr(
        (e as Error).message === "bloqueado" ? t("errBlocked") : t("errAuth"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen tabbed={false} padded={false}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.m,
          paddingHorizontal: space.gutter,
          marginTop: space.xs,
        }}
      >
        <CircleButton
          glyph={GLYPH.back}
          label={t("back")}
          onPress={() => router.back()}
        />
        <T v="title" style={{ flex: 1 }}>
          {t("guestTitle")}
        </T>
      </View>
      <T
        v="small"
        c={inkAlpha(0.6)}
        style={{
          marginTop: space.m,
          paddingHorizontal: space.gutter,
          fontSize: 13.5,
          lineHeight: 20,
        }}
      >
        {t("guestSub")}
      </T>

      <View
        style={{ paddingHorizontal: space.gutter, marginTop: space.xl, gap: 11 }}
      >
        {paths.map((p, i) => (
          <View key={p[1]}>
            <Pressable
              onPress={() => void openPath(i)}
              accessibilityRole="button"
              accessibilityLabel={p[1]}
              style={{
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: inkAlpha(0.09),
                borderRadius: radius.card,
                padding: 17,
                flexDirection: "row",
                gap: 15,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: inkAlpha(0.05),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T v="body" c={color.accent} style={{ fontSize: 17 }}>
                  {p[0]}
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T v="subheading" style={{ fontSize: 17 }}>
                  {p[1]}
                </T>
                <T
                  v="small"
                  c={inkAlpha(0.55)}
                  style={{ marginTop: 6 }}
                >
                  {p[2]}
                </T>
                <View
                  style={{
                    marginTop: 11,
                    alignSelf: "flex-start",
                    borderWidth: 1,
                    borderColor: inkAlpha(0.2),
                    borderRadius: radius.pill,
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                  }}
                >
                  <T v="bodyMedium" style={{ fontSize: 12, lineHeight: 14 }}>
                    {p[3]}
                  </T>
                </View>
              </View>
            </Pressable>

            {i === 1 && mode === "stay" ? (
              <View
                style={{
                  marginTop: space.s,
                  gap: space.s,
                  backgroundColor: color.white,
                  borderWidth: 1,
                  borderColor: inkAlpha(0.09),
                  borderRadius: radius.cardSmall,
                  padding: space.l,
                }}
              >
                <Field
                  value={habitacion}
                  onChange={setHabitacion}
                  placeholder={t("formRoom")}
                  autoFocus
                />
                <Field
                  value={apellido}
                  onChange={setApellido}
                  placeholder={t("formLastName")}
                />
                {err ? (
                  <T v="small" c={color.accent}>
                    {err}
                  </T>
                ) : null}
                <Button
                  label={p[3]}
                  onPress={() => void onFindStay()}
                  variant="dark"
                  busy={busy}
                  disabled={!habitacion.trim() || !apellido.trim()}
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View
        style={{
          marginHorizontal: space.gutter,
          marginTop: space.xxl + 2,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: inkAlpha(0.2),
          borderRadius: radius.cardSmall,
          padding: 18,
        }}
      >
        <T v="label" c={inkAlpha(0.45)}>
          {t("guestLimitsTitle")}
        </T>
        <View style={{ marginTop: 13, gap: space.s }}>
          {limits.map(([label, allowed]) => (
            <View
              key={label}
              style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}
            >
              <View
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 8,
                  marginTop: 1,
                  backgroundColor:
                    allowed === 1 ? color.accent : inkAlpha(0.12),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T
                  v="caption"
                  c={color.white}
                  style={{ fontSize: 8.5, lineHeight: 10 }}
                >
                  {allowed === 1 ? "✓" : "✕"}
                </T>
              </View>
              <T
                v="small"
                c={allowed === 1 ? inkAlpha(0.8) : inkAlpha(0.4)}
                style={{ flex: 1 }}
              >
                {label}
              </T>
            </View>
          ))}
        </View>
        <View
          style={{
            marginTop: 15,
            paddingTop: 13,
            borderTopWidth: 1,
            borderTopColor: inkAlpha(0.1),
          }}
        >
          <T v="caption" c={inkAlpha(0.5)}>
            {t("guestFooter")}
          </T>
        </View>
      </View>

      <Modal visible={mode === "scan"} animationType="fade">
        <View style={{ flex: 1, backgroundColor: color.ink }}>
          {mode === "scan" ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => void onScanned(data)}
            />
          ) : null}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: insets.bottom + space.xxxl,
              alignItems: "center",
              gap: space.l,
              paddingHorizontal: space.gutter,
            }}
          >
            <T v="body" c={whiteAlpha(0.85)} center>
              {t("guestScanning")}
            </T>
            <Button
              label={t("scanCancel")}
              onPress={() => setMode(null)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
