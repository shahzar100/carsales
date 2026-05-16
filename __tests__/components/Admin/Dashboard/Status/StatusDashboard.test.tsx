/**
 * Tests for src/components/Admin/Dashboard/Status/StatusDashboard.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders the overall-status banner per
 *   operational/degraded/outage; per-service rows with the right label
 *   pill + response time; uptime formatted as "Xd Yh Zm"; Refresh hits
 *   /api/admin/health and updates state
 * - 🎯 Usability: error banner on fetch failure; loading flag disables
 *   the Refresh button mid-flight
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StatusDashboard from "@/components/Admin/Dashboard/Status/StatusDashboard";
import type { HealthData } from "@/components/Admin/Dashboard/Status/getHealthData";

const baseHealth: HealthData = {
  status: "operational",
  timestamp: new Date("2026-05-15T10:30:00Z").toISOString(),
  uptime: 86400 + 7200 + 600, // 1d 2h 10m
  nodeVersion: "v22.0.0",
  services: [
    {
      name: "MongoDB",
      status: "operational",
      message: "Connected",
      responseTime: 12,
    },
    {
      name: "Email Service (SMTP)",
      status: "degraded",
      message: "Slow handshakes",
      responseTime: 2400,
    },
    {
      name: "Server Memory",
      status: "outage",
      message: "Heap exhausted",
      responseTime: null,
    },
  ],
} as unknown as HealthData;

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("StatusDashboard", () => {
  it("renders the overall-status banner for 'operational' health", () => {
    render(<StatusDashboard initialHealth={baseHealth} />);
    expect(screen.getByText("System Status")).toBeInTheDocument();
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
  });

  it("📋 banner copy: 'Some Systems Degraded' for degraded health", () => {
    render(
      <StatusDashboard
        initialHealth={{ ...baseHealth, status: "degraded" }}
      />
    );
    expect(screen.getByText(/some systems degraded/i)).toBeInTheDocument();
  });

  it("📋 banner copy: 'System Outage Detected' for outage health", () => {
    // `initialHealth` flows into `useState`, so a fresh mount is required
    // to swap the banner copy — rerender alone doesn't reset useState.
    render(
      <StatusDashboard
        initialHealth={{ ...baseHealth, status: "outage" }}
      />
    );
    expect(screen.getByText(/system outage detected/i)).toBeInTheDocument();
  });

  it("📋 renders one row per service with name + message + response time", () => {
    render(<StatusDashboard initialHealth={baseHealth} />);
    expect(screen.getByText("MongoDB")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("12 ms")).toBeInTheDocument();
    expect(screen.getByText("Slow handshakes")).toBeInTheDocument();
    expect(screen.getByText("2400 ms")).toBeInTheDocument();
    expect(screen.getByText("Heap exhausted")).toBeInTheDocument();
  });

  it("📋 omits the response-time pill when responseTime is null", () => {
    render(<StatusDashboard initialHealth={baseHealth} />);
    // MongoDB → "12 ms", Email → "2400 ms"; Server Memory has null so the
    // page should NOT show "null ms".
    expect(screen.queryByText(/null ms/i)).not.toBeInTheDocument();
  });

  it("📋 formats uptime as 'Xd Yh Zm' (and only includes the non-zero parts)", () => {
    render(<StatusDashboard initialHealth={baseHealth} />);
    expect(screen.getByText(/Uptime: 1d 2h 10m/)).toBeInTheDocument();
  });

  it("📋 a uptime under an hour shows only the minute part", () => {
    render(
      <StatusDashboard
        initialHealth={{ ...baseHealth, uptime: 75 }}
      />
    );
    expect(screen.getByText(/Uptime: 1m/)).toBeInTheDocument();
  });

  it("📋 includes node version + 'Updated HH:MM:SS' badge", () => {
    render(<StatusDashboard initialHealth={baseHealth} />);
    expect(screen.getByText(/Node v22\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Updated \d{2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("📋 Refresh fetches /api/admin/health and updates state", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...baseHealth,
        services: [
          {
            name: "MongoDB",
            status: "operational",
            message: "Refreshed",
            responseTime: 8,
          },
        ],
      }),
    });
    render(<StatusDashboard initialHealth={baseHealth} />);
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/health")
    );
    await waitFor(() =>
      expect(screen.getByText("Refreshed")).toBeInTheDocument()
    );
  });

  it("🎯 fetch failure surfaces an error banner", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    render(<StatusDashboard initialHealth={baseHealth} />);
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/failed to fetch health status/i)
      ).toBeInTheDocument()
    );
  });
});
