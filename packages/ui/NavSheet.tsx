/**
 * Nav sheet del prototipo: hoja oscura con las ocho secciones del
 * sitio ("Explorar") y las herramientas de la visita ("Tu visita").
 */
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./T";
import { color, hit, radius, space, whiteAlpha } from "./tokens";

export interface SheetEntry {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

interface NavSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  siteTitle: string;
  appTitle: string;
  closeLabel: string;
  site: SheetEntry[];
  app: SheetEntry[];
}

function Row({ entry, big }: { entry: SheetEntry; big: boolean }) {
  return (
    <Pressable
      onPress={entry.onPress}
      accessibilityRole="link"
      accessibilityLabel={entry.label}
      style={{ minHeight: hit.minHeight, justifyContent: "center" }}
    >
      <T
        v={big ? "heading" : "body"}
        c={
          entry.active
            ? color.accent
            : big
              ? color.white
              : whiteAlpha(0.72)
        }
      >
        {entry.label}
      </T>
    </Pressable>
  );
}

export function NavSheet({
  open,
  onClose,
  title,
  siteTitle,
  appTitle,
  closeLabel,
  site,
  app,
}: NavSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          accessibilityLabel={closeLabel}
          style={{ flex: 1 }}
        />
        <View
          style={{
            backgroundColor: color.ink,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingHorizontal: space.gutter,
            paddingTop: space.xxl,
            paddingBottom: insets.bottom + space.xl,
          }}
        >
          <T v="label" c={whiteAlpha(0.45)}>
            {title}
          </T>
          <View style={{ marginTop: space.l }}>
            <T v="labelSmall" c={whiteAlpha(0.45)}>
              {siteTitle}
            </T>
            {site.map((e) => (
              <Row key={e.key} entry={e} big />
            ))}
          </View>
          <View style={{ marginTop: space.xl }}>
            <T v="labelSmall" c={whiteAlpha(0.45)}>
              {appTitle}
            </T>
            {app.map((e) => (
              <Row key={e.key} entry={e} big={false} />
            ))}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            style={{
              marginTop: space.xxl,
              minHeight: hit.minHeight,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: whiteAlpha(0.34),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T v="bodyMedium" c={color.white}>
              {closeLabel}
            </T>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
