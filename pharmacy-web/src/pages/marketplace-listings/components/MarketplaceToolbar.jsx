// pharmacy-web/src/pages/marketplace-listings/components/MarketplaceToolbar.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/MarketplaceToolbar.jsx

import {
  Power, EyeOff, Eye, PackageX, PackageCheck,
  Zap, LayoutGrid, Loader2,
} from "lucide-react";
import Toggle from "../../marketplace-storefront/components/primitives/Toggle";
import SectionCard from "../../marketplace-storefront/components/primitives/SectionCard";
import SectionHeader from "../../marketplace-storefront/components/primitives/SectionHeader";

const MarketplaceToolbar = ({
  globalEnabled,
  categories,
  categoryToggles,
  onCategoryToggle,
  selectedCount,
  onBulkHide,
  onBulkShow,
  onBulkOutOfStock,
  onBulkRestoreStock,
  isCategoriesLoading,
}) => {
  return (
    <SectionCard>
      <SectionHeader
        icon={Power}
        title="Marketplace Controls"
        subtitle="Configure category visibility and manage listings in bulk"
      />

      {/* ── Global Status Banner ── */}
      <div className="mx-5 mt-4 mb-4">
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors duration-200 ${
            globalEnabled
              ? "bg-emerald-500/[0.06] border-emerald-500/15"
              : "bg-red-500/[0.05] border-red-500/15"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                globalEnabled ? "bg-emerald-500/15" : "bg-red-500/10"
              }`}
            >
              <Power
                size={14}
                className={globalEnabled ? "text-emerald-400" : "text-red-400"}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Marketplace {globalEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-[11px] text-white/30 mt-0.5">
                {globalEnabled
                  ? "This branch is live on the Cureli app — customers can browse and order medicines"
                  : "This branch is hidden from all customers — manage via Storefront settings"}
              </p>
            </div>
          </div>
          {/* Status indicator only — toggle lives in Storefront settings */}
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              globalEnabled ? "bg-emerald-400 animate-pulse" : "bg-red-400/40"
            }`}
          />
        </div>
      </div>

      {/* ── Category Visibility ── */}
      <div className="px-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid size={11} className="text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
            Category Visibility
          </p>
          {isCategoriesLoading ? (
            <Loader2
              size={10}
              className="text-white/20 animate-spin ml-auto"
            />
          ) : (
            <span className="text-[10px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded-full ml-auto">
              {categories.length} categories
            </span>
          )}
        </div>

        {isCategoriesLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-xl bg-white/[0.03] border border-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-[11px] text-white/20 text-center py-4">
            No categories found for this branch
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => {
              const enabled = categoryToggles[cat.category_name] ?? true;
              return (
                <div
                  key={cat.category_name}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                    !globalEnabled
                      ? "opacity-30 pointer-events-none border-white/[0.04] bg-white/[0.01]"
                      : enabled
                      ? "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04]"
                      : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                        enabled ? "bg-emerald-400" : "bg-white/15"
                      }`}
                    />
                    <span className="text-[13px] text-white/70 font-medium truncate">
                      {cat.display_name}
                    </span>
                    <span className="text-[10px] text-white/20 bg-white/[0.05] px-2 py-0.5 rounded-full font-medium tabular-nums min-w-[28px] text-center flex-shrink-0">
                      {cat.count}
                    </span>
                  </div>
                  <Toggle
                    enabled={enabled}
                    onChange={() => onCategoryToggle(cat.category_name)}
                    size="sm"
                    disabled={!globalEnabled}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Bulk Actions ──
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={11} className="text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold">
            Quick Bulk Actions
          </p>
          {selectedCount > 0 ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {selectedCount} selected
            </span>
          ) : (
            <span className="ml-auto text-[10px] text-white/15">
              Select medicines to enable
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <BulkButton
            icon={Eye}
            label="Show"
            onClick={onBulkShow}
            disabled={selectedCount === 0}
            variant="ghost"
          />
          <BulkButton
            icon={EyeOff}
            label="Hide"
            onClick={onBulkHide}
            disabled={selectedCount === 0}
            variant="ghost"
          />
          <div className="h-7 w-px bg-white/[0.06] mx-1 flex-shrink-0" />
          <BulkButton
            icon={PackageX}
            label="Out of Stock"
            onClick={onBulkOutOfStock}
            disabled={selectedCount === 0}
            variant="warning"
          />
          <BulkButton
            icon={PackageCheck}
            label="Restore Stock"
            onClick={onBulkRestoreStock}
            disabled={selectedCount === 0}
            variant="success"
          />
        </div>
      </div> */}
    </SectionCard>
  );
};

const VARIANT_STYLES = {
  ghost: {
    enabled: "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-white/50 hover:text-white/80",
    iconColor: "text-white/40 group-hover:text-white/70",
  },
  warning: {
    enabled: "bg-amber-500/[0.06] hover:bg-amber-500/[0.12] border-amber-500/15 text-amber-400/70 hover:text-amber-400",
    iconColor: "text-amber-400/50 group-hover:text-amber-400",
  },
  success: {
    enabled: "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] border-emerald-500/15 text-emerald-400/80 hover:text-emerald-400",
    iconColor: "text-emerald-400/50 group-hover:text-emerald-400",
  },
};

const BulkButton = ({ icon: Icon, label, onClick, disabled, variant = "ghost" }) => {
  const styles = VARIANT_STYLES[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl border text-left transition-all whitespace-nowrap ${
        disabled
          ? "opacity-25 cursor-not-allowed bg-white/[0.01] border-white/[0.04]"
          : styles.enabled
      }`}
    >
      <Icon size={13} className={disabled ? "text-white/15" : styles.iconColor} />
      <span className={`text-xs font-semibold ${disabled ? "text-white/15" : ""}`}>
        {label}
      </span>
    </button>
  );
};

export default MarketplaceToolbar;