import React from "react";
import { CheckCircle } from "lucide-react";
import type { AccentColor } from "./PackageCard";
import { accentColors } from "./PackageCard";

interface FeatureListProps {
  /** List of feature strings */
  features: string[];
  /** Optional section heading (e.g. "Exterior", "Interior") */
  title?: string;
  /** Title colour variant — uses accent highlight when provided */
  titleColor?: string;
  /** Features starting with this prefix get accent-coloured styling */
  highlightPrefix?: string;
  /** Accent colour for highlighted items (default "blue") */
  accent?: AccentColor;
}

const FeatureList: React.FC<FeatureListProps> = ({
  features,
  title,
  titleColor = "text-gray-900",
  highlightPrefix,
  accent = "blue",
}) => {
  const c = accentColors[accent];

  return (
    <div>
      {title && (
        <h4
          className={`mb-2 text-sm font-semibold uppercase tracking-wide ${titleColor}`}
        >
          {title}
        </h4>
      )}
      <div className="space-y-2">
        {features.map((feature, idx) => {
          const isHighlighted =
            highlightPrefix && feature.startsWith(highlightPrefix);
          return (
            <div key={idx} className="flex items-start">
              <CheckCircle
                className={`mt-0.5 mr-2 h-4 w-4 shrink-0 ${
                  isHighlighted ? c.highlightIcon : "text-green-500"
                }`}
              />
              <span
                className={`text-sm ${
                  isHighlighted
                    ? `font-medium italic ${c.highlight}`
                    : "text-gray-700"
                }`}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureList;
