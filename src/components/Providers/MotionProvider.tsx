"use client";

import { LazyMotion, MotionConfig } from "motion/react";

/**
 * App-wide `MotionConfig` with `reducedMotion="user"`, plus `LazyMotion`.
 *
 * The root layout is a Server Component, so the `motion/react` context
 * provider lives in its own `"use client"` wrapper (same pattern as
 * AuthSessionProvider). `reducedMotion="user"` makes every `motion/react`
 * animation in the app honour the OS-level "Reduce motion" setting —
 * transform/layout animations are skipped while opacity is preserved.
 * The matching CSS keyframes (shimmer, mm-pop, mm-fade) are guarded by a
 * `@media (prefers-reduced-motion: reduce)` block in globals.css.
 *
 * `LazyMotion` lets every component use the lightweight `m` component
 * instead of `motion`, and loads the feature bundle as a separate async
 * chunk (kept out of the initial JS). We use `domMax` because the app
 * relies on layout projection (`layoutId`, `AnimatePresence mode="popLayout"`)
 * which `domAnimation` does not include. `strict` makes any stray full
 * `motion` component throw, so accidental regressions are caught.
 */
const loadFeatures = () =>
  import("motion/react").then((mod) => mod.domMax);

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
