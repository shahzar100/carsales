/**
 * Tests for src/lib/utils/sentryRedact.ts
 *
 * The scrubber must:
 *  - replace values for known-sensitive params with "[REDACTED]"
 *  - leave other params untouched
 *  - match param names case-insensitively
 *  - tolerate URLs with no query string (return unchanged)
 *  - tolerate malformed input (never throw)
 *  - reach into event.request.query_string and breadcrumb.data.url too
 *
 * Source: PR #77's security review (Medium finding #2).
 */
import type { ErrorEvent } from "@sentry/nextjs";
import {
  redactUrlQueryParams,
  beforeSendRedact,
} from "@/lib/utils/sentryRedact";

// Test fixtures construct just the fields the scrubber reads. Sentry's
// `ErrorEvent` has a required `type: 'transaction' | 'feedback' | undefined`
// among other things — we don't care for these tests, so cast at the
// boundary.
const evt = <T extends object>(e: T): ErrorEvent => e as unknown as ErrorEvent;

describe("redactUrlQueryParams", () => {
  it("redacts a single sensitive param", () => {
    expect(
      redactUrlQueryParams("/api/bookings/lookup?ref=BK-12345")
    ).toBe("/api/bookings/lookup?ref=[REDACTED]");
  });

  it("preserves non-sensitive params", () => {
    expect(redactUrlQueryParams("/cars?make=Tesla&year=2024")).toBe(
      "/cars?make=Tesla&year=2024"
    );
  });

  it("redacts sensitive and preserves non-sensitive in the same URL", () => {
    expect(
      redactUrlQueryParams(
        "/api/bookings/lookup?ref=BK-12345&email=x@y.com&page=2"
      )
    ).toBe("/api/bookings/lookup?ref=[REDACTED]&email=[REDACTED]&page=2");
  });

  it("returns the input unchanged when there is no query string", () => {
    expect(redactUrlQueryParams("/api/cars")).toBe("/api/cars");
  });

  it("returns undefined/empty input unchanged", () => {
    expect(redactUrlQueryParams(undefined)).toBeUndefined();
    expect(redactUrlQueryParams("")).toBe("");
  });

  it("matches param names case-insensitively", () => {
    expect(redactUrlQueryParams("/x?Email=x@y.com")).toBe("/x?Email=[REDACTED]");
    expect(redactUrlQueryParams("/x?TURNSTILETOKEN=abc")).toBe(
      "/x?TURNSTILETOKEN=[REDACTED]"
    );
  });

  it("redacts both snake_case and camelCase variants", () => {
    expect(redactUrlQueryParams("/x?turnstile_token=abc&api_key=k")).toBe(
      "/x?turnstile_token=[REDACTED]&api_key=[REDACTED]"
    );
    expect(redactUrlQueryParams("/x?turnstileToken=abc&apiKey=k")).toBe(
      "/x?turnstileToken=[REDACTED]&apiKey=[REDACTED]"
    );
  });

  it("does not throw on a malformed URL — returns input as-is or scrubbed best-effort", () => {
    // Malformed but the question-mark split still works.
    expect(() =>
      redactUrlQueryParams("not://a/real/url?ref=x")
    ).not.toThrow();
    expect(redactUrlQueryParams("not://a/real/url?ref=x")).toBe(
      "not://a/real/url?ref=[REDACTED]"
    );
  });

  it("tolerates an empty value or empty pair", () => {
    expect(redactUrlQueryParams("/x?ref=&email=y@z.com")).toBe(
      "/x?ref=[REDACTED]&email=[REDACTED]"
    );
    expect(redactUrlQueryParams("/x?&ref=BK")).toBe("/x?&ref=[REDACTED]");
  });
});

describe("beforeSendRedact", () => {
  it("scrubs event.request.url", () => {
    const out = beforeSendRedact(
      evt({ request: { url: "/api/bookings/lookup?ref=BK-1&email=x@y.com" } })
    );
    expect(out.request?.url).toBe(
      "/api/bookings/lookup?ref=[REDACTED]&email=[REDACTED]"
    );
  });

  it("scrubs event.request.query_string (no leading ?)", () => {
    const out = beforeSendRedact(
      evt({ request: { query_string: "ref=BK-1&page=2" } })
    );
    expect(out.request?.query_string).toBe("ref=[REDACTED]&page=2");
  });

  it("scrubs query_string when supplied as a key/value record", () => {
    const out = beforeSendRedact(
      evt({ request: { query_string: { ref: "BK-1", page: "2" } } })
    );
    expect(out.request?.query_string).toEqual({
      ref: "[REDACTED]",
      page: "2",
    });
  });

  it("scrubs query_string when supplied as a tuple array", () => {
    const out = beforeSendRedact(
      evt({
        request: {
          query_string: [
            ["ref", "BK-1"],
            ["page", "2"],
          ],
        },
      })
    );
    expect(out.request?.query_string).toEqual([
      ["ref", "[REDACTED]"],
      ["page", "2"],
    ]);
  });

  it("scrubs breadcrumb data.url and data.to", () => {
    const out = beforeSendRedact(
      evt({
        breadcrumbs: [
          { data: { url: "/x?token=abc" } },
          { data: { to: "/y?password=hunter2" } },
          { data: { url: "/safe?make=Tesla" } },
        ],
      })
    );
    expect(out.breadcrumbs?.[0]?.data?.url).toBe("/x?token=[REDACTED]");
    expect(out.breadcrumbs?.[1]?.data?.to).toBe("/y?password=[REDACTED]");
    expect(out.breadcrumbs?.[2]?.data?.url).toBe("/safe?make=Tesla");
  });

  it("returns the event when request and breadcrumbs are absent", () => {
    const out = beforeSendRedact(evt({ foo: "bar" }));
    expect(out).toEqual({ foo: "bar" });
  });

  it("ignores breadcrumbs without data or with non-string url/to", () => {
    const event = evt({
      breadcrumbs: [
        {},
        { data: undefined },
        { data: { url: 42 as unknown as string } },
      ],
    });
    expect(() => beforeSendRedact(event)).not.toThrow();
  });
});
