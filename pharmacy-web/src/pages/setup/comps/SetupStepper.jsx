// pharmacy-web/src/pages/setup/comps/SetupStepper.jsx (do not remove this comment)
// src/components/setup/SetupStepper.jsx
import { motion } from "framer-motion";
import { Check, Building2, Users, ClipboardCheck } from "lucide-react";

const steps = [
  { id: 1, title: "Branches", icon: Building2 },
  { id: 2, title: "Users", icon: Users },
  { id: 3, title: "Review", icon: ClipboardCheck },
];

const SetupStepper = ({ currentStep = 1, variant = "horizontal" }) => {
  // Vertical variant for desktop sidebar
  if (variant === "vertical") {
    return (
      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Setup Progress
        </h2>
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLast = index === steps.length - 1;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative">
              <div
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                  ${isActive ? "bg-[#000060]/10" : ""}
                  ${isCompleted ? "bg-emerald-50" : ""}
                `}
              >
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted
                      ? "#10b981"
                      : isActive
                      ? "#000060"
                      : "#e5e7eb",
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  {isCompleted ? (
                    <Check size={18} className="text-white" strokeWidth={3} />
                  ) : (
                    <StepIcon
                      size={18}
                      className={isActive ? "text-white" : "text-gray-400"}
                    />
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      isActive
                        ? "text-[#000060]"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    Step {step.id} of {steps.length}
                  </p>
                </div>

                {isActive && (
                  <div className="w-1.5 h-8 bg-[#000060] rounded-full" />
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[26px] top-[52px] w-0.5 h-4 bg-gray-200">
                  <motion.div
                    initial={{ height: "0%" }}
                    animate={{ height: isCompleted ? "100%" : "0%" }}
                    className="w-full bg-emerald-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal compact variant for mobile
  if (variant === "horizontal-compact") {
    return (
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLast = index === steps.length - 1;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted
                    ? "#10b981"
                    : isActive
                    ? "#000060"
                    : "#e5e7eb",
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {isCompleted ? (
                  <Check size={14} className="text-white" strokeWidth={3} />
                ) : (
                  <StepIcon
                    size={14}
                    className={isActive ? "text-white" : "text-gray-400"}
                  />
                )}
              </motion.div>

              {!isLast && (
                <div className="w-6 h-0.5 bg-gray-200 mx-1">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Default horizontal variant
  return (
    <div className="flex items-center justify-between w-full max-w-md">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isLast = index === steps.length - 1;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "#10b981"
                    : isActive
                    ? "#000060"
                    : "#e5e7eb",
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                {isCompleted ? (
                  <Check size={18} className="text-white" strokeWidth={3} />
                ) : (
                  <StepIcon
                    size={16}
                    className={isActive ? "text-white" : "text-gray-400"}
                  />
                )}
              </motion.div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  isActive
                    ? "text-[#000060]"
                    : isCompleted
                    ? "text-emerald-600"
                    : "text-gray-400"
                }`}
              >
                {step.title}
              </span>
            </div>

            {!isLast && (
              <div className="flex-1 mx-3 h-0.5 bg-gray-200">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  className="h-full bg-emerald-500"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SetupStepper;