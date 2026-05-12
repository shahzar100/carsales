import { MetadataRoute } from "next";
import { getCarsCollection, serializeDocument } from "@/lib/models";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/BrowseFleet`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/Services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/Services/Detailing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/Services/Tints`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/Services/Repairs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/Recoveries`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/CarParts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/AboutUs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/AccidentClaims`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/FAQ`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic pages — fetch car listings from DB
  let carPages: MetadataRoute.Sitemap = [];
  try {
    const carsCollection = await getCarsCollection();
    const cars = await carsCollection
      .find({ status: "available" }, { projection: { _id: 1, updatedAt: 1 } })
      .toArray();

    carPages = cars.map((car) => {
      const serialized = serializeDocument(car);
      return {
        url: `${baseUrl}/BrowseFleet/${serialized._id}`,
        lastModified: serialized.updatedAt
          ? new Date(String(serialized.updatedAt))
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error("Error generating sitemap car pages:", error);
  }

  return [...staticPages, ...carPages];
}
