import React from "react";

interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

interface ProcessFlowProps {
  title: string;
  steps: ProcessStep[];
  accentColor?: string;
  dark?: boolean;
}

const ProcessFlow: React.FC<ProcessFlowProps> = ({
  title,
  steps,
  accentColor = "bg-red-50 text-red-600",
  dark = false,
}) => {
  return (
    <div className="mb-8 md:mb-16">
      <h2
        className={`mb-6 text-center text-2xl font-bold tracking-tight md:mb-12 md:text-3xl ${
          dark ? "text-white" : ""
        }`}
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-6">
        {steps.map((process, index) => (
          <div key={index} className="text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${
                dark
                  ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                  : accentColor
              }`}
            >
              {process.step}
            </div>
            <h3
              className={`mb-2 text-base font-semibold ${
                dark ? "text-white" : ""
              }`}
            >
              {process.title}
            </h3>
            <p
              className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}
            >
              {process.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlow;
