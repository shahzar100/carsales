/**
 * @jest-environment node
 *
 * Tests for src/app/sitemap.ts
 *
 * Standards coverage:
 * - 📋 Functional: static page list + dynamic car pages from getCarsCollection
 * - 🎯 Usability: DB failure degrades gracefully (static pages still ship)
 * - 🔒 SEO: only `available` cars are listed publicly
 */

const mockToArray = jest.fn();
const mockFind = jest.fn(() => ({
  toArray: mockToArray,
}));
const mockGetCarsCollection = jest.fn();
const mockSerialize = jest.fn((doc: unknown) => doc);

jest.mock("@/lib/models", () => ({
  getCarsCollection: () => mockGetCarsCollection(),
  serializeDocument: (doc: unknown) => mockSerialize(doc),
}));

const mockLogError = jest.fn();
jest.mock("@/lib/utils/observability", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
  logEvent: jest.fn(),
}));

import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    mockGetCarsCollection.mockResolvedValue({ find: mockFind });
  });

  it("includes all the static marketing pages plus the available cars", async () => {
    mockToArray.mockResolvedValue([
      { _id: "a", updatedAt: new Date("2026-04-01T00:00:00Z") },
      { _id: "b", updatedAt: null },
    ]);

    const out = await sitemap();
    const urls = out.map((e) => e.url);
    expect(urls).toContain("https://example.test");
    expect(urls).toContain("https://example.test/BrowseFleet");
    expect(urls).toContain("https://example.test/CarParts");
    expect(urls).toContain("https://example.test/BrowseFleet/a");
    expect(urls).toContain("https://example.test/BrowseFleet/b");
  });

  it("🔒 only queries cars with status='available'", async () => {
    mockToArray.mockResolvedValue([]);
    await sitemap();
    expect(mockFind).toHaveBeenCalledWith(
      { status: "available" },
      expect.objectContaining({ projection: { _id: 1, updatedAt: 1 } })
    );
  });

  it("uses the car's updatedAt when present", async () => {
    const stamp = new Date("2026-04-01T12:00:00Z");
    mockToArray.mockResolvedValue([{ _id: "a", updatedAt: stamp }]);
    const out = await sitemap();
    const entry = out.find((e) => e.url.endsWith("/BrowseFleet/a"));
    expect((entry?.lastModified as Date).toISOString()).toBe(
      stamp.toISOString()
    );
  });

  it("falls back to now() when a car has no updatedAt", async () => {
    mockToArray.mockResolvedValue([{ _id: "no-stamp", updatedAt: null }]);
    const out = await sitemap();
    const entry = out.find((e) => e.url.endsWith("/BrowseFleet/no-stamp"));
    expect(entry?.lastModified).toBeInstanceOf(Date);
  });

  it("🎯 still returns the static pages when the DB lookup throws", async () => {
    mockGetCarsCollection.mockRejectedValue(new Error("mongo offline"));
    const out = await sitemap();
    // Static pages still present
    expect(out.find((e) => e.url === "https://example.test")).toBeDefined();
    // No car pages
    expect(out.every((e) => !e.url.includes("/BrowseFleet/"))).toBe(true);
    // Logged via observability with the right context
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError.mock.calls[0][1]).toMatchObject({
      context: "sitemap.cars",
    });
  });

  it("falls back to localhost when NEXT_PUBLIC_SITE_URL is empty", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mockToArray.mockResolvedValue([]);
    const out = await sitemap();
    expect(out[0].url).toBe("http://localhost:3000");
  });
});
