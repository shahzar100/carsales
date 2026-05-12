import { z } from "zod";

/**
 * Server-side environment variable validation.
 *
 * Validates all required env vars at boot time so the app fails fast with
 * clear error messages rather than crashing at runtime with cryptic
 * undefined errors. The matching `.env.example` at the repo root
 * documents every variable for new developers. (CODEBASE_ISSUES H3.)
 */

const serverSchema = z.object({
  // ── Database ──────────────────────────────────────────────
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://"
    ),

  // ── Session ───────────────────────────────────────────────
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .optional(),

  // ── Email / SMTP ──────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional().default("noreply@yourdomain.com"),
  EMAIL_FROM_NAME: z.string().optional().default("MMC Leeds"),

  // ── AWS / S3 — used by src/lib/utils/s3.ts ────────────────
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  CLOUDFRONT_DOMAIN: z.string().optional(),

  // ── Cron — Vercel sets this to authenticate cron invocations ─
  CRON_SECRET: z.string().optional(),

  // ── Admin bootstrap (consumed by scripts/setup-admin.mjs) ──
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  // ── App ───────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_BUSINESS_NAME: z.string().optional().default("MMC Leeds"),
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_BASE_URL: z.string().optional(), // used by reviewInvite
});

function validateServerEnv() {
  // Skip validation during build or client-side
  if (typeof window !== "undefined") return {} as z.infer<typeof serverSchema>;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    throw new Error("Invalid server environment variables");
  }

  // Production hard-requires SESSION_SECRET. Ditto for the EMAIL_FROM
  // default — `noreply@yourdomain.com` would send real emails from a
  // nonsense address. (CODEBASE_ISSUES H3.)
  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.SESSION_SECRET) {
      throw new Error(
        "SESSION_SECRET must be set in production (min 32 characters)"
      );
    }
    if (parsed.data.EMAIL_FROM === "noreply@yourdomain.com") {
      throw new Error(
        "EMAIL_FROM must be set to a real address in production"
      );
    }
  }

  return parsed.data;
}

function validateClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BUSINESS_NAME: process.env.NEXT_PUBLIC_BUSINESS_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
}

export const serverEnv = validateServerEnv();
export const clientEnv = validateClientEnv();
