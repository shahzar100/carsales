"use client";
import React from "react";
import { motion } from "motion/react";
import { Check, Clock, type LucideIcon } from "lucide-react";

export interface PackageCardData {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  includes?: string[];
  recommended?: boolean;
  icon: LucideIcon;
}

interface PackageCardProps {
  pkg: PackageCardData;
  selected: boolean;
  onSelect: () => void;
}

export default function PackageCard({
  pkg,
  selected,
  onSelect,
}: PackageCardProps) {
  const Icon = pkg.icon;
  const includes = pkg.includes ?? [];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      className={`pkg-card${selected ? " is-selected" : ""}${
        pkg.recommended ? " is-recommended" : ""
      }`}
    >
      <motion.span
        className="pkg-icon"
        animate={{ scale: selected ? 1.06 : 1 }}
        transition={{ type: "spring", stiffness: 460, damping: 22 }}
      >
        <Icon className="h-6 w-6 sm:h-[26px] sm:w-[26px]" />
        <span className="pkg-icon-radio">
          <motion.span
            className="dot"
            animate={{ scale: selected ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 540, damping: 22 }}
          />
        </span>
      </motion.span>

      <span className="pkg-info">
        <h4>
          <span>{pkg.name}</span>
          {pkg.recommended && (
            <motion.span
              className="pkg-rec-badge"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              Most popular
            </motion.span>
          )}
        </h4>
        <p>{pkg.description}</p>
        {includes.length > 0 && (
          <span className="pkg-includes hidden sm:flex">
            {includes.map((it) => (
              <span key={it} className="inc">
                <Check className="h-3 w-3" strokeWidth={3} />
                <span>{it}</span>
              </span>
            ))}
          </span>
        )}
      </span>

      <span className="pkg-price">
        <span className="amt">{pkg.price}</span>
        <span className="dur">
          <Clock className="h-2.5 w-2.5" /> {pkg.duration}
        </span>
      </span>
    </motion.button>
  );
}
