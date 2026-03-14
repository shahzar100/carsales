import clientPromise from "@/backend/mongodb";

// ── Types ────────────────────────────────────────────────────

export interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage";
  responseTime: number | null;
  message: string;
}

export interface HealthData {
  status: "operational" | "degraded" | "outage";
  timestamp: string;
  uptime: number;
  nodeVersion: string;
  services: ServiceStatus[];
}

// ── Individual checks ────────────────────────────────────────

async function checkMongoDB(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    return {
      name: "MongoDB",
      status: "operational",
      responseTime: Date.now() - start,
      message: "Database is responding normally",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return {
      name: "MongoDB",
      status: "outage",
      responseTime: null,
      message: `Database connection failed: ${msg}`,
    };
  }
}

function checkEmailService(): ServiceStatus {
  const hasConfig = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
  return {
    name: "Email Service (SMTP)",
    status: hasConfig ? "operational" : "degraded",
    responseTime: null,
    message: hasConfig
      ? "SMTP configuration is present"
      : "SMTP environment variables are missing — using Ethereal fallback",
  };
}

function checkMemory(): ServiceStatus {
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const pct = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  return {
    name: "Server Memory",
    status: pct > 90 ? "degraded" : "operational",
    responseTime: null,
    message: `Heap: ${heapUsedMB} MB / ${heapTotalMB} MB (${pct}%)`,
  };
}

function checkEnvironment(): ServiceStatus {
  const required = ["MONGODB_URI", "SESSION_SECRET"];
  const missing = required.filter((k) => !process.env[k]);

  return {
    name: "Environment",
    status: missing.length === 0 ? "operational" : "degraded",
    responseTime: null,
    message:
      missing.length === 0
        ? "All required environment variables are set"
        : `Missing: ${missing.join(", ")}`,
  };
}

function checkNextServer(): ServiceStatus {
  const uptimeSeconds = Math.round(process.uptime());
  return {
    name: "Next.js Server",
    status: "operational",
    responseTime: null,
    message: `Running for ${formatUptime(uptimeSeconds)} on Node ${process.version}`,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

// ── Main fetch ───────────────────────────────────────────────

export async function getHealthData(): Promise<HealthData> {
  const services: ServiceStatus[] = await Promise.all([
    checkMongoDB(),
    Promise.resolve(checkEmailService()),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkEnvironment()),
    Promise.resolve(checkNextServer()),
  ]);

  const overallStatus = services.some((s) => s.status === "outage")
    ? "outage"
    : services.some((s) => s.status === "degraded")
      ? "degraded"
      : "operational";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    nodeVersion: process.version,
    services,
  };
}
