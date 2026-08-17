/**
 * Diario — pantalla 19 del prototipo.
 * Nota honesta: el blog del sitio no tiene posts aún; estos son
 * placeholders del tipo de piezas que correrían aquí.
 */
import { Image } from "expo-image";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { lx, useJournal } from "../../../packages/lib/content";
import { useUiStore } from "../../../packages/lib/uiStore";
import { IMG } from "../../../packages/ui/images";
import { ListState } from "../../../packages/ui/ListState";
import { SheetButton } from "../../../packages/ui/SheetButton";
import { T } from "../../../packages/ui/T";
import { color, inkAlpha, radius, space } from "../../../packages/ui/tokens";

export default function Blog() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const journal = useJournal();

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + space.xs,
          paddingBottom: 132,
          paddingHorizontal: space.gutter,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <SheetButton label={t("menuLabel")} onPress={openSheet} />
          <T v="title">{t("blogTitle")}</T>
        </View>
        <T
          v="small"
          c={inkAlpha(0.6)}
          style={{ marginTop: 14, fontSize: 13.5 }}
        >
          {t("blogSub")}
        </T>
        <View
          style={{
            marginTop: 14,
            padding: 12,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: inkAlpha(0.22),
            borderRadius: radius.control,
          }}
        >
          <T v="caption" c={inkAlpha(0.5)}>
            {t("blogNote")}
          </T>
        </View>

        <ListState
          loading={journal.isPending}
          error={journal.isError}
          empty={!journal.isPending && (journal.data?.length ?? 0) === 0}
          emptyText={t("listEmpty")}
          errorText={t("listError")}
          retryLabel={t("retry")}
          onRetry={() => void journal.refetch()}
        />

        <View style={{ paddingTop: 18, gap: space.l }}>
          {(journal.data ?? []).map((post) => (
            <View key={post.id}>
              <Image
                source={{ uri: IMG[post.image] }}
                style={{
                  width: "100%",
                  height: 172,
                  borderRadius: radius.cardSmall,
                  backgroundColor: color.stone,
                }}
                contentFit="cover"
                accessibilityLabel={lx(post.titulo)}
              />
              <T v="heading" style={{ marginTop: 13, fontSize: 21 }}>
                {lx(post.titulo)}
              </T>
              <T v="small" c={inkAlpha(0.55)} style={{ marginTop: 7 }}>
                {lx(post.sub)}
              </T>
              <View
                style={{
                  marginTop: 10,
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <T
                  v="label"
                  c={color.accent}
                  style={{ fontSize: 10, letterSpacing: 1.4 }}
                >
                  {t("blogRead")}
                </T>
                <T
                  v="label"
                  c={inkAlpha(0.35)}
                  style={{ fontSize: 10, letterSpacing: 1.4 }}
                >
                  {`${post.minutos} min`}
                </T>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
