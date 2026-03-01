import React from "react";
import { Check } from "lucide-react";
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
  titleColor,
  highlightPrefix,
  accent = "red",
}) => {
  const c = accentColors[accent];

  return (
    <div>
      {title && (
        <h4
          className={`mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase ${
            titleColor || c.text
          }`}
        >
          <span className="h-px flex-1 bg-white/10" />
          {title}
          <span className="h-px flex-1 bg-white/10" />
        </h4>
      )}
      <div className="space-y-2.5">
        {features.map((feature, idx) => {
          const isHighlighted =
            highlightPrefix && feature.startsWith(highlightPrefix);
          return (
            <div key={idx} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  isHighlighted
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <span
                className={`text-sm leading-snug ${
                  isHighlighted ? `font-medium ${c.highlight}` : "text-gray-300"
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
