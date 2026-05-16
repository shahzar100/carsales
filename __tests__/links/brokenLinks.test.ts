/**
 * BROKEN INTERNAL LINKS TEST
 *
 * Scans all TSX/TS files under src/ for internal href values (href="/...")
 * and validates that a corresponding page.tsx exists in the App Router.
 *
 * Dynamic segments like /BrowseFleet/[_id] are treated as catch-alls for
 * any sub-path under /BrowseFleet/*, so /BrowseFleet/Toyota would pass.
 *
 * To allow a link that doesn't map to a page (e.g. anchors handled by
 * middleware, external redirects, etc.), add it to ALLOWED_HREFS below.
 */

import * as fs from "fs";
import * as path from "path";

// ─── Configuration ───────────────────────────────────────────────────────────

const SRC_DIR = path.resolve(__dirname, "../../src");
const APP_DIR = path.join(SRC_DIR, "app");

/**
 * Hrefs that are intentionally unresolvable to a page.tsx
 * (e.g. pages you plan to build later, middleware-handled routes, etc.)
 */
const ALLOWED_HREFS: string[] = [
  // Example: "/some-future-page",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect all files matching an extension set */
function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Walk the App Router tree and return every valid route.
 * Route groups like (main) and (admin) are stripped from the URL.
 * Dynamic segments like [_id] are stored as-is so we can match them later.
 */
function discoverRoutes(dir: string, prefix = ""): string[] {
  const routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      // A page.tsx at this level means this prefix is a valid route.
      // route.ts / route.tsx also counts — email templates link to API
      // endpoints like /api/auth/verify-email which only exist as a
      // route handler. Skipping them produced false positives.
      if (
        entry.name === "page.tsx" ||
        entry.name === "page.ts" ||
        entry.name === "route.tsx" ||
        entry.name === "route.ts"
      ) {
        routes.push(prefix || "/");
      }
      continue;
    }

    const folderName = entry.name;

    // Private folders (_), special Next.js folders. We DO recurse into
    // /api so its route handlers register as resolvable URLs.
    if (folderName.startsWith("_") || folderName.startsWith(".")) {
      continue;
    }

    // Route groups: (main), (admin) — strip from URL
    const isGroup = /^\(.*\)$/.test(folderName);
    const segment = isGroup ? "" : `/${folderName}`;
    routes.push(
      ...discoverRoutes(path.join(dir, folderName), prefix + segment)
    );
  }

  return routes;
}

/**
 * Check if an href resolves to an existing route.
 * Handles dynamic segments: /BrowseFleet/[_id] matches /BrowseFleet/anything.
 */
function routeExists(href: string, routes: string[]): boolean {
  // Exact match
  if (routes.includes(href)) return true;

  // Try matching dynamic segments
  const hrefParts = href.split("/").filter(Boolean);

  return routes.some((route) => {
    const routeParts = route.split("/").filter(Boolean);
    if (routeParts.length !== hrefParts.length) return false;

    return routeParts.every((seg, i) => {
      // Dynamic segment matches anything
      if (seg.startsWith("[") && seg.endsWith("]")) return true;
      return seg === hrefParts[i];
    });
  });
}

/** Extract all internal href strings from a file's contents */
function extractInternalHrefs(
  content: string,
  filePath: string
): { href: string; line: number }[] {
  const results: { href: string; line: number }[] = [];
  const lines = content.split("\n");

  // For URL-builder utilities (review-invite generators, sitemap, email
  // templates) the route doesn't appear as `href=...`. Day 8 / Fix 8.2:
  // also scan these specific files for string literals that look like an
  // internal route — this is what would have caught the /review email
  // 404 (Finding #2) before customers did.
  const rel = path.relative(SRC_DIR, filePath);
  const scanAsUtility =
    rel.startsWith("lib/") || rel.startsWith("emails/") || rel === "app/sitemap.ts";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const patterns: RegExp[] = [
      /href="(\/[^"]*?)"/g,
      /href=\{"(\/[^"]*?)"\}/g,
      /href=\{`(\/[^`]*?)`\}/g,
    ];

    // Utility files: match internal-route string literals — bare strings
    // ("/contact") and template literals (`${baseUrl}/review?ref=...`).
    // This is what would have caught the /review email 404 (Finding #2)
    // before customers did. Skips comments.
    if (scanAsUtility && !/^\s*\/\//.test(line)) {
      patterns.push(
        // Bare quoted: "/contact" or '/contact'
        /["'](\/[A-Za-z][a-zA-Z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)["']/g,
        // Template literal with ${...} prefix: `${baseUrl}/review?...`
        /\$\{[^}]*\}(\/[A-Za-z][a-zA-Z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)/g
      );
    }

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        let href = match[1];

        // Skip dynamic template expressions — we can't statically resolve them
        if (href.includes("${")) continue;

        // Strip query strings and hash fragments
        href = href.split("?")[0].split("#")[0];

        // Skip empty or root
        if (!href || href === "/") continue;

        // Strip trailing slash
        href = href.replace(/\/$/, "");

        results.push({ href, line: i + 1 });
      }
    }
  }

  return results;
}

// ─── Test ────────────────────────────────────────────────────────────────────

describe("Broken Internal Links", () => {
  const routes = discoverRoutes(APP_DIR);
  const sourceFiles = collectFiles(SRC_DIR, [".tsx", ".ts"]);

  // Build a map of href → locations for better error messages
  const hrefMap = new Map<string, { file: string; line: number }[]>();

  for (const filePath of sourceFiles) {
    // Skip API routes, email templates, and test utilities
    const rel = path.relative(SRC_DIR, filePath);
    if (rel.startsWith("app/api/")) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const hrefs = extractInternalHrefs(content, filePath);

    for (const { href, line } of hrefs) {
      const relPath = path.relative(path.resolve(__dirname, "../.."), filePath);
      if (!hrefMap.has(href)) hrefMap.set(href, []);
      hrefMap.get(href)!.push({ file: relPath, line });
    }
  }

  // Deduplicated list of unique hrefs to check
  const uniqueHrefs = Array.from(hrefMap.keys()).sort();

  if (uniqueHrefs.length === 0) {
    it("should find internal hrefs to validate", () => {
      throw new Error("No internal hrefs found — check the extraction logic");
    });
    return;
  }

  it("should have discovered app routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  // Create one test case per unique href for clear failure messages
  for (const href of uniqueHrefs) {
    if (ALLOWED_HREFS.includes(href)) continue;

    it(`href="${href}" should resolve to an existing page`, () => {
      const locations = hrefMap.get(href)!;
      const locationList = locations
        .map((loc) => `  • ${loc.file}:${loc.line}`)
        .join("\n");

      if (!routeExists(href, routes)) {
        throw new Error(
          `Broken link: "${href}" has no matching page route.\n` +
            `Found in:\n${locationList}\n\n` +
            `Available routes:\n${routes.map((r) => `  ${r}`).join("\n")}\n\n` +
            `If this link is intentional, add it to ALLOWED_HREFS in this test file.`
        );
      }
    });
  }
});
