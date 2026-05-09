import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { generatePresignedUploadUrl, getPublicUrl } from "@/lib/utils/s3";
import { v4 as uuidv4 } from "uuid";

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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { contentType, fileName, folder } = body as {
      contentType?: string;
      fileName?: string;
      folder?: string;
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

    const sanitized = sanitizeFileName(fileName);
    const uuid = uuidv4();
    const key = `${folder}/${uuid}-${sanitized}`;

    const uploadUrl = await generatePresignedUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl, key, publicUrl });
  } catch (error) {
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
