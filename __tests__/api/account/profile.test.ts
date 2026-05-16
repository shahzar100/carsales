/**
 * @jest-environment node
 *
 * Tests for /api/account/profile (src/app/api/account/profile/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: auth-gated; identity from session not body
 * - 📋 Functional: GET returns derived flags (hasPassword, emailVerified);
 *   PATCH updates name and stamps updatedAt
 * - 🎯 Usability: clear 400 messages for missing/invalid name
 */
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/account/profile/route";
import { getTestCollections } from "../../utils/testUtils";

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

async function seedUser(email: string, fields: Record<string, unknown> = {}) {
  const { users, client } = await getTestCollections();
  await users.insertOne({
    email,
    name: "Original",
    createdAt: new Date(),
    ...fields,
  } as never);
  await client.close();
}

function makePatch(body: unknown) {
  return new NextRequest("http://localhost:3000/api/account/profile", {
    method: "PATCH",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/account/profile", () => {
  beforeEach(() => mockAuth.mockReset());

  describe("GET", () => {
    it("🔒 returns 401 when not signed in", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns 404 when the account document is missing", async () => {
      mockAuth.mockResolvedValue({ user: { email: "ghost@example.com" } });
      const res = await GET();
      expect(res.status).toBe(404);
    });

    it("returns derived flags hasPassword=true / emailVerified=true correctly", async () => {
      mockAuth.mockResolvedValue({ user: { email: "p@example.com" } });
      await seedUser("p@example.com", {
        name: "Pat",
        password: "bcrypt-hash",
        emailVerified: new Date(),
      });
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data).toMatchObject({
        name: "Pat",
        email: "p@example.com",
        hasPassword: true,
        emailVerified: true,
      });
    });

    it("returns hasPassword=false / emailVerified=false when neither is set", async () => {
      mockAuth.mockResolvedValue({ user: { email: "q@example.com" } });
      await seedUser("q@example.com", { name: "Q" });
      const res = await GET();
      const json = await res.json();
      expect(json.data.hasPassword).toBe(false);
      expect(json.data.emailVerified).toBe(false);
    });

    it("returns name='' when stored as null/undefined", async () => {
      mockAuth.mockResolvedValue({ user: { email: "n@example.com" } });
      await seedUser("n@example.com", { name: null });
      const res = await GET();
      const json = await res.json();
      expect(json.data.name).toBe("");
    });
  });

  describe("PATCH", () => {
    it("🔒 returns 401 when not signed in", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await PATCH(makePatch({ name: "x" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 for malformed JSON body", async () => {
      mockAuth.mockResolvedValue({ user: { email: "p@example.com" } });
      const res = await PATCH(makePatch("not-json"));
      expect(res.status).toBe(400);
    });

    it("returns 400 when name is empty after trim", async () => {
      mockAuth.mockResolvedValue({ user: { email: "p@example.com" } });
      const res = await PATCH(makePatch({ name: "   " }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when name exceeds 80 characters", async () => {
      mockAuth.mockResolvedValue({ user: { email: "p@example.com" } });
      const res = await PATCH(makePatch({ name: "x".repeat(81) }));
      expect(res.status).toBe(400);
    });

    it("updates the name and stamps updatedAt", async () => {
      mockAuth.mockResolvedValue({ user: { email: "p@example.com" } });
      await seedUser("p@example.com");
      const res = await PATCH(makePatch({ name: " Renamed " }));
      const json = await res.json();
      expect(res.status).toBe(200);
      // Server should trim whitespace before persisting.
      expect(json.data.name).toBe("Renamed");

      const { users, client } = await getTestCollections();
      const saved = await users.findOne({ email: "p@example.com" });
      expect(saved?.name).toBe("Renamed");
      expect(saved?.updatedAt).toBeInstanceOf(Date);
      await client.close();
    });
  });
});
