import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/Providers/AuthSessionProvider";
import MotionProvider from "@/components/Providers/MotionProvider";
import { ViewingProvider } from "@/contexts/ViewingContext";
import { BusinessInfoProvider } from "@/contexts/BusinessInfoContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ToastProvider, ToastContainer } from "@/components/Toast";
import PageLoader from "@/components/UI/PageLoader";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getBusinessInfo();

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ),
    title: {
      default: `${businessName} — Car Sales & Services`,
      template: `%s | ${businessName}`,
    },
    description:
      "Browse quality vehicles, book car viewings, and access professional auto services including detailing, window tinting, repairs, and breakdown recovery.",
    keywords: [
      "car sales",
      "vehicle viewing",
      "car services",
      "auto dealer",
      "car detailing",
      "window tinting",
      "auto repairs",
      "breakdown recovery",
    ],
    authors: [{ name: businessName }],
    creator: businessName,
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: businessName,
      // (#23) Default OG image — every page without an explicit override
      // gets this. WhatsApp / Facebook / iMessage all use it for previews.
      images: [
        {
          url: "/car.jpg",
          width: 1200,
          height: 630,
          alt: businessName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/car.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        {/* SessionProvider wraps everything so any client component can
            call useSession() — the nav account link and the saved-cars
            sync both rely on it. */}
        <AuthSessionProvider>
          <MotionProvider>
            <ToastProvider>
              <NavigationProvider>
                <ViewingProvider>
                  <BusinessInfoProvider>
                    <PageLoader />
                    {children}
                  </BusinessInfoProvider>
                </ViewingProvider>
              </NavigationProvider>
              <ToastContainer />
            </ToastProvider>
          </MotionProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
