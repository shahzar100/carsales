import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/**
 * Hard cap on car/parts image uploads (#14). Anything larger gets rejected
 * before we even sign — and the signed URL itself encodes Content-Length
 * so an over-cap PUT also fails at S3 against the signature.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

/**
 * Generate a presigned PUT URL that's locked to a specific content type
 * AND content length. The client MUST send a Content-Length header that
 * matches what we signed — anything else makes S3 reject the upload.
 *
 * (#14) Without binding ContentLength, a leaked or stolen URL could be
 * used to upload arbitrarily large files. We also reject any declared
 * size > MAX_UPLOAD_BYTES before signing as a fast pre-check.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  contentLength: number
): Promise<string> {
  if (
    !ALLOWED_CONTENT_TYPES.includes(
      contentType as (typeof ALLOWED_CONTENT_TYPES)[number]
    )
  ) {
    throw new Error(
      `Content type "${contentType}" is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`
    );
  }

  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    throw new Error("contentLength must be a positive number");
  }
  if (contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File too large. Max upload size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`
    );
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return url;
}

export async function deleteS3Object(
  key: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export function getPublicUrl(key: string): string {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  if (cloudfrontDomain) {
    return `https://${cloudfrontDomain}/${key}`;
  }
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Convert a stored image value (which may be a CloudFront URL, an S3 URL, a
 * relative path like "/tesla.webp", or a raw key) back into the S3 object key.
 * Returns null for static / non-S3 paths so callers can safely skip them.
 *
 * Used by the cleanup-on-delete code paths in cars/carparts so the routes
 * don't have to re-derive the bucket layout. (CODEBASE_ISSUES C8.)
 */
export function s3KeyFromStoredImage(value: string | undefined | null): string | null {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("/")) return null; // public/static asset
  if (!value.startsWith("http")) {
    // Already a key (e.g. "cars/abc123.webp")
    return value;
  }
  try {
    const url = new URL(value);
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    if (cloudfrontDomain && url.host === cloudfrontDomain) {
      return url.pathname.replace(/^\//, "");
    }
    if (url.host.endsWith(".amazonaws.com") && url.pathname.startsWith("/")) {
      return url.pathname.replace(/^\//, "");
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Best-effort delete of multiple S3 objects. Never throws — orphans are
 * recoverable, but a failed user-facing delete because of a flaky S3 call
 * isn't. Caller should log the returned errors.
 */
export async function deleteS3Objects(
  keys: Array<string | undefined | null>
): Promise<{ deleted: number; failed: Array<{ key: string; error: string }> }> {
  const failed: Array<{ key: string; error: string }> = [];
  let deleted = 0;
  for (const raw of keys) {
    const key = s3KeyFromStoredImage(raw);
    if (!key) continue;
    const result = await deleteS3Object(key);
    if (result.success) deleted++;
    else failed.push({ key, error: result.error });
  }
  return { deleted, failed };
}
