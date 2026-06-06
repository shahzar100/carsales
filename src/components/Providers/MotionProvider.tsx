"use client";

import { MotionConfig } from "motion/react";

/**
 * App-wide `MotionConfig` with `reducedMotion="user"`.
 *
 * The root layout is a Server Component, so the `motion/react` context
 * provider lives in its own `"use client"` wrapper (same pattern as
 * AuthSessionProvider). `reducedMotion="user"` makes every `motion/react`
 * animation in the app honour the OS-level "Reduce motion" setting —
 * transform/layout animations are skipped while opacity is preserved.
 * The matching CSS keyframes (shimmer, mm-pop, mm-fade) are guarded by a
 * `@media (prefers-reduced-motion: reduce)` block in globals.css.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
