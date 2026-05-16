/**
 * @jest-environment node
 *
 * Tests for /api/account/saved (src/app/api/account/saved/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: Unauthenticated requests rejected; the server enforces the
 *   50-item cap regardless of client; identity is taken from auth() not body.
 * - 📋 Functional: GET returns persisted list; PUT replaces it (full-list).
 * - 🎯 Usability: Malformed JSON / wrong shape get clear 400 responses.
 */
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/account/saved/route";
import { getTestCollections } from "../../utils/testUtils";

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

async function seedUser(
  email = "saved@example.com",
  savedCarIds: string[] = []
) {
  const { users, client } = await getTestCollections();
  await users.insertOne({
    email,
    passwordHash: "x",
    savedCarIds,
    createdAt: new Date(),
  } as never);
  await client.close();
}

function makePutRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/account/saved", {
    method: "PUT",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/account/saved", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  describe("GET", () => {
    it("🔒 returns 401 when no session is present", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns an empty list when the user record has no savedCarIds", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      await seedUser();
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.savedCarIds).toEqual([]);
    });

    it("returns the persisted savedCarIds list when present", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      await seedUser("saved@example.com", ["c1", "c2", "c3"]);
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.savedCarIds).toEqual(["c1", "c2", "c3"]);
    });

    it("returns an empty list when the user document does not exist yet", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "never-seen@example.com" },
      });
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.savedCarIds).toEqual([]);
    });
  });

  describe("PUT", () => {
    it("🔒 returns 401 when no session is present", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await PUT(makePutRequest({ ids: ["a"] }));
      expect(res.status).toBe(401);
    });

    it("returns 400 for a malformed JSON body", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      const res = await PUT(makePutRequest("not-json"));
      expect(res.status).toBe(400);
    });

    it("returns 400 when the body shape doesn't match the schema", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      const res = await PUT(makePutRequest({ wrong: "shape" }));
      expect(res.status).toBe(400);
    });

    it("persists the supplied ids and stamps updatedAt", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      await seedUser();
      const res = await PUT(makePutRequest({ ids: ["a", "b"] }));
      expect(res.status).toBe(200);

      const { users, client } = await getTestCollections();
      const saved = await users.findOne({ email: "saved@example.com" });
      expect(saved?.savedCarIds).toEqual(["a", "b"]);
      expect(saved?.updatedAt).toBeInstanceOf(Date);
      await client.close();
    });

    it("de-dupes the list before writing", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      await seedUser();
      const res = await PUT(makePutRequest({ ids: ["x", "x", "y", "x"] }));
      const json = await res.json();
      expect(json.data.savedCarIds).toEqual(["x", "y"]);
    });

    it("🔒 rejects payloads above the 50-item cap (server-side enforcement)", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "saved@example.com" },
      });
      const tooMany = Array.from({ length: 51 }, (_, i) => `c${i}`);
      const res = await PUT(makePutRequest({ ids: tooMany }));
      expect(res.status).toBe(400);
    });

    it("🔒 keys storage by session email, not anything in the body", async () => {
      // A logged-in customer can only mutate their own list — even if the
      // body claimed a different email field, the route should ignore it.
      mockAuth.mockResolvedValue({
        user: { email: "real-customer@example.com" },
      });
      await seedUser("real-customer@example.com");
      await seedUser("victim@example.com");

      await PUT(
        makePutRequest({ ids: ["pwned"], email: "victim@example.com" })
      );

      const { users, client } = await getTestCollections();
      const real = await users.findOne({ email: "real-customer@example.com" });
      const victim = await users.findOne({ email: "victim@example.com" });
      expect(real?.savedCarIds).toEqual(["pwned"]);
      expect(victim?.savedCarIds ?? []).toEqual([]);
      await client.close();
    });
  });
});
