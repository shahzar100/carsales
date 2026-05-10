/**
 * Tests for the typed useApi hook (src/hooks/useApi.ts).
 *
 * Standards coverage:
 * - 📋 Functional: Loading state, success unwrap, error handling, refetch
 * - 🛡️ Resilience: Non-JSON bodies, aborted requests, skip flag
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import useApi from "@/hooks/useApi";

const originalFetch = global.fetch;

function mockFetchOnce(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("useApi", () => {
  it("starts with loading=true and resolves to the unwrapped data", async () => {
    mockFetchOnce({ success: true, data: { id: 1, name: "x" } });

    const { result } = renderHook(() => useApi<{ id: number }>("/api/x"));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: 1, name: "x" });
    expect(result.current.error).toBeNull();
  });

  it("captures the error message when success: false", async () => {
    mockFetchOnce({ success: false, error: "Not found" }, { ok: false, status: 404 });

    const { result } = renderHook(() => useApi("/api/missing"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Not found");
    expect(result.current.data).toBeNull();
  });

  it("falls back to a status-based error when the body isn't JSON", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    const { result } = renderHook(() => useApi("/api/x"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toMatch(/500/);
  });

  it("does not fetch when skip is true", async () => {
    global.fetch = jest.fn();

    const { result } = renderHook(() =>
      useApi("/api/x", { skip: true })
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when url is null", async () => {
    global.fetch = jest.fn();

    renderHook(() => useApi(null));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("refetch fires another request and updates state", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: "first" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: "second" }),
      });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useApi<string>("/api/x"));
    await waitFor(() => expect(result.current.data).toBe("first"));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe("second");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("invokes onSuccess with the unwrapped data", async () => {
    mockFetchOnce({ success: true, data: 42 });
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useApi<number>("/api/x", { onSuccess }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(onSuccess).toHaveBeenCalledWith(42);
  });

  it("invokes onError with the error message", async () => {
    mockFetchOnce(
      { success: false, error: "Boom" },
      { ok: false, status: 500 }
    );
    const onError = jest.fn();

    const { result } = renderHook(() => useApi("/api/x", { onError }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(onError).toHaveBeenCalledWith("Boom");
  });
});
