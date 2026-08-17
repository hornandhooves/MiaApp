/**
 * Staff · cocina — tras bandera (FLAGS.staff).
 * MIA-143: pedidos por lugar y antigüedad, para despachar en orden.
 * Alerta visual cuando un pedido pasa de doce minutos sin avanzar.
 * Un toque en el estado lo avanza (recibido → preparación → camino →
 * entregado); al entregar, el cargo entra al folio.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import type { Order, OrderState } from "../../packages/domain/types";
import { lx } from "../../packages/lib/content";
import { moneyUsd } from "../../packages/lib/tulum";
import { ListState } from "../../packages/ui/ListState";
import { T } from "../../packages/ui/T";
import {
  color,
  hit,
  radius,
  space,
  whiteAlpha,
} from "../../packages/ui/tokens";

const ALERT_MINUTES = 12;
const STATE_IDX: Record<OrderState, number> = {
  received: 0,
  preparing: 1,
  "on-way": 2,
  delivered: 3,
};

const ageMinutes = (createdAt: string, now: number): number =>
  Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));

export default function Kitchen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => getPorts().order.suscribirCocina(setOrders), []);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const states = t("orderStates", { returnObjects: true }) as string[];

  return (
    <View style={{ flex: 1, backgroundColor: color.ink }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.l,
          paddingHorizontal: space.gutter,
          paddingBottom: insets.bottom + space.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <T v="title" c={color.white}>
          {t("staffKitchenTitle")}
        </T>

        <ListState
          loading={false}
          error={false}
          empty={orders.length === 0}
          emptyText={t("listEmpty")}
          errorText={t("listError")}
          retryLabel={t("retry")}
          onDark
        />

        <View style={{ gap: space.m, marginTop: space.xl }}>
          {orders.map((o) => {
            const age = ageMinutes(o.createdAt, now);
            const late = age >= ALERT_MINUTES;
            const destino = o.spotId ?? o.roomId ?? "";
            return (
              <View
                key={o.id}
                style={{
                  borderWidth: late ? 1.5 : 1,
                  borderColor: late ? color.accent : whiteAlpha(0.16),
                  borderRadius: radius.cardSmall,
                  padding: space.l,
                  backgroundColor: late
                    ? "rgba(226,89,63,.08)"
                    : whiteAlpha(0.04),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.m,
                  }}
                >
                  <T v="subheading" c={color.white} style={{ flex: 1 }}>
                    {destino}
                  </T>
                  <T
                    v="bodyMedium"
                    c={late ? color.accent : whiteAlpha(0.5)}
                    style={{ fontSize: 12 }}
                  >
                    {t("minTpl", { m: age })}
                  </T>
                </View>
                <View style={{ marginTop: 8, gap: 3 }}>
                  {o.lineas.map((l) => (
                    <View
                      key={l.menuItemId}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <T
                        v="small"
                        c={whiteAlpha(0.75)}
                        style={{ fontSize: 12.5 }}
                      >
                        {`${l.cantidad} × ${lx(l.nombre)}`}
                      </T>
                      <T
                        v="small"
                        c={whiteAlpha(0.45)}
                        style={{ fontSize: 12.5 }}
                      >
                        {moneyUsd(l.precioCents * l.cantidad)}
                      </T>
                    </View>
                  ))}
                </View>
                <View
                  style={{
                    marginTop: space.m,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.m,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: whiteAlpha(0.1),
                      borderRadius: radius.pill,
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      alignSelf: "flex-start",
                    }}
                  >
                    <T v="labelSmall" c={whiteAlpha(0.7)}>
                      {states[STATE_IDX[o.estado]] ?? ""}
                    </T>
                  </View>
                  <Pressable
                    onPress={() => void getPorts().order.avanzar(o.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t("staffAdvance")}
                    style={{
                      backgroundColor: color.white,
                      borderRadius: radius.pill,
                      paddingVertical: 11,
                      paddingHorizontal: 18,
                      minHeight: hit.minHeight - 6,
                      justifyContent: "center",
                    }}
                  >
                    <T v="bodyMedium" style={{ fontSize: 12.5 }}>
                      {t("staffAdvance")}
                    </T>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
