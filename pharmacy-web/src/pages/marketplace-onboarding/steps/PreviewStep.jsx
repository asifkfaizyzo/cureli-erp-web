// pharmacy-web/src/pages/marketplace-onboarding/steps/PreviewStep.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-onboarding/steps/PreviewStep.jsx

import {
  ArrowRight,
  ArrowLeft,
  Check,
  Store,
  Building2,
  MapPin,
  Clock,
  Truck,
  Phone,
  Eye,
  Landmark, // <-- Imported
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

const PreviewStep = ({ onNext, onBack }) => {
  const storefront = useMarketplaceStore((s) => s.storefront);
  const banking = useMarketplaceStore((s) => s.banking); // <-- Fetched
  const allBranches = useMarketplaceStore((s) => s.allBranches);
  const selectedBranchIds = useMarketplaceStore((s) => s.selectedBranchIds);
  const branchConfigs = useMarketplaceStore((s) => s.branchConfigs);

  const enabledBranches = allBranches.filter(
    (b) =>
      selectedBranchIds.includes(b.branch_id) &&
      branchConfigs[b.branch_id]?.marketplace_enabled
  );

  const logoSrc = resolveImageUrl(storefront.logo_url);
  const bannerSrc = resolveImageUrl(storefront.banner_url);

  // Expanded checklist tracking banking state
  const checks = [
    {
      label: "Storefront name",
      done: !!storefront.storefront_name?.trim(),
      value: storefront.storefront_name,
    },
    {
      label: "Support phone",
      done: !!storefront.support_phone?.trim(),
      value: storefront.support_phone,
    },
    {
      label: "Logo uploaded",
      done: !!storefront.logo_url,
    },
    {
      label: "Banking details", // <-- Added
      done: !!(banking.bank_account_holder?.trim() && banking.bank_account_number?.trim() && banking.bank_ifsc?.trim()),
      value: banking.bank_account_number ? `Acc: *${banking.bank_account_number.slice(-4)}` : "Missing Details",
    },
    {
      label: "Branches enabled",
      done: enabledBranches.length > 0,
      value: enabledBranches.length > 0
        ? `${enabledBranches.length} branch${enabledBranches.length > 1 ? "es" : ""}`
        : "None",
    },
  ];

  const allChecked = checks.every((c) => c.done);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">
          Review Your Storefront
        </h2>
        <p className="text-white/40 text-sm">
          Everything look good? You can go back to make changes.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Storefront card visual preview */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="relative h-32">
              {bannerSrc ? (
                <img
                  src={bannerSrc}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/[0.04] to-white/[0.02]
                  flex items-center justify-center">
                  <p className="text-[10px] text-white/15">No banner uploaded</p>
                </div>
              )}

              <div
                className="absolute -bottom-6 left-5 w-14 h-14 rounded-2xl
                bg-[#0d0a2e] border-2 border-white/[0.08] shadow-lg
                flex items-center justify-center overflow-hidden"
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Logo"
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <Store size={20} className="text-white/20" />
                )}
              </div>
            </div>

            <div className="px-5 pt-9 pb-5">
              <h3 className="text-lg font-bold text-white leading-tight">
                {storefront.storefront_name || (
                  <span className="text-white/20">Pharmacy Name</span>
                )}
              </h3>
              <p className="text-sm text-white/40 mt-1 leading-relaxed line-clamp-2">
                {storefront.storefront_description || (
                  <span className="text-white/15">Description</span>
                )}
              </p>

              {storefront.support_phone && (
                <div className="flex items-center gap-1.5 mt-3">
                  <Phone size={12} className="text-white/25" />
                  <span className="text-xs text-white/40">
                    {storefront.support_phone}
                  </span>
                </div>
              )}

              {/* Branches (Lists configs with Delivery mode badge) */}
              {enabledBranches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-3">
                    Available Locations
                  </p>
                  <div className="space-y-2.5">
                    {enabledBranches.slice(0, 3).map((branch) => {
                      const cfg = branchConfigs[branch.branch_id] || {};
                      return (
                        <div
                          key={branch.branch_id}
                          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl
                            bg-white/[0.03] border border-white/[0.05]"
                        >
                          <MapPin
                            size={12}
                            className="text-white/25 mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/70 truncate">
                              {branch.branch_name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {cfg.is_24_hours ? (
                                <span className="text-[10px] text-white/30 flex items-center gap-1">
                                  <Clock size={9} /> 24 hrs
                                </span>
                              ) : cfg.opening_time ? (
                                <span className="text-[10px] text-white/30 flex items-center gap-1">
                                  <Clock size={9} /> {cfg.opening_time} – {cfg.closing_time}
                                </span>
                              ) : null}
                              <div className="flex items-center gap-1.5">
                                {cfg.pickup_enabled && (
                                  <span className="text-[9px] text-white/25 px-1.5 py-0.5 rounded bg-white/[0.04]">
                                    Pickup
                                  </span>
                                )}
                                {cfg.delivery_enabled && (
                                  <span className="text-[9px] text-white/25 px-1.5 py-0.5 rounded bg-white/[0.04] inline-flex items-center gap-1">
                                    Delivery ({cfg.delivery_mode === "SELF" ? "Self" : "Cureli"})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {enabledBranches.length > 3 && (
                      <p className="text-[10px] text-white/25 pl-1">
                        +{enabledBranches.length - 3} more location
                        {enabledBranches.length - 3 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── ADDED BANKING SUMMARY CARD ────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Landmark size={14} className="text-white/40" />
              <p className="text-xs font-semibold text-white/60">Settlement Account details</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-white/20">Holder</p>
                <p className="text-white/70 font-medium mt-0.5">{banking.bank_account_holder || "-"}</p>
              </div>
              <div>
                <p className="text-white/20">Account Number</p>
                <p className="text-white/70 font-mono mt-0.5">
                  {banking.bank_account_number ? `•••• •••• ${banking.bank_account_number.slice(-4)}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-white/20">Bank Name</p>
                <p className="text-white/70 font-medium mt-0.5">{banking.bank_name || "-"}</p>
              </div>
              <div>
                <p className="text-white/20">IFSC & Branch</p>
                <p className="text-white/70 font-mono mt-0.5 uppercase">
                  {banking.bank_ifsc || "-"} ({banking.bank_branch_name || "-"})
                </p>
              </div>
            </div>
          </div>
          {/* ────────────────────────────────────────────────────────── */}
        </div>

        {/* Right column (Summary/checks + Actions) */}
        <div className="w-full lg:w-[280px] flex-shrink-0">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-xs font-semibold text-white/50 mb-3">
                Setup Checklist
              </p>
              <div className="space-y-2.5">
                {checks.map((check) => (
                  <div key={check.label} className="flex items-start gap-2.5">
                    <div
                      className={`
                        w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
                        ${check.done
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/[0.04] text-white/15"
                        }
                      `}
                    >
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          check.done ? "text-white/60" : "text-white/25"
                        }`}
                      >
                        {check.label}
                      </p>
                      {check.value && (
                        <p className="text-[10px] text-white/20 truncate mt-0.5">
                          {check.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {allChecked && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]
                  flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[11px] text-emerald-400/80 font-medium">
                    Ready to go live
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2.5 rounded-xl border border-white/10
                  text-white/50 text-sm font-medium hover:border-white/20
                  hover:text-white/70 transition-all flex items-center
                  justify-center gap-2"
              >
                <ArrowLeft size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!allChecked}
                className="flex-[2] py-2.5 bg-white text-[#010015] rounded-xl
                  font-bold text-sm hover:bg-white/90 disabled:opacity-50
                  disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewStep;