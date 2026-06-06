import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieBanner from "@/components/Shared/CookieBanner";
import { SavedCarsProvider } from "@/contexts/SavedCarsContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import ComparisonBar from "@/components/Car/ComparisonBar";

/**
 * Rendering strategy is now PER-PAGE, not layout-wide.
 *
 * The previous `export const dynamic = "force-dynamic"` line here flipped
 * every customer-facing page to per-request SSR, collapsing throughput to
 * ~4-9 req/s with 4-6 s tail latency under modest load (audit #1 +
 * autocannon evidence in POST_PR_RESULTS.md). Each marketing page now
 * declares its own `revalidate` according to how often its data changes;
 * per-user pages (account, saved, Booking/lookup, etc.) declare
 * `dynamic = "force-dynamic"` themselves.
 *
 * The original concern was that Vercel build IPs can't reach Atlas. With
 * `revalidate`, the first request after deploy populates the cache; the
 * build never needs to hit Mongo. BrowseFleet has shipped with this
 * pattern (revalidate=60) since launch and proves it works.
 */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedCarsProvider>
      <ComparisonProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-200 focus:rounded-lg focus:bg-red-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        {/* Floating comparison bar — only renders when cars are queued. */}
        <ComparisonBar />
        <Footer />
      {/* (#36) Floating WhatsApp button — async server component that
          fetches the business phone, wrapped in Suspense so it never
          blocks the page render if Mongo is slow.

          Wrapped in <aside> so axe's `region` rule (all content must be
          in a landmark) doesn't flag the floating <a> as orphan content
          on text-heavy pages (FAQ/contact/privacy/terms/login/register
          — PR #40 axe report). */}
        <aside aria-label="Quick contact">
          <Suspense fallback={null}>
            <WhatsAppButton />
          </Suspense>
        </aside>
        <CookieBanner />
      </ComparisonProvider>
    </SavedCarsProvider>
  );
}
