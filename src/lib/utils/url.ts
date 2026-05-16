/**
 * URL helpers for safely rendering admin-supplied / user-supplied hrefs.
 *
 * Why this file exists: `new URL("javascript:alert(1)")` parses cleanly,
 * so a `new URL(value)` check alone does not stop a `javascript:`,
 * `data:`, or `vbscript:` payload from reaching an `<a href>` and
 * executing on the next click. We allowlist `https:` because every
 * admin-supplied external link in the site (Google Maps, social media)
 * is a public web URL — `http:` is rejected too so a downgraded link
 * can't sneak past mixed-content protections in older browsers.
 *
 * This helper is the render-side defence in depth that pairs with the
 * server-side protocol check on the admin shop write handler
 * (src/app/api/admin/shop/route.ts).
 */

/**
 * Return `href` unchanged if it is a syntactically valid `https://` URL,
 * otherwise return `undefined`. Call sites should treat `undefined` as
 * "don't render the link" — the typical pattern is
 *
 *     const safe = safeExternalHref(value);
 *     return safe ? <a href={safe}>…</a> : <span>…</span>;
 *
 * Returns `undefined` for:
 *   - `null` / `undefined` / non-string inputs
 *   - empty / whitespace-only strings
 *   - strings that don't parse as a URL (`new URL` throws)
 *   - any protocol other than `https:` (notably `javascript:`, `data:`,
 *     `vbscript:`, `file:`, and `http:`)
 *
 * Note that we test `.protocol` on the *parsed* URL — string-prefix
 * checks (`startsWith("https://")`) are bypassable with whitespace
 * tricks and the WHATWG URL parser is the only reliable way to read
 * the scheme.
 */
export function safeExternalHref(
  href: string | null | undefined
): string | undefined {
  if (typeof href !== "string") return undefined;
  const trimmed = href.trim();
  if (trimmed.length === 0) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:") return undefined;
  return trimmed;
}
