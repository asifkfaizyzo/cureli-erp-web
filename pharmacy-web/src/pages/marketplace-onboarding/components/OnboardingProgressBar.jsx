// pharmacy-web/src/pages/marketplace-onboarding/components/OnboardingProgressBar.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-onboarding/components/OnboardingProgressBar.jsx

import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Storefront" },
  { id: 3, label: "Branches" },
  { id: 4, label: "Configure" },
  { id: 5, label: "Banking" }, // <-- Added
  { id: 6, label: "Preview" },
  { id: 7, label: "Go Live" },
];

const OnboardingProgressBar = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-bold transition-all duration-300
                  ${isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-white text-[#010015] ring-4 ring-white/20"
                    : "bg-white/10 text-white/30 border border-white/10"
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap hidden sm:block
                  ${isActive ? "text-white" : isCompleted ? "text-emerald-400" : "text-white/30"}
                `}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`
                  w-8 sm:w-12 h-px mb-4 mx-1 transition-all duration-300
                  ${currentStep > step.id ? "bg-emerald-500" : "bg-white/10"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OnboardingProgressBar;