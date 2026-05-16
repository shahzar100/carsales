/**
 * @jest-environment node
 *
 * Tests for src/lib/utils/buildCarFilter.ts
 *
 * Standards coverage:
 * - 📋 Functional: search-param → typed filter → MongoDB filter pipeline
 * - 🔒 Security: regex special chars in `search` are escaped (no ReDoS), and
 *   only declared status / sort values are accepted (no SSRF-style overrides)
 * - 🎯 Usability: sensible defaults (page=1, perPage=9, status=available)
 */

import {
  parseCarFilters,
  buildCarMongoFilter,
  buildCarSort,
} from "@/lib/utils/buildCarFilter";

describe("parseCarFilters", () => {
  it("falls back to defaults when no params are provided", () => {
    expect(parseCarFilters({})).toEqual({
      search: undefined,
      make: undefined,
      status: undefined,
      priceMin: undefined,
      priceMax: undefined,
      yearMin: undefined,
      yearMax: undefined,
      mileageMin: undefined,
      mileageMax: undefined,
      doors: undefined,
      colour: undefined,
      features: undefined,
      sort: undefined,
      page: 1,
      perPage: 9,
    });
  });

  it("accepts all three valid status values", () => {
    for (const s of ["available", "sold", "reserved"] as const) {
      expect(parseCarFilters({ status: s }).status).toBe(s);
    }
  });

  it("🔒 silently ignores invalid status values (no injection)", () => {
    expect(
      parseCarFilters({ status: "{$ne:1}" }).status
    ).toBeUndefined();
    expect(parseCarFilters({ status: "" }).status).toBeUndefined();
  });

  it("accepts every documented sort value and rejects others", () => {
    const valid = [
      "newest",
      "priceAsc",
      "priceDesc",
      "mileageAsc",
      "yearDesc",
    ] as const;
    for (const s of valid) {
      expect(parseCarFilters({ sort: s }).sort).toBe(s);
    }
    expect(parseCarFilters({ sort: "DROP TABLE cars" }).sort).toBeUndefined();
  });

  it("splits comma-separated features, trims, drops empties, caps at 20", () => {
    const features = Array.from({ length: 25 }, (_, i) => `f${i}`).join(",");
    const parsed = parseCarFilters({ features: ` AC, , Bluetooth , Cruise ` });
    expect(parsed.features).toEqual(["AC", "Bluetooth", "Cruise"]);

    const capped = parseCarFilters({ features });
    expect(capped.features).toHaveLength(20);
    expect(capped.features?.[19]).toBe("f19");
  });

  it("clamps page to >=1 and perPage to [1, 50]", () => {
    expect(parseCarFilters({ page: "-3", perPage: "0" })).toMatchObject({
      page: 1,
      perPage: 1,
    });
    expect(parseCarFilters({ page: "9999", perPage: "9999" }).perPage).toBe(50);
    expect(parseCarFilters({ perPage: "not-a-number" }).perPage).toBe(9);
  });

  it("truncates search to 100 chars and drops empty string", () => {
    const long = "x".repeat(200);
    expect(parseCarFilters({ search: long }).search).toHaveLength(100);
    expect(parseCarFilters({ search: "" }).search).toBeUndefined();
  });

  it("treats 'all' as the unset sentinel for make / doors / colour", () => {
    expect(parseCarFilters({ make: "all" }).make).toBeUndefined();
    expect(parseCarFilters({ doors: "all" }).doors).toBeUndefined();
    expect(parseCarFilters({ colour: "all" }).colour).toBeUndefined();
  });

  it("picks the first value when a param is provided multiple times", () => {
    expect(parseCarFilters({ make: ["Tesla", "Toyota"] }).make).toBe("Tesla");
  });

  it("rejects non-integer numeric inputs (e.g. floats, NaN)", () => {
    expect(parseCarFilters({ priceMin: "1000.5" }).priceMin).toBeUndefined();
    expect(parseCarFilters({ yearMin: "abc" }).yearMin).toBeUndefined();
    expect(parseCarFilters({ doors: "3.7" }).doors).toBeUndefined();
  });

  it("rejects negative numeric inputs", () => {
    expect(parseCarFilters({ priceMin: "-5" }).priceMin).toBeUndefined();
    expect(parseCarFilters({ yearMin: "-1" }).yearMin).toBeUndefined();
  });
});

describe("buildCarMongoFilter", () => {
  it("defaults to status=available when none is supplied", () => {
    const q = buildCarMongoFilter({ page: 1, perPage: 9 });
    expect(q.status).toBe("available");
  });

  it("honours the parsed status (sold / reserved) verbatim", () => {
    const q = buildCarMongoFilter({ status: "sold", page: 1, perPage: 9 });
    expect(q.status).toBe("sold");
  });

  it("builds price / year / mileage range expressions", () => {
    const q = buildCarMongoFilter({
      priceMin: 1000,
      priceMax: 50000,
      yearMin: 2015,
      mileageMax: 80000,
      page: 1,
      perPage: 9,
    });
    expect(q.price).toEqual({ $gte: 1000, $lte: 50000 });
    expect(q.year).toEqual({ $gte: 2015 });
    expect(q.mileage).toEqual({ $lte: 80000 });
  });

  it("uses $all for features so every selected feature is required (AND)", () => {
    const q = buildCarMongoFilter({
      features: ["AC", "Bluetooth"],
      page: 1,
      perPage: 9,
    });
    expect(q.features).toEqual({ $all: ["AC", "Bluetooth"] });
  });

  it("🔒 escapes regex metacharacters in `search` so a hostile term can't break the query", () => {
    const q = buildCarMongoFilter({
      search: ".*+?^${}()|[]\\dangerous",
      page: 1,
      perPage: 9,
    });
    const orClause = q.$or as Array<{ make: RegExp }>;
    expect(orClause).toBeDefined();
    // The literal `.` and `*` must be escaped — i.e. the pattern source
    // must contain `\\.` and `\\*` (not the bare special chars).
    expect(orClause[0].make.source).toContain("\\.");
    expect(orClause[0].make.source).toContain("\\*");
    expect(orClause[0].make.flags).toContain("i");
  });

  it("searches across make / model / colour case-insensitively", () => {
    const q = buildCarMongoFilter({ search: "Tesla", page: 1, perPage: 9 });
    const or = q.$or as Array<Record<string, RegExp>>;
    expect(or.map((o) => Object.keys(o)[0]).sort()).toEqual([
      "colour",
      "make",
      "model",
    ]);
  });

  it("omits range clauses when only undefined is supplied", () => {
    const q = buildCarMongoFilter({ page: 1, perPage: 9 });
    expect(q.price).toBeUndefined();
    expect(q.year).toBeUndefined();
    expect(q.mileage).toBeUndefined();
    expect(q.$or).toBeUndefined();
  });

  it("threads make/colour/doors filters through to the Mongo query", () => {
    const q = buildCarMongoFilter({
      make: "Tesla",
      colour: "Red",
      doors: 4,
      page: 1,
      perPage: 9,
    });
    expect(q.make).toBe("Tesla");
    expect(q.colour).toBe("Red");
    expect(q.doors).toBe(4);
  });

  it("supports yearMax-only and mileageMin-only ranges", () => {
    const q1 = buildCarMongoFilter({ yearMax: 2024, page: 1, perPage: 9 });
    expect(q1.year).toEqual({ $lte: 2024 });
    const q2 = buildCarMongoFilter({ mileageMin: 10000, page: 1, perPage: 9 });
    expect(q2.mileage).toEqual({ $gte: 10000 });
  });

  it("supports a priceMax-only range (no $gte clause)", () => {
    const q = buildCarMongoFilter({ priceMax: 25000, page: 1, perPage: 9 });
    expect(q.price).toEqual({ $lte: 25000 });
  });
});

describe("parseCarFilters — colour pass-through", () => {
  it("forwards a non-'all' colour through to the parsed filter", () => {
    expect(parseCarFilters({ colour: "Red" }).colour).toBe("Red");
  });
});

describe("buildCarSort", () => {
  it.each([
    ["priceAsc", { price: 1 }],
    ["priceDesc", { price: -1 }],
    ["mileageAsc", { mileage: 1 }],
    ["yearDesc", { year: -1 }],
    ["newest", { createdAt: -1 }],
  ])("returns the right Mongo sort for %s", (sort, expected) => {
    expect(buildCarSort(sort as "newest")).toEqual(expected);
  });

  it("defaults to {createdAt:-1} when no sort is provided", () => {
    expect(buildCarSort(undefined)).toEqual({ createdAt: -1 });
  });
});
