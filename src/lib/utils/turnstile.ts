/**
 * (#17) Cloudflare Turnstile verification.
 *
 * Public booking forms are open POST endpoints — without a CAPTCHA the
 * day this site starts ranking is the day the admin inbox fills up with
 * spam reservations. Turnstile is free, privacy-friendly, and invisible
 * to most legitimate users.
 *
 * Usage:
 *   - Client: include `<TurnstileWidget onToken={...} />` in the form
 *   - Server: call `verifyTurnstileToken(token, request)` before doing work
 *
 * If `TURNSTILE_SECRET_KEY` is not set we treat verification as a
 * no-op so local development and existing tests still work. Production
 * should set both site key and secret.
 */

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  cdata?: string;
}

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev / test fallback: if no secret is configured, accept everything.
  // Production deploys should set TURNSTILE_SECRET_KEY in the env.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      // Loud fail in prod — refusing to silently let spam through.
      return { ok: false, reason: "captcha-not-configured" };
    }
    return { ok: true };
  }

  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing-token" };
  }

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp) form.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      // Don't let Turnstile slow us down indefinitely.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, reason: `verify-http-${res.status}` };
    }
    const data = (await res.json()) as TurnstileResponse;
    if (data.success) return { ok: true };
    return {
      ok: false,
      reason: (data["error-codes"] ?? ["unknown"]).join(","),
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "verify-failed",
    };
  }
}
