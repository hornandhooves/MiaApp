/**
 * Mía Círculo — pantalla 17 del prototipo. Tras FLAGS.circulo y
 * ROTULADO COMO CONCEPTO (las Olas no tienen valor contable).
 * El saldo SIEMPRE se deriva del ledger; el banner de unirse acredita
 * el consumo del día al crear cuenta (linkWithCredential conserva el
 * UID, así que no hay nada que migrar).
 */
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../../packages/domain/di";
import { FLAGS } from "../../../packages/domain/flags";
import { OLAS } from "../../../packages/domain/PLACEHOLDER_PRICES";
import type { Folio } from "../../../packages/domain/types";
import { currentLang } from "../../../packages/i18n";
import { useConfirmStore } from "../../../packages/lib/confirmStore";
import { useSession } from "../../../packages/lib/session";
import { mensajeConPista } from "../../../packages/lib/errorTecnico";
import { spotOrRoomLabel } from "../../../packages/lib/spotLink";
import { useUiStore } from "../../../packages/lib/uiStore";
import { Button } from "../../../packages/ui/Button";
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

interface TierRow {
  0: string; // name
  1: string; // req
  2: string; // perks
}

export default function Circulo() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const uid = useSession((s) => s.uid);
  const status = useSession((s) => s.status);
  const spotId = useSession((s) => s.spotId);
  const roomId = useSession((s) => s.roomId);
  const signInWithApple = useSession((s) => s.signInWithApple);
  const setConfirm = useConfirmStore((s) => s.setConfirm);
  const [saldo, setSaldo] = useState(0);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return getPorts().ledger.suscribirSaldo(uid, setSaldo);
  }, [uid]);

  // Folio vivo: la tarjeta de unirse promete el número real que join()
  // va a acreditar, no el literal del prototipo.
  useEffect(() => {
    if (!uid) return;
    return getPorts().folio.suscribir(uid, setFolio);
  }, [uid]);

  const locale = currentLang() === "es" ? "es-MX" : "en-US";
  const isMember = status === "member";
  const tiers = t("cirTiers", { returnObjects: true }) as TierRow[];
  const earn = t("cirEarn", { returnObjects: true }) as [string, string][];
  const redeem = t("cirRedeem", { returnObjects: true }) as [
    string,
    string,
    number,
  ][];

  if (!FLAGS.circulo) return null;

  // Copy dinámico de la tarjeta de unirse: lugar real de la sesión y
  // el mismo número que join() acreditará (saldo abierto × tasa arena).
  const joinSpot = spotOrRoomLabel(
    spotId,
    roomId,
    t("bedPick"),
    t("tablePick"),
    t("roomKey"),
  );
  const joinOlas = Math.round(
    ((folio?.saldoCents ?? 0) / 100) * OLAS.ratePerUsd.arena,
  );
  const joinSub =
    joinOlas > 0 && joinSpot
      ? t("cirJoinSubTpl", {
          spot: joinSpot,
          olas: joinOlas.toLocaleString(locale),
        })
      : t("cirJoinSubZero");

  const join = () => {
    if (!uid) return;
    setJoining(true);
    void (async () => {
      try {
        // linkWithCredential conserva el UID: el folio del día ya
        // apunta al usuario correcto, solo se acredita el asiento.
        await signInWithApple();
        // Se relee el uid DESPUÉS de autenticar. En el camino feliz es
        // el mismo (ese es el invariante). Pero si esa cuenta de Apple
        // ya existía, session.ts cae a signInWithCredential y el uid
        // cambia: acreditar contra el uid viejo escribiría en el ledger
        // de otro usuario, y las reglas lo rechazarían con un mensaje
        // que no explica nada.
        const uidReal = useSession.getState().uid;
        if (!uidReal) throw new Error("sin-uid-tras-login");
        const folio = await getPorts().folio.obtenerAbierto(uidReal);
        const consumo = folio?.saldoCents ?? 0;
        // Estimación local para no pedir dos veces; la cifra que se
        // enseña es la que devuelve el servidor, que es la que quedó
        // asentada en el ledger.
        const estimadas = Math.round((consumo / 100) * OLAS.ratePerUsd.arena);
        let olas = 0;
        if (estimadas > 0 && folio) {
          const asiento = await getPorts().ledger.acreditar({
            uid: uidReal,
            delta: estimadas,
            motivo: "consumo-del-dia",
            refId: folio.id,
            idempotencyKey: `join-${uidReal}`,
          });
          olas = asiento.delta;
        }
        setConfirm({
          kind: "join",
          rows: [
            { k: t("kTier"), v: tiers[0]?.[0] ?? "" },
            { k: t("kOlas"), v: olas.toLocaleString(locale) },
          ],
        });
        router.push("/confirm");
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== "ERR_REQUEST_CANCELED") {
          Alert.alert(mensajeConPista(t("needAccountForOlas"), e));
        }
      } finally {
        setJoining(false);
      }
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {/* Cabecera tinta */}
        <View
          style={{
            backgroundColor: color.ink,
            borderBottomLeftRadius: radius.sheet,
            borderBottomRightRadius: radius.sheet,
            paddingBottom: 28,
            paddingTop: insets.top + space.xs,
          }}
        >
          <View
            style={{
              paddingHorizontal: space.gutter,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <SheetButton label={t("menuLabel")} onPress={openSheet} onDark />
            <T v="title" c={color.white} style={{ flex: 1, fontSize: 26 }}>
              {t("cirName")}
            </T>
          </View>
          <T
            v="caption"
            c={whiteAlpha(0.5)}
            style={{ paddingHorizontal: space.gutter, marginTop: space.xl }}
          >
            {t("cirSub")}
          </T>
          {/* Rotulado como concepto */}
          <View
            style={{
              marginTop: space.m,
              marginHorizontal: space.gutter,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: whiteAlpha(0.3),
              borderRadius: radius.pill,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <T v="labelSmall" c={whiteAlpha(0.65)}>
              {t("conceptBadge")}
            </T>
          </View>

          {isMember ? (
            <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
              <T v="labelSmall" c={whiteAlpha(0.45)}>
                {t("cirPoints")}
              </T>
              <T
                v="display"
                c={color.white}
                style={{ marginTop: 10, fontSize: 52, lineHeight: 50 }}
              >
                {saldo.toLocaleString(locale)}
              </T>
              <T
                v="label"
                c={color.accent}
                style={{ marginTop: 8, fontSize: 11 }}
              >
                {t("cirPoints")}
              </T>
              <View
                style={{
                  marginTop: space.xl,
                  height: 3,
                  backgroundColor: whiteAlpha(0.14),
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min(100, Math.round((saldo / OLAS.redeem.freeNightOcean) * 100))}%`,
                    backgroundColor: color.accent,
                  }}
                />
              </View>
              <T
                v="caption"
                c={whiteAlpha(0.55)}
                style={{ marginTop: 10 }}
              >
                {t("cirToNext")}
              </T>
            </View>
          ) : (
            <View
              style={{
                marginTop: 22,
                marginHorizontal: space.gutter,
                borderWidth: 1,
                borderColor: whiteAlpha(0.2),
                borderRadius: radius.card + 2,
                padding: space.xl,
              }}
            >
              <T v="heading" c={color.white} style={{ fontSize: 24 }}>
                {t("cirJoinTitle")}
              </T>
              <T
                v="caption"
                c={whiteAlpha(0.55)}
                style={{ marginTop: 10 }}
              >
                {joinSub}
              </T>
              <View style={{ marginTop: space.l }}>
                <Button
                  label={t("cirJoin")}
                  onPress={join}
                  variant="solid"
                  busy={joining}
                />
              </View>
            </View>
          )}
        </View>

        {/* Cómo acumulas */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("cirEarnTitle")}
          </T>
          <View style={{ marginTop: space.m }}>
            {earn.map((e) => (
              <View
                key={e[0]}
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: inkAlpha(0.08),
                }}
              >
                <T v="small" c={inkAlpha(0.68)} style={{ flex: 1 }}>
                  {e[0]}
                </T>
                <T v="bodyMedium" style={{ fontSize: 13.5 }}>
                  {e[1]}
                </T>
              </View>
            ))}
          </View>
        </View>

        {/* Niveles */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("cirTiersTitle")}
          </T>
          <View style={{ gap: 10, marginTop: space.m }}>
            {tiers.map((tier, i) => {
              const current = isMember && i === 0;
              return (
                <View
                  key={tier[0]}
                  style={{
                    backgroundColor: current
                      ? color.ink
                      : whiteAlpha(0.55),
                    borderWidth: 1,
                    borderColor: current ? color.ink : inkAlpha(0.1),
                    borderRadius: radius.cardSmall,
                    padding: space.l,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <T
                      v="subheading"
                      c={current ? color.white : color.ink}
                    >
                      {tier[0]}
                    </T>
                    <T
                      v="caption"
                      c={current ? whiteAlpha(0.55) : inkAlpha(0.5)}
                    >
                      {current ? t("active") : tier[1]}
                    </T>
                  </View>
                  <T
                    v="caption"
                    c={current ? whiteAlpha(0.8) : inkAlpha(0.62)}
                    style={{ marginTop: 7, lineHeight: 17 }}
                  >
                    {tier[2]}
                  </T>
                </View>
              );
            })}
          </View>
        </View>

        {/* Canjes */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 24 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("cirRedeemTitle")}
          </T>
          <View style={{ marginTop: space.m }}>
            {redeem.map((r) => {
              const cost = Number(String(r[1]).replace(/[^\d]/g, ""));
              const falta = Math.max(0, cost - saldo);
              const alcanza = falta === 0;
              return (
                <Pressable
                  key={r[0]}
                  onPress={() => router.push("/chat")}
                  accessibilityRole="button"
                  accessibilityLabel={r[0]}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: inkAlpha(0.08),
                    minHeight: hit.minHeight,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <T v="body" style={{ fontSize: 14 }}>
                      {r[0]}
                    </T>
                    <T
                      v="caption"
                      c={alcanza ? color.accent : inkAlpha(0.45)}
                      style={{ marginTop: 3 }}
                    >
                      {alcanza
                        ? t("redeemableTag")
                        : t("missingTpl", {
                            n: falta.toLocaleString(locale),
                          })}
                    </T>
                  </View>
                  <T v="bodyMedium" style={{ fontSize: 13.5 }}>
                    {r[1]}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
