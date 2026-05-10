/**
 * @jest-environment node
 *
 * Tests for the API response envelope helpers (src/lib/utils/apiResponse.ts).
 *
 * Standards coverage:
 * - 📋 Functional: Envelope shape, status codes, header propagation
 * - 🔒 Contract: Always returns { success, data } or { success, error }
 */
import {
  ok,
  fail,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  serverError,
} from "@/lib/utils/apiResponse";

describe("apiResponse helpers", () => {
  describe("ok", () => {
    it("returns 200 with { success: true, data } envelope by default", async () => {
      const res = ok({ hello: "world" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true, data: { hello: "world" } });
    });

    it("respects a custom status code", async () => {
      const res = ok({ id: "abc" }, 201);
      expect(res.status).toBe(201);
    });

    it("preserves headers passed via init", () => {
      const res = ok({ ok: true }, 200, { headers: { "X-Trace": "t1" } });
      expect(res.headers.get("X-Trace")).toBe("t1");
    });

    it("supports a null data payload", async () => {
      const res = ok(null);
      const body = await res.json();
      expect(body).toEqual({ success: true, data: null });
    });
  });

  describe("fail", () => {
    it("returns 500 with { success: false, error } envelope by default", async () => {
      const res = fail("oops");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ success: false, error: "oops" });
    });

    it("respects a custom status code", async () => {
      const res = fail("nope", 418);
      expect(res.status).toBe(418);
    });

    it("preserves headers passed via init", () => {
      const res = fail("rate-limited", 429, {
        headers: { "Retry-After": "60" },
      });
      expect(res.headers.get("Retry-After")).toBe("60");
    });
  });

  describe("status helpers", () => {
    it("badRequest → 400", async () => {
      const res = badRequest("missing field");
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: "missing field",
      });
    });

    it("unauthorized → 401", () => {
      expect(unauthorized().status).toBe(401);
    });

    it("forbidden → 403", () => {
      expect(forbidden().status).toBe(403);
    });

    it("notFound → 404", () => {
      expect(notFound().status).toBe(404);
    });

    it("tooManyRequests → 429", () => {
      expect(tooManyRequests().status).toBe(429);
    });

    it("serverError → 500", () => {
      expect(serverError().status).toBe(500);
    });

    it("each helper accepts a custom message", async () => {
      const cases: Array<[ReturnType<typeof badRequest>, number, string]> = [
        [badRequest("a"), 400, "a"],
        [unauthorized("b"), 401, "b"],
        [forbidden("c"), 403, "c"],
        [notFound("d"), 404, "d"],
        [tooManyRequests("e"), 429, "e"],
        [serverError("f"), 500, "f"],
      ];
      for (const [res, expectedStatus, expectedMessage] of cases) {
        expect(res.status).toBe(expectedStatus);
        const body = await res.json();
        expect(body).toEqual({ success: false, error: expectedMessage });
      }
    });
  });
});
