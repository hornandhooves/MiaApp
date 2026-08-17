/**
 * Home — pantalla 03 del prototipo.
 * Héroe por modo, chips que reconfiguran la pantalla, banner según
 * sesión, línea de tiempo del día (lo pasado se atenúa, lo próximo se
 * expande) y tarjetas discover por modo.
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  lx,
  useDayEvents,
  useDiscover,
} from "../../../packages/lib/content";
import { SCREEN_ROUTES } from "../../../packages/lib/routes";
import { useSession } from "../../../packages/lib/session";
import {
  hhmmToMinutes,
  minutesNowInTulum,
  stayDay,
  todayLabel,
} from "../../../packages/lib/tulum";
import { useUiStore } from "../../../packages/lib/uiStore";
import { CircleButton, GLYPH } from "../../../packages/ui/CircleButton";
import { IMG } from "../../../packages/ui/images";
import { ListState } from "../../../packages/ui/ListState";
import { SheetButton } from "../../../packages/ui/SheetButton";
import { T } from "../../../packages/ui/T";
import {
  canvasAlpha,
  color,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../../packages/ui/tokens";

const HERO_BY_MODE = ["aerial", "loungers", "cenote"] as const;

function spotLabel(
  spotId: string,
  bedWord: string,
  tableWord: string,
): string {
  const [kind, num] = spotId.split("-");
  const word = kind === "table" ? tableWord : bedWord;
  return `${word.toLowerCase()} ${num ?? ""}`.trim();
}

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const status = useSession((s) => s.status);
  const spotId = useSession((s) => s.spotId);
  const roomId = useSession((s) => s.roomId);
  const estancia = useSession((s) => s.estancia);

  // El modo inicial se deduce del tipo de sesión (MIA-111)
  const initialMode = spotId ? 1 : roomId ? 0 : status === "member" ? 0 : 2;
  const [mode, setMode] = useState(initialMode);

  const events = useDayEvents();
  const discover = useDiscover();

  const nowMin = minutesNowInTulum();
  const defaultOpen = useMemo(() => {
    const list = events.data ?? [];
    const idx = list.findIndex((e) => hhmmToMinutes(e.hora) >= nowMin);
    return idx === -1 ? list.length - 1 : idx;
  }, [events.data, nowMin]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const expanded = openIdx ?? defaultOpen;

  const modes = t("modes", { returnObjects: true }) as string[];
  const heroTitles = t("heroTitle", { returnObjects: true }) as string[];
  const discoverTitles = t("discoverTitle", {
    returnObjects: true,
  }) as string[];

  const stay = estancia ? stayDay(estancia.desde, estancia.hasta) : null;
  const dayOf = stay ? t("dayOfTpl", { d: stay.day, n: stay.total }) : null;

  const showBanner = status === "guest" || status === "member";
  const isGuestBanner = status === "guest";
  const bannerTitle = isGuestBanner
    ? spotId
      ? t("guestBannerTitleTpl", {
          spot: spotLabel(spotId, t("bedPick"), t("tablePick")),
        })
      : t("guestBannerTitle")
    : t("memberBannerTitle");

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {/* Héroe */}
        <View style={{ height: 380 }}>
          <Image
            source={{ uri: IMG[HERO_BY_MODE[mode] ?? "aerial"] }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
            transition={250}
          />
          <LinearGradient
            colors={[
              "rgba(0,0,0,.5)",
              "rgba(0,0,0,0)",
              "rgba(0,0,0,.08)",
              "rgba(0,0,0,.76)",
            ]}
            locations={[0, 0.36, 0.54, 1]}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
          <View
            style={{
              marginTop: insets.top + space.xs,
              paddingHorizontal: space.gutter,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SheetButton label={t("menuLabel")} onPress={openSheet} onDark />
            <Image
              source={{ uri: IMG.logo }}
              style={{ height: 46, width: 110 }}
              contentFit="contain"
              accessibilityLabel={t("sheetTitle")}
            />
            <CircleButton
              glyph={GLYPH.chat}
              label={t("concierge")}
              onPress={() => router.push(SCREEN_ROUTES.chat)}
              onDark
            />
          </View>
          <View
            style={{
              position: "absolute",
              left: space.gutter,
              right: space.gutter,
              bottom: space.gutter,
            }}
          >
            <T
              v="label"
              c={whiteAlpha(0.82)}
              style={{ letterSpacing: 2.6 }}
            >
              {t("eyebrow")}
            </T>
            <T v="display" c={color.white} style={{ marginTop: space.m }}>
              {heroTitles[mode] ?? ""}
            </T>
          </View>
        </View>

        {/* Chips de modo — sticky */}
        <View
          style={{
            backgroundColor: canvasAlpha(0.96),
            borderBottomWidth: 1,
            borderBottomColor: inkAlpha(0.07),
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: space.s,
              paddingHorizontal: space.gutter,
              paddingVertical: 14,
            }}
          >
            {modes.map((label, i) => {
              const active = i === mode;
              return (
                <Pressable
                  key={label}
                  onPress={() => setMode(i)}
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
                    paddingHorizontal: 17,
                  }}
                >
                  <T
                    v="body"
                    c={active ? color.white : inkAlpha(0.7)}
                    style={{ fontSize: 13, lineHeight: 15 }}
                  >
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Banner de sesión */}
        {showBanner ? (
          <Pressable
            onPress={() => router.push(SCREEN_ROUTES.circulo)}
            accessibilityRole="button"
            accessibilityLabel={bannerTitle}
            style={{
              marginTop: 18,
              marginHorizontal: space.gutter,
              backgroundColor: isGuestBanner
                ? color.ink
                : whiteAlpha(0.62),
              borderRadius: radius.cardSmall,
              padding: 15,
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
            }}
          >
            <View style={{ flex: 1 }}>
              <T
                v="body"
                c={isGuestBanner ? color.white : color.ink}
                style={{ fontSize: 14, lineHeight: 17 }}
              >
                {bannerTitle}
              </T>
              <T
                v="caption"
                c={isGuestBanner ? whiteAlpha(0.6) : inkAlpha(0.55)}
                style={{ marginTop: 5 }}
              >
                {isGuestBanner ? t("guestBannerSub") : t("memberBannerSub")}
              </T>
            </View>
            <View
              style={{
                backgroundColor: isGuestBanner ? color.accent : color.ink,
                borderRadius: radius.pill,
                paddingVertical: 9,
                paddingHorizontal: 14,
              }}
            >
              <T
                v="bodyMedium"
                c={color.white}
                style={{ fontSize: 11.5, lineHeight: 13 }}
              >
                {isGuestBanner ? t("joinCta") : t("cirPoints")}
              </T>
            </View>
          </Pressable>
        ) : null}

        {/* Tu día */}
        <View
          style={{
            marginTop: 22,
            paddingHorizontal: space.gutter,
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <T v="title">{t("yourDay")}</T>
          <T v="caption" c={inkAlpha(0.5)}>
            {dayOf ? `${todayLabel()} · ${dayOf}` : todayLabel()}
          </T>
        </View>

        <View style={{ paddingHorizontal: space.gutter, paddingTop: 18 }}>
          <ListState
            loading={events.isPending}
            error={events.isError}
            empty={!events.isPending && (events.data?.length ?? 0) === 0}
            emptyText={t("listEmpty")}
            errorText={t("listError")}
            retryLabel={t("retry")}
            onRetry={() => void events.refetch()}
          />
          {(events.data ?? []).map((ev, i) => {
            const past = hhmmToMinutes(ev.hora) < nowMin;
            const open = i === expanded;
            return (
              <View key={ev.id} style={{ flexDirection: "row", gap: 14 }}>
                <T
                  v="bodyMedium"
                  c={past ? inkAlpha(0.3) : inkAlpha(0.62)}
                  style={{
                    width: 48,
                    textAlign: "right",
                    paddingTop: 3,
                    fontSize: 12.5,
                  }}
                >
                  {ev.hora}
                </T>
                <View style={{ width: 13, alignItems: "center" }}>
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      marginTop: 4,
                      backgroundColor: open
                        ? color.accent
                        : past
                          ? inkAlpha(0.2)
                          : color.ink,
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      width: 1,
                      backgroundColor: inkAlpha(0.13),
                    }}
                  />
                </View>
                <View style={{ flex: 1, paddingBottom: space.xl }}>
                  <View
                    style={{
                      backgroundColor: open
                        ? color.white
                        : past
                          ? inkAlpha(0)
                          : whiteAlpha(0.6),
                      borderWidth: 1,
                      borderColor: open ? inkAlpha(0.1) : inkAlpha(0.08),
                      borderRadius: radius.cardSmall,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      onPress={() => setOpenIdx(open ? -1 : i)}
                      accessibilityRole="button"
                      accessibilityLabel={lx(ev.titulo)}
                      style={{
                        padding: 14,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <T
                          v="subheading"
                          c={past ? inkAlpha(0.42) : color.ink}
                        >
                          {lx(ev.titulo)}
                        </T>
                        <T
                          v="small"
                          c={past ? inkAlpha(0.32) : inkAlpha(0.5)}
                          style={{ marginTop: 5 }}
                        >
                          {lx(ev.lugar)}
                        </T>
                      </View>
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: open
                            ? color.accent
                            : inkAlpha(0.07),
                          borderRadius: radius.pill,
                          paddingVertical: 5,
                          paddingHorizontal: 9,
                        }}
                      >
                        <T
                          v="labelSmall"
                          c={open ? color.white : inkAlpha(0.5)}
                        >
                          {lx(ev.tag)}
                        </T>
                      </View>
                    </Pressable>
                    {open ? (
                      <View>
                        <Image
                          source={{ uri: IMG[ev.image] }}
                          style={{ width: "100%", height: 128 }}
                          contentFit="cover"
                        />
                        <View style={{ padding: 14 }}>
                          <T
                            v="small"
                            c={inkAlpha(0.68)}
                            style={{ fontSize: 13, lineHeight: 19 }}
                          >
                            {lx(ev.cuerpo)}
                          </T>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 9,
                              marginTop: 14,
                            }}
                          >
                            <Pressable
                              onPress={() =>
                                router.push(SCREEN_ROUTES[ev.destino])
                              }
                              accessibilityRole="button"
                              accessibilityLabel={lx(ev.cta)}
                              style={{
                                backgroundColor: color.ink,
                                borderRadius: radius.pill,
                                paddingVertical: 11,
                                paddingHorizontal: 19,
                                minHeight: hit.minHeight - 4,
                                justifyContent: "center",
                              }}
                            >
                              <T
                                v="bodyMedium"
                                c={color.white}
                                style={{ fontSize: 12.5 }}
                              >
                                {lx(ev.cta)}
                              </T>
                            </Pressable>
                            <View
                              style={{
                                borderWidth: 1,
                                borderColor: inkAlpha(0.2),
                                borderRadius: radius.pill,
                                paddingVertical: 11,
                                paddingHorizontal: 17,
                                justifyContent: "center",
                              }}
                            >
                              <T v="body" style={{ fontSize: 12.5 }}>
                                {t("remind")}
                              </T>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Discover */}
        <T
          v="title"
          style={{ paddingHorizontal: space.gutter, paddingTop: 6 }}
        >
          {discoverTitles[mode] ?? ""}
        </T>
        <ListState
          loading={discover.isPending}
          error={discover.isError}
          empty={!discover.isPending && (discover.data?.length ?? 0) === 0}
          emptyText={t("listEmpty")}
          errorText={t("listError")}
          retryLabel={t("retry")}
          onRetry={() => void discover.refetch()}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 13,
            paddingHorizontal: space.gutter,
            paddingTop: space.l,
          }}
        >
          {(discover.data?.[mode] ?? []).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(SCREEN_ROUTES[c.destino])}
              accessibilityRole="button"
              accessibilityLabel={lx(c.titulo)}
              style={{
                width: 206,
                height: 258,
                borderRadius: radius.cardSmall,
                overflow: "hidden",
                backgroundColor: color.stone,
              }}
            >
              <Image
                source={{ uri: IMG[c.image] }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,.7)"]}
                locations={[0.45, 1]}
                style={{ position: "absolute", width: "100%", height: "100%" }}
              />
              <View
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  backgroundColor: whiteAlpha(0.94),
                  borderRadius: radius.pill,
                  paddingVertical: 5,
                  paddingHorizontal: 11,
                }}
              >
                <T v="bodyMedium" style={{ fontSize: 11, lineHeight: 13 }}>
                  {lx(c.chip)}
                </T>
              </View>
              <View
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 14,
                }}
              >
                <T v="subheading" c={color.white} style={{ fontSize: 19 }}>
                  {lx(c.titulo)}
                </T>
                <T
                  v="small"
                  c={whiteAlpha(0.82)}
                  style={{ marginTop: 5, fontSize: 12 }}
                >
                  {lx(c.meta)}
                </T>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}
