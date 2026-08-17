/**
 * Destino del universal link / QR: mia://spot/bed-14?t=<token>.
 * No es una pantalla del prototipo: es el manejador del deep link.
 * Valida el token contra validarQR y aterriza en Home ya ligado.
 */
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSession } from "../../../packages/lib/session";
import { T } from "../../../packages/ui/T";
import { color, inkAlpha, space } from "../../../packages/ui/tokens";

export default function SpotLinkHandler() {
  const { t } = useTranslation();
  const router = useRouter();
  const { spotId, t: token } = useLocalSearchParams<{
    spotId: string;
    t?: string;
  }>();
  const bindSpot = useSession((s) => s.bindSpot);
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current || !spotId || !token) return;
    started.current = true;
    bindSpot(spotId, token)
      .then(() => router.replace("/"))
      .catch((e: Error) => {
        Alert.alert(
          e.message.includes("qr-vencido")
            ? t("errQrExpired")
            : e.message.includes("qr-invalido")
              ? t("errQrInvalid")
              : t("errAuth"),
        );
        setFailed(true);
      });
  }, [spotId, token, bindSpot, router, t]);

  if (!spotId || !token || failed) {
    return <Redirect href="/guest" />;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.canvas,
        alignItems: "center",
        justifyContent: "center",
        gap: space.l,
      }}
    >
      <ActivityIndicator color={color.ink} />
      <T v="small" c={inkAlpha(0.5)}>
        {t("loading")}
      </T>
    </View>
  );
}
