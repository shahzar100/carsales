/**
 * @jest-environment node
 *
 * Verifies the featured-car cache behaviour. KV path uses a `fetch` mock so
 * the test stays hermetic; in-memory fallback exercises the real module
 * state.
 */
import {
  FEATURED_CAR_TTL_SECONDS,
  invalidateFeaturedCarCache,
  readFeaturedCarCache,
  writeFeaturedCarCache,
  _resetFeaturedCarMemoryCache,
} from "@/lib/utils/featuredCarCache";

describe("featuredCarCache — in-memory fallback (no KV env)", () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    _resetFeaturedCarMemoryCache();
  });

  it("returns undefined when there is no cache entry", async () => {
    expect(await readFeaturedCarCache()).toBeUndefined();
  });

  it("round-trips a value", async () => {
    await writeFeaturedCarCache({ make: "Toyota" });
    expect(await readFeaturedCarCache()).toEqual({ make: "Toyota" });
  });

  it("caches a null result so we don't re-query Mongo", async () => {
    await writeFeaturedCarCache(null);
    expect(await readFeaturedCarCache()).toBeNull();
  });

  it("invalidates", async () => {
    await writeFeaturedCarCache({ make: "BMW" });
    await invalidateFeaturedCarCache();
    expect(await readFeaturedCarCache()).toBeUndefined();
  });
});

describe("featuredCarCache — KV path", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env.KV_REST_API_URL = "https://kv.example.com";
    process.env.KV_REST_API_TOKEN = "token";
  });
  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("issues a GET when reading", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: JSON.stringify({ make: "Audi" }) }),
    });
    global.fetch = fetchMock as never;

    const value = await readFeaturedCarCache();

    expect(value).toEqual({ make: "Audi" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://kv.example.com/get/featured-car",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer token" },
      })
    );
  });

  it("issues a POST with TTL when writing", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: "OK" }),
    });
    global.fetch = fetchMock as never;

    await writeFeaturedCarCache({ make: "Audi" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/set/featured-car/`),
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock.mock.calls[0][0]).toContain(
      `EX=${FEATURED_CAR_TTL_SECONDS}`
    );
  });

  it("returns undefined and logs on KV error", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    global.fetch = fetchMock as never;

    const value = await readFeaturedCarCache();
    expect(value).toBeUndefined();
  });
});
