import type { Metadata } from "next";
import "./globals.css";
import { SearchContextProvider } from "@/backend/SearchContext";
import { ViewingProvider } from "@/backend/ViewingContext";
import { BusinessInfoProvider } from "@/backend/BusinessInfoContext";
import { NavigationProvider } from "@/backend/NavigationContext";
import { ToastProvider, ToastContainer } from "@/components/Toast";
import PageLoader from "@/components/UI/PageLoader";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <ToastProvider>
          <NavigationProvider>
            <SearchContextProvider>
              <ViewingProvider>
                <BusinessInfoProvider>
                  <PageLoader />
                  {children}
                </BusinessInfoProvider>
              </ViewingProvider>
            </SearchContextProvider>
          </NavigationProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
