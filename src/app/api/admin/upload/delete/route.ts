import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { hasMinimumRole } from "@/lib/utils/auth";
import { deleteS3Object } from "@/lib/utils/s3";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

const ALLOWED_PREFIXES = ["cars/", "parts/"];

// Bound the worst case of a compromised manager session being used to
// nuke S3 objects in a loop. 60/min is well above legitimate cleanup
// during car / part deletions.
const deleteLimiter = createRateLimiter("admin-upload-delete", {
  maxRequests: 60,
  windowMs: 60 * 1000,
});

export async function POST(request: NextRequest) {
  try {
    if (!(await hasMinimumRole("manager"))) {
      return NextResponse.json(
        { error: "Forbidden — manager role required" },
        { status: 403 }
      );
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await deleteLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
        }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { key } = body as { key?: unknown };

    if (!key || typeof key !== "string" || key.trim() === "") {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      return NextResponse.json(
        { error: "Invalid key prefix" },
        { status: 400 }
      );
    }

    // Check for path traversal in both raw and URL-decoded forms
    const decodedKey = decodeURIComponent(key);
    if (key.includes("..") || decodedKey.includes("..")) {
      return NextResponse.json(
        { error: "Invalid key: path traversal detected" },
        { status: 400 }
      );
    }

    const result = await deleteS3Object(key);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { route: "POST /api/admin/upload/delete" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
