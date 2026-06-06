"use client";
import React from "react";
import { m } from "motion/react";
import {
  Sparkles,
  Shield,
  Wrench,
  Check,
  Clock,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ServiceKey = "detailing" | "tints" | "repairs";

export interface ServiceCardData {
  key: ServiceKey;
  name: string;
  description: string;
  durationLabel: string;
  fromPrice: string;
  icon: LucideIcon;
  capTagLabel: string;
  capTagKind: "gold" | "neutral" | "urgent";
  capTagIcon: LucideIcon;
}

const KEY_TO_ICON: Record<ServiceKey, LucideIcon> = {
  detailing: Sparkles,
  tints: Shield,
  repairs: Wrench,
};

export const SERVICES: ServiceCardData[] = [
  {
    key: "detailing",
    name: "Detailing",
    description:
      "Showroom-grade hand wash, polish, and protection from our master detailers.",
    durationLabel: "2–6 hrs",
    fromPrice: "£59",
    icon: KEY_TO_ICON.detailing,
    capTagLabel: "Premium",
    capTagKind: "gold",
    capTagIcon: Sparkles,
  },
  {
    key: "tints",
    name: "Window Tints",
    description:
      "Pro film install with up to 99% UV block, heat rejection, and privacy.",
    durationLabel: "3–4 hrs",
    fromPrice: "£149",
    icon: KEY_TO_ICON.tints,
    capTagLabel: "UV Block 99%",
    capTagKind: "neutral",
    capTagIcon: Shield,
  },
  {
    key: "repairs",
    name: "Repairs & MOT",
    description:
      "Diagnostics, brakes, MOT, and mechanical fixes by certified technicians.",
    durationLabel: "1–2 days",
    fromPrice: "£39",
    icon: KEY_TO_ICON.repairs,
    capTagLabel: "Fast Turnaround",
    capTagKind: "urgent",
    capTagIcon: Zap,
  },
];

interface ServiceCardProps {
  service: ServiceCardData;
  selected: boolean;
  onSelect: () => void;
}

export default function ServiceCard({
  service,
  selected,
  onSelect,
}: ServiceCardProps) {
  const Icon = service.icon;
  const TagIcon = service.capTagIcon;

  return (
    <m.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`svc-card${selected ? " is-selected" : ""}`}
    >
      <m.span
        className="svc-check"
        aria-hidden={!selected}
        animate={{
          scale: selected ? 1 : 0,
          rotate: selected ? 0 : -90,
        }}
        transition={{ type: "spring", stiffness: 520, damping: 22 }}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </m.span>

      <span className={`svc-cap ${service.key}`}>
        <span className="badge-row">
          <span className={`svc-cap-tag ${service.capTagKind}`}>
            {service.capTagKind === "urgent" && (
              <span className="pulse" aria-hidden="true" />
            )}
            <TagIcon className="h-[11px] w-[11px]" strokeWidth={2.5} />
            {service.capTagLabel}
          </span>
          {service.key === "detailing" && (
            <span
              className="svc-cap-tag"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Star className="h-[10px] w-[10px]" fill="currentColor" /> 4.9
            </span>
          )}
          {service.key === "tints" && (
            <span
              className="svc-cap-tag"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              5-yr warranty
            </span>
          )}
          {service.key === "repairs" && (
            <span className="svc-cap-tag today">
              <Clock className="h-[10px] w-[10px]" /> Today
            </span>
          )}
        </span>
        <span className="svc-cap-icon">
          <Icon className="h-7 w-7" strokeWidth={2} />
        </span>
      </span>

      <span className="svc-body">
        <h3>{service.name}</h3>
        <p>{service.description}</p>
        <span className="svc-meta">
          <span className="svc-meta-item">
            <Clock className="h-[13px] w-[13px]" /> {service.durationLabel}
          </span>
          <span className="svc-price">
            <span className="from">From</span>
            <span className="amt">{service.fromPrice}</span>
          </span>
        </span>
      </span>
    </m.button>
  );
}
