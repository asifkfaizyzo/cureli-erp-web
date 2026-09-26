// pharmacy-web/src/pages/verification/comps/VerificationStepper.jsx (do not remove this comment)
// src/components/verification/VerificationStepper.jsx
import { Check, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

const steps = [
  { id: 12, label: "Under Review", icon: Clock },
  { id: 14, label: "Resubmission", icon: AlertTriangle },
  { id: 15, label: "Verified", icon: ShieldCheck },
];

const VerificationStepper = ({ currentStep }) => {
  const getStepIndex = (stepId) => steps.findIndex((s) => s.id === stepId);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm border border-gray-100">
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = currentIndex > idx;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Pill */}
              <div
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-300
                  ${isCompleted 
                    ? "bg-green-100 text-green-700" 
                    : isActive 
                      ? "bg-[#000060] text-white shadow-md shadow-[#000060]/20" 
                      : "bg-gray-100 text-gray-400"
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <StepIcon size={12} />
                )}
                <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap hidden sm:inline">
                  {step.label}
                </span>
                <span className="text-[10px] font-semibold sm:hidden">
                  {idx + 1}
                </span>
              </div>

              {/* Connector */}
              {idx < steps.length - 1 && (
                <div
                  className={`
                    w-4 sm:w-8 h-0.5 mx-1 rounded-full transition-all duration-300
                    ${currentIndex > idx ? "bg-green-400" : "bg-gray-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerificationStepper;