import { NextResponse } from "next/server";
import { logEvent } from "@/lib/utils/observability";

export const runtime = "edge";

/**
 * Receives CSP violation reports from the browser.
 *
 * The proxy emits a Content-Security-Policy-Report-Only header with a
 * tightened style-src ('self' only, no 'unsafe-inline') and points
 * `report-uri` here. Reports stream into the structured log so we can
 * observe what would break before we flip the live CSP to enforce.
 *
 * Browsers POST the report as application/csp-report (legacy spec) or
 * application/reports+json (Reporting API). We accept either, no
 * authentication — the body is browser-supplied telemetry and the worst
 * a hostile caller can do is fill the log. Mitigated by:
 *   1. 64KB hard cap on the body
 *   2. Stripping `script-sample` which can echo arbitrary page content
 *   3. Same-origin CSRF gate in proxy.ts already blocks XHRs from
 *      foreign origins for POST routes outside /api/cron.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 65536) {
      return NextResponse.json({ ok: true }, { status: 204 });
    }
    let body: unknown = null;
    try {
      body = JSON.parse(raw);
    } catch {
      // malformed JSON — drop silently
      return NextResponse.json({ ok: true }, { status: 204 });
    }

    // Both legacy and modern shapes expose violatedDirective + blockedURL.
    type LegacyReport = { "csp-report"?: Record<string, unknown> };
    type ModernReport = { type?: string; body?: Record<string, unknown> };
    const legacy = (body as LegacyReport)["csp-report"];
    const modern = (body as ModernReport).body;
    const report = legacy ?? modern ?? body;

    if (typeof report === "object" && report !== null) {
      const r = report as Record<string, unknown>;
      // script-sample can echo HTML content from the page — drop it
      delete r["script-sample"];
      logEvent("csp_violation", {
        directive:
          r["violated-directive"] ??
          r["violatedDirective"] ??
          r["effective-directive"] ??
          "unknown",
        blocked: r["blocked-uri"] ?? r["blockedURL"] ?? "unknown",
        document: r["document-uri"] ?? r["documentURL"] ?? "unknown",
        disposition: r["disposition"] ?? "report",
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    // Don't 500 on report-only telemetry — the browser will retry and noise the logs.
    return new NextResponse(null, { status: 204 });
  }
}
