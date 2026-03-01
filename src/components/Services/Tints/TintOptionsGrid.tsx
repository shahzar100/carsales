import React from "react";
import {
  PackageGrid,
  PackageCard,
  FeatureList,
  InfoBox,
} from "@/components/Services/Common";

interface TintOption {
  name: string;
  type: string;
  price: string;
  vlt: string;
  warranty: string;
  description: string;
  features: string[];
  popular: boolean;
}

interface TintOptionsGridProps {
  tintOptions: TintOption[];
}

const TintOptionsGrid: React.FC<TintOptionsGridProps> = ({ tintOptions }) => {
  return (
    <PackageGrid title="Tint Film Options">
      {tintOptions.map((option, index) => (
        <PackageCard
          key={index}
          name={option.name}
          subtitle={`${option.type} Film`}
          price={option.price}
          popular={option.popular}
          accent="crimson"
        >
          <div className="space-y-3">
            <InfoBox
              rows={[
                { label: "VLT Options:", value: option.vlt },
                { label: "Warranty:", value: option.warranty },
              ]}
            />
            <FeatureList features={option.features} accent="crimson" />
          </div>
        </PackageCard>
      ))}
    </PackageGrid>
  );
};

export default TintOptionsGrid;
