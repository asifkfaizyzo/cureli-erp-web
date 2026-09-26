// pharmacy-web/src/pages/marketplace-storefront/components/BranchCard.jsx (do not remove this comment)
// src/pages/marketplace-storefront/components/BranchCard.jsx

import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Shield, ShoppingBag, Truck, Clock,
  Phone, AlertCircle, PlusCircle, Settings, Edit3, Loader2,
  ImageIcon,
} from "lucide-react";
import Toggle from "./primitives/Toggle";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

const BranchCard = ({ branch, canManage, isToggling, onToggle, onEdit }) => {
  const isConfigured = branch.is_configured;

  const handleToggle = (newValue) => {
    if (newValue && !isConfigured) {
      onEdit(branch);
      return;
    }
    onToggle(branch.branch_id, newValue);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border transition-all duration-200
        ${branch.marketplace_enabled
          ? "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.12]"
          : isConfigured
            ? "bg-white/[0.01] border-white/[0.05]"
            : "bg-white/[0.01] border-dashed border-white/[0.08]"
        }
      `}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            branch.marketplace_enabled ? "bg-white/[0.06]" : isConfigured ? "bg-white/[0.03]" : "bg-white/[0.02]"
          }`}>
            <Building2 size={14} className={
              branch.marketplace_enabled ? "text-white/60" : isConfigured ? "text-white/20" : "text-white/10"
            } />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold truncate ${
                branch.marketplace_enabled ? "text-white" : isConfigured ? "text-white/40" : "text-white/25"
              }`}>
                {branch.branch_name}
              </p>
              {branch.branch_type === "main" && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-blue-500/15 text-blue-300 uppercase flex-shrink-0">
                  Main
                </span>
              )}
              {!isConfigured && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/[0.05] text-white/20 uppercase flex-shrink-0">
                  Not set up
                </span>
              )}
            </div>
            {(branch.city || branch.state) && (
              <p className="text-[11px] text-white/20 mt-0.5 truncate">
                {[branch.city, branch.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isToggling ? (
            <Loader2 size={14} className="text-white/30 animate-spin" />
          ) : (
            <Toggle
              enabled={branch.marketplace_enabled}
              onChange={handleToggle}
              disabled={!canManage}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {(branch.marketplace_enabled || (!isConfigured && canManage)) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/[0.05]">

              {/* Unconfigured Prompt */}
              {!isConfigured && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <PlusCircle size={12} className="text-white/20 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/35 font-medium">Branch not configured</p>
                    <p className="text-[11px] text-white/20 mt-0.5 leading-relaxed">
                      Set up location, hours, and fulfillment options to add this branch to the marketplace.
                    </p>
                  </div>
                </div>
              )}

              {/* Configured + Enabled Content */}
              {isConfigured && branch.marketplace_enabled && (
                <>
                  {/* ── Branch Image ──────────────────────────── */}
                  {branch.shop_image_url && (
                    <div className="rounded-lg overflow-hidden border border-white/[0.06]">
                      <div className="relative w-full h-32">
                        <img
                          src={resolveImageUrl(branch.shop_image_url)}
                          alt={`${branch.branch_name} storefront`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Subtle gradient overlay at bottom for readability */}
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
                        {/* Image label */}
                        <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                          <ImageIcon size={9} className="text-white/50" />
                          <span className="text-[9px] text-white/50 font-medium">
                            Branch photo
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {branch.formatted_address ? (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <MapPin size={11} className="text-white/20 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-white/40 leading-relaxed">{branch.formatted_address}</p>
                        {branch.latitude && branch.longitude && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-emerald-400 font-medium">
                            <Shield size={8} /> Location verified
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <AlertCircle size={11} className="text-amber-400/60 flex-shrink-0" />
                      <span className="text-[11px] text-amber-400/70">Location not set</span>
                    </div>
                  )}

                  {/* Fulfillment + Hours */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        icon: ShoppingBag,
                        label: "Pickup",
                        enabled: branch.pickup_enabled,
                        detail: null,
                      },
                      {
                        icon: Truck,
                        label: "Delivery",
                        enabled: branch.delivery_enabled,
                        detail: branch.delivery_enabled
                          ? `(${branch.delivery_mode === "SELF" ? "Self" : "Cureli"})`
                          : null,
                      },
                    ].map(({ icon: Icon, label, enabled, detail }) => (
                      <span key={label} className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border
                        ${enabled
                          ? "bg-white/[0.06] border-white/10 text-white/60"
                          : "bg-white/[0.02] border-white/[0.04] text-white/20"
                        }
                      `}>
                        <Icon size={10} />
                        {label} {enabled ? "On" : "Off"}
                        {detail && (
                          <span className="text-[9px] text-white/40 font-normal ml-0.5">
                            {detail}
                          </span>
                        )}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border bg-white/[0.03] border-white/[0.06] text-white/40">
                      <Clock size={10} />
                      {branch.is_24_hours
                        ? "24 Hours"
                        : branch.opening_time && branch.closing_time
                          ? `${branch.opening_time} – ${branch.closing_time}`
                          : "Hours not set"
                      }
                    </span>
                  </div>

                  {/* Contact */}
                  {branch.contact_override || branch.contact_number ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <Phone size={11} className="text-white/20 flex-shrink-0" />
                      <span className="text-xs text-white/40 font-mono">
                        {branch.contact_override || branch.contact_number}
                      </span>
                      {branch.contact_override && (
                        <span className="ml-auto text-[9px] text-white/20 font-medium">override</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <Phone size={11} className="text-amber-400/50 flex-shrink-0" />
                      <span className="text-[11px] text-amber-400/60">No contact number set</span>
                    </div>
                  )}
                </>
              )}

              {/* Action Button */}
              {canManage && (
                <button
                  onClick={() => onEdit(branch)}
                  className={`
                    w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all
                    ${!isConfigured
                      ? "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.1] text-white/60 hover:text-white/80"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-white/50 hover:text-white/70"
                    }
                  `}
                >
                  {!isConfigured
                    ? <><Settings size={12} /> Configure Branch</>
                    : <><Edit3 size={12} /> Edit Branch Settings</>
                  }
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Edit Hint — configured but disabled */}
      {isConfigured && !branch.marketplace_enabled && canManage && (
        <div className="px-4 pb-3 pt-0">
          <button
            onClick={() => onEdit(branch)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-white/20 hover:text-white/40 transition-colors"
          >
            <Edit3 size={10} /> Edit settings
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default BranchCard;