"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Explicit `"use client"` wrapper around Auth.js's SessionProvider.
 *
 * The root layout is a Server Component; importing `SessionProvider`
 * (a client component) into it directly trips React's client/server
 * boundary during static prerender of pages like `/_not-found`
 * ("Cannot read properties of null (reading 'useState')"). Re-exporting
 * it from a file that owns the `"use client"` directive keeps the
 * boundary unambiguous.
 */
export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // refetchOnWindowFocus is left ON (default) so a session that expires in
  // another tab is noticed — but we cap refetchInterval at 0 (no polling) and
  // rely on the visibility refetch. The key reliability win is server-side:
  // a stable AUTH_URL (see src/lib/env.ts) so the client's /api/auth/session
  // fetch is always same-origin and never throws ClientFetchError.
  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}
