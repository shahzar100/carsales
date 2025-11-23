import React from "react";

interface VLTOption {
  vlt: string;
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
}

const VLTGuide: React.FC = () => {
  const vltOptions: VLTOption[] = [
    {
      vlt: "5%",
      name: "5% VLT",
      description: 'Very dark, maximum privacy. Often called "limo tint"',
      bgColor: "bg-gray-900",
      textColor: "text-white",
    },
    {
      vlt: "20%",
      name: "20% VLT",
      description: "Dark tint, good privacy while maintaining visibility",
      bgColor: "bg-gray-700",
      textColor: "text-white",
    },
    {
      vlt: "35%",
      name: "35% VLT",
      description: "Medium tint, popular choice for all windows",
      bgColor: "bg-gray-500",
      textColor: "text-white",
    },
    {
      vlt: "50%",
      name: "50% VLT",
      description: "Light tint, subtle appearance with UV protection",
      bgColor: "bg-gray-300",
      textColor: "text-gray-800",
    },
  ];

  return (
    <div className="mb-16">
      <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
        Tint Darkness Guide (VLT)
      </h2>
      <div className="rounded-2xl bg-gray-50 p-8">
        <div className="grid gap-6 md:grid-cols-4">
          {vltOptions.map((option, index) => (
            <div key={index} className="text-center">
              <div
                className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg ${option.bgColor}`}
              >
                <span className={`font-bold ${option.textColor}`}>
                  {option.vlt}
                </span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">
                {option.name}
              </h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Legal Notice:</strong> Please check your local laws for
            legal tint limits. We&apos;ll help ensure your tint complies with
            local regulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VLTGuide;
