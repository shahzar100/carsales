import React from "react";
import { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsGridProps {
  benefits: Benefit[];
  title?: string;
  columns?: number;
}

const BenefitsGrid: React.FC<BenefitsGridProps> = ({
  benefits,
  title = "Benefits",
  columns = 4,
}) => {
  const gridClass = `grid gap-6 sm:gap-8 ${
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 3
        ? "sm:grid-cols-2 md:grid-cols-3"
        : "sm:grid-cols-2"
  }`;

  return (
    <div className="mb-8 md:mb-16">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl md:mb-12">
        {title}
      </h2>
      <div className={gridClass}>
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-4 text-center transition-shadow duration-300 hover:shadow-md sm:p-6"
            >
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <IconComponent size={32} />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BenefitsGrid;
