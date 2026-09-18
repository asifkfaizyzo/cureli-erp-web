import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  Loader2,
  Clock,
  Package,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import medicinesAPI from "../../../api/medicines";
import { useToast } from "../../../components/common/Toast";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const ResubmitForReviewModal = ({ open, onClose, branchId, onComplete }) => {
  const toast = useToast();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  // Fetch unlinked/review-pending items
  const fetchEligibleItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get unlinked medicines for the shop/branch
      const response = await medicinesAPI.getUnlinkedMedicines({
        limit: 1000,
        status: "ALL" // Fetch PENDING, SUGGESTED, UNLINKED collectively
      });

      if (response?.success && Array.isArray(response.data?.medicines)) {
        setMedicines(response.data.medicines);
      } else {
        setMedicines([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve items. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && branchId) {
      fetchEligibleItems();
      setSelectedIds(new Set());
      setSearch("");
    }
  }, [open, branchId]);

  ///reset after-----24 hr

  // Process list into structured, clean UI rows
//   const preparedMedicines = useMemo(() => {
//     const COOLDOWN_MS = 24 * 60 * 60 * 1000;
//     const now = Date.now();
const preparedMedicines = useMemo(() => {
    const COOLDOWN_MS = 0; // Set to 0 for testing (disabled cooldown)
    const now = Date.now();

    return medicines.map((m) => {
      const lastTime = m.last_resubmitted_at ? new Date(m.last_resubmitted_at).getTime() : 0;
      const isCooldownActive = lastTime && now - lastTime < COOLDOWN_MS;
      
      let hoursRemaining = 0;
      if (isCooldownActive) {
        hoursRemaining = Math.max(1, Math.round((COOLDOWN_MS - (now - lastTime)) / (1000 * 60 * 60)));
      }

      return {
        id: m.medicine_id,
        name: m.name,
        manufacturer: m.manufacturer,
        status: m.link_status || "PENDING",
        resubCount: m.resubmission_count || 0,
        lastResubAt: m.last_resubmitted_at,
        isCooldownActive,
        hoursRemaining,
      };
    });
  }, [medicines]);

  // Filter list with input query
  const filteredMedicines = useMemo(() => {
    if (!search.trim()) return preparedMedicines;
    const query = search.toLowerCase();
    return preparedMedicines.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.manufacturer.toLowerCase().includes(query)
    );
  }, [preparedMedicines, search]);

  const eligibleItems = useMemo(() => {
    return filteredMedicines.filter((m) => !m.isCooldownActive);
  }, [filteredMedicines]);

  const allSelected = eligibleItems.length > 0 && eligibleItems.every((m) => selectedIds.has(m.id));

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        eligibleItems.forEach((m) => next.delete(m.id));
      } else {
        eligibleItems.forEach((m) => next.add(m.id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      const response = await medicinesAPI.resubmitForReview(Array.from(selectedIds));
      if (response?.success) {
        toast.success(
          "Resubmitted successfully",
          `Successfully pushed ${response.data?.processed || 0} medicines into cadmin mapping queues.`
        );
        onComplete();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", err.response?.data?.message || err.message || "Failed to resubmit.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      SUGGESTED: "bg-blue-100 text-blue-700 border-blue-200",
      PENDING: "bg-amber-100 text-amber-700 border-amber-200",
      UNLINKED: "bg-slate-100 text-slate-600 border-slate-200",
    };
    const cls = config[status] || config.PENDING;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
        {status === "SUGGESTED" ? "Suggested" : status === "UNLINKED" ? "Rejected" : "Pending"}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          <motion.div
            className="relative bg-white w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <RefreshCw size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Resubmit for Catalog Mapping</h3>
                  <p className="text-[10px] text-indigo-200">Re-runs catalog matching & queues for admin verification</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Sub-Header / Search Filters */}
            <div className="shrink-0 p-4 border-b border-gray-100 bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter medicines by name or manufacturer..."
                  className="w-full h-9 pl-9 pr-4 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-gray-400"
                />
              </div>

              {/* Informative banners */}
              <div className="flex gap-2.5 items-start px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-700 leading-normal">
                <Info size={13} className="shrink-0 text-indigo-500 mt-0.5" />
                <span>
                  Items resubmitted will be auto-matched. If a catalog item is identified, they are linked immediately. Otherwise, they appear as a prioritized queue entry in CAdmin.
                </span>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-white divide-y divide-gray-100">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-400">Loading shop medicines...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-red-500 font-semibold">{error}</p>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Package size={28} className="text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-500">No medicines found</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">All local catalog medicines might already be linked.</p>
                </div>
              ) : (
                filteredMedicines.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => !med.isCooldownActive && handleToggleSelect(med.id)}
                    className={`flex items-center gap-3 px-5 py-2.5 transition-colors cursor-pointer ${
                      med.isCooldownActive
                        ? "bg-slate-50/40 opacity-55 cursor-not-allowed"
                        : selectedIds.has(med.id)
                        ? "bg-indigo-50/30 hover:bg-indigo-50/50"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Checkbox column */}
                    <div className="shrink-0">
                      {med.isCooldownActive ? (
                        <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center bg-gray-100 text-gray-400">
                          <Clock size={10} />
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          selectedIds.has(med.id)
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-gray-300"
                        }`}>
                          {selectedIds.has(med.id) && <Check size={11} strokeWidth={3} />}
                        </div>
                      )}
                    </div>

                    {/* Metadata column */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{med.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{med.manufacturer}</p>
                    </div>

                    {/* Stats badges */}
                    <div className="shrink-0 flex items-center gap-2">
                      {getStatusBadge(med.status)}
                      {med.resubCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100 font-mono">
                          {med.resubCount}× Resub
                        </span>
                      )}
                      {med.isCooldownActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px] font-medium border border-gray-200">
                          Cooldown {med.hoursRemaining}h
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer actions */}
            <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3 select-none">
                {!loading && eligibleItems.length > 0 && (
                  <button
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      allSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 bg-white"
                    }`}>
                      {allSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    Select All ({eligibleItems.length})
                  </button>
                )}
                {selectedIds.size > 0 && (
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-full">
                    {selectedIds.size} Selected
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || selectedIds.size === 0}
                  className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg transition-all ${
                    selectedIds.size > 0 && !submitting
                      ? "bg-[#05015A] hover:bg-[#0a0280] shadow"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Resubmitting...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      Resubmit {selectedIds.size > 0 ? selectedIds.size : ""} Items
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResubmitForReviewModal;