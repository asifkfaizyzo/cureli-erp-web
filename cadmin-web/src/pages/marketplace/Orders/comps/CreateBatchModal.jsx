// cadmin-web/src/pages/marketplace/Orders/comps/CreateBatchModal.jsx (do not remove this comment)
import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  Truck,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  getAvailableTeamRiders,
  batchAssignOrders,
} from "../../../../api/cadminDelivery";
import useMarketplaceSSE from "./hooks/useMarketplaceSSE";

const CreateBatchModal = ({ unassignedOrders, onClose, onCreated, toast }) => {
  const [step, setStep] = useState(1);
  const [riders, setRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(true);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState(
    unassignedOrders.map((o) => o.order_id),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchRiders = useCallback(async () => {
    setLoadingRiders(true);
    setError(null);
    try {
      const res = await getAvailableTeamRiders();
      setRiders(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load riders");
    } finally {
      setLoadingRiders(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  // ── Live-update rider availability while modal is open ──
  // Backend already filters out riders with active batches. If a rider:
  //   • goes offline → remove from list (no longer eligible)
  //   • gets assigned to another batch elsewhere → their availability event
  //     may not fire, but handleSubmit will fail safely with a toast
  //   • comes online → silent re-fetch to pull their full record
  const handleRiderAvailability = useCallback(
    (payload) => {
      if (!payload?.rider_id) return;

      if (payload.is_online === false) {
        setRiders((prev) =>
          prev.filter((r) => r.rider_id !== payload.rider_id),
        );
        setSelectedRiderId((prev) =>
          prev === payload.rider_id ? null : prev,
        );
        return;
      }

      // Online event: if rider is already in list, update; otherwise re-fetch
      setRiders((prev) => {
        const exists = prev.some((r) => r.rider_id === payload.rider_id);
        if (!exists) {
          // Newly-online rider — silently re-fetch to get their full record
          fetchRiders();
          return prev;
        }
        return prev.map((r) =>
          r.rider_id === payload.rider_id ? { ...r, is_online: true } : r,
        );
      });
    },
    [fetchRiders],
  );

  useMarketplaceSSE({
    onRiderAvailability: handleRiderAvailability,
    debounceMs: 1000,
  });

  const selectedRider = riders.find((r) => r.rider_id === selectedRiderId);

  const toggleOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const handleSubmit = async () => {
    if (!selectedRiderId || selectedOrderIds.length === 0) return;
    setSubmitting(true);
    try {
      const res = await batchAssignOrders(selectedOrderIds, selectedRiderId);
      const count = res.data?.data?.order_count || selectedOrderIds.length;
      toast.success(
        "Batch Created",
        `${count} order(s) assigned to ${selectedRider?.rider_name}`,
      );
      onCreated?.();
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Could not create batch",
      );
      // Re-fetch so stale rider (now on another batch) disappears
      fetchRiders();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#05015A]/10 flex items-center justify-center">
              <Truck size={18} className="text-[#05015A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Create Same Day Batch
              </h3>
              <p className="text-[11px] text-gray-500">
                Step {step} of 2 —{" "}
                {step === 1 ? "Choose a team rider" : "Select orders"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
          <div className="flex-1 h-1 rounded-full bg-[#05015A]" />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${step === 2 ? "bg-[#05015A]" : "bg-gray-200"}`}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <UserCheck size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Available Team Riders
                  </span>
                </div>
                <button
                  onClick={fetchRiders}
                  disabled={loadingRiders}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-[#05015A] hover:bg-[#05015A]/5 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw
                    size={11}
                    className={loadingRiders ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {loadingRiders && (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-medium">Loading riders...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {!loadingRiders && !error && riders.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500 font-medium">
                    No team riders available
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    All team riders are offline or already on a batch
                  </p>
                  <button
                    onClick={fetchRiders}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#05015A] bg-[#05015A]/5 hover:bg-[#05015A]/10 transition-colors"
                  >
                    <RefreshCw size={11} />
                    Check Again
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {riders.map((rider) => {
                  const isSelected = selectedRiderId === rider.rider_id;
                  return (
                    <button
                      key={rider.rider_id}
                      onClick={() => setSelectedRiderId(rider.rider_id)}
                      className={`w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-[#05015A] bg-[#05015A]/5"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-[#05015A] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <UserCheck size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {rider.rider_name}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {rider.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rider.is_online ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span className="text-[10px] font-semibold text-gray-500">
                          {rider.is_online ? "Online" : "Offline"}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          size={18}
                          className="text-[#05015A] flex-shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Package size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Select Orders for {selectedRider?.rider_name}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setSelectedOrderIds(
                      selectedOrderIds.length === unassignedOrders.length
                        ? []
                        : unassignedOrders.map((o) => o.order_id),
                    )
                  }
                  className="text-[10px] font-bold text-[#05015A] hover:text-[#05015A]/80"
                >
                  {selectedOrderIds.length === unassignedOrders.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="space-y-1.5">
                {unassignedOrders.map((o) => {
                  const isChecked = selectedOrderIds.includes(o.order_id);
                  return (
                    <label
                      key={o.order_id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                        isChecked
                          ? "border-[#05015A] bg-[#05015A]/5"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOrder(o.order_id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#05015A] focus:ring-[#05015A] cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 font-mono">
                            {o.order_number}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {o.customer_name} · {o.shop?.business_name}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-gray-700 flex-shrink-0">
                          ₹{Number(o.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedRiderId}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#05015A] hover:bg-[#05015A]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !selectedRiderId ||
                  selectedOrderIds.length === 0
                }
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#05015A] hover:bg-[#05015A]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Truck size={14} />
                    Create Batch ({selectedOrderIds.length})
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBatchModal;