// src/pages/marketplace-onboarding/steps/WelcomeStep.jsx (do not remove this comment)

import {
  ArrowRight,
  Store,
  MapPin,
  Zap,
  ShieldCheck,
  Sparkles,
  IndianRupee,
  Info,
  Loader2,
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";

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
  const commissionRate = useMarketplaceStore((s) => s.commissionRate);
  const isCommissionLoaded = useMarketplaceStore((s) => s.isCommissionLoaded);

  const getCommissionDisplay = () => {
    if (!commissionRate) return null;

    if (!commissionRate.has_commission || commissionRate.is_suspended) {
      return {
        rateText: "0%",
        description: commissionRate.is_suspended
          ? "Commission is currently waived. You keep 100% of your medicine sales!"
          : "No marketplace commission is currently configured.",
        example: null,
        isZero: true,
      };
    }

    const example = commissionRate.examples?.find(
      (e) => e.order_subtotal === 500
    );

    return {
      rateText: commissionRate.rate_description,
      description: `System platform fee of ${commissionRate.rate_description} applies to marketplace processed sales.`,
      example: example
        ? {
            subtotal: example.order_subtotal,
            commission: example.commission_amount,
            receives: example.pharmacy_receives,
          }
        : null,
      isZero: false,
    };
  };

  const commission = getCommissionDisplay();

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

        {/* ── Commission Policy Widget ───────────────────────────── */}
        <div className="mt-8">
          {!isCommissionLoaded ? (
            <div
              className="flex items-center gap-3 px-5 py-4 rounded-2xl
              bg-white/[0.025] border border-white/[0.06]"
            >
              <Loader2
                size={16}
                className="text-white/30 animate-spin"
              />
              <span className="text-xs text-white/30">
                Loading commission details…
              </span>
            </div>
          ) : commission ? (
            <div
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0a21]/20 backdrop-blur-md p-5"
            >
              {/* Subtle Glowing Policy Left Border */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                  commission.isZero ? "bg-emerald-500/40" : "bg-indigo-500/40"
                }`}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      commission.isZero
                        ? "bg-emerald-500/[0.08] text-emerald-400"
                        : "bg-indigo-500/[0.08] text-indigo-400"
                    }`}
                  >
                    <IndianRupee size={16} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-white/80 tracking-wide">
                        Platform Fee Policy
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          commission.isZero
                            ? "bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300"
                            : "bg-indigo-500/[0.04] border-indigo-500/20 text-indigo-300"
                        }`}
                      >
                        {commission.rateText} Rate
                      </span>
                    </div>

                    <p className="text-[11px] text-white/35 mt-1 leading-relaxed max-w-lg">
                      {commission.description}
                    </p>
                  </div>
                </div>

                {/* Integrated Settlement Ledger */}
                {commission.example && (
                  <div className="flex items-center gap-3 bg-white/[0.015] border border-white/[0.04] rounded-xl p-3 text-xs self-start md:self-auto">
                    <div className="text-right">
                      <span className="block text-[9px] text-white/20 uppercase tracking-wider">
                        Sample Order
                      </span>
                      <span className="font-semibold text-white/70">
                        ₹{commission.example.subtotal}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-white/[0.06]" />
                    <div className="text-right">
                      <span className="block text-[9px] text-white/20 uppercase tracking-wider">
                        Platform Share
                      </span>
                      <span className="font-semibold text-red-400/80">
                        -₹{commission.example.commission}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-white/[0.06]" />
                    <div className="text-right">
                      <span className="block text-[9px] text-white/20 uppercase tracking-wider">
                        Your Payout
                      </span>
                      <span className="font-bold text-emerald-400">
                        ₹{commission.example.receives}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!commission.isZero && (
                <div className="mt-4 pt-3.5 border-t border-white/[0.04] flex items-center gap-2 text-[10px] text-white/20">
                  <Info size={11} className="text-white/25 flex-shrink-0" />
                  <span>
                    Any adjustments to the baseline rate policies are notified automatically via your system dashboard and registered email profiles.
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ── Bottom trust strip ──────────────────────────────────
        <div
          className="mt-8 pt-6 border-t border-white/[0.04]
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
        </div> */}
      </div>
    </div>
  );
};

export default WelcomeStep;