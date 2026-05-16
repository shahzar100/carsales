import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared chrome for the /privacy and /terms long-form legal pages.
 *
 * Both pages had byte-identical section-rendering JSX (hero on black,
 * white middle with a list of titled sections, dark CTA at the bottom).
 * This shell owns the chrome; each page owns its own data — the eyebrow
 * icon, hero accent words, the section list, and the bottom CTA buttons.
 */
export interface LegalSection {
  title: string;
  /**
   * Pre-rendered body for this section. Privacy/Terms render multiple
   * paragraphs with optional subheadings inside each section — that
   * formatting decision stays in the page file, the shell just renders
   * whatever it's given inside the shared layout slot.
   */
  body: React.ReactNode;
}

export interface LegalPageShellProps {
  /** Plain page title — e.g. "Privacy" or "Terms of" with the accent below. */
  titleLead: string;
  /** Coloured/highlighted tail of the title — e.g. "Policy" or "Service". */
  titleAccent: string;
  /** Small pill above the H1, e.g. "Your Privacy Matters". */
  eyebrow: { icon: LucideIcon; label: string };
  /** Body copy below the H1. */
  intro: string;
  /** Stamp under the intro. Pass the shared LEGAL_LAST_UPDATED const. */
  lastUpdated: string;
  /** Ordered list of sections to render in the white middle band. */
  sections: LegalSection[];
  /** CTA block at the bottom — title, body, and pre-rendered buttons. */
  footerCta: {
    title: string;
    body: string;
    actions: React.ReactNode;
  };
}

export default function LegalPageShell({
  titleLead,
  titleAccent,
  eyebrow: { icon: EyebrowIcon, label: eyebrowLabel },
  intro,
  lastUpdated,
  sections,
  footerCta,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute -top-32 right-0 h-125 w-125 rounded-full bg-red-600/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-red-600/3 blur-3xl" />

        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
              <EyebrowIcon size={14} />
              {eyebrowLabel}
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              {titleLead}{" "}
              <span className="bg-linear-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                {titleAccent}
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-400">
              {intro}
            </p>

            <p className="mt-6 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Sections ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="mb-5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    {section.title}
                  </h2>
                  <div className="space-y-4">{section.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer CTA ─── */}
      <section className="bg-black py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
              {footerCta.title}
            </h2>
            <p className="mb-8 text-gray-400">{footerCta.body}</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {footerCta.actions}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
