"use client";
import React from "react";
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
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`pkg-card${selected ? " is-selected" : ""}${
        pkg.recommended ? " is-recommended" : ""
      }`}
    >
      <span className="pkg-icon">
        <Icon className="h-6 w-6 sm:h-[26px] sm:w-[26px]" />
        <span className="pkg-icon-radio">
          <span className="dot" />
        </span>
      </span>

      <span className="pkg-info">
        <h4>
          <span>{pkg.name}</span>
          {pkg.recommended && (
            <span className="pkg-rec-badge">Most popular</span>
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
    </button>
  );
}

