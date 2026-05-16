"use client";
import Link from "next/link";
import { motion } from "motion/react";

/**
 * Shared chrome for the customer login / register pages — a centred card
 * with a heading and a footer link to the sibling page. Keeps the two
 * pages visually identical without duplicating the layout markup.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: { prompt: string; linkText: string; href: string };
}) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28, delay: 0.14 }}
          className="rounded-2xl bg-white p-8 shadow-xl"
        >
          {children}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          {footer.prompt}{" "}
          <Link
            href={footer.href}
            className="font-semibold text-red-600 hover:underline"
          >
            {footer.linkText}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
