// pharmacy-web/src/pages/marketplace-onboarding/components/OnboardingSidebar.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-onboarding/components/OnboardingSidebar.jsx

import {
  Check,
  Sparkles,
  Store,
  Building2,
  Settings,
  Landmark, // <-- Imported
  Eye,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";

// Expanded Steps Schema
const STEPS = [
  { id: 1, label: "Welcome", description: "Get started", icon: Sparkles },
  { id: 2, label: "Storefront", description: "Name, logo & contact", icon: Store },
  { id: 3, label: "Branches", description: "Select locations", icon: Building2 },
  { id: 4, label: "Configure", description: "Hours & fulfillment", icon: Settings },
  { id: 5, label: "Banking", description: "Payment settlements", icon: Landmark }, // <-- New Step
  { id: 6, label: "Preview", description: "Review storefront", icon: Eye },
  { id: 7, label: "Go Live", description: "Launch marketplace", icon: Rocket },
];

const OnboardingSidebar = ({ currentStep, onStepClick }) => {
  const isDraftSaving = useMarketplaceStore((s) => s.isDraftSaving);
  const lastSavedAt = useMarketplaceStore((s) => s.lastSavedAt);

  const formatSavedTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-[260px] flex-shrink-0
      h-full border-r border-white/[0.06] bg-white/[0.015]"
    >
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
            flex items-center justify-center"
          >
            <Store size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Marketplace</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
              Setup Wizard
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/[0.06] flex-shrink-0" />

      <nav className="flex-1 min-h-0 px-3 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isClickable = step.id <= currentStep;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative">
                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      absolute left-[21px] top-[40px] w-[2px] h-[8px]
                      transition-colors duration-300
                      ${isCompleted ? "bg-emerald-500/40" : "bg-white/[0.06]"}
                    `}
                  />
                )}

                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`
                    w-full flex items-center gap-2.5 px-2 py-2 rounded-xl
                    text-left transition-all duration-200 group
                    ${isActive
                      ? "bg-white/[0.08]"
                      : isClickable
                        ? "hover:bg-white/[0.04]"
                        : "opacity-50 cursor-not-allowed"
                    }
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      flex-shrink-0 transition-all duration-300
                      ${isCompleted
                        ? "bg-emerald-500/15 text-emerald-400"
                        : isActive
                          ? "bg-white/10 text-white ring-2 ring-white/20"
                          : "bg-white/[0.04] text-white/25"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-medium leading-tight
                        ${isActive
                          ? "text-white"
                          : isCompleted
                            ? "text-white/70"
                            : "text-white/35"
                        }
                      `}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 leading-tight
                        ${isActive
                          ? "text-white/40"
                          : isCompleted
                            ? "text-white/25"
                            : "text-white/15"
                        }
                      `}
                    >
                      {step.description}
                    </p>
                  </div>

                  {isActive && (
                    <ChevronRight size={13} className="text-white/25 flex-shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="mx-5 h-px bg-white/[0.06] flex-shrink-0" />

      <div className="px-5 py-3 flex-shrink-0 space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/25 font-medium">
              Progress
            </span>
            <span className="text-[10px] text-white/35 font-semibold">
              {Math.round(((currentStep - 1) / 6) * 100)}% {/* Adjusted percentage scaling */}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500
                transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isDraftSaving ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
              <span className="text-[10px] text-white/20">Saving...</span>
            </>
          ) : lastSavedAt ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
              <span className="text-[10px] text-white/20">
                Saved {formatSavedTime(lastSavedAt)}
              </span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <span className="text-[10px] text-white/15">Not saved yet</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default OnboardingSidebar;