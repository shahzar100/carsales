import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * MIDDLEWARE FOR CSRF PROTECTION
 *
 * Security headers are set in next.config.ts via the headers() function
 * to avoid duplication. This middleware handles CSRF only.
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSRF protection for state-changing methods on API routes
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method) &&
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Reject requests without an Origin header (non-browser clients)
    // Exception: cron routes (Vercel cron invocations don't send Origin)
    const isCronRoute = request.nextUrl.pathname.startsWith("/api/cron/");

    if (!isCronRoute) {
      if (!origin) {
        return NextResponse.json(
          { error: "Missing Origin header" },
          { status: 403 }
        );
      }

      // Strict host comparison — parse origin URL to prevent substring bypass
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "CSRF validation failed" },
          { status: 403 }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
