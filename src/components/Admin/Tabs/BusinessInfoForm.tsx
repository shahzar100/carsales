"use client";
import React from "react";
import type { ShopInfo } from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import {
  Building2,
  Clock,
  Globe,
  BarChart3,
  Sparkles,
  Shield,
  Truck,
  Wrench,
} from "lucide-react";

import Section from "./BusinessInfo/Section";
import CoreInfoSection from "./BusinessInfo/CoreInfoSection";
import HoursSection from "./BusinessInfo/HoursSection";
import SocialMediaSection from "./BusinessInfo/SocialMediaSection";
import HeroStatsSection from "./BusinessInfo/HeroStatsSection";
import DetailingPackagesSection from "./BusinessInfo/DetailingPackagesSection";
import TintOptionsSection from "./BusinessInfo/TintOptionsSection";
import ServiceOverviewsSection from "./BusinessInfo/ServiceOverviewsSection";
import RecoverySection from "./BusinessInfo/RecoverySection";

interface BusinessInfoFormProps {
  shopInfo: ShopInfo;
  onShopInfoChange: (shopInfo: ShopInfo) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

// Orchestrator: owns no local state of its own, just merges partials into
// shopInfo and delegates each section to a focused child component.
export default function BusinessInfoForm({
  shopInfo,
  onShopInfoChange,
  onSave,
}: BusinessInfoFormProps) {
  const update = (partial: Partial<ShopInfo>) =>
    onShopInfoChange({ ...shopInfo, ...partial });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Settings</h2>
        <p className="text-sm text-gray-500">
          Manage all business information displayed across the website.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <Section
          icon={Building2}
          title="Business Information"
          description="Name, contact details, and address"
          defaultOpen
        >
          <CoreInfoSection shopInfo={shopInfo} update={update} />
        </Section>

        <Section
          icon={Clock}
          title="Business Hours"
          description="Opening times displayed to customers"
        >
          <HoursSection shopInfo={shopInfo} update={update} />
        </Section>

        <Section
          icon={Globe}
          title="Social Media"
          description="Social media profile links"
        >
          <SocialMediaSection shopInfo={shopInfo} update={update} />
        </Section>

        <Section
          icon={BarChart3}
          title="Homepage Stats"
          description="Statistics shown on the hero section of the homepage"
        >
          <HeroStatsSection shopInfo={shopInfo} update={update} />
        </Section>

        <Section
          icon={Sparkles}
          title="Detailing Packages"
          description="Car detailing service packages and pricing"
        >
          <DetailingPackagesSection
            packages={shopInfo.detailingPackages ?? []}
            onChange={(pkgs) => update({ detailingPackages: pkgs })}
          />
        </Section>

        <Section
          icon={Shield}
          title="Window Tinting Options"
          description="Window tint products, pricing, and warranties"
        >
          <TintOptionsSection
            options={shopInfo.tintOptions ?? []}
            onChange={(opts) => update({ tintOptions: opts })}
          />
        </Section>

        <Section
          icon={Wrench}
          title="Service Overviews"
          description="Service summaries shown on the main Services page"
        >
          <ServiceOverviewsSection
            overviews={shopInfo.serviceOverviews ?? []}
            onChange={(ovs) => update({ serviceOverviews: ovs })}
          />
        </Section>

        <Section
          icon={Truck}
          title="Breakdown Recovery"
          description="Coverage areas, pricing tiers, and response time"
        >
          <RecoverySection
            recovery={
              shopInfo.recovery ?? {
                coverageAreas: [],
                pricingTiers: [],
                responseTime: "",
              }
            }
            onChange={(r) => update({ recovery: r })}
          />
        </Section>

        <div className="pt-2">
          <Button type="submit" size="lg" customWidth="w-full">
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
