"use client";
import React, { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { NextButton, PreviousButton, SubmitButton } from "./FormPrimitives";

export interface FormStep {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  /** Return true if valid, or a string error message if invalid */
  validate?: () => true | string;
}

interface FormProps {
  steps: FormStep[];
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  className?: string;
}

const Form: React.FC<FormProps> = ({
  steps,
  onSubmit,
  submitLabel = "Submit",
  className = "",
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Reactively check whether the current step passes validation
  // (without setting error messages — those only appear on explicit click)
  const isCurrentStepValid = (() => {
    const step = steps[currentStep];
    if (!step.validate) return true;
    return step.validate() === true;
  })();

  const validateCurrentStep = useCallback((): boolean => {
    const step = steps[currentStep];
    if (step.validate) {
      const result = step.validate();
      if (result !== true) {
        setStepError(result);
        return false;
      }
    }
    setStepError("");
    return true;
  }, [currentStep, steps]);

  const goToNext = () => {
    if (!validateCurrentStep()) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToPrevious = () => {
    setStepError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (index: number) => {
    // Allow going back freely, or to completed steps
    if (index < currentStep || completedSteps.has(index)) {
      setStepError("");
      setCurrentStep(index);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      await onSubmit();
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
    } catch {
      setStepError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-6 ${className}`}
    >
      {/* Step Progress Indicator */}
      <div className="relative overflow-x-auto">
        <div className="flex min-w-0 items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const isClickable = index < currentStep || isCompleted;

            return (
              <React.Fragment key={index}>
                {/* Step Circle + Label */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    disabled={!isClickable && !isActive}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-200"
                        : isCompleted
                          ? "cursor-pointer border-emerald-500 bg-emerald-500 text-white hover:shadow-md hover:shadow-emerald-200"
                          : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="h-5 w-5" />
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      index + 1
                    )}
                  </button>

                  <div className="text-center">
                    <p
                      className={`hidden text-xs font-medium transition-colors duration-300 sm:block ${
                        isActive
                          ? "text-red-600"
                          : isCompleted
                            ? "text-emerald-600"
                            : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="mt-0.5 hidden text-[10px] text-gray-400 sm:block">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="mx-1 mb-4 h-0.5 flex-1 sm:mx-2 sm:mb-8">
                    <div className="relative h-full w-full rounded-full bg-gray-200">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{
                          width: isCompleted ? "100%" : "0%",
                        }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-50 rounded-xl border border-gray-200 bg-gray-50/50 p-3 sm:p-6">
        <div className="mb-4">
          <h3 className="heading-3">{steps[currentStep].title}</h3>
          {steps[currentStep].description && (
            <p className="mt-1 text-sm text-gray-500">
              {steps[currentStep].description}
            </p>
          )}
        </div>

        {/* Error Message */}
        {stepError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {stepError}
          </div>
        )}

        <div>{steps[currentStep].content}</div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <PreviousButton onClick={goToPrevious} disabled={isFirstStep} />

        {/* Step Counter */}
        <span className="text-xs text-gray-400">
          Step {currentStep + 1} of {steps.length}
        </span>

        {isLastStep ? (
          <SubmitButton
            label={submitLabel}
            loading={isSubmitting}
            disabled={!isCurrentStepValid}
          />
        ) : (
          <NextButton onClick={goToNext} disabled={!isCurrentStepValid} />
        )}
      </div>
    </form>
  );
};

export default Form;
