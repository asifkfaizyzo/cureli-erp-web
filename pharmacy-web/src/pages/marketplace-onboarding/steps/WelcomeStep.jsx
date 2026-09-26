// pharmacy-web/src/pages/marketplace-onboarding/steps/WelcomeStep.jsx (do not remove this comment)
// src/pages/marketplace-onboarding/steps/WelcomeStep.jsx

import {
  ArrowRight,
  Store,
  MapPin,
  Zap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Custom Storefront",
    description: "Branded pharmacy page with logo, description & contact.",
  },
  {
    icon: MapPin,
    title: "Multi-Branch",
    description: "Multiple locations with individual hours & fulfillment.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Go live in minutes. Everything auto-saves as you go.",
  },
  {
    icon: ShieldCheck,
    title: "Full Control",
    description: "Suspend, resume, or update your presence anytime.",
  },
];

const WelcomeStep = ({ onNext }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-4xl">
        {/* ── Two-column hero layout ────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left — text + CTA */}
          <div className="flex-1 lg:max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <Store size={18} className="text-white" />
              </div>
              <div
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08]
                flex items-center gap-1.5"
              >
                <Sparkles size={12} className="text-indigo-400" />
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  New
                </span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
              Welcome to the
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>

            <p className="text-white/45 text-sm leading-relaxed mb-8 max-w-sm">
              Set up your pharmacy storefront on Cureli Mobile and start
              receiving orders from customers in your area.
            </p>

            <button
              type="button"
              onClick={onNext}
              className="px-7 py-3.5 bg-white text-[#010015] rounded-xl font-bold
                text-sm hover:bg-white/90 active:scale-[0.98] transition-all
                flex items-center gap-2 shadow-lg shadow-black/10"
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>

          {/* Right — feature grid */}
          <div className="flex-1 w-full lg:max-w-md">
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`
                    p-4 rounded-2xl border transition-all
                    bg-white/[0.025] border-white/[0.06]
                    hover:bg-white/[0.05] hover:border-white/10
                    ${i % 2 === 1 ? "lg:translate-y-4" : ""}
                  `}
                >
                  <div
                    className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center
                    justify-center mb-3"
                  >
                    <feature.icon size={16} className="text-white/50" />
                  </div>
                  <p className="text-[13px] font-semibold text-white/80 leading-tight">
                    {feature.title}
                  </p>
                  <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom trust strip ────────────────────────────────── */}
        <div
          className="mt-12 pt-6 border-t border-white/[0.04]
          flex items-center justify-center gap-8"
        >
          {[
            { value: "5 min", label: "Average setup time" },
            { value: "Auto-save", label: "Never lose progress" },
            { value: "Instant", label: "Go live when ready" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-sm font-bold text-white/60">{stat.value}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;