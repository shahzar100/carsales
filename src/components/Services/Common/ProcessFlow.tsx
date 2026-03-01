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
}

const ProcessFlow: React.FC<ProcessFlowProps> = ({
  title,
  steps,
  accentColor = "bg-green-100 text-green-600",
}) => {
  return (
    <div className="mb-8 md:mb-16">
      <h2 className="section-title mb-6 text-center md:mb-12">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-6">
        {steps.map((process, index) => (
          <div key={index} className="text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${accentColor} text-xl font-bold`}
            >
              {process.step}
            </div>
            <h3 className="heading-4 mb-2">{process.title}</h3>
            <p className="text-sm text-gray-600">{process.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlow;
