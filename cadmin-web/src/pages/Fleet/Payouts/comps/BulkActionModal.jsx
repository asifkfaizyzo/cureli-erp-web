// cadmin-web/src/pages/Fleet/Payouts/comps/BulkActionModal.jsx (do not remove this comment)
import { useState } from "react";
import { X, Loader2, Play, CheckCircle } from "lucide-react";
import { bulkProcessRiderPayouts, bulkCompleteRiderPayouts } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const BulkActionModal = ({ actionType, selectedPayouts, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [bankUsed, setBankUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);

  const isProcess = actionType === "PROCESS";

  const handleSubmit = async () => {
    setLoading(true);
    const payoutIds = selectedPayouts.map((p) => p.payout_id).filter(Boolean);

    try {
      if (isProcess) {
        if (!reference.trim()) {
          toast.error("Validation", "Batch UTR/Reference number is required");
          setLoading(false);
          return;
        }

        const resp = await bulkProcessRiderPayouts({
          payout_ids: payoutIds,
          manual_reference: reference.trim(),
          manual_bank_used: bankUsed.trim() || undefined,
          manual_notes: notes.trim() || undefined,
        });

        const data = resp.data?.data;
        toast.success("Processed", `${data?.processed || 0} payouts moved to PROCESSING`);
      } else {
        if (!paymentDate) {
          toast.error("Validation", "Payment date is required");
          setLoading(false);
          return;
        }

        const resp = await bulkCompleteRiderPayouts({
          payout_ids: payoutIds,
          manual_payment_date: paymentDate,
          manual_reference: reference.trim() || undefined,
        });

        const data = resp.data?.data;
        toast.success("Completed", `${data?.completed || 0} payouts marked as PAID`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Bulk action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isProcess ? "bg-blue-600" : "bg-green-600"}`}>
              {isProcess ? <Play size={16} className="text-white" /> : <CheckCircle size={16} className="text-white" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isProcess ? "Bulk Move to Processing" : "Bulk Mark as Paid"}
              </h2>
              <p className="text-xs text-gray-500">{selectedPayouts.length} payout(s) selected</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className={`p-3 rounded-lg text-xs ${isProcess ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
            {isProcess
              ? "All eligible PENDING payouts in your selection will receive this transaction reference."
              : "All eligible PROCESSING payouts in your selection will be marked as COMPLETED."}
          </div>

          {!isProcess && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-200"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {isProcess ? "Batch UTR / Transfer Reference *" : "Batch Reference (Optional)"}
            </label>
            <input
              type="text"
              placeholder="e.g., CMS_NEFT_20261005_01"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {isProcess && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Bank Used (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., HDFC Corporate"
                  value={bankUsed}
                  onChange={(e) => setBankUsed(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Batch 1 transfer via portal"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (isProcess && !reference.trim())}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-1.5 ${isProcess ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirm Batch Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;