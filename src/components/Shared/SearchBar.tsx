"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Day 9 / Fix 9.6 — site-wide search bar.
 *
 * Submits to `/BrowseFleet?search=…`, which the existing parseCarFilters
 * already reads (regex match over make/model/colour, indexed). Upgrading
 * to a `$text` index or Atlas Search is a follow-up when fleet size and
 * traffic warrant it; today's regex path is fast enough.
 *
 * On the BrowseFleet page itself we hydrate the value from the URL so
 * customers can refine instead of retyping.
 */
export default function SearchBar({
  className = "",
  placeholder = "Search make or model...",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  // Keep the input in sync with the URL when the user lands on BrowseFleet
  // via a search link. Doesn't re-clobber what they're typing because the
  // dep is `searchParams` only.
  useEffect(() => {
    const initial = searchParams.get("search") ?? "";
    setValue(initial);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      router.push("/BrowseFleet");
      return;
    }
    const params = new URLSearchParams();
    params.set("search", trimmed);
    router.push(`/BrowseFleet?${params.toString()}`);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative flex items-center ${className}`}
    >
      <label htmlFor="site-search" className="sr-only">
        Search the fleet
      </label>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400"
        aria-hidden="true"
      />
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
      />
    </form>
  );
}
