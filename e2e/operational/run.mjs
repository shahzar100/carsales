/**
 * Operational E2E launcher. Provisions: a real mongod (cached binary), a fake
 * S3-compatible store, a fake Upstash-REST KV, and an SMTP sink — then runs the
 * operational Playwright suite against `npm run dev` wired to all of them.
 *
 *   node e2e/operational/run.mjs            # all operational specs
 *   node e2e/operational/run.mjs cron       # filter
 *
 * No external services are touched (except Cloudflare's public Turnstile test
 * keys, which need outbound network for the one PASS assertion).
 */
import { spawn } from "node:child_process";
import {
  startMongod,
  startFakeS3,
  startFakeUpstash,
  startSmtpSink,
} from "./_infra.mjs";

const mongo = await startMongod();
const s3 = await startFakeS3();
const kv = await startFakeUpstash();
const smtp = await startSmtpSink(mongo.uri);

console.log("[op] mongod      :", mongo.uri);
console.log("[op] fake S3     :", s3.url);
console.log("[op] fake Upstash:", kv.url);
console.log("[op] SMTP sink   : 127.0.0.1:" + smtp.port);

Object.assign(process.env, {
  MONGODB_URI: mongo.uri,
  NEXT_MONGODB_URI: mongo.uri,
  NODE_ENV: "development",
  // S3-compatible object store
  AWS_REGION: "eu-west-2",
  AWS_ACCESS_KEY_ID: "test",
  AWS_SECRET_ACCESS_KEY: "test",
  S3_BUCKET_NAME: "mmc-test-bucket",
  AWS_S3_ENDPOINT: s3.url,
  CLOUDFRONT_DOMAIN: "",
  // KV-backed distributed rate limiting (real Upstash-REST shim)
  KV_REST_API_URL: kv.url,
  KV_REST_API_TOKEN: "test-token",
  // SMTP sink (captures sends into the _outbox collection)
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: String(smtp.port),
  SMTP_USER: "test",
  SMTP_PASS: "test",
  EMAIL_FROM: "noreply@mmc.test",
  // Cron bearer
  CRON_SECRET: "op-cron-secret",
  // Cloudflare Turnstile — always-pass test keys
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  // expose control URLs to specs
  OP_S3_URL: s3.url,
  OP_KV_URL: kv.url,
});

const child = spawn(
  "npx",
  [
    "playwright",
    "test",
    "--config",
    "e2e/operational/playwright.operational.config.ts",
    "--workers=1",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", env: process.env }
);

const shutdown = async (code) => {
  try {
    s3.server.close();
    kv.server.close();
    await smtp.close();
    await mongo.stop();
  } catch {
    /* ignore */
  }
  process.exit(code);
};
child.on("exit", (code) => shutdown(code ?? 1));
process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
