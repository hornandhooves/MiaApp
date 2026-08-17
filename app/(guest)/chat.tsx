/**
 * Concierge — pantalla 15 del prototipo.
 * Chat dentro de la app (Firestore en producción, memoria en el
 * demo) con respuesta automática para que se sienta vivo, respuestas
 * rápidas, y la nota de WhatsApp — el puente Twilio llega con la
 * verificación de Meta.
 */
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getPorts } from "../../packages/domain/di";
import type { ChatMessage } from "../../packages/domain/ports/ChatPort";
import { useSession } from "../../packages/lib/session";
import { CircleButton, GLYPH } from "../../packages/ui/CircleButton";
import { T } from "../../packages/ui/T";
import {
  color,
  font,
  hit,
  inkAlpha,
  radius,
  space,
} from "../../packages/ui/tokens";

const LOGO_M = "M";
const SEND = "↑";

export default function Chat() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useSession((s) => s.uid);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState("");
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (!uid) return;
    return getPorts().chat.suscribir(uid, (m) => {
      setMsgs(m);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
    });
  }, [uid]);

  const quick = t("quick", { returnObjects: true }) as string[];

  const send = (text: string) => {
    if (!uid || !text.trim()) return;
    void getPorts().chat.enviar(uid, text);
    setTexto("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.canvas }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: color.white,
          borderBottomWidth: 1,
          borderBottomColor: inkAlpha(0.09),
          paddingTop: insets.top,
          paddingHorizontal: space.gutter,
          paddingBottom: space.l,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
            marginTop: space.xs,
          }}
        >
          <CircleButton
            glyph={GLYPH.back}
            label={t("back")}
            onPress={() => router.back()}
          />
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: color.ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T v="subheading" c={color.white} style={{ fontSize: 14 }}>
              {LOGO_M}
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="body" style={{ fontSize: 16 }}>
              {t("concierge")}
            </T>
            <View
              style={{
                marginTop: 3,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: color.success,
                }}
              />
              <T v="caption" c={inkAlpha(0.5)}>
                {t("online")}
              </T>
            </View>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.xl, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {msgs.map((m) => (
          <View
            key={m.id}
            style={{
              alignSelf: m.mine ? "flex-end" : "flex-start",
              maxWidth: "78%",
              backgroundColor: m.mine ? color.ink : color.white,
              borderWidth: 1,
              borderColor: m.mine ? color.ink : inkAlpha(0.09),
              borderRadius: radius.card,
              borderBottomRightRadius: m.mine ? 5 : radius.card,
              borderBottomLeftRadius: m.mine ? radius.card : 5,
              paddingVertical: 12,
              paddingHorizontal: 15,
            }}
          >
            <T
              v="small"
              c={m.mine ? color.white : color.ink}
              style={{ fontSize: 13.5, lineHeight: 19 }}
            >
              {m.texto}
            </T>
          </View>
        ))}
        <T
          v="caption"
          c={inkAlpha(0.38)}
          center
          style={{ marginTop: 6, fontSize: 11 }}
        >
          {t("chatWa")}
        </T>
      </ScrollView>

      {/* Respuestas rápidas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          gap: space.s,
          paddingHorizontal: space.xl,
          paddingBottom: space.m,
        }}
      >
        {quick.map((label) => (
          <Pressable
            key={label}
            onPress={() => send(label)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{
              borderWidth: 1,
              borderColor: inkAlpha(0.2),
              borderRadius: radius.pill,
              paddingVertical: 9,
              paddingHorizontal: 15,
              minHeight: hit.minHeight - 8,
              justifyContent: "center",
            }}
          >
            <T v="body" style={{ fontSize: 12.5 }}>
              {label}
            </T>
          </Pressable>
        ))}
      </ScrollView>

      {/* Entrada */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: space.xl,
          paddingTop: space.s,
          paddingBottom: insets.bottom + space.m,
          borderTopWidth: 1,
          borderTopColor: inkAlpha(0.08),
        }}
      >
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder={t("typeMsg")}
          placeholderTextColor={inkAlpha(0.38)}
          onSubmitEditing={() => send(texto)}
          returnKeyType="send"
          style={{
            flex: 1,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: inkAlpha(0.12),
            borderRadius: radius.pill,
            paddingVertical: 13,
            paddingHorizontal: 18,
            fontFamily: font.sansLight,
            fontSize: 13.5,
            color: color.ink,
            minHeight: hit.minHeight,
          }}
          accessibilityLabel={t("typeMsg")}
        />
        <Pressable
          onPress={() => send(texto)}
          accessibilityRole="button"
          accessibilityLabel={t("order")}
          style={{
            width: hit.minWidth,
            height: hit.minHeight,
            borderRadius: hit.minHeight / 2,
            backgroundColor: color.ink,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T v="body" c={color.white} style={{ fontSize: 17 }}>
            {SEND}
          </T>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
