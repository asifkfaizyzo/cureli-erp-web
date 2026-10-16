// cadmin-web/src/pages/marketplace/Orders/comps/AddOrdersToBatchModal.jsx (do not remove this comment)
import { useState } from "react";
import { X, Loader2, Plus, Package, Truck } from "lucide-react";
import { addOrderToBatch } from "../../../../api/cadminDelivery";

const AddOrdersToBatchModal = ({
  batch,
  unassignedOrders,
  onClose,
  onAdded,
  toast,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (orderId) => {
    setSelectedIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);

    let successCount = 0;
    let errorCount = 0;

    for (const orderId of selectedIds) {
      try {
        await addOrderToBatch(orderId, batch.rider_id);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`Failed to add order ${orderId}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(
        "Added",
        `${successCount} order(s) added to ${batch.rider_name}'s batch${errorCount > 0 ? ` (${errorCount} failed)` : ""}`,
      );
      onAdded?.();
    } else {
      toast.error("Failed", "Could not add any orders to the batch");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#05015A]/10 flex items-center justify-center">
              <Plus size={18} className="text-[#05015A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Add Orders to Batch
              </h3>
              <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                <Truck size={10} className="text-[#05015A]" />
                {batch.rider_name} · {batch.order_count} current orders
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {unassignedOrders.length === 0 ? (
            <div className="text-center py-10">
              <Package size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">
                No unassigned Same Day orders available
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                All current orders are already in batches
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Unassigned Orders ({unassignedOrders.length})
                </span>
                <button
                  onClick={() =>
                    setSelectedIds(
                      selectedIds.length === unassignedOrders.length
                        ? []
                        : unassignedOrders.map((o) => o.order_id),
                    )
                  }
                  className="text-[10px] font-bold text-[#05015A] hover:text-[#05015A]/80"
                >
                  {selectedIds.length === unassignedOrders.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="space-y-1.5">
                {unassignedOrders.map((o) => {
                  const isChecked = selectedIds.includes(o.order_id);
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
                        onChange={() => toggle(o.order_id)}
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
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedIds.length === 0}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#05015A] hover:bg-[#05015A]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={14} />
                Add {selectedIds.length} Order{selectedIds.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrdersToBatchModal;