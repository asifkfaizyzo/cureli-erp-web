// pharmacy-web/src/pages/marketplace-listings/components/BranchSelectorCard.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/BranchSelectorCard.jsx

import { useState } from "react";
import {
  ChevronDown, Building2, Eye, EyeOff,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionCard from "../../marketplace-storefront/components/primitives/SectionCard";

const BranchSelectorCard = ({
  branches,
  selectedBranch,
  onBranchChange,
  isLoading,
  isSuperAdmin,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSelect = (branch) => {
    onBranchChange(branch);
    setDropdownOpen(false);
  };

  if (isLoading || !selectedBranch) {
    return (
      <SectionCard>
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Loader2 size={16} className="text-white/30 animate-spin" />
          <span className="text-sm text-white/30">Loading branches...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-visible">
      <div className="flex items-center gap-4 px-5 py-3.5">
        {/* Branch Selector */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
            <Building2 size={14} className="text-white/50" />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
              Active Branch
            </p>
            <div className="relative mt-0.5">
              {/* Only show dropdown trigger for super_admin with multiple branches */}
              {isSuperAdmin && branches.length > 1 ? (
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors"
                >
                  {selectedBranch.branch_name}
                  <ChevronDown
                    size={13}
                    className={`text-white/40 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <p className="text-sm font-semibold text-white">
                  {selectedBranch.branch_name}
                </p>
              )}

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-[#0d0b2e] border border-white/[0.1] shadow-2xl shadow-black/60 z-50 overflow-hidden"
                  >
                    {branches.map((branch) => (
                      <button
                        key={branch.branch_id}
                        onClick={() => handleSelect(branch)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.05] last:border-0 ${
                          selectedBranch.branch_id === branch.branch_id
                            ? "bg-white/[0.04]"
                            : ""
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/80">
                            {branch.branch_name}
                          </p>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {branch.live_count} live ·{" "}
                            {branch.hidden_count} hidden
                          </p>
                        </div>
                        {branch.marketplace_enabled ? (
                          <CheckCircle2
                            size={13}
                            className="text-emerald-400 flex-shrink-0"
                          />
                        ) : (
                          <AlertCircle
                            size={13}
                            className="text-white/20 flex-shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-white/[0.06] mx-2 flex-shrink-0" />

        {/* Marketplace Status */}
        <div className="flex-shrink-0">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">
            Marketplace
          </p>
          {selectedBranch.marketplace_enabled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/30 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              Disabled
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-white/[0.06] mx-2 flex-shrink-0" />

        {/* Stats */}
        <div className="flex items-center gap-6 flex-1">
          <BranchStat
            icon={Eye}
            label="Live Listings"
            value={selectedBranch.live_count ?? 0}
            valueClass="text-emerald-400"
          />
          <BranchStat
            icon={EyeOff}
            label="Hidden"
            value={selectedBranch.hidden_count ?? 0}
            valueClass="text-white/50"
          />
          <BranchStat
            icon={AlertCircle}
            label="Out of Stock"
            value={selectedBranch.out_of_stock_count ?? 0}
            valueClass="text-amber-400"
          />
        </div>
      </div>
    </SectionCard>
  );
};

const BranchStat = ({ icon: Icon, label, value, valueClass }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
      <Icon size={12} className="text-white/30" />
    </div>
    <div>
      <p className="text-[10px] text-white/25 font-medium">{label}</p>
      <p className={`text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  </div>
);

export default BranchSelectorCard;