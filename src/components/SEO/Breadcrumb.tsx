import { JsonLd } from "./JsonLd";

/**
 * Renders a schema.org BreadcrumbList for the current page.
 *
 * Google uses this to show the breadcrumb trail in SERPs instead of the
 * raw URL — significantly improves CTR on deep pages like car details.
 * See https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 *
 * (#22) Pass items in order from root → current page. The URL on the
 * LAST item is what appears as the SERP slug, so it should be the
 * canonical URL for that page.
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function Breadcrumb({ items }: BreadcrumbProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
  return <JsonLd data={data} />;
}
