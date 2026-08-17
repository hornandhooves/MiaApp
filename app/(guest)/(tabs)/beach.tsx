/**
 * Beach Club — pantalla 04 del prototipo.
 * Héroe con la insignia de abierto, tres pestañas (Cocina, Admisión,
 * Camastros) sobre barra oscura sticky, y el CTA permanente al menú.
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Crypto from "expo-crypto";
import { getPorts } from "../../../packages/domain/di";
import { lx, useAdmissions, useKitchen } from "../../../packages/lib/content";
import { useConfirmStore } from "../../../packages/lib/confirmStore";
import { useSession } from "../../../packages/lib/session";
import { SCREEN_ROUTES } from "../../../packages/lib/routes";
import {
  hoyISOTulum,
  moneyMxn,
  todayLabel,
} from "../../../packages/lib/tulum";
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

const GLYPH_DINE = "◑"; // ◑
const GLYPH_CHEV = "›"; // ›

function DineCta({ dark = true }: { dark?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(SCREEN_ROUTES.dine)}
      accessibilityRole="button"
      accessibilityLabel={t("dineTitle")}
      style={{
        marginTop: space.l,
        marginHorizontal: space.gutter,
        backgroundColor: dark ? color.ink : inkAlpha(0),
        borderWidth: dark ? 0 : 1,
        borderColor: whiteAlpha(0.16),
        borderRadius: radius.cardSmall,
        padding: space.l,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        minHeight: hit.minHeight,
      }}
    >
      <T v="body" c={color.accent} style={{ fontSize: 18 }}>
        {GLYPH_DINE}
      </T>
      <View style={{ flex: 1 }}>
        <T v="body" c={color.white} style={{ fontSize: 14.5 }}>
          {t("dineTitle")}
        </T>
        <T v="caption" c={whiteAlpha(0.45)} style={{ marginTop: 4 }}>
          {t("orderFromHere")}
        </T>
      </View>
      <T v="body" c={whiteAlpha(0.3)} style={{ fontSize: 18 }}>
        {GLYPH_CHEV}
      </T>
    </Pressable>
  );
}

export default function Beach() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const [tab, setTab] = useState(0);
  const [admission, setAdmission] = useState(1);
  const [buying, setBuying] = useState(false);
  const uid = useSession((s) => s.uid);
  const setConfirm = useConfirmStore((s) => s.setConfirm);

  const kitchen = useKitchen();
  const admissions = useAdmissions();

  const tabs = t("bcTabs", { returnObjects: true }) as string[];
  const included = t("bcIncluded", { returnObjects: true }) as string[];
  const selected = admissions.data?.[admission];

  const buyPass = async () => {
    if (!selected || !uid) return;
    setBuying(true);
    try {
      const idempotencyKey = Crypto.randomUUID();
      const personas = 2; // el prototipo confirma 2 personas
      const monto = selected.precioMxnCents * personas;
      const pago = await getPorts().payment.pagar({
        montoCents: monto,
        currency: "mxn",
        concepto: lx(selected.nombre),
        idempotencyKey,
        uid,
      });
      const pass = await getPorts().pass.emitir({
        uid,
        admission: selected.id,
        fecha: hoyISOTulum(),
        personas,
        montoCents: monto,
        paymentIntentId: pago.paymentIntentId,
        idempotencyKey,
      });
      setConfirm({
        kind: "pass",
        rows: [
          { k: t("kAdmission"), v: lx(selected.nombre) },
          { k: t("kWhen"), v: todayLabel() },
          { k: t("kGuests"), v: String(personas) },
          {
            k: t("kTotal"),
            v: `${moneyMxn(monto)} ${t("bcCurrency")}`,
          },
        ],
        qr: pass.qrCode,
        note: pago.simulado ? t("payDemoNote") : undefined,
      });
      router.push(SCREEN_ROUTES.confirm);
    } catch {
      Alert.alert(t("errAuth"));
    } finally {
      setBuying(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {/* Héroe */}
        <View style={{ height: 330 }}>
          <Image
            source={{ uri: IMG.bcGirls }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,.5)", "rgba(0,0,0,0)", "rgba(11,11,12,.85)"]}
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
              bottom: 22,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                backgroundColor: whiteAlpha(0.16),
                borderRadius: radius.pill,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: color.successBright,
                }}
              />
              <T
                v="labelSmall"
                c={color.white}
                style={{ fontSize: 10, letterSpacing: 1.6 }}
              >
                {t("bcOpen")}
              </T>
            </View>
            <T v="hero" c={color.white} style={{ marginTop: 14 }}>
              {t("bcTitle")}
            </T>
            <T v="caption" c={whiteAlpha(0.62)} style={{ marginTop: 10 }}>
              {t("bcAward")}
            </T>
          </View>
        </View>

        {/* Pestañas sticky sobre tinta */}
        <View style={{ backgroundColor: color.ink }}>
          <View
            style={{
              flexDirection: "row",
              gap: space.gutter,
              paddingHorizontal: space.gutter,
              paddingTop: 15,
            }}
          >
            {tabs.map((label, i) => {
              const active = i === tab;
              return (
                <Pressable
                  key={label}
                  onPress={() => setTab(i)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                  style={{
                    paddingBottom: 11,
                    borderBottomWidth: 2,
                    borderBottomColor: active ? color.accent : inkAlpha(0),
                    minHeight: hit.minHeight - 12,
                  }}
                >
                  <T v="body" c={active ? color.white : whiteAlpha(0.5)}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Cocina */}
        {tab === 0 ? (
          <View>
            <T
              v="small"
              c={inkAlpha(0.62)}
              style={{
                margin: space.xl,
                marginBottom: 0,
                fontSize: 13.5,
                lineHeight: 20,
              }}
            >
              {t("bcSub")}
            </T>
            <ListState
              loading={kitchen.isPending}
              error={kitchen.isError}
              empty={!kitchen.isPending && (kitchen.data?.length ?? 0) === 0}
              emptyText={t("listEmpty")}
              errorText={t("listError")}
              retryLabel={t("retry")}
              onRetry={() => void kitchen.refetch()}
            />
            <View
              style={{
                paddingHorizontal: space.gutter,
                paddingTop: space.xl,
                gap: 13,
              }}
            >
              {(kitchen.data ?? []).map((k) => (
                <View
                  key={k.id}
                  style={{
                    backgroundColor: color.white,
                    borderWidth: 1,
                    borderColor: inkAlpha(0.09),
                    borderRadius: radius.card,
                    overflow: "hidden",
                    flexDirection: "row",
                  }}
                >
                  <Image
                    source={{ uri: IMG[k.image] }}
                    style={{ width: 104 }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, padding: 15 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <T v="subheading" style={{ fontSize: 19 }}>
                        {lx(k.nombre)}
                      </T>
                      <T
                        v="bodyMedium"
                        c={color.accent}
                        style={{ fontSize: 11.5 }}
                      >
                        {k.horario}
                      </T>
                    </View>
                    <T
                      v="small"
                      c={inkAlpha(0.55)}
                      style={{ marginTop: 8, fontSize: 12 }}
                    >
                      {lx(k.descripcion)}
                    </T>
                  </View>
                </View>
              ))}
            </View>
            <DineCta />
          </View>
        ) : null}

        {/* Admisión */}
        {tab === 1 ? (
          <View style={{ paddingHorizontal: space.gutter }}>
            <T v="label" c={inkAlpha(0.45)} style={{ marginTop: space.xl }}>
              {t("bcIncludedTitle")}
            </T>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 7,
                marginTop: space.m,
              }}
            >
              {included.map((label) => (
                <View
                  key={label}
                  style={{
                    borderWidth: 1,
                    borderColor: inkAlpha(0.14),
                    borderRadius: radius.pill,
                    paddingVertical: 7,
                    paddingHorizontal: 13,
                  }}
                >
                  <T v="small" c={inkAlpha(0.7)} style={{ fontSize: 12 }}>
                    {label}
                  </T>
                </View>
              ))}
            </View>

            <T v="label" c={inkAlpha(0.45)} style={{ marginTop: space.xxl }}>
              {t("bcAdmTitle")}
            </T>
            <T v="caption" c={inkAlpha(0.5)} style={{ marginTop: 6 }}>
              {t("bcAdmNote")}
            </T>
            <ListState
              loading={admissions.isPending}
              error={admissions.isError}
              empty={
                !admissions.isPending && (admissions.data?.length ?? 0) === 0
              }
              emptyText={t("listEmpty")}
              errorText={t("listError")}
              retryLabel={t("retry")}
              onRetry={() => void admissions.refetch()}
            />
            <View style={{ gap: space.m, marginTop: space.l }}>
              {(admissions.data ?? []).map((a, i) => {
                const active = i === admission;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setAdmission(i)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={lx(a.nombre)}
                    style={{
                      backgroundColor: active
                        ? color.white
                        : whiteAlpha(0.55),
                      borderWidth: 1,
                      borderColor: active ? color.ink : inkAlpha(0.1),
                      borderRadius: radius.card,
                      padding: space.l,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space.m,
                      }}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          borderWidth: 1,
                          borderColor: active ? color.ink : inkAlpha(0.25),
                          backgroundColor: active ? color.ink : inkAlpha(0),
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {active ? (
                          <T
                            v="caption"
                            c={color.white}
                            style={{ fontSize: 9, lineHeight: 11 }}
                          >
                            {"✓"}
                          </T>
                        ) : null}
                      </View>
                      <T v="subheading" style={{ flex: 1 }}>
                        {lx(a.nombre)}
                      </T>
                      <T v="bodyMedium">
                        {`${moneyMxn(a.precioMxnCents)} ${t("bcCurrency")}`}
                      </T>
                    </View>
                    <T
                      v="small"
                      c={inkAlpha(0.55)}
                      style={{ marginTop: 9 }}
                    >
                      {lx(a.descripcion)}
                    </T>
                    {active ? (
                      <View style={{ marginTop: 11, gap: 6 }}>
                        {a.perks.map((perk) => (
                          <View
                            key={perk.en}
                            style={{
                              flexDirection: "row",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 3,
                                backgroundColor: color.accent,
                              }}
                            />
                            <T
                              v="small"
                              c={inkAlpha(0.65)}
                              style={{ fontSize: 12 }}
                            >
                              {lx(perk)}
                            </T>
                          </View>
                        ))}
                        <T
                          v="caption"
                          c={inkAlpha(0.45)}
                          style={{ marginTop: 4 }}
                        >
                          {t("bcPerPerson")}
                        </T>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {selected ? (
              <View style={{ marginTop: space.xl, gap: space.s }}>
                <T v="small" c={inkAlpha(0.6)} center>
                  {`${lx(selected.nombre)} · ${moneyMxn(selected.precioMxnCents)} ${t("bcCurrency")}`}
                </T>
                <Button
                  label={t("bcCta")}
                  onPress={() => void buyPass()}
                  variant="dark"
                  busy={buying}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Camastros — entrada al mapa */}
        {tab === 2 ? (
          <View style={{ paddingHorizontal: space.gutter }}>
            <Pressable
              onPress={() => router.push(SCREEN_ROUTES.sunbeds)}
              accessibilityRole="button"
              accessibilityLabel={t("bcPick")}
              style={{
                marginTop: space.xl,
                height: 220,
                borderRadius: radius.card,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: IMG.loungers }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,.65)"]}
                locations={[0.4, 1]}
                style={{ position: "absolute", width: "100%", height: "100%" }}
              />
              <View
                style={{
                  position: "absolute",
                  left: space.l,
                  right: space.l,
                  bottom: space.l,
                }}
              >
                <T v="heading" c={color.white}>
                  {t("beachTitle")}
                </T>
                <T
                  v="small"
                  c={whiteAlpha(0.8)}
                  style={{ marginTop: 6 }}
                >
                  {t("beachSub")}
                </T>
              </View>
            </Pressable>
            <View style={{ marginTop: space.l }}>
              <Button
                label={t("bcPick")}
                onPress={() => router.push(SCREEN_ROUTES.sunbeds)}
                variant="dark"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
