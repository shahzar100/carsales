import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieBanner from "@/components/Shared/CookieBanner";
import { SavedCarsProvider } from "@/contexts/SavedCarsContext";

/**
 * Force every marketing page to render at request time. Most pages here
 * call await getBusinessInfo() (which hits MongoDB), and the Header reads
 * cookies via useSearchParams in SearchBar — so static prerender requires
 * a live DB connection from the build runner. Vercel's build IPs aren't
 * on Atlas's allowlist, which surfaces as a TLS internal-error alert
 * during prerender. Declaring dynamic here makes the build skip DB
 * entirely; pages still SSR with full HTML for SEO at request time.
 */
export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SavedCarsProvider>
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
      <Footer />
      {/* (#36) Floating WhatsApp button — async server component that
          fetches the business phone, wrapped in Suspense so it never
          blocks the page render if Mongo is slow. */}
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
      <CookieBanner />
    </SavedCarsProvider>
  );
}
