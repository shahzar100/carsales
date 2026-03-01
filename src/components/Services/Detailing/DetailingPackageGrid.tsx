import React from "react";
import {
  PackageGrid,
  PackageCard,
  FeatureList,
} from "@/components/Services/Common";

interface DetailingPackage {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  duration: string;
  description: string;
  exteriorFeatures: string[];
  interiorFeatures: string[];
  popular: boolean;
  includesPrevious: string | null;
}

interface DetailingPackageGridProps {
  packages: DetailingPackage[];
}

const DetailingPackageGrid: React.FC<DetailingPackageGridProps> = ({
  packages,
}) => {
  return (
    <PackageGrid title="Choose Your Detailing Package">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          name={pkg.name}
          subtitle={pkg.subtitle}
          price={pkg.price}
          extra={pkg.duration}
          popular={pkg.popular}
          accent="red"
        >
          <div className="space-y-3">
            <FeatureList
              features={pkg.exteriorFeatures}
              title="Exterior"
              titleColor="text-red-400"
              highlightPrefix="All services from"
              accent="red"
            />
            <FeatureList
              features={pkg.interiorFeatures}
              title="Interior"
              highlightPrefix="All services from"
              accent="red"
            />
          </div>
        </PackageCard>
      ))}
    </PackageGrid>
  );
};

export default DetailingPackageGrid;
