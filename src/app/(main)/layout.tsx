import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    </>
  );
}
