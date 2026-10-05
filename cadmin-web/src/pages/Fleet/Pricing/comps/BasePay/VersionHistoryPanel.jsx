// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/VersionHistoryPanel.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, History, Loader2, Package, Truck, Shield, User, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";
import { getPricingHistory } from "../../../../../api/cadminFleetPricing";
import { useToast } from "../../../../../components/common/Toast";

const SlabList = ({ slabs, label, icon: Icon }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
      <Icon size={10} />
      {label}
    </div>
    <div className="space-y-1">
      {slabs.map((s, i) => (
        <div key={s.slab_id || i} className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-md">
          <span className="text-[11px] text-gray-600">
            {s.from_km} – {s.to_km !== null ? `${s.to_km} km` : "∞"}
          </span>
          <span className="text-[11px] font-semibold text-gray-800">
            {s.rate_type === "FLAT_FIXED" ? `₹${s.rate} flat` : `₹${s.rate}/km`}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const VersionCard = ({ config }) => {
  const [expanded, setExpanded] = useState(false);

  const effectiveFrom = new Date(config.effective_from);
  const effectiveUntil = config.effective_until ? new Date(config.effective_until) : null;

  const durationMs = effectiveUntil ? effectiveUntil.getTime() - effectiveFrom.getTime() : null;
  const durationDays = durationMs ? Math.round(durationMs / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-gray-600">v{config.version}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">{config.name}</p>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={9} />
                {effectiveFrom.toLocaleDateString()} → {effectiveUntil ? effectiveUntil.toLocaleDateString() : "—"}
              </span>
              {durationDays !== null && (
                <span className="text-gray-400">
                  ({durationDays} day{durationDays !== 1 ? "s" : ""})
                </span>
              )}
            </div>
            {config.created_by_name && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                <User size={9} />
                Created by {config.created_by_name}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full uppercase">
            Archived
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
              {/* Base fees row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="px-2.5 py-2 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-blue-600 uppercase">
                    <Shield size={9} /> Floor
                  </div>
                  <p className="text-sm font-bold text-blue-900 mt-0.5">₹{config.min_floor_payout}</p>
                </div>
                <div className="px-2.5 py-2 bg-purple-50 border border-purple-100 rounded-md">
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-purple-600 uppercase">
                    <Package size={9} /> Pickup Base
                  </div>
                  <p className="text-sm font-bold text-purple-900 mt-0.5">₹{config.pickup_base_fee}</p>
                </div>
                <div className="px-2.5 py-2 bg-emerald-50 border border-emerald-100 rounded-md">
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 uppercase">
                    <Truck size={9} /> Drop Base
                  </div>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5">₹{config.drop_base_fee}</p>
                </div>
              </div>

              {/* Slabs */}
              <div className="grid grid-cols-2 gap-3">
                <SlabList slabs={config.pickup_slabs} label="Pickup Slabs" icon={Package} />
                <SlabList slabs={config.drop_slabs} label="Drop Slabs" icon={Truck} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function VersionHistoryPanel({ open, onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      try {
        setLoading(true);
        const res = await getPricingHistory({ page, limit: 10 });
        setItems(res.data.data.items || []);
        setMeta(res.data.data.meta || { page: 1, limit: 10, total: 0, total_pages: 0 });
      } catch (err) {
        toast.error("Load Failed", err.response?.data?.message || "Could not load history");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, page]); // eslint-disable-line

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-gray-50 shadow-2xl z-[9999] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#05015A] flex items-center justify-center">
              <History size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pricing Version History</h2>
              <p className="text-[10px] text-gray-500">
                {meta.total} archived version{meta.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[#05015A]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <History size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No archived versions yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Each time you save a new pricing version, the previous active one is archived here.
              </p>
            </div>
          ) : (
            items.map((config) => <VersionCard key={config.config_id} config={config} />)
          )}
        </div>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="px-5 py-3 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] text-gray-500">
              Page {meta.page} of {meta.total_pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200
                           hover:bg-gray-50 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page >= meta.total_pages || loading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#05015A] hover:bg-[#05015A]/90
                           rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}