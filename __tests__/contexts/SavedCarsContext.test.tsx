/**
 * Tests for src/contexts/SavedCarsContext.tsx
 *
 * Standards coverage:
 * - 📋 Functional: localStorage hydrate, toggle/remove/clear, cross-tab sync,
 *   server reconcile on sign-in, 50-item cap
 * - 🔒 Security: server is the authority when signed in — toggle/remove fire
 *   a PUT; failures don't crash the UI
 * - 🎯 Usability: useSavedCars outside provider throws
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { SavedCarsProvider, useSavedCars } from "@/contexts/SavedCarsContext";

const mockedUseSession = useSession as unknown as jest.Mock;

function Probe() {
  const { savedIds, toggle, remove, clear, isSaved } = useSavedCars();
  return (
    <div>
      <span data-testid="ids">{savedIds.join(",")}</span>
      <span data-testid="count">{savedIds.length}</span>
      <span data-testid="has-a">{String(isSaved("a"))}</span>
      <button onClick={() => toggle("a")}>toggle-a</button>
      <button onClick={() => toggle("b")}>toggle-b</button>
      <button onClick={() => remove("a")}>remove-a</button>
      <button onClick={() => clear()}>clear</button>
    </div>
  );
}

describe("SavedCarsContext", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { savedCarIds: [] } }),
    });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
  });

  it("starts empty, toggles ids in and out, persists to localStorage", async () => {
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );

    await act(async () => screen.getByText("toggle-a").click());
    expect(screen.getByTestId("ids")).toHaveTextContent("a");
    expect(JSON.parse(localStorage.getItem("saved-cars") || "[]")).toEqual([
      "a",
    ]);

    await act(async () => screen.getByText("toggle-a").click());
    expect(screen.getByTestId("ids")).toHaveTextContent("");
  });

  it("isSaved() reflects membership", async () => {
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    expect(screen.getByTestId("has-a")).toHaveTextContent("false");
    await act(async () => screen.getByText("toggle-a").click());
    expect(screen.getByTestId("has-a")).toHaveTextContent("true");
  });

  it("remove() and clear() drop ids from state and storage", async () => {
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    await act(async () => screen.getByText("toggle-a").click());
    await act(async () => screen.getByText("toggle-b").click());
    await act(async () => screen.getByText("remove-a").click());
    expect(screen.getByTestId("ids")).toHaveTextContent("b");
    await act(async () => screen.getByText("clear").click());
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("hydrates from localStorage on mount", async () => {
    localStorage.setItem("saved-cars", JSON.stringify(["x", "y"]));
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("ids")).toHaveTextContent("x,y")
    );
  });

  it("ignores malformed localStorage payloads without crashing", async () => {
    localStorage.setItem("saved-cars", "{not-json");
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );
  });

  it("when signed in, reconciles localStorage with server (union)", async () => {
    localStorage.setItem("saved-cars", JSON.stringify(["local-1", "shared"]));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { savedCarIds: ["server-1", "shared"] },
      }),
    });
    mockedUseSession.mockReturnValue({
      data: { user: { email: "u@e.com" } },
      status: "authenticated",
    });

    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );

    await waitFor(() => {
      const ids = screen.getByTestId("ids").textContent;
      expect(ids).toContain("server-1");
      expect(ids).toContain("shared");
      expect(ids).toContain("local-1");
    });
  });

  it("when signed in, toggle PUTs the updated list to /api/account/saved", async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { email: "u@e.com" } },
      status: "authenticated",
    });

    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    // Allow the mount-time reconcile to settle before clicking
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fetchMock.mockClear();
    await act(async () => screen.getByText("toggle-a").click());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/saved",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["a"] }),
      })
    );
  });

  it("does NOT call the server when toggling while signed out", async () => {
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    await act(async () => screen.getByText("toggle-a").click());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when useSavedCars is used outside the provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/SavedCarsProvider/);
    consoleError.mockRestore();
  });

  it("caps the saved list at 50 entries", async () => {
    const fifty = Array.from({ length: 50 }, (_, i) => `c${i}`);
    localStorage.setItem("saved-cars", JSON.stringify(fifty));
    render(
      <SavedCarsProvider>
        <Probe />
      </SavedCarsProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("50")
    );
    // Toggling a 51st id should be a no-op because the cap is hit.
    await act(async () => screen.getByText("toggle-a").click());
    expect(screen.getByTestId("count")).toHaveTextContent("50");
  });
});
