"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Database,
  Mail,
  Server,
  Cpu,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { HealthData } from "./getHealthData";
import Button from "@/components/Helpful/Buttons/Button";

// ── Helpers ──────────────────────────────────────────────────

const serviceIcon: Record<string, React.ReactNode> = {
  MongoDB: <Database className="h-5 w-5" />,
  "Email Service (SMTP)": <Mail className="h-5 w-5" />,
  "Server Memory": <Cpu className="h-5 w-5" />,
  Environment: <ShieldCheck className="h-5 w-5" />,
  "Next.js Server": <Server className="h-5 w-5" />,
};

const STATUS_CONFIG = {
  operational: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Operational",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  },
  degraded: {
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Degraded",
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  },
  outage: {
    dot: "bg-red-500 animate-pulse",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Outage",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
} as const;

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

// ── Component ────────────────────────────────────────────────

interface StatusDashboardProps {
  initialHealth: HealthData;
}

export default function StatusDashboard({
  initialHealth,
}: StatusDashboardProps) {
  const [health, setHealth] = useState<HealthData>(initialHealth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/health");
      if (!res.ok) throw new Error("Failed to fetch health status");
      setHealth(await res.json());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(fetchHealth, 30_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title tracking-tight">System Status</h1>
          <p className="subtitle mt-1">
            Monitor services, health checks, and test results
          </p>
        </div>

        <div className="flex items-center gap-3">
          {health.timestamp && (
            <span className="caption hidden sm:inline">
              Updated{" "}
              {new Date(health.timestamp).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
          <Button
            onClick={fetchHealth}
            disabled={loading}
            variant="outline"
            size="sm"
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="card flex items-center gap-3 border-red-200 bg-red-50 p-4 text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Overall Status Banner */}
      <div
        className={`card border-2 p-6 ${STATUS_CONFIG[health.status].border} ${STATUS_CONFIG[health.status].bg}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-4 w-4 rounded-full ${STATUS_CONFIG[health.status].dot}`}
          />
          <h2
            className={`text-xl font-semibold ${STATUS_CONFIG[health.status].text}`}
          >
            {health.status === "operational"
              ? "All Systems Operational"
              : health.status === "degraded"
                ? "Some Systems Degraded"
                : "System Outage Detected"}
          </h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Uptime: {formatUptime(health.uptime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Node {health.nodeVersion}
          </span>
        </div>
      </div>

      {/* Service Status List */}
      <section>
        <h2 className="section-title mb-4">Services</h2>
        <div className="space-y-3">
          {health.services.map((service) => {
            const cfg = STATUS_CONFIG[service.status];
            return (
              <div
                key={service.name}
                className={`card flex items-center justify-between border p-4 ${cfg.border} ${cfg.bg}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">
                    {serviceIcon[service.name] ?? (
                      <Activity className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.message}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {service.responseTime !== null && (
                    <span className="caption">{service.responseTime} ms</span>
                  )}
                  <span
                    className={`badge ${
                      service.status === "operational"
                        ? "badge-green"
                        : service.status === "degraded"
                          ? "badge-amber"
                          : "badge-red"
                    }`}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
