import { NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/functions";
import { isAuthenticated, hasMinimumRole } from "@/lib/utils/auth";
import {
  generatePresignedUploadUrl,
  getPublicUrl,
  MAX_UPLOAD_BYTES,
} from "@/lib/utils/s3";
import { v4 as uuidv4 } from "uuid";
import { createRateLimiter } from "@/lib/utils/rateLimit";
import { logError } from "@/lib/utils/observability";

// Each call mints a presigned S3 URL (a billable AWS round-trip) — cap
// at 60/min/IP so a stuck client or hijacked manager session can't burn
// through S3 SigV4 quota on a loop.
const uploadLimiter = createRateLimiter("admin-upload", {
  maxRequests: 60,
  windowMs: 60 * 1000,
});

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const ALLOWED_FOLDERS = ["cars", "parts"];

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasMinimumRole("manager"))) {
      return NextResponse.json(
        { error: "Forbidden — manager role required" },
        { status: 403 }
      );
    }

    const ip = ipAddress(request) || "unknown";
    const { allowed, resetIn } = await uploadLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
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

    const { contentType, fileName, folder, contentLength } = body as {
      contentType?: string;
      fileName?: string;
      folder?: string;
      contentLength?: number;
    };

    if (!contentType || typeof contentType !== "string") {
      return NextResponse.json(
        { error: "contentType is required" },
        { status: 400 }
      );
    }
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      );
    }

    if (!folder || typeof folder !== "string") {
      return NextResponse.json(
        { error: "folder is required" },
        { status: 400 }
      );
    }
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    // (#14) Require declared size; reject anything over the cap before we
    // even spend the round-trip to S3 to sign.
    if (
      typeof contentLength !== "number" ||
      !Number.isFinite(contentLength) ||
      contentLength <= 0
    ) {
      return NextResponse.json(
        { error: "contentLength (in bytes) is required" },
        { status: 400 }
      );
    }
    if (contentLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Max upload size is ${Math.round(
            MAX_UPLOAD_BYTES / 1024 / 1024
          )} MB`,
        },
        { status: 413 }
      );
    }

    const sanitized = sanitizeFileName(fileName);
    const uuid = uuidv4();
    const key = `${folder}/${uuid}-${sanitized}`;

    const uploadUrl = await generatePresignedUploadUrl(
      key,
      contentType,
      contentLength
    );
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      maxBytes: MAX_UPLOAD_BYTES,
    });
  } catch (error) {
    logError(error, { route: "POST /api/admin/upload" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
