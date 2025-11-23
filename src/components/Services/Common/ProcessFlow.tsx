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
    <div className="mb-16">
      <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
        {title}
      </h2>
      <div className="grid gap-6 md:grid-cols-5">
        {steps.map((process, index) => (
          <div key={index} className="text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${accentColor} text-xl font-bold`}
            >
              {process.step}
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">
              {process.title}
            </h3>
            <p className="text-sm text-gray-600">{process.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlow;
