// pharmacy-web/src/components/layout/CustomStepper.jsx (do not remove this comment)
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const CustomStepper = ({ currentStep = 1 }) => {
  //  UPDATED: Only show onboarding steps (1-12)
  // Steps 12+ are handled by VerificationStepper
  const stepsConfig = [
    { id: 1, type: "main", label: "Basic Details" },
    { id: 2, type: "sub" }, // Phone Details
    { id: 3, type: "sub" }, // Phone OTP
    { id: 4, type: "sub" }, // Identity Form
    { id: 5, type: "main", label: "Business Details" },
    { id: 6, type: "sub" }, // BusinessTypeAndGST
    { id: 7, type: "sub" }, // UploadDrugLicense
    { id: 8, type: "sub" }, // UploadRegistration
    { id: 9, type: "sub" }, // UploadProof
    { id: 10, type: "sub" }, // UploadEALisence
    { id: 11, type: "sub" }, // UploadBPan
    { id: 12, type: "main", label: "Submit" }, // UploadAddressProof (final step)
  ];

  // Colors
  const COLOR_NAVY = "#000066";
  const COLOR_GRAY = "#e5e7eb";

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-lg font-semibold mb-2 tracking-wide"
      >
        <span className="text-gray-500">Onboarding:</span>{" "}
        <span className="text-[#000066] font-bold">Cureli</span>
      </motion.h1>

      {/* Container */}
      <div className="flex items-center w-full max-w-3xl px-2 sm:px-4">
        {stepsConfig.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLastStep = index === stepsConfig.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* NODE */}
              <div className="relative flex flex-col items-center justify-center">
                {/* SMALL DOT */}
                {step.type === "sub" && (
                  <motion.div
                    animate={{
                      backgroundColor:
                        isCompleted || isCurrent ? COLOR_NAVY : COLOR_GRAY,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-1.5 h-1.5 rounded-full z-10"
                  />
                )}

                {/* BIG CIRCLE */}
                {step.type === "main" && (
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted ? COLOR_NAVY : "#fff",
                      borderColor:
                        isCompleted || isCurrent ? COLOR_NAVY : "#d1d5db",
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center z-10 
                      ${isCompleted ? "text-white" : "text-gray-400"}`}
                  >
                    <AnimatePresence mode="wait">
                      {/* Checkmark */}
                      {isCompleted && (
                        <motion.svg
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-3 h-3 font-bold"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </motion.svg>
                      )}

                      {/* Active Dot */}
                      {isCurrent && !isCompleted && (
                        <motion.div
                          key="active-dot"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 bg-[#000066] rounded-full"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* LABEL */}
                {step.type === "main" && (
                  <motion.div
                    animate={{
                      color: isCurrent || isCompleted ? COLOR_NAVY : "#9ca3af",
                    }}
                    className="absolute top-7 text-[10px] font-bold whitespace-nowrap"
                  >
                    {step.label}
                  </motion.div>
                )}
              </div>

              {/* LINE */}
              {!isLastStep && (
                <div className="flex-1 mx-0.5 h-[2px] bg-gray-200 relative rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="h-full bg-[#000066]"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CustomStepper;
