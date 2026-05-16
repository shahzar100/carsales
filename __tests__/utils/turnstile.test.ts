/**
 * @jest-environment node
 *
 * Tests for src/lib/utils/turnstile.ts
 *
 * Standards coverage:
 * - 🔒 Security: dev shortcut never fires in production; missing token rejected
 * - 📋 Functional: posts secret+response to Cloudflare; relays error codes
 * - 🎯 Usability: network/HTTP failure mapped to a reason string, never throws
 */

import { verifyTurnstileToken } from "@/lib/utils/turnstile";

describe("verifyTurnstileToken", () => {
  const ORIGINAL_ENV = process.env;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.TURNSTILE_SECRET_KEY;
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("when no secret is configured", () => {
    it("returns ok=true in non-production (dev / test fallback)", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
        configurable: true,
      });
      await expect(verifyTurnstileToken("anything")).resolves.toEqual({
        ok: true,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("🔒 returns ok=false with captcha-not-configured in production", async () => {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
        configurable: true,
      });
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({
        ok: false,
        reason: "captcha-not-configured",
      });
      // Reset for other tests
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
        configurable: true,
      });
    });
  });

  describe("when a secret is configured", () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = "secret-key";
    });

    it("returns missing-token when called without a token", async () => {
      await expect(verifyTurnstileToken(null)).resolves.toEqual({
        ok: false,
        reason: "missing-token",
      });
      await expect(verifyTurnstileToken("")).resolves.toEqual({
        ok: false,
        reason: "missing-token",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("POSTs the secret and response to Cloudflare's siteverify URL", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      await verifyTurnstileToken("tok-123", "203.0.113.5");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify"
      );
      expect(init.method).toBe("POST");
      expect(init.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded"
      );
      const body = new URLSearchParams(init.body);
      expect(body.get("secret")).toBe("secret-key");
      expect(body.get("response")).toBe("tok-123");
      expect(body.get("remoteip")).toBe("203.0.113.5");
    });

    it("does not include remoteip when none is supplied", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      await verifyTurnstileToken("tok-123");
      const init = fetchMock.mock.calls[0][1];
      const body = new URLSearchParams(init.body);
      expect(body.has("remoteip")).toBe(false);
    });

    it("returns ok=true when Cloudflare reports success", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({ ok: true });
    });

    it("relays Cloudflare's error codes as a comma-joined reason", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          "error-codes": ["invalid-input-response", "timeout-or-duplicate"],
        }),
      });
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({
        ok: false,
        reason: "invalid-input-response,timeout-or-duplicate",
      });
    });

    it("returns reason=unknown when success=false with no error-codes", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      });
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({
        ok: false,
        reason: "unknown",
      });
    });

    it("maps non-2xx HTTP responses to verify-http-{status}", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 503 });
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({
        ok: false,
        reason: "verify-http-503",
      });
    });

    it("never throws — fetch rejection becomes a reason string", async () => {
      fetchMock.mockRejectedValue(new Error("network down"));
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({
        ok: false,
        reason: "network down",
      });
    });

    it("handles non-Error rejections gracefully", async () => {
      fetchMock.mockRejectedValue("plain string error");
      await expect(verifyTurnstileToken("tok")).resolves.toEqual({
        ok: false,
        reason: "verify-failed",
      });
    });
  });
});
