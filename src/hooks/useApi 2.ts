"use client";

/**
 * Typed `fetch` hook that pairs with the `{ success, data, error }` envelope
 * returned by routes built on top of `lib/utils/apiResponse.ts`.
 *
 * The dashboard pages currently hand-roll `useState({ loading, data, error })`
 * + `useEffect(() => fetch(...))` over and over (admin/dashboard/service,
 * /viewing, /carparts, etc.). This hook is the recommended new home for that
 * pattern. Existing call sites keep working — migrate them opportunistically.
 *
 * Behaviour:
 *  - `data` starts `null` and is set on each successful fetch.
 *  - `error` is non-null when the response is non-2xx OR the envelope's
 *    `success` is false. The error message is whatever the server returned.
 *  - `loading` is true during initial fetch and any subsequent `refetch()`.
 *  - `refetch()` returns a promise that resolves once data/error are settled.
 *  - The hook aborts in-flight fetches on unmount and on URL change so a
 *    late response can't overwrite fresh state.
 *
 * Usage:
 *
 * ```tsx
 * const { data, error, loading, refetch } = useApi<Car[]>("/api/admin/cars");
 *
 * if (loading) return <Skeleton />;
 * if (error) return <ErrorPanel message={error} onRetry={refetch} />;
 * return <CarTable cars={data ?? []} />;
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
  error: string;
}

type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface UseApiResult<T> {
  /** The unwrapped `data` field from the success envelope, or null. */
  data: T | null;
  /** Server- or network-provided error message, or null on success. */
  error: string | null;
  /** True while a fetch is in flight. */
  loading: boolean;
  /** Re-fire the request. Returns a promise that resolves after settle. */
  refetch: () => Promise<void>;
}

export interface UseApiOptions {
  /** Skip the initial fetch — useful when the URL depends on later state. */
  skip?: boolean;
  /** Forwarded to `fetch`. Use for POST/PUT bodies or custom headers. */
  init?: RequestInit;
  /**
   * Callback fired with the unwrapped `data` after each successful fetch.
   * Useful for syncing fetched data into another piece of state.
   */
  onSuccess?: (data: unknown) => void;
  /** Callback fired when the request fails (non-2xx OR `success: false`). */
  onError?: (error: string) => void;
}

/**
 * Issue a GET request and unwrap the API envelope.
 *
 * @param url      Endpoint URL. Pass `null` to skip until the URL is ready.
 * @param options  Optional skip flag, fetch init, and lifecycle callbacks.
 */
export function useApi<T = unknown>(
  url: string | null,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { skip = false, init, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Hold the latest abort controller so repeated calls cancel in-flight ones.
  const abortRef = useRef<AbortController | null>(null);

  // Stable refs for the callbacks so the effect doesn't re-run on every
  // render just because the parent inlined a new function.
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const doFetch = useCallback(async (): Promise<void> => {
    if (!url || skip) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      let body: ApiEnvelope<T> | null = null;
      try {
        body = (await response.json()) as ApiEnvelope<T>;
      } catch {
        // Body wasn't JSON — fall through to a generic error.
        body = null;
      }

      if (controller.signal.aborted) return;

      if (!response.ok || !body || body.success === false) {
        const message =
          (body && body.success === false ? body.error : null) ??
          `Request failed with status ${response.status}`;
        setError(message);
        setData(null);
        onErrorRef.current?.(message);
        return;
      }

      setData(body.data);
      setError(null);
      onSuccessRef.current?.(body.data);
    } catch (err) {
      if (controller.signal.aborted) return;
      // Network error, DNS failure, CORS, etc.
      const message =
        err instanceof Error ? err.message : "Network error";
      setError(message);
      setData(null);
      onErrorRef.current?.(message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [url, skip, init]);

  useEffect(() => {
    void doFetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [doFetch]);

  return { data, error, loading, refetch: doFetch };
}

export default useApi;
