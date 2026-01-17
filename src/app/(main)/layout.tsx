import Header from "@/components/Header";
import NavLink from "@/components/Dropdown/NavLink";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <footer className="w-full border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Main Footer Content */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div>
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                {process.env.NEXT_PUBLIC_BUSINESS_NAME}
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Browse our premium car collection with convenient viewing and
                booking services.
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
                        process.env.NEXT_PUBLIC_BUSINESS_CITY || "City"
                      }, ${process.env.NEXT_PUBLIC_BUSINESS_STATE || ""} ${
                        process.env.NEXT_PUBLIC_BUSINESS_ZIP || ""
                      }`.trim()
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer transition-colors hover:text-red-500"
                  >
                    {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
                      "123 Auto Street"}
                    , {process.env.NEXT_PUBLIC_BUSINESS_CITY || "City"}
                  </a>
                </p>
                <p>
                  📞{" "}
                  <a
                    href={`tel:${
                      process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+15551234567"
                    }`}
                    className="cursor-pointer transition-colors hover:text-red-500"
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
                    className="cursor-pointer transition-colors hover:text-red-500"
                  >
                    {process.env.NEXT_PUBLIC_BUSINESS_EMAIL ||
                      "info@carsales.com"}
                  </a>
                </p>
              </div>
            </div>

            {/* Browse & Services */}
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">
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
                  <NavLink href="/AccidentClaims" text="Accident Claims" />
                </li>
              </ul>
            </div>

            {/* Support & Info */}
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">
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
              <h4 className="mb-4 font-semibold text-gray-900">
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
            <div className="flex flex-col items-center justify-between md:flex-row">
              <p className="text-sm text-gray-600">
                &copy; 2025{" "}
                {process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing"}
                . All rights reserved.
              </p>
              <div className="mt-4 flex space-x-6 md:mt-0">
                <a
                  href="#"
                  className="text-gray-400 transition-colors hover:text-red-500"
                >
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a
                  href="#"
                  className="text-gray-400 transition-colors hover:text-red-500"
                >
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a
                  href="#"
                  className="text-gray-400 transition-colors hover:text-red-500"
                >
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
