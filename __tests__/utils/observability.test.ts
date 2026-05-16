/**
 * @jest-environment node
 *
 * Tests for src/lib/utils/observability.ts
 *
 * Standards coverage:
 * - 🔒 Security: PII redaction at the log boundary (no email/phone/tokens leak)
 * - 📋 Functional: Structured logging shape preserved for future Sentry swap-in
 */

import { logError, logEvent } from "@/lib/utils/observability";

describe("observability", () => {
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  describe("logError", () => {
    it("logs the Error message and stack with the [error] tag", () => {
      const err = new Error("boom");
      logError(err);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [tag, payload] = errorSpy.mock.calls[0];
      expect(tag).toBe("[error]");
      expect(payload).toMatchObject({
        message: "boom",
        stack: expect.stringContaining("Error: boom"),
      });
    });

    it("stringifies non-Error rejections (string, number, object)", () => {
      logError("just a string");
      logError(404);
      logError({ kind: "weird" });
      expect(errorSpy).toHaveBeenCalledTimes(3);
      expect(errorSpy.mock.calls[0][1].message).toBe("just a string");
      expect(errorSpy.mock.calls[1][1].message).toBe("404");
      expect(errorSpy.mock.calls[2][1].message).toBe("[object Object]");
      // Non-Error values have no stack
      expect(errorSpy.mock.calls[0][1].stack).toBeUndefined();
    });

    it("🔒 redacts PII keys at the top level", () => {
      logError(new Error("x"), {
        email: "leak@example.com",
        customerEmail: "also-leak@example.com",
        customerName: "Jane Doe",
        customerPhone: "555-0123",
        phone: "555-0124",
        password: "hunter2",
        passwordHash: "$2a$10$abc",
        token: "tok_123",
        sessionToken: "sess_xyz",
        Authorization: "Bearer xxx",
        authorization: "Basic xxx",
        cookie: "next-auth.session-token=abc",
        Cookie: "next-auth.session-token=abc",
        safe: "ok",
      });
      const payload = errorSpy.mock.calls[0][1];
      for (const k of [
        "email",
        "customerEmail",
        "customerName",
        "customerPhone",
        "phone",
        "password",
        "passwordHash",
        "token",
        "sessionToken",
        "Authorization",
        "authorization",
        "cookie",
        "Cookie",
      ]) {
        expect(payload[k]).toBe("[redacted]");
      }
      expect(payload.safe).toBe("ok");
    });

    it("🔒 redacts PII keys nested inside objects and arrays", () => {
      logError(new Error("nested"), {
        request: {
          headers: { authorization: "Bearer xxx", "x-other": "ok" },
          body: { email: "leak@example.com", make: "Tesla" },
        },
        recent: [
          { email: "a@b.com", id: 1 },
          { email: "c@d.com", id: 2 },
        ],
      });
      const payload = errorSpy.mock.calls[0][1];
      expect(payload.request.headers.authorization).toBe("[redacted]");
      expect(payload.request.headers["x-other"]).toBe("ok");
      expect(payload.request.body.email).toBe("[redacted]");
      expect(payload.request.body.make).toBe("Tesla");
      expect(payload.recent[0].email).toBe("[redacted]");
      expect(payload.recent[0].id).toBe(1);
      expect(payload.recent[1].email).toBe("[redacted]");
    });

    it("preserves null and undefined context values without throwing", () => {
      expect(() =>
        logError(new Error("x"), { a: null, b: undefined, c: 0 })
      ).not.toThrow();
      const payload = errorSpy.mock.calls[0][1];
      expect(payload.a).toBeNull();
      expect(payload.b).toBeUndefined();
      expect(payload.c).toBe(0);
    });
  });

  describe("logEvent", () => {
    it("logs the event name prefixed with [event] and a redacted context", () => {
      logEvent("admin.password_reset", {
        actor: "admin1",
        email: "user@example.com",
      });
      expect(logSpy).toHaveBeenCalledTimes(1);
      const [label, ctx] = logSpy.mock.calls[0];
      expect(label).toBe("[event] admin.password_reset");
      expect(ctx).toEqual({ actor: "admin1", email: "[redacted]" });
    });

    it("emits a clean object when no context is passed", () => {
      logEvent("test.event");
      expect(logSpy).toHaveBeenCalledWith("[event] test.event", {});
    });
  });
});
