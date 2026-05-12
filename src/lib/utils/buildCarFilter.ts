import type { Filter } from "mongodb";
import type { CarInterface } from "@/lib/interfaces";

/**
 * (#19) Parse URL search params into a MongoDB filter for the cars
 * collection. This is the single source of truth for what the
 * customer-facing fleet listing supports — kept server-side so the
 * client never gets to choose which fields it filters on.
 *
 * Indexes covered by these queries are declared in
 * `src/lib/models/index.ts:getCarsCollection` — keep them aligned.
 */

export interface ParsedCarFilters {
  search?: string;
  make?: string;
  status?: "available" | "sold" | "reserved";
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  doors?: number;
  colour?: string;
  features?: string[];
  sort?: "newest" | "priceAsc" | "priceDesc" | "mileageAsc" | "yearDesc";
  page: number;
  perPage: number;
}

const PER_PAGE_DEFAULT = 9;
const PER_PAGE_MAX = 50;

function toInt(v: string | null | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) ? n : undefined;
}

function toPositiveInt(v: string | null | undefined): number | undefined {
  const n = toInt(v);
  return n !== undefined && n >= 0 ? n : undefined;
}

/**
 * Parse a `URLSearchParams`-like object (or a plain searchParams record
 * from a server component) into a typed filter description.
 */
export function parseCarFilters(
  searchParams: Record<string, string | string[] | undefined>
): ParsedCarFilters {
  const get = (key: string): string | undefined => {
    const v = searchParams[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const statusRaw = get("status");
  const status =
    statusRaw === "available" ||
    statusRaw === "sold" ||
    statusRaw === "reserved"
      ? statusRaw
      : undefined;

  const sortRaw = get("sort");
  const sort =
    sortRaw === "priceAsc" ||
    sortRaw === "priceDesc" ||
    sortRaw === "mileageAsc" ||
    sortRaw === "yearDesc" ||
    sortRaw === "newest"
      ? sortRaw
      : undefined;

  const featuresRaw = get("features");
  const features = featuresRaw
    ? featuresRaw
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 20)
    : undefined;

  const page = Math.max(1, toInt(get("page")) ?? 1);
  const perPageRaw = toInt(get("perPage")) ?? PER_PAGE_DEFAULT;
  const perPage = Math.min(PER_PAGE_MAX, Math.max(1, perPageRaw));

  return {
    search: get("search")?.slice(0, 100) || undefined,
    make: get("make") && get("make") !== "all" ? get("make") : undefined,
    status,
    priceMin: toPositiveInt(get("priceMin")),
    priceMax: toPositiveInt(get("priceMax")),
    yearMin: toPositiveInt(get("yearMin")),
    yearMax: toPositiveInt(get("yearMax")),
    mileageMin: toPositiveInt(get("mileageMin")),
    mileageMax: toPositiveInt(get("mileageMax")),
    doors:
      get("doors") && get("doors") !== "all" ? toInt(get("doors")) : undefined,
    colour:
      get("colour") && get("colour") !== "all" ? get("colour") : undefined,
    features,
    sort,
    page,
    perPage,
  };
}

/**
 * Build a typed MongoDB filter expression from parsed filters.
 * Customer-facing default: only `available` cars unless an explicit
 * status filter says otherwise. Admins use a different code path.
 */
export function buildCarMongoFilter(
  f: ParsedCarFilters
): Filter<CarInterface> {
  const query: Filter<CarInterface> = {};

  // Default to available cars unless the user picked something else
  query.status = f.status ?? "available";

  if (f.make) query.make = f.make;
  if (f.colour) query.colour = f.colour;
  if (typeof f.doors === "number") query.doors = f.doors;

  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    query.price = {};
    if (f.priceMin !== undefined) query.price.$gte = f.priceMin;
    if (f.priceMax !== undefined) query.price.$lte = f.priceMax;
  }
  if (f.yearMin !== undefined || f.yearMax !== undefined) {
    query.year = {};
    if (f.yearMin !== undefined) query.year.$gte = f.yearMin;
    if (f.yearMax !== undefined) query.year.$lte = f.yearMax;
  }
  if (f.mileageMin !== undefined || f.mileageMax !== undefined) {
    query.mileage = {};
    if (f.mileageMin !== undefined) query.mileage.$gte = f.mileageMin;
    if (f.mileageMax !== undefined) query.mileage.$lte = f.mileageMax;
  }

  if (f.features && f.features.length > 0) {
    query.features = { $all: f.features };
  }

  // Full-text-ish search across make/model/colour. For volume traffic
  // upgrade this to a $text index or Atlas Search, but for hundreds of
  // listings a regex over indexed fields is fine.
  if (f.search) {
    const safe = f.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    query.$or = [
      { make: rx },
      { model: rx },
      { colour: rx },
    ];
  }

  return query;
}

/**
 * MongoDB sort tuple for the requested sort option.
 */
export function buildCarSort(
  sort: ParsedCarFilters["sort"]
): Record<string, 1 | -1> {
  switch (sort) {
    case "priceAsc":
      return { price: 1 };
    case "priceDesc":
      return { price: -1 };
    case "mileageAsc":
      return { mileage: 1 };
    case "yearDesc":
      return { year: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}
