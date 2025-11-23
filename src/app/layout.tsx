import type { Metadata } from "next";
import "./globals.css";
import { SearchContextProvider } from "@/backend/SearchContext";
import { ViewingProvider } from "@/backend/ViewingContext";
import { ShopProvider } from "@/backend/ShopContext";
import { NavigationProvider } from "@/backend/NavigationContext";
import Header from "@/components/Header";
import PageLoader from "@/components/UI/PageLoader";
import NavLink from "@/components/Dropdown/NavLink";

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
      <body className="antialiased min-h-screen grid grid-rows-[auto_1fr_auto] gap-4 p-4 overflow-x-hidden">
        <NavigationProvider>
          <SearchContextProvider>
            <ViewingProvider>
              <ShopProvider>
                <PageLoader />
                <Header />
                <main className="min-h-screen">{children}</main>
                <footer className="border-t bg-gray-50 w-full">
                  <div className="mx-auto max-w-7xl px-6 py-12">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                      {/* Company Info */}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-4">
                          {process.env.NEXT_PUBLIC_BUSINESS_NAME ||
                            "Car Sales & Viewing"}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          Browse our premium car collection with convenient
                          viewing and booking services.
                        </p>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>
                            📍{" "}
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(
                                `${
                                  process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
                                  "123 Auto Street"
                                }, ${
                                  process.env.NEXT_PUBLIC_BUSINESS_CITY ||
                                  "City"
                                }, ${
                                  process.env.NEXT_PUBLIC_BUSINESS_STATE || ""
                                } ${
                                  process.env.NEXT_PUBLIC_BUSINESS_ZIP || ""
                                }`.trim()
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-red-500 transition-colors cursor-pointer"
                            >
                              {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
                                "123 Auto Street"}
                              ,{" "}
                              {process.env.NEXT_PUBLIC_BUSINESS_CITY || "City"}
                            </a>
                          </p>
                          <p>
                            📞{" "}
                            <a
                              href={`tel:${
                                process.env.NEXT_PUBLIC_BUSINESS_PHONE ||
                                "+15551234567"
                              }`}
                              className="hover:text-red-500 transition-colors cursor-pointer"
                            >
                              {process.env.NEXT_PUBLIC_BUSINESS_PHONE ||
                                "(555) 123-4567"}
                            </a>
                          </p>
                          <p>
                            ✉️{" "}
                            <a
                              href={`mailto:${
                                process.env.NEXT_PUBLIC_BUSINESS_EMAIL ||
                                "info@carsales.com"
                              }`}
                              className="hover:text-red-500 transition-colors cursor-pointer"
                            >
                              {process.env.NEXT_PUBLIC_BUSINESS_EMAIL ||
                                "info@carsales.com"}
                            </a>
                          </p>
                        </div>
                      </div>

                      {/* Browse & Services */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Browse & Services
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li>
                            <NavLink href="/BrowseFleet" text="Browse Fleet" />
                          </li>
                          <li>
                            <NavLink href="/Services" text="Services" />
                          </li>
                          <li>
                            <NavLink href="/Services/Repairs" text="Repairs" />
                          </li>
                          <li>
                            <NavLink href="/Recoveries" text="Recoveries" />
                          </li>
                          <li>
                            <NavLink href="/CarParts" text="Car Parts" />
                          </li>
                          <li>
                            <NavLink
                              href="/AccidentClaims"
                              text="Accident Claims"
                            />
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
                            <NavLink href="/FAQ" text="FAQ" dropdown={false} />
                          </li>
                          <li>
                            <NavLink href="/AboutUs" text="About Us" />
                          </li>
                          <li>
                            <NavLink href="/Enquiry" text="Contact Us" />
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
                            <NavLink href="/admin" text="Admin Dashboard" />
                          </li>
                          <li>
                            <NavLink href="/privacy" text="Privacy Policy" />
                          </li>
                          <li>
                            <NavLink href="/terms" text="Terms of Service" />
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-600 text-sm">
                          &copy; 2025{" "}
                          {process.env.NEXT_PUBLIC_BUSINESS_NAME ||
                            "Car Sales & Viewing"}
                          . All rights reserved.
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
              </ShopProvider>
            </ViewingProvider>
          </SearchContextProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
