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
  return <SessionProvider>{children}</SessionProvider>;
}
