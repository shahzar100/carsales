import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SearchContextProvider } from "@/backend/SearchContext";
import { ViewingProvider } from "@/backend/ViewingContext";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Car Sales & Viewing",
  description: "Book car viewings and browse our vehicle inventory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen px-1 grid grid-rows-[auto_1fr_auto] gap-4 p-4`}
      >
        <SearchContextProvider>
          <ViewingProvider>
            <Header />
            <main className="overflow-auto bg-black">{children}</main>
            <footer className="border-t p-4 w-full">
              <div className="mx-auto max-w-5xl text-center text-gray-600">
                <p>&copy; 2025 Car Sales & Viewing. All rights reserved.</p>
              </div>
            </footer>
          </ViewingProvider>
        </SearchContextProvider>
      </body>
    </html>
  );
}
