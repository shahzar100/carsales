import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
    </>
  );
}
