/**
 * Tu estancia — pantalla 16 del prototipo.
 * Cabecera tinta con la tarjeta de llave (BLOQUEADA: la llave digital
 * queda fuera del demo — una puerta es una frontera de seguridad),
 * plan de comidas con upgrade prorrateado por noches restantes,
 * folio línea por línea en tiempo real, y Liquidar ahora.
 */
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { mensajeConPista } from "../../../packages/lib/errorTecnico";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { httpsCallable } from "firebase/functions";
import { getPorts } from "../../../packages/domain/di";
import { functions } from "../../../packages/lib/firebase";
import { FLAGS } from "../../../packages/domain/flags";
import { OLAS } from "../../../packages/domain/PLACEHOLDER_PRICES";
import { prorrateoUpgradeFbe } from "../../../packages/domain/prorrateo";
import type { Folio, MealPlanId , Reservation } from "../../../packages/domain/types";
import { lx } from "../../../packages/lib/content";
import { currentLang } from "../../../packages/i18n";
import { rangeLabel } from "../../../packages/lib/bookingStore";
import { useSession } from "../../../packages/lib/session";
import {
  minutosDesde,
  useSesionDia,
} from "../../../packages/lib/sesionDia";
import type { ReservaBienestar } from "../../../packages/domain/ports/WellnessPort";
import { DaySection } from "../../../packages/ui/DaySection";
import { moneyUsd } from "../../../packages/lib/tulum";
import { ListState } from "../../../packages/ui/ListState";
import { SheetButton } from "../../../packages/ui/SheetButton";
import { T } from "../../../packages/ui/T";
import { useUiStore } from "../../../packages/lib/uiStore";
import {
  color,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../../packages/ui/tokens";

const KEY_ICON = "○";
const CHEV = "›";
const DASH = "—";

export default function Stay() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openSheet = useUiStore((s) => s.openSheet);
  const uid = useSession((s) => s.uid);
  const status = useSession((s) => s.status);
  const spotId = useSession((s) => s.spotId);
  const signOutAll = useSession((s) => s.signOutAll);
  const dia = useSesionDia();
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [bienestar, setBienestar] = useState<ReservaBienestar[]>([]);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    void getPorts()
      .reservation.delUsuario(uid)
      .then((r) => vivo && setReservas(r))
      .catch(() => {});
    void getPorts()
      .wellness.misReservas(uid)
      .then((r) => vivo && setBienestar(r))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [uid]);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  /** Cerrar sesión: para un invitado anónimo esto DESTRUYE el día. */
  const cerrarSesion = () => {
    const anonimo = status !== "member";
    Alert.alert(
      anonimo ? t("signOutGuestTitle") : t("signOut"),
      anonimo ? t("signOutGuestBody") : t("signOutMemberBody"),
      [
        { text: t("cancelLbl"), style: "cancel" },
        {
          text: t("signOutConfirm"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await signOutAll();
              // Sin esto la pantalla se queda igual y parece que el
              // botón no hizo nada: por dentro sí cerró sesión y creó
              // un anónimo nuevo, pero la vista no se mueve. Cerrar
              // sesión tiene que llevarte a algún lado.
              router.replace("/login");
            })();
          },
        },
      ],
    );
  };

  /**
   * Borrado de cuenta. Apple lo exige para aprobar la app, y es la via
   * practica del derecho de cancelacion bajo la ley mexicana de datos.
   * Se bloquea si hay cuenta abierta: nadie desaparece debiendo.
   */
  const eliminarCuenta = () => {
    if (folio && folio.estado === "open" && folio.saldoCents > 0) {
      Alert.alert(t("deleteOpenFolio"));
      return;
    }
    Alert.alert(t("deleteTitle"), t("deleteBody"), [
      { text: t("cancelLbl"), style: "cancel" },
      {
        text: t("deleteConfirm"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await httpsCallable(functions(), "eliminarCuenta")();
              await signOutAll();
              Alert.alert(t("deleteDone"));
              router.replace("/login");
            } catch (e) {
              Alert.alert(mensajeConPista(t("deleteFailed"), e));
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };
  const roomId = useSession((s) => s.roomId);
  const estancia = useSession((s) => s.estancia);

  const [folio, setFolio] = useState<Folio | null>(null);
  const [plan, setPlan] = useState<MealPlanId>(estancia?.plan ?? "bb");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return getPorts().folio.suscribir(uid, setFolio);
  }, [uid]);

  const locale = currentLang() === "es" ? "es-MX" : "en-US";
  const plans = t("plans", { returnObjects: true }) as [
    string,
    string,
    string,
  ][];
  const includes = t(plan === "fbe" ? "planInclFbe" : "planIncl", {
    returnObjects: true,
  }) as [string, number][];

  const hasRoom = !!roomId && !!estancia;
  const roomNum = roomId ? (roomId.split("-")[1] ?? "") : "";
  const isFbe = plan === "fbe";

  const onKey = () => {
    // La llave digital queda FUERA del demo (FLAGS.digitalKey=false):
    // una puerta es una frontera de seguridad, no una feature de UI.
    if (!FLAGS.digitalKey) Alert.alert(t("keyDemoNote"));
  };

  const togglePlan = () => {
    if (!estancia || !uid) return;
    if (!isFbe) {
      const { noches, cargoCents } = prorrateoUpgradeFbe(
        estancia.desde,
        estancia.hasta,
      );
      if (noches === 0) return;
      Alert.alert(
        t("planUp"),
        t("upgradeChargeTpl", { price: moneyUsd(cargoCents), n: noches }),
        [
          { text: t("cancelLbl"), style: "cancel" },
          {
            text: t("confirmLbl"),
            onPress: () => {
              void (async () => {
                const f = await getPorts().folio.abrir({ uid, roomId: roomId ?? "" });
                await getPorts().folio.agregarCargo(f.id, {
                  idempotencyKey: `plan-fbe-${estancia.desde}`,
                  concepto: {
                    es: plans[1]?.[0] ?? "",
                    en: plans[1]?.[0] ?? "",
                  },
                  precioCents: cargoCents,
                  cantidad: 1,
                  origen: "room",
                  createdAt: new Date().toISOString(),
                });
                setPlan("fbe");
              })();
            },
          },
        ],
      );
    } else {
      // Vuelta a B&B: asiento en contra (auditable), nunca sobrescribir
      const { cargoCents } = prorrateoUpgradeFbe(
        estancia.desde,
        estancia.hasta,
      );
      void (async () => {
        const f = await getPorts().folio.abrir({ uid, roomId: roomId ?? "" });
        await getPorts().folio.agregarCargo(f.id, {
          idempotencyKey: `plan-fbe-rev-${estancia.desde}`,
          concepto: { es: plans[0]?.[0] ?? "", en: plans[0]?.[0] ?? "" },
          precioCents: -cargoCents,
          cantidad: 1,
          origen: "adjust",
          createdAt: new Date().toISOString(),
        });
        setPlan("bb");
        Alert.alert(
          t("downgradeNoteTpl", { price: moneyUsd(cargoCents) }),
        );
      })();
    }
  };

  const settle = () => {
    if (!uid || !folio || folio.saldoCents <= 0) return;
    setBusy(true);
    void (async () => {
      try {
        const key = Crypto.randomUUID();
        const pago = await getPorts().payment.pagar({
          montoCents: folio.saldoCents,
          currency: "usd",
          concepto: t("folio"),
          idempotencyKey: key,
          uid,
        });
        await getPorts().folio.cerrar(folio.id, {
          metodo: "stripe_test",
          paymentIntentId: pago.paymentIntentId,
          idempotencyKey: key,
        });
        const olas = Math.round(
          (folio.saldoCents / 100) * OLAS.ratePerUsd.marea,
        );
        // El consumo liquidado se acredita al ledger (append-only)
        await getPorts().ledger.acreditar({
          uid,
          delta: olas,
          motivo: "folio-liquidado",
          refId: folio.id,
          idempotencyKey: `settle-${folio.id}`,
        });
        Alert.alert(
          t("settleDoneTpl", {
            price: moneyUsd(folio.saldoCents),
            olas: olas.toLocaleString(locale),
          }),
          t("payDemoNote"),
        );
      } catch (e) {
        Alert.alert(mensajeConPista(t("errAuth"), e));
      } finally {
        setBusy(false);
      }
    })();
  };

  const fmtWhen = (iso: string): string =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "America/Cancun",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
      >
        {/* Cabecera tinta con llave */}
        <View
          style={{
            backgroundColor: color.ink,
            borderBottomLeftRadius: radius.sheet,
            borderBottomRightRadius: radius.sheet,
            paddingBottom: 26,
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
              {t("stayTitle")}
            </T>
            {estancia ? (
              <T v="caption" c={whiteAlpha(0.45)}>
                {rangeLabel(estancia.desde, estancia.hasta, locale)}
              </T>
            ) : null}
          </View>
          <Pressable
            onPress={onKey}
            accessibilityRole="button"
            accessibilityLabel={
              hasRoom && status === "member" ? t("roomKey") : t("keyGuest")
            }
            style={{
              marginTop: 22,
              marginHorizontal: space.gutter,
              borderWidth: 1,
              borderColor: whiteAlpha(0.18),
              borderRadius: radius.card + 2,
              padding: space.xl,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <T v="labelSmall" c={whiteAlpha(0.55)}>
                  {hasRoom && status === "member"
                    ? t("roomKey")
                    : t("keyGuest")}
                </T>
                <T
                  v="display"
                  c={color.white}
                  style={{ marginTop: 11, fontSize: 38 }}
                >
                  {hasRoom ? roomNum : DASH}
                </T>
              </View>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth: 2,
                  borderColor: whiteAlpha(0.3),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T v="body" c={color.white} style={{ fontSize: 24 }}>
                  {KEY_ICON}
                </T>
              </View>
            </View>
            <T
              v="small"
              c={whiteAlpha(0.45)}
              style={{ marginTop: space.l, fontSize: 12.5 }}
            >
              {hasRoom && status === "member"
                ? t("keyDemoNote")
                : t("keyGuestSub")}
            </T>
          </Pressable>
        </View>

        {/* Plan de comidas */}
        {hasRoom ? (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
            <T v="label" c={inkAlpha(0.45)}>
              {t("mealPlan")}
            </T>
            <View
              style={{
                marginTop: space.m,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: inkAlpha(0.09),
                borderRadius: radius.card,
                padding: 18,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <T v="heading">{plans[isFbe ? 1 : 0]?.[0] ?? ""}</T>
                <T
                  v="labelSmall"
                  c={color.accent}
                  style={{ letterSpacing: 1.3 }}
                >
                  {t("active")}
                </T>
              </View>
              <View style={{ marginTop: space.m, gap: 7 }}>
                {includes.map(([label, on]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <View
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 8,
                        backgroundColor:
                          on === 1 ? color.accent : inkAlpha(0.15),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <T
                        v="caption"
                        c={color.white}
                        style={{ fontSize: 9, lineHeight: 11 }}
                      >
                        {on === 1 ? "✓" : "·"}
                      </T>
                    </View>
                    <T
                      v="small"
                      c={on === 1 ? inkAlpha(0.8) : inkAlpha(0.35)}
                    >
                      {label}
                    </T>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={togglePlan}
                accessibilityRole="button"
                accessibilityLabel={isFbe ? t("planDown") : t("planUp")}
                style={{
                  marginTop: space.l,
                  paddingTop: 15,
                  borderTopWidth: 1,
                  borderTopColor: inkAlpha(0.08),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: hit.minHeight,
                }}
              >
                <View style={{ flex: 1 }}>
                  <T v="body" style={{ fontSize: 14 }}>
                    {isFbe ? t("planDown") : t("planUp")}
                  </T>
                  <T
                    v="caption"
                    c={inkAlpha(0.5)}
                    style={{ marginTop: 4 }}
                  >
                    {isFbe ? t("planDownSub") : t("planUpSub")}
                  </T>
                </View>
                <T v="body" c={inkAlpha(0.3)} style={{ fontSize: 18 }}>
                  {CHEV}
                </T>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Folio */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
          <T v="label" c={inkAlpha(0.45)}>
            {t("folio")}
          </T>
          <ListState
            loading={false}
            error={false}
            empty={!folio || folio.lineas.length === 0}
            emptyText={t("listEmpty")}
            errorText={t("listError")}
            retryLabel={t("retry")}
          />
          {folio && folio.lineas.length > 0 ? (
            <View
              style={{
                marginTop: space.m,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: inkAlpha(0.09),
                borderRadius: radius.card,
                paddingHorizontal: 18,
                paddingVertical: 6,
              }}
            >
              {folio.lineas.map((l) => (
                <View
                  key={l.idempotencyKey}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: space.m,
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: inkAlpha(0.07),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <T v="body" style={{ fontSize: 14 }}>
                      {lx(l.concepto)}
                    </T>
                    <T
                      v="caption"
                      c={inkAlpha(0.45)}
                      style={{ marginTop: 3 }}
                    >
                      {fmtWhen(l.createdAt)}
                    </T>
                  </View>
                  <T v="bodyMedium" style={{ fontSize: 14 }}>
                    {moneyUsd(l.precioCents * l.cantidad)}
                  </T>
                </View>
              ))}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                }}
              >
                <T v="bodyMedium">{t("openTotal")}</T>
                <T v="bodyMedium" style={{ fontSize: 16 }}>
                  {moneyUsd(folio.saldoCents)}
                </T>
              </View>
            </View>
          ) : null}
          {folio && folio.estado === "open" && folio.saldoCents > 0 ? (
            <Pressable
              onPress={settle}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t("settle")}
              accessibilityState={{ disabled: busy }}
              style={{
                marginTop: space.l,
                backgroundColor: color.ink,
                opacity: busy ? 0.5 : 1,
                borderRadius: radius.pill,
                minHeight: hit.minHeight + 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T v="bodyMedium" c={color.white}>
                {t("settle")}
              </T>
            </Pressable>
          ) : null}
        </View>

        {/* Tu lugar */}
        <DaySection
          title={t("dayPlace")}
          empty={dia.lugarTipo || dia.reservado ? null : t("dayPlaceNone")}
        >
          <Pressable
            onPress={() => router.push(spotId ? "/sunbeds" : "/guest")}
            accessibilityRole="button"
            accessibilityLabel={t("dayPlace")}
            style={{
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: inkAlpha(0.09),
              borderRadius: radius.card,
              padding: 18,
              minHeight: hit.minHeight,
            }}
          >
            <T v="bodyMedium" style={{ fontSize: 16 }}>
              {dia.lugarTipo && dia.lugarNum
                ? t(
                    dia.lugarTipo === "table"
                      ? "sbTable"
                      : dia.lugarTipo === "room"
                        ? "sbRoom"
                        : "sbBed",
                    { n: dia.lugarNum },
                  )
                : dia.reservado
                  ? // Apartado, que no es lo mismo que estar ahí: se
                    // dice con su hora de llegada para que el huésped
                    // sepa que todavía tiene que ir y escanear el QR.
                    t(
                      dia.reservado.tipo === "table"
                        ? "sbHeldTable"
                        : "sbHeldBed",
                      { n: dia.reservado.num, when: dia.horaLlegada ?? "" },
                    )
                  : t("dayPlaceLink")}
            </T>
            {dia.minutosHold !== null ? (
              <T
                v="caption"
                c={dia.minutosHold > 0 ? inkAlpha(0.45) : color.accent}
                style={{ marginTop: 4 }}
              >
                {dia.minutosHold > 0
                  ? t("dayHoldLeftTpl", { n: dia.minutosHold })
                  : t("dayHoldGone")}
              </T>
            ) : null}
          </Pressable>
        </DaySection>

        {/* Tus pedidos */}
        <DaySection
          title={t("dayOrders")}
          empty={dia.pedidos.length === 0 ? t("dayOrdersNone") : null}
        >
          <View
            style={{
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: inkAlpha(0.09),
              borderRadius: radius.card,
              paddingHorizontal: 18,
              paddingVertical: 6,
            }}
          >
            {dia.pedidos.map((o) => {
              const mins = minutosDesde(o.createdAt, ahora);
              const vivo = o.estado !== "delivered";
              return (
                <View
                  key={o.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: space.m,
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: inkAlpha(0.07),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <T v="body" style={{ fontSize: 14 }}>
                      {t(
                        o.estado === "received"
                          ? "stateReceived"
                          : o.estado === "preparing"
                            ? "statePreparing"
                            : o.estado === "on-way"
                              ? "stateOnWay"
                              : "stateDelivered",
                      )}
                    </T>
                    <T v="caption" c={inkAlpha(0.45)} style={{ marginTop: 3 }}>
                      {mins < 1
                        ? t("orderJustNow")
                        : t("orderAgoTpl", { n: mins })}
                    </T>
                  </View>
                  <T v="bodyMedium" c={vivo ? color.accent : inkAlpha(0.55)}>
                    {moneyUsd(o.totalCents)}
                  </T>
                </View>
              );
            })}
          </View>
        </DaySection>

        {/* Tus reservas */}
        <DaySection
          title={t("dayBookings")}
          empty={
            reservas.length === 0 && bienestar.length === 0
              ? t("dayBookingsNone")
              : null
          }
        >
          <View
            style={{
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: inkAlpha(0.09),
              borderRadius: radius.card,
              paddingHorizontal: 18,
              paddingVertical: 6,
            }}
          >
            {reservas.map((r) => (
              <View
                key={r.id}
                style={{
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: inkAlpha(0.07),
                }}
              >
                <T v="body" style={{ fontSize: 14 }}>
                  {rangeLabel(r.desde, r.hasta, currentLang() === "es" ? "es-MX" : "en-US")}
                </T>
                <T v="caption" c={inkAlpha(0.45)} style={{ marginTop: 3 }}>
                  {moneyUsd(r.totalCents)}
                </T>
              </View>
            ))}
            {bienestar.map((b) => (
              <View
                key={b.id}
                style={{
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: inkAlpha(0.07),
                }}
              >
                <T v="body" style={{ fontSize: 14 }}>
                  {b.tipo === "shuttle" ? t("dayShuttle") : lx(b.nombre)}
                </T>
                <T v="caption" c={inkAlpha(0.45)} style={{ marginTop: 3 }}>
                  {b.asientos
                    ? `${b.hora} \u00b7 ${t("daySeatsTpl", { n: b.asientos })}`
                    : b.hora}
                </T>
              </View>
            ))}
          </View>
        </DaySection>

        {/* Cerrar sesión */}
        <View style={{ paddingHorizontal: space.gutter, marginTop: 32 }}>
          <Pressable
            onPress={cerrarSesion}
            accessibilityRole="button"
            accessibilityLabel={t("signOut")}
            style={{
              minHeight: hit.minHeight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T v="body" c={color.accent} style={{ fontSize: 14 }}>
              {t("signOut")}
            </T>
          </Pressable>
          {status === "member" ? (
            <Pressable
              onPress={eliminarCuenta}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t("deleteAccount")}
              accessibilityState={{ disabled: busy }}
              style={{
                minHeight: hit.minHeight,
                alignItems: "center",
                justifyContent: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <T v="caption" c={inkAlpha(0.4)}>
                {t("deleteAccount")}
              </T>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
