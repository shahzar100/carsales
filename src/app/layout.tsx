import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SearchContextProvider } from "@/backend/SearchContext";
import { ViewingProvider } from "@/backend/ViewingContext";
import Header from "@/components/Header";
import Link from "next/link";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen grid grid-rows-[auto_1fr_auto] gap-4 p-4`}
      >
        <SearchContextProvider>
          <ViewingProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <footer className="border-t bg-gray-50 w-full">
              <div className="mx-auto max-w-7xl px-6 py-12">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                  {/* Company Info */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      Car Sales & Viewing
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Browse our premium car collection with convenient viewing
                      and booking services.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📍 123 Auto Street, City</p>
                      <p>📞 (555) 123-4567</p>
                      <p>✉️ info@carsales.com</p>
                    </div>
                  </div>

                  {/* Browse & Services */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Browse & Services
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link
                          href="/BrowseFleet"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Browse Fleet
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/Services"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Services
                        </Link>
                      </li>

                      <li>
                        <Link
                          href="/Services/Repairs"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Repairs
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/Recoveries"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Recoveries
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/Car Parts"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Car Parts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/AccidentClaims"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Accident Claims
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Support & Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Support & Info
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link
                          href="/FAQ"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          FAQ
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/AboutUs"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          About Us
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/Enquiry"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Contact Us
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Admin & Legal */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Admin & Legal
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link
                          href="/admin"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/privacy"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/terms"
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          Terms of Service
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-600 text-sm">
                      &copy; 2025 Car Sales & Viewing. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                      <a
                        href="#"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <span className="sr-only">Facebook</span>
                        📘
                      </a>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <span className="sr-only">Twitter</span>
                        🐦
                      </a>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <span className="sr-only">Instagram</span>
                        📷
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </ViewingProvider>
        </SearchContextProvider>
      </body>
    </html>
  );
}
