/**
 * Tests for src/contexts/BusinessInfoContext.tsx
 *
 * Standards coverage:
 * - 📋 Functional: fetches from /api/businessinfo on mount and exposes via context
 * - 🎯 Usability: stays in loading=true until the fetch resolves; outside-provider throws
 * - 🔒 Security: a failing fetch never crashes the consumer; only loading flips false
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  BusinessInfoProvider,
  useBusinessInfo,
} from "@/contexts/BusinessInfoContext";

function Probe() {
  const { businessInfo, loading, refetch } = useBusinessInfo();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="name">{businessInfo?.businessName ?? "(none)"}</span>
      <button onClick={() => refetch()}>refetch</button>
    </div>
  );
}

describe("BusinessInfoContext", () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    fetchMock = jest.fn();
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  });

  it("starts in loading state and resolves to businessInfo on success", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        success: true,
        data: { businessName: "Acme Motors" },
      }),
    });

    render(
      <BusinessInfoProvider>
        <Probe />
      </BusinessInfoProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("name")).toHaveTextContent("Acme Motors");
  });

  it("leaves businessInfo=null when the API responds success=false", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ success: false, error: "nope" }),
    });

    render(
      <BusinessInfoProvider>
        <Probe />
      </BusinessInfoProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("name")).toHaveTextContent("(none)");
  });

  it("flips loading=false even when fetch rejects (no unhandled crash)", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network"));

    render(
      <BusinessInfoProvider>
        <Probe />
      </BusinessInfoProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    );
    expect(screen.getByTestId("name")).toHaveTextContent("(none)");
    consoleError.mockRestore();
  });

  it("refetch() re-hits the API and updates state", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { businessName: "First" } }),
    });

    render(
      <BusinessInfoProvider>
        <Probe />
      </BusinessInfoProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("name")).toHaveTextContent("First")
    );

    fetchMock.mockResolvedValueOnce({
      json: async () => ({ success: true, data: { businessName: "Second" } }),
    });

    await act(async () => {
      screen.getByText("refetch").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("name")).toHaveTextContent("Second")
    );
  });

  it("throws when useBusinessInfo is used outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/BusinessInfoProvider/);
    consoleError.mockRestore();
  });
});
