"use client";
import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { FOCUS_RING, type LinkItem } from "./constants";

// ── Reusable desktop dropdown panel ────────────────────────────────────
export function DropdownPanel({
  id,
  panelRef,
  className = "",
  children,
}: {
  id?: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      ref={panelRef}
      id={id}
      role="menu"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 480, damping: 30, mass: 0.6 }}
      className={
        "absolute top-full right-0 z-50 mt-2 origin-top-right rounded-xl border border-white/[0.08] bg-[#171717] p-1 shadow-2xl shadow-black/60 ring-1 ring-black/20 " +
        className
      }
    >
      {children}
    </motion.div>
  );
}

// ── Desktop panel link (icon + label + optional description) ───────────
export function PanelLink({
  item,
  onNav,
}: {
  item: LinkItem;
  onNav: (href: string, label: string) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={() => onNav(item.href, item.label)}
      className={
        "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white " +
        FOCUS_RING
      }
    >
      {Icon && (
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.04] text-red-400 transition-colors group-hover:bg-red-500/10">
          <Icon size={16} />
        </span>
      )}
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block leading-tight font-medium">{item.label}</span>
        {item.desc && (
          <span className="mt-0.5 block text-[12px] leading-snug text-gray-500 group-hover:text-gray-400">
            {item.desc}
          </span>
        )}
      </span>
    </Link>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">
      {children}
    </div>
  );
}
