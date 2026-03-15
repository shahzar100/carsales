"use client";
import { useState, useEffect, useRef } from "react";

/**
 * Hook that returns `true` for a configurable duration, then `false`.
 * Use it to show skeleton placeholders before revealing actual content.
 *
 * @param minMs  Minimum skeleton duration in ms (default 1000)
 * @param maxMs  Maximum skeleton duration in ms (default 3000)
 * @returns      `true` while the skeleton should be shown
 */
export function useSkeleton(
  minMs: number = 1000,
  maxMs: number = 3000
): boolean {
  const [isLoading, setIsLoading] = useState(true);
  const durationRef = useRef(
    Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), durationRef.current);
    return () => clearTimeout(timer);
  }, []);

  return isLoading;
}
