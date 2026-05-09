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

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string
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

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
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
