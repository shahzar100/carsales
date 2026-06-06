"use client";
import Link from "next/link";
import { m } from "motion/react";

/**
 * Shared chrome for the customer login / register / forgot-password / reset
 * pages — a centred card with a heading and an optional footer link. Also
 * doubles as the admin auth shell via `variant="admin"`, which swaps the
 * card shadow and the outer min-height to match the admin login look.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  variant = "customer",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /**
   * Optional footer link block. Customer pages always pass one (e.g.
   * "Need an account? Create one"). Admin pages may pass a static prompt
   * string instead by omitting `href` — render as plain text.
   */
  footer?:
    | { prompt: string; linkText: string; href: string }
    | { prompt: string; linkText?: undefined; href?: undefined };
  /**
   * "customer" (default) = soft rounded-2xl card on a gradient page.
   * "admin"             = harder rounded-xl card with a deeper shadow,
   *                       full-viewport min-height. Otherwise identical.
   */
  variant?: "customer" | "admin";
}) {
  const isAdmin = variant === "admin";
  return (
    <div
      className={`flex ${
        isAdmin ? "min-h-screen" : "min-h-[80vh]"
      } items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4 ${
        isAdmin ? "" : "py-12"
      }`}
    >
      <m.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md"
      >
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className={isAdmin ? "mb-8 text-center" : "mb-6 text-center"}
        >
          <h1
            className={
              isAdmin
                ? "mb-2 text-3xl font-bold"
                : "text-3xl font-bold text-gray-900"
            }
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={
                isAdmin
                  ? "text-sm text-gray-500"
                  : "mt-1.5 text-sm text-gray-600"
              }
            >
              {subtitle}
            </p>
          )}
        </m.div>
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.14 }}
          className={
            isAdmin
              ? "rounded-xl bg-white p-8 shadow-2xl"
              : "rounded-2xl bg-white p-8 shadow-xl"
          }
        >
          {children}
        </m.div>
        {footer && (
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className={
              isAdmin
                ? "mt-6 text-center text-sm text-gray-500"
                : "mt-6 text-center text-sm text-gray-600"
            }
          >
            {footer.prompt}
            {footer.linkText && footer.href && (
              <>
                {" "}
                <Link
                  href={footer.href}
                  className="font-semibold text-red-600 hover:underline"
                >
                  {footer.linkText}
                </Link>
              </>
            )}
          </m.p>
        )}
      </m.div>
    </div>
  );
}
