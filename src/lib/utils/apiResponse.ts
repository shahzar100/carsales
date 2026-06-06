/**
 * Standard JSON response envelope for API routes.
 *
 * Every route should return one of:
 *   - `ok(data)`              → 200 with `{ success: true, data }`
 *   - `ok(data, status)`      → custom 2xx status (e.g. 201 for create)
 *   - `fail(message, status)` → `{ success: false, error: message }`
 *
 * Helpers for the common error statuses (`badRequest`, `unauthorized`,
 * `forbidden`, `notFound`, `tooManyRequests`, `serverError`) are exposed
 * so call sites read declaratively instead of passing raw numbers around.
 */

import { NextResponse } from "next/server";

/** Successful response shape. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Error response shape. */
export interface ApiError {
  success: false;
  error: string;
}

/** Unified envelope returned by every endpoint. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Build a successful JSON response.
 *
 * @param data   Payload to serialise into `data`. Use `null` for endpoints
 *               that just acknowledge the action (e.g. logout).
 * @param status HTTP status — defaults to `200`. Pass `201` for created
 *               resources, `202` for async-accepted, etc.
 * @param init   Optional extra response init (headers, etc.).
 */
export function ok<T>(
  data: T,
  status: number = 200,
  init?: ResponseInit
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data },
    { ...init, status }
  );
}

/**
 * Build a failure JSON response.
 *
 * @param error  Human-readable error message. Avoid leaking implementation
 *               details — log the underlying exception, return a clean
 *               string here.
 * @param status HTTP status code — defaults to `500`. Use the named helpers
 *               below for the common cases.
 * @param init   Optional extra response init (headers, etc.).
 */
export function fail(
  error: string,
  status: number = 500,
  init?: ResponseInit
): NextResponse<ApiError> {
  return NextResponse.json<ApiError>(
    { success: false, error },
    { ...init, status }
  );
}

// ── Convenience helpers for common error statuses ──────────────────────

/** 400 Bad Request — validation failed, malformed body, missing fields. */
export const badRequest = (
  message: string = "Bad request",
  init?: ResponseInit
) => fail(message, 400, init);

/** 401 Unauthorized — auth required or session expired. */
export const unauthorized = (
  message: string = "Unauthorized",
  init?: ResponseInit
) => fail(message, 401, init);

/** 403 Forbidden — authenticated but not allowed. */
export const forbidden = (
  message: string = "Forbidden",
  init?: ResponseInit
) => fail(message, 403, init);

/** 404 Not Found — resource doesn't exist. */
export const notFound = (
  message: string = "Not found",
  init?: ResponseInit
) => fail(message, 404, init);

/**
 * 409 Conflict — the request collides with the current state of the
 * resource (e.g. a booking slot taken by a concurrent request). Distinct
 * from 429: a client should NOT blindly retry the same request, it should
 * change it (pick another slot).
 */
export const conflict = (
  message: string = "Conflict",
  init?: ResponseInit
) => fail(message, 409, init);

/** 429 Too Many Requests — rate limit hit. Pass `Retry-After` in headers. */
export const tooManyRequests = (
  message: string = "Too many requests",
  init?: ResponseInit
) => fail(message, 429, init);

/** 500 Internal Server Error — unexpected exception. */
export const serverError = (
  message: string = "Internal server error",
  init?: ResponseInit
) => fail(message, 500, init);
