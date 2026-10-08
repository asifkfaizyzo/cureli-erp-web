import { useState } from "react";
import { X, Loader2, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { bulkProcessPharmacyPayouts, bulkCompletePharmacyPayouts } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

const BulkActionModal = ({ actionType, selectedPayouts, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [reference, setReference] = useState("");
  const [bankUsed, setBankUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);

  const isProcess = actionType === "PROCESS";
  const payoutIds = selectedPayouts.map((p) => p.payout_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isProcess) {
        const resp = await bulkProcessPharmacyPayouts({
          payout_ids: payoutIds,
          manual_reference: reference.trim() || undefined,
          manual_bank_used: bankUsed.trim() || undefined,
          manual_notes: notes.trim() || undefined,
        });
        const data = resp.data?.data;
        toast.success(
          "Bulk Process Complete",
          `Moved ${data?.processed || 0} to processing. (${data?.skipped || 0} skipped)`
        );
      } else {
        const resp = await bulkCompletePharmacyPayouts({
          payout_ids: payoutIds,
          manual_payment_date: paymentDate,
          manual_reference: reference.trim() || undefined,
        });
        const data = resp.data?.data;
        toast.success(
          "Bulk Settlement Complete",
          `Completed ${data?.completed || 0} payouts. (${data?.skipped || 0} skipped)`
        );
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Bulk action failed");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedPayouts.reduce((s, p) => s + Number(p.net_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            {isProcess ? <Play size={16} className="text-blue-600" /> : <CheckCircle size={16} className="text-emerald-600" />}
            {isProcess ? "Bulk Process Disbursals" : "Bulk Settle Payouts"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-gray-500">Selected Payouts:</span>{" "}
              <strong className="text-gray-900">{payoutIds.length}</strong>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Total Net Amount:</span>{" "}
              <strong className="text-emerald-700">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {!isProcess && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Settlement / Transfer Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05015A]/20"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              {isProcess ? "Disbursal Reference / Batch ID (Optional)" : "Bank UTR / Transaction ID"}
            </label>
            <input
              type="text"
              required={!isProcess}
              placeholder="e.g. BATCH-2025-05-A or UTR12345"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05015A]/20"
            />
          </div>

          {isProcess && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Debit Bank Used
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={bankUsed}
                    onChange={(e) => setBankUsed(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Disbursal Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sent via IMPS"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Any pharmacies with missing bank details will be safely skipped during processing.</span>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                isProcess ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {isProcess ? "Start Processing" : "Mark as Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkActionModal;