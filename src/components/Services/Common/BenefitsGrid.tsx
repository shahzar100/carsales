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
  dark?: boolean;
}

const BenefitsGrid: React.FC<BenefitsGridProps> = ({
  benefits,
  title = "Benefits",
  columns = 4,
  dark = false,
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
      <h2
        className={`mb-6 text-center text-2xl font-bold tracking-tight md:mb-12 md:text-3xl ${
          dark ? "text-white" : ""
        }`}
      >
        {title}
      </h2>
      <div className={gridClass}>
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <div
              key={index}
              className={`rounded-xl border p-4 text-center transition-all duration-300 sm:p-6 ${
                dark
                  ? "border-white/10 bg-white/[0.05] hover:-translate-y-1 hover:bg-white/[0.08]"
                  : "border-gray-200 bg-white hover:shadow-md"
              }`}
              style={
                dark
                  ? {
                      background:
                        "linear-gradient(160deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.02) 100%)",
                    }
                  : undefined
              }
            >
              <div
                className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
                  dark
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <IconComponent size={32} />
              </div>
              <h3
                className={`mb-2 text-base font-semibold ${
                  dark ? "text-white" : ""
                }`}
              >
                {benefit.title}
              </h3>
              <p
                className={`text-sm ${
                  dark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {benefit.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BenefitsGrid;
