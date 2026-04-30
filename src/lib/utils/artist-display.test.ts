// src/lib/utils/artist-display.test.ts
import { formatArtistDisplay, formatArtistDisplayFromNames } from "./artist-display";

describe("formatArtistDisplay", () => {
  describe("formatArtistDisplayFromNames", () => {
    it("returns empty string for empty array", () => {
      expect(formatArtistDisplayFromNames([])).toBe("");
    });

    it("returns single artist name for 1 artist", () => {
      expect(formatArtistDisplayFromNames(["Not Guilty"])).toBe("Not Guilty");
    });

    it("returns 'Artist1 & Artist2' for 2 artists", () => {
      expect(formatArtistDisplayFromNames(["Not Guilty", "The Remedy"])).toBe(
        "Not Guilty & The Remedy"
      );
    });

    it("returns 'Artist1 + N more' for 3+ artists", () => {
      expect(
        formatArtistDisplayFromNames(["Not Guilty", "The Remedy", "Jazz Trio"])
      ).toBe("Not Guilty + 2 more");
    });

    it("returns 'Artist1 + 3 more' for 4 artists", () => {
      expect(
        formatArtistDisplayFromNames([
          "Not Guilty",
          "The Remedy",
          "Jazz Trio",
          "Rock Band",
        ])
      ).toBe("Not Guilty + 3 more");
    });

    it("handles undefined/null gracefully", () => {
      expect(formatArtistDisplayFromNames(undefined as unknown as string[])).toBe("");
      expect(formatArtistDisplayFromNames(null as unknown as string[])).toBe("");
    });
  });

  describe("formatArtistDisplay (from Event)", () => {
    const mockEvent = (artistNames: string[] | undefined, artistName?: string) => ({
      artistNames,
      artistName,
    });

    it("uses artistNames array when available", () => {
      const event = mockEvent(["Artist1", "Artist2", "Artist3"]);
      expect(formatArtistDisplay(event as any)).toBe("Artist1 + 2 more");
    });

    it("falls back to artistName when artistNames is empty", () => {
      const event = mockEvent([], "Solo Artist");
      expect(formatArtistDisplay(event as any)).toBe("Solo Artist");
    });

    it("falls back to artistName when artistNames is undefined", () => {
      const event = mockEvent(undefined, "Solo Artist");
      expect(formatArtistDisplay(event as any)).toBe("Solo Artist");
    });

    it("returns 'Live Music' when no artist info available", () => {
      const event = mockEvent(undefined, undefined);
      expect(formatArtistDisplay(event as any)).toBe("Live Music");
    });
  });
});
