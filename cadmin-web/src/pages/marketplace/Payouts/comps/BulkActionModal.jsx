import { useState } from "react";
import { X, Loader2, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { bulkProcessPharmacyPayouts, bulkCompletePharmacyPayouts } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

const BulkActionModal = ({ actionType, selectedPayouts, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
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
        await bulkProcessPharmacyPayouts({
          payout_ids: payoutIds,
          manual_reference: reference.trim() || undefined,
          manual_bank_used: bankUsed.trim() || undefined,
          manual_notes: notes.trim() || undefined,
        });
        toast.success("Success", `${payoutIds.length} payouts moved to processing`);
      } else {
        await bulkCompletePharmacyPayouts({
          payout_ids: payoutIds,
          manual_payment_date: paymentDate,
          manual_reference: reference.trim() || undefined,
        });
        toast.success("Success", `${payoutIds.length} payouts settled and marked as completed`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            {isProcess ? <Play size={16} className="text-blue-600" /> : <CheckCircle size={16} className="text-green-600" />}
            {isProcess ? "Bulk Process Payouts" : "Bulk Settle Payouts"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-gray-500">Payouts Selected:</span>{" "}
              <strong className="text-gray-900">{payoutIds.length}</strong>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Total Net Amount:</span>{" "}
              <strong className="text-[#05015A]">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {!isProcess && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Settlement / Transfer Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-10 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {isProcess ? "Disbursal Reference No. (Optional)" : "Bank UTR / Transaction ID"}
            </label>
            <input
              type="text"
              required={!isProcess}
              placeholder="e.g. UTIB00012345 or IMPSRef10"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>

          {isProcess && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Debit Bank Used
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={bankUsed}
                    onChange={(e) => setBankUsed(e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Internal Disbursal Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sent via bulk IMPS"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Any pharmacies with missing bank details will be automatically skipped during processing.</span>
              </div>
            </>
          )}

          {/* Footer Actions */}
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
              className={`px-4 py-2 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50
                ${isProcess ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {isProcess ? "Start Processing" : "Mark as Paid / Settled"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkActionModal;