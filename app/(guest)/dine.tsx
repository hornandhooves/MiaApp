/**
 * Menú y pedidos — pantalla 06 del prototipo.
 * Destino visible (del spotId/roomId de la sesión) SIEMPRE antes de
 * confirmar, categorías, platillos con precio o "Incluido", carrito
 * con el precio CONGELADO al agregar (nunca se relee al cobrar), y
 * la cuenta del día al pie. El pedido sale con clave de idempotencia.
 */
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import { ORDER_ETA } from "../../packages/domain/PLACEHOLDER_PRICES";
import type { Folio, MenuItem, OrderLine } from "../../packages/domain/types";
import { lx, useMenu } from "../../packages/lib/content";
import { useConfirmStore } from "../../packages/lib/confirmStore";
import { useSession } from "../../packages/lib/session";
import { spotOrRoomLabel } from "../../packages/lib/spotLink";
import { moneyUsd } from "../../packages/lib/tulum";
import { CircleButton, GLYPH } from "../../packages/ui/CircleButton";
import { ListState } from "../../packages/ui/ListState";
import { T } from "../../packages/ui/T";
import {
  canvasAlpha,
  color,
  hit,
  inkAlpha,
  radius,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

const PLUS = "+";
const CHECK = "✓";

export default function Dine() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useSession((s) => s.uid);
  const spotId = useSession((s) => s.spotId);
  const roomId = useSession((s) => s.roomId);
  const setConfirm = useConfirmStore((s) => s.setConfirm);

  const menu = useMenu();
  const [cat, setCat] = useState(0);
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return getPorts().folio.suscribir(uid, setFolio);
  }, [uid]);

  const cats = t("dineCats", { returnObjects: true }) as string[];

  // Destinos posibles. Un huesped SI puede pedir a un lugar donde no
  // esta (decision de producto, 2026-08-19): pedir a la suite mientras
  // vuelves del camastro es el caso natural.
  const destinos = [
    ...(spotId
      ? [
          {
            id: spotId,
            tipo: spotId.startsWith("table") ? "table" : "bed",
            label: spotId.startsWith("table") ? t("destTable") : t("destBed"),
            detalle: spotOrRoomLabel(
              spotId,
              null,
              t("bedPick"),
              t("tablePick"),
              t("roomKey"),
            ),
          },
        ]
      : []),
    ...(roomId
      ? [
          {
            id: roomId,
            tipo: "room",
            label: t("destRoom"),
            detalle: spotOrRoomLabel(
              null,
              roomId,
              t("bedPick"),
              t("tablePick"),
              t("roomKey"),
            ),
          },
        ]
      : []),
  ];
  const [destIdx, setDestIdx] = useState(0);
  const elegido = destinos[destIdx] ?? destinos[0];
  const destino = elegido?.detalle ?? null;

  const items = (menu.data ?? []).filter((m) => m.categoria === cat);
  const inCart = (id: string) => cart.some((l) => l.menuItemId === id);

  const toggle = (item: MenuItem) => {
    setCart((prev) => {
      if (prev.some((l) => l.menuItemId === item.id)) {
        return prev.filter((l) => l.menuItemId !== item.id);
      }
      // AQUÍ se congela el precio: la línea guarda el precio del
      // momento de agregar; el cobro jamás relee el catálogo.
      return [
        ...prev,
        {
          menuItemId: item.id,
          nombre: item.nombre,
          precioCents: item.precioCents ?? 0,
          cantidad: 1,
          incluido: item.precioCents === null,
        },
      ];
    });
  };

  const total = cart.reduce((s, l) => s + l.precioCents * l.cantidad, 0);
  const cartLabel = `${cart.length} ${cart.length === 1 ? t("item") : t("items")}${total > 0 ? ` · ${moneyUsd(total)}` : ""}`;

  const placeOrder = async () => {
    if (!uid || cart.length === 0) return;
    if (!destino) {
      Alert.alert(t("orderNeedsSpot"));
      return;
    }
    setBusy(true);
    try {
      const idempotencyKey = Crypto.randomUUID();
      await getPorts().order.crear({
        uid,
        ...(elegido?.tipo === "room"
          ? { roomId: elegido.id }
          : elegido
            ? { spotId: elegido.id }
            : {}),
        lineas: cart,
        idempotencyKey,
      });
      setConfirm({
        kind: "order",
        rows: [
          { k: t("kWhere"), v: destino },
          {
            k: t("kEta"),
            v: t("etaTpl", { a: ORDER_ETA.minMin, b: ORDER_ETA.maxMin }),
          },
          { k: t("kTotal"), v: total > 0 ? moneyUsd(total) : t("included") },
        ],
      });
      setCart([]);
      router.push("/confirm");
    } catch {
      Alert.alert(t("errAuth"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + space.xs,
          paddingBottom: 160,
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
          <CircleButton
            glyph={GLYPH.back}
            label={t("back")}
            onPress={() => router.back()}
          />
          <T v="title">{t("dineTitle")}</T>
        </View>

        {/* Destino — siempre visible antes de confirmar */}
        <View
          style={{
            marginTop: 14,
            marginHorizontal: space.gutter,
            backgroundColor: color.ink,
            borderRadius: 15,
            paddingVertical: 13,
            paddingHorizontal: space.l,
          }}
        >
          <T v="caption" c={whiteAlpha(0.5)} style={{ marginBottom: 10 }}>
            {t("deliverPick")}
          </T>
          {destinos.length === 0 ? (
            <Pressable
              onPress={() => router.push("/guest")}
              accessibilityRole="button"
              accessibilityLabel={t("destLink")}
              style={{ minHeight: hit.minHeight, justifyContent: "center" }}
            >
              <T v="body" c={color.white} style={{ fontSize: 13.5 }}>
                {t("destNone")}
              </T>
              <T v="caption" c={color.accent} style={{ marginTop: 4 }}>
                {t("destLink")}
              </T>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", gap: space.s }}>
              {destinos.map((d, i) => {
                const on = i === destIdx;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => setDestIdx(i)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${d.label} ${d.detalle ?? ""}`}
                    style={{
                      flex: 1,
                      minHeight: hit.minHeight,
                      justifyContent: "center",
                      paddingHorizontal: space.m,
                      borderRadius: radius.cardSmall,
                      borderWidth: 1,
                      borderColor: on ? color.white : whiteAlpha(0.18),
                      backgroundColor: on ? whiteAlpha(0.1) : whiteAlpha(0),
                    }}
                  >
                    <T
                      v="body"
                      c={on ? color.white : whiteAlpha(0.72)}
                      style={{ fontSize: 13.5 }}
                    >
                      {d.label}
                    </T>
                    {d.detalle ? (
                      <T v="caption" c={whiteAlpha(0.45)}>
                        {d.detalle}
                      </T>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: space.s,
            paddingHorizontal: space.gutter,
            paddingTop: space.l,
          }}
        >
          {cats.map((label, i) => {
            const active = i === cat;
            return (
              <Pressable
                key={label}
                onPress={() => setCat(i)}
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
                  paddingHorizontal: 16,
                }}
              >
                <T
                  v="body"
                  c={active ? color.white : inkAlpha(0.7)}
                  style={{ fontSize: 13 }}
                >
                  {label}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Platillos */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: 8 }}>
          <ListState
            loading={menu.isPending}
            error={menu.isError}
            empty={!menu.isPending && items.length === 0}
            emptyText={t("listEmpty")}
            errorText={t("listError")}
            retryLabel={t("retry")}
            onRetry={() => void menu.refetch()}
          />
          {items.map((item) => {
            const added = inCart(item.id);
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: space.l,
                  borderBottomWidth: 1,
                  borderBottomColor: inkAlpha(0.09),
                }}
              >
                <View style={{ flex: 1 }}>
                  <T v="subheading">{lx(item.nombre)}</T>
                  <T
                    v="small"
                    c={inkAlpha(0.52)}
                    style={{ marginTop: 5, fontSize: 12 }}
                  >
                    {lx(item.descripcion)}
                  </T>
                  <View
                    style={{
                      marginTop: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <T v="bodyMedium">
                      {item.precioCents === null
                        ? t("included")
                        : moneyUsd(item.precioCents)}
                    </T>
                    {item.tag ? (
                      <View
                        style={{
                          backgroundColor: inkAlpha(0.07),
                          borderRadius: radius.pill,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                        }}
                      >
                        <T
                          v="labelSmall"
                          c={inkAlpha(0.5)}
                          style={{ letterSpacing: 1.2 }}
                        >
                          {lx(item.tag)}
                        </T>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  onPress={() => toggle(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: added }}
                  accessibilityLabel={lx(item.nombre)}
                  style={{
                    width: hit.minWidth,
                    height: hit.minHeight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: added ? color.accent : inkAlpha(0.07),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <T
                      v="body"
                      c={added ? color.white : color.ink}
                      style={{ fontSize: 19, lineHeight: 22 }}
                    >
                      {added ? CHECK : PLUS}
                    </T>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* En tu cuenta */}
        {folio && folio.lineas.length > 0 && destino ? (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: 22 }}>
            <T v="label" c={inkAlpha(0.45)}>
              {t("tabTitle")}
            </T>
            <View
              style={{
                marginTop: space.m,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: inkAlpha(0.09),
                borderRadius: radius.cardSmall,
                paddingHorizontal: space.l,
                paddingVertical: space.xs,
              }}
            >
              {folio.lineas.map((l) => (
                <View
                  key={l.idempotencyKey}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: inkAlpha(0.07),
                  }}
                >
                  <T v="small" style={{ fontSize: 13 }}>
                    {lx(l.concepto)}
                  </T>
                  <T v="bodyMedium" style={{ fontSize: 13 }}>
                    {moneyUsd(l.precioCents * l.cantidad)}
                  </T>
                </View>
              ))}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                }}
              >
                <T v="bodyMedium">{t("openTotal")}</T>
                <T v="bodyMedium">{moneyUsd(folio.saldoCents)}</T>
              </View>
            </View>
            <T v="caption" c={inkAlpha(0.45)} style={{ marginTop: 8 }}>
              {t("tabNoteTpl", { spot: destino })}
            </T>
          </View>
        ) : null}
      </ScrollView>

      {/* Carrito */}
      {cart.length > 0 ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: canvasAlpha(0.96),
            borderTopWidth: 1,
            borderTopColor: inkAlpha(0.09),
            paddingHorizontal: space.gutter,
            paddingTop: 14,
            paddingBottom: insets.bottom + space.m,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <T v="bodyMedium" style={{ fontSize: 16 }}>
              {cartLabel}
            </T>
            <T v="caption" c={inkAlpha(0.5)} style={{ marginTop: 5 }}>
              {t("etaTpl", { a: ORDER_ETA.minMin, b: ORDER_ETA.maxMin })}
            </T>
          </View>
          <Pressable
            onPress={() => void placeOrder()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("order")}
            accessibilityState={{ disabled: busy }}
            style={{
              backgroundColor: color.accent,
              opacity: busy ? 0.5 : 1,
              borderRadius: radius.pill,
              paddingVertical: 15,
              paddingHorizontal: 26,
              minHeight: hit.minHeight,
              justifyContent: "center",
            }}
          >
            <T v="bodyMedium" c={color.white}>
              {t("order")}
            </T>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
