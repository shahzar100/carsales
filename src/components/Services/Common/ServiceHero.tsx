import React from "react";
import { LucideIcon } from "lucide-react";

interface FeatureBadge {
  icon: LucideIcon;
  text: string;
  color: string;
}

interface ServiceHeroProps {
  icon: LucideIcon;
  iconBgColor: string;
  title: string;
  description: string;
  badges: FeatureBadge[];
}

const ServiceHero: React.FC<ServiceHeroProps> = ({
  icon: Icon,
  iconBgColor,
  title,
  description,
  badges,
}) => {
  return (
    <div className="mb-16 text-center">
      <div
        className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${iconBgColor || ""}`}
      >
        {Icon && <Icon size={40} />}
      </div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-600 sm:text-xl">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm text-gray-500">
        {(badges || []).map((badge, index) => {
          if (!badge || !badge.icon) return null;
          const BadgeIcon = badge.icon;
          return (
            <div key={index} className="flex items-center">
              <BadgeIcon className={`mr-2 h-5 w-5 ${badge.color || ""}`} />
              {badge.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceHero;
