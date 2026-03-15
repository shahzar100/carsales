import { z } from "zod";

/**
 * Server-side environment variable validation.
 *
 * Validates all required env vars at boot time so the app
 * fails fast with clear error messages rather than crashing
 * at runtime with cryptic undefined errors.
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
  SESSION_SECRET: z.string().optional(),

  // ── Email / SMTP ──────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional().default("noreply@yourdomain.com"),
  EMAIL_FROM_NAME: z.string().optional().default("MMC Leeds"),

  // ── App ───────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_BUSINESS_NAME: z.string().optional().default("MMC Leeds"),
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
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

  // Warn if SESSION_SECRET is missing in production
  if (!parsed.data.SESSION_SECRET && parsed.data.NODE_ENV === "production") {
    console.warn(
      "⚠️  SESSION_SECRET is not set — using fallback. Set it for production!"
    );
  }

  return parsed.data;
}

function validateClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BUSINESS_NAME: process.env.NEXT_PUBLIC_BUSINESS_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
