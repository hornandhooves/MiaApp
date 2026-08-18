/**
 * Parser del enlace del sticker: mia://spot/<spotId>?t=<token>
 * (también acepta el universal link https con la misma cola).
 * Lógica pura — con tests.
 */
export interface SpotLink {
  spotId: string;
  token: string;
}

const SPOT_ID_RE = /^(bed|table)-\d{1,3}$/;

export function parseSpotLink(raw: string): SpotLink | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "mia:" && url.protocol !== "https:") return null;

  // mia://spot/bed-14 → host "spot", path "/bed-14"
  // https://miatulum.com/spot/bed-14 → path "/spot/bed-14"
  const segments = [url.host, ...url.pathname.split("/")].filter(Boolean);
  const spotIdx = segments.indexOf("spot");
  if (spotIdx === -1) return null;
  const spotId = segments[spotIdx + 1];
  if (!spotId || !SPOT_ID_RE.test(spotId)) return null;

  const token = url.searchParams.get("t");
  if (!token) return null;

  return { spotId, token };
}

/**
 * Etiqueta humana del lugar de la sesión: el camastro/mesa vinculado
 * o, en su defecto, la habitación de la estancia. Las palabras llegan
 * ya traducidas (t("bedPick")/t("tablePick")/t("roomKey")) para que la
 * lógica quede pura y testeable.
 */
export function spotOrRoomLabel(
  spotId: string | null,
  roomId: string | null,
  bedWord: string,
  tableWord: string,
  roomWord: string,
): string | null {
  if (spotId) {
    const [kind, num] = spotId.split("-");
    const word = kind === "table" ? tableWord : bedWord;
    return `${word.toLowerCase()} ${num ?? ""}`.trim();
  }
  if (roomId) {
    const num = roomId.split("-")[1] ?? roomId;
    return `${roomWord.toLowerCase()} ${num}`;
  }
  return null;
}
