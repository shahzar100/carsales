import type { Metadata } from "next";
import "./globals.css";
import { SearchContextProvider } from "@/backend/SearchContext";
import { ViewingProvider } from "@/backend/ViewingContext";
import { BusinessInfoProvider } from "@/backend/BusinessInfoContext";
import { NavigationProvider } from "@/backend/NavigationContext";
import { ToastProvider, ToastContainer } from "@/components/Toast";
import PageLoader from "@/components/UI/PageLoader";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing",
  description: "Book car viewings and browse our vehicle inventory",
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
