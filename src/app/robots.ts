import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        // /Booking/lookup is a public booking tracker — allow it explicitly
        // (longer, more-specific match wins over the /Booking/ disallow), while
        // still hiding the per-user dynamic /Booking/[id] and /confirmation.
        allow: ["/", "/Booking/lookup"],
        disallow: ["/admin/", "/api/", "/Booking/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
