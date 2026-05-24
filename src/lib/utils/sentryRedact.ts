/**
 * Sentry `beforeSend` PII scrubbers.
 *
 * The SDK auto-captures the request URL on any error event. Query strings
 * in this app can contain bearer-credential-equivalent pairs — booking
 * lookup, magic-link tokens, Turnstile tokens, password-reset codes — and
 * we don't want them leaving the process untouched.
 *
 * `redactUrlQueryParams` is a pure helper: takes a URL string, returns
 * the same string with sensitive query values replaced by "[REDACTED]".
 * Param names are matched case-insensitively. Malformed input is returned
 * as-is rather than throwing — the scrubber must never break event
 * delivery.
 *
 * `beforeSendRedact` is the Sentry hook entry point: walks the event
 * shape (request.url, request.query_string, breadcrumb.data.url) and
 * applies the scrubber. Wire it into each `sentry.{client,server,edge}
 * .config.ts` `Sentry.init({ beforeSend, beforeBreadcrumb })` slot.
 */

const SENSITIVE_PARAMS = new Set([
  "ref",
  "email",
  "token",
  "turnstileToken",
  "turnstile_token",
  "password",
  "secret",
  "apiKey",
  "api_key",
  "sessionId",
  "session_id",
  "auth",
  "code",
]);

const SENSITIVE_LOWER = new Set(Array.from(SENSITIVE_PARAMS, (k) => k.toLowerCase()));

export function redactUrlQueryParams(url: string | undefined): string | undefined {
  if (!url) return url;
  const qIndex = url.indexOf("?");
  if (qIndex === -1) return url;

  const base = url.slice(0, qIndex);
  const query = url.slice(qIndex + 1);

  // Some captured "URLs" are actually just the query-string fragment that
  // Sentry pulls from `event.request.query_string`. Re-parse the whole
  // input as a query string when there's no scheme — keeps both shapes
  // working.
  const pairs = query.split("&");
  const out: string[] = [];
  for (const pair of pairs) {
    if (!pair) {
      out.push(pair);
      continue;
    }
    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const decodedKey = safeDecode(rawKey);
    if (SENSITIVE_LOWER.has(decodedKey.toLowerCase())) {
      out.push(`${rawKey}=[REDACTED]`);
    } else {
      out.push(pair);
    }
  }
  return `${base}?${out.join("&")}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Strip sensitive query params from anywhere they might surface on a
 * Sentry event. Typed against Sentry's actual `ErrorEvent` so the
 * function plugs straight into `Sentry.init({ beforeSend })` without a
 * cast.
 *
 * `query_string` in Sentry is `string | Record<string,string> | [string,string][] | null`
 * — handled below with runtime narrowing so all three shapes are scrubbed.
 */
import type { ErrorEvent } from "@sentry/nextjs";

export function beforeSendRedact(event: ErrorEvent): ErrorEvent {
  const request = event.request;
  if (request) {
    if (typeof request.url === "string") {
      request.url = redactUrlQueryParams(request.url);
    }
    const query = request.query_string;
    if (typeof query === "string") {
      // query_string is the raw query without the `?` prefix — round-trip
      // via the URL helper by prefixing a sentinel base.
      const redacted = redactUrlQueryParams(`?${query}`);
      request.query_string = redacted ? redacted.slice(1) : redacted;
    } else if (Array.isArray(query)) {
      // [["ref","BK-1"], ["page","2"]] form — mutate the tuple values in
      // place so the redaction sticks.
      for (const entry of query) {
        if (
          Array.isArray(entry) &&
          typeof entry[0] === "string" &&
          SENSITIVE_LOWER.has(entry[0].toLowerCase())
        ) {
          entry[1] = "[REDACTED]";
        }
      }
    } else if (query && typeof query === "object") {
      // { ref: "BK-1", page: "2" } form — same idea, walk the keys.
      const record = query as Record<string, string>;
      for (const key of Object.keys(record)) {
        if (SENSITIVE_LOWER.has(key.toLowerCase())) {
          record[key] = "[REDACTED]";
        }
      }
    }
  }
  if (Array.isArray(event.breadcrumbs)) {
    for (const breadcrumb of event.breadcrumbs) {
      if (!breadcrumb || typeof breadcrumb !== "object") continue;
      const data = breadcrumb.data;
      if (data && typeof data === "object") {
        if (typeof data.url === "string") {
          data.url = redactUrlQueryParams(data.url);
        }
        if (typeof data.to === "string") {
          data.to = redactUrlQueryParams(data.to);
        }
      }
    }
  }
  return event;
}
