/**
 * Experiencias — pantalla 12 del prototipo.
 * Las nueve del sitio, expandibles, cada una con su salida (casi
 * todas abren el concierge con contexto; el cenote va incluido).
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { lx, useExperiences } from "../../../packages/lib/content";
import { SCREEN_ROUTES } from "../../../packages/lib/routes";
import { useUiStore } from "../../../packages/lib/uiStore";
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

export default function Experiences() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const [open, setOpen] = useState<string | null>(null);
  const experiences = useExperiences();

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        <View style={{ height: 300 }}>
          <Image
            source={{ uri: IMG.aerial3 }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.44)", "rgba(0,0,0,0)", "rgba(0,0,0,.78)"]}
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
              {t("expTitle")}
            </T>
            <T v="small" c={whiteAlpha(0.74)} style={{ marginTop: 11 }}>
              {t("expSub")}
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
          {t("expBody")}
        </T>

        <ListState
          loading={experiences.isPending}
          error={experiences.isError}
          empty={
            !experiences.isPending && (experiences.data?.length ?? 0) === 0
          }
          emptyText={t("listEmpty")}
          errorText={t("listError")}
          retryLabel={t("retry")}
          onRetry={() => void experiences.refetch()}
        />

        <View
          style={{ paddingHorizontal: space.gutter, paddingTop: space.xl, gap: 12 }}
        >
          {(experiences.data ?? []).map((e) => {
            const expanded = open === e.id;
            const incluida = e.destino === "cenote";
            return (
              <View
                key={e.id}
                style={{
                  backgroundColor: color.white,
                  borderWidth: 1,
                  borderColor: inkAlpha(0.09),
                  borderRadius: radius.card,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => setOpen(expanded ? null : e.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={lx(e.nombre)}
                  style={{ flexDirection: "row", minHeight: 96 }}
                >
                  <Image
                    source={{ uri: IMG[e.image] }}
                    style={{ width: 112 }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, padding: 15 }}>
                    <T v="subheading" style={{ fontSize: 18 }}>
                      {lx(e.nombre)}
                    </T>
                    {expanded ? (
                      <T
                        v="small"
                        c={inkAlpha(0.58)}
                        style={{ marginTop: 7, fontSize: 12.5 }}
                      >
                        {lx(e.descripcion)}
                      </T>
                    ) : null}
                  </View>
                </Pressable>
                {expanded ? (
                  <Pressable
                    onPress={() => router.push(SCREEN_ROUTES[e.destino])}
                    accessibilityRole="button"
                    accessibilityLabel={
                      incluida ? t("expIncluded") : t("expAsk")
                    }
                    style={{
                      marginHorizontal: 15,
                      marginBottom: 15,
                      alignSelf: "flex-start",
                      backgroundColor: incluida ? inkAlpha(0.06) : color.ink,
                      borderRadius: radius.pill,
                      paddingVertical: 11,
                      paddingHorizontal: 18,
                      minHeight: hit.minHeight - 6,
                      justifyContent: "center",
                    }}
                  >
                    <T
                      v="bodyMedium"
                      c={incluida ? color.ink : color.white}
                      style={{ fontSize: 12.5 }}
                    >
                      {incluida ? t("expIncluded") : t("expAsk")}
                    </T>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
