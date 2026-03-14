import Header from "@/components/Header";
import Link from "next/link";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <footer className="w-full border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 text-black sm:px-6 sm:py-12">
          {/* Main Footer Content */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div>
              <h3 className="heading-3 mb-4">
                {process.env.NEXT_PUBLIC_BUSINESS_NAME}
              </h3>
              <p className="mb-4 text-sm text-gray-700">
                Browse our premium car collection with convenient viewing and
                booking services.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  📍{" "}
                  <Link
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${
                        process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
                        "123 Auto Street"
                      }, ${
                        process.env.NEXT_PUBLIC_BUSINESS_CITY || "City"
                      }, ${process.env.NEXT_PUBLIC_BUSINESS_STATE || ""} ${
                        process.env.NEXT_PUBLIC_BUSINESS_ZIP || ""
                      }`.trim()
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-red-600"
                  >
                    {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
                      "123 Auto Street"}
                    , {process.env.NEXT_PUBLIC_BUSINESS_CITY || "City"}
                  </Link>
                </p>
                <p>
                  📞{" "}
                  <a
                    href={`tel:${
                      process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+15551234567"
                    }`}
                    className="transition-colors hover:text-red-600"
                  >
                    {process.env.NEXT_PUBLIC_BUSINESS_PHONE || "(555) 123-4567"}
                  </a>
                </p>
                <p>
                  ✉️{" "}
                  <a
                    href={`mailto:${
                      process.env.NEXT_PUBLIC_BUSINESS_EMAIL ||
                      "info@carsales.com"
                    }`}
                    className="transition-colors hover:text-red-600"
                  >
                    {process.env.NEXT_PUBLIC_BUSINESS_EMAIL ||
                      "info@carsales.com"}
                  </a>
                </p>
              </div>
            </div>

            {/* Browse & Services */}
            <div>
              <h4 className="heading-4 mb-4">Browse & Services</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/BrowseFleet"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Browse Fleet
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Services"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Services/Repairs"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Repairs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Recoveries"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Recoveries
                  </Link>
                </li>
                <li>
                  <Link
                    href="/CarParts"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Car Parts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/AccidentClaims"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Accident Claims
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support & Info */}
            <div>
              <h4 className="heading-4 mb-4">Support & Info</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/FAQ"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/AboutUs"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/Enquiry"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Admin & Legal */}
            <div>
              <h4 className="heading-4 mb-4">Admin & Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/admin/dashboard"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-700 transition-colors hover:text-red-600"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <p className="text-sm text-gray-700">
                &copy; 2025{" "}
                {process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing"}
                . All rights reserved.
              </p>
              <div className="mt-4 flex space-x-4 md:mt-0">
                <Link
                  href="#"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
                >
                  <span className="sr-only">Facebook</span>
                  📘
                </Link>
                <Link
                  href="#"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
                >
                  <span className="sr-only">Twitter</span>
                  🐦
                </Link>
                <Link
                  href="#"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600"
                >
                  <span className="sr-only">Instagram</span>
                  📷
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
