import React from "react";
import { CheckCircle, Shield, Clock, LucideIcon } from "lucide-react";

interface WhyChooseItem {
  icon: LucideIcon;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
}

interface WhyChooseUsProps {
  items?: WhyChooseItem[];
}

const defaultItems: WhyChooseItem[] = [
  {
    icon: CheckCircle,
    title: "Certified Expertise",
    description:
      "ASE certified technicians with years of experience on all vehicle makes and models.",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description:
      "All repairs backed by comprehensive warranty and satisfaction guarantee.",
    bgColor: "bg-gray-100",
    textColor: "text-gray-900",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "Efficient service with most repairs completed within 1-2 business days.",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
];

const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ items }) => {
  const displayItems = items || defaultItems;

  return (
    <div className="mb-16">
      <h2 className="section-title mb-12 text-center">
        Why Choose Our Repair Shop?
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {displayItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.title} className="p-6 text-center">
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${item.bgColor} ${item.textColor}`}
              >
                <IconComponent size={32} />
              </div>
              <h3 className="heading-4 mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WhyChooseUs;
