/**
 * Iniciar sesión — pantalla 01 del prototipo.
 * Foto completa con gradiente, logo, título serif, tres botones,
 * divisor "o", y la salida a continuar sin cuenta.
 * El login nunca es un muro: todo lo de abajo funciona sin cuenta.
 */
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useSession } from "../../packages/lib/session";
import { IMG } from "../../packages/ui/images";
import { T } from "../../packages/ui/T";
import { Button } from "../../packages/ui/Button";
import {
  color,
  heroGradient,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

export default function Login() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signInWithApple = useSession((s) => s.signInWithApple);
  const [busy, setBusy] = useState(false);

  const btnLabels = t("loginBtns", { returnObjects: true }) as string[];

  const onApple = async () => {
    setBusy(true);
    try {
      await signInWithApple();
      router.replace("/");
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(t("errAuth"));
      }
    } finally {
      setBusy(false);
    }
  };

  // Decisión registrada: el prototipo no diseña formularios de Google
  // ni de correo; en el demo se avisa en vez de aproximar en silencio.
  const onUnavailable = () => Alert.alert(t("demoOnlyApple"));

  return (
    <View style={{ flex: 1, backgroundColor: color.photo }}>
      <Image
        source={{ uri: IMG.aerial }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={[...heroGradient]}
        locations={[0, 0.34, 0.78, 1]}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space.s,
          paddingHorizontal: space.xxxl,
          paddingBottom: insets.bottom + space.screenBottom,
        }}
      >
        <Image
          source={{ uri: IMG.logo }}
          style={{ height: 64, width: 150, marginTop: space.l, marginLeft: -6 }}
          contentFit="contain"
          contentPosition="left center"
          accessibilityLabel={t("sheetTitle")}
        />
        <View style={{ flex: 1 }} />
        <T v="display" c={color.white}>
          {t("loginTitle")}
        </T>
        <T
          v="body"
          c={whiteAlpha(0.66)}
          style={{ marginTop: space.m + 1 }}
        >
          {t("loginSub")}
        </T>
        <View style={{ gap: 9, marginTop: space.xxl + 2 }}>
          <Button
            label={btnLabels[0] ?? ""}
            onPress={() => void onApple()}
            variant="solid"
            busy={busy}
          />
          <Button
            label={btnLabels[1] ?? ""}
            onPress={onUnavailable}
            variant="outline"
          />
          <Button
            label={btnLabels[2] ?? ""}
            onPress={onUnavailable}
            variant="outline"
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.m,
            marginTop: space.xl + 2,
          }}
        >
          <View
            style={{ flex: 1, height: 1, backgroundColor: whiteAlpha(0.18) }}
          />
          <T v="labelSmall" c={whiteAlpha(0.42)}>
            {t("loginOr")}
          </T>
          <View
            style={{ flex: 1, height: 1, backgroundColor: whiteAlpha(0.18) }}
          />
        </View>
        <Pressable
          onPress={() => router.push("/guest")}
          accessibilityRole="link"
          accessibilityLabel={t("loginGuest")}
          style={{ marginTop: space.xl, minHeight: 44 }}
        >
          <T
            v="body"
            c={color.white}
            style={{
              fontSize: 15,
              textDecorationLine: "underline",
            }}
          >
            {t("loginGuest")}
          </T>
          <T v="small" c={whiteAlpha(0.5)} style={{ marginTop: 9 }}>
            {t("loginGuestSub")}
          </T>
        </Pressable>
        <T
          v="caption"
          c={whiteAlpha(0.42)}
          style={{ marginTop: space.xl }}
        >
          {t("loginTerms")}
        </T>
      </View>
    </View>
  );
}
