import Link from "next/link";

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
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">{children}</div>
        <p className="mt-6 text-center text-sm text-gray-600">
          {footer.prompt}{" "}
          <Link
            href={footer.href}
            className="font-semibold text-red-600 hover:underline"
          >
            {footer.linkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
