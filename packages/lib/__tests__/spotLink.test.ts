import { parseSpotLink } from "../spotLink";

describe("parseSpotLink", () => {
  it("acepta el esquema propio con token", () => {
    expect(parseSpotLink("mia://spot/bed-14?t=2026-08-17.abc")).toEqual({
      spotId: "bed-14",
      token: "2026-08-17.abc",
    });
  });

  it("acepta mesas y universal links https", () => {
    expect(
      parseSpotLink("https://miatulum.com/spot/table-62?t=x.y"),
    ).toEqual({ spotId: "table-62", token: "x.y" });
  });

  it("rechaza sin token", () => {
    expect(parseSpotLink("mia://spot/bed-14")).toBeNull();
  });

  it("rechaza spotIds malformados", () => {
    expect(parseSpotLink("mia://spot/puerta-1?t=x")).toBeNull();
    expect(parseSpotLink("mia://spot/bed-?t=x")).toBeNull();
  });

  it("rechaza esquemas ajenos y basura", () => {
    expect(parseSpotLink("http://miatulum.com/spot/bed-14?t=x")).toBeNull();
    expect(parseSpotLink("no es un url")).toBeNull();
  });
});
