import { useState } from "react";
import { Play, CheckCircle, XCircle, RotateCcw, Undo2 } from "lucide-react";
import {
  processPharmacyPayout,
  completePharmacyPayout,
  failPharmacyPayout,
  retryPharmacyPayout,
  revertDraftPharmacyPayout, 
} from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";
import CAdminAPI from "../../../../api/axios";

const StatusTransitionBar = ({ payout, onTransitioned }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showInputForm, setShowInputForm] = useState(null); // 'PROCESS' | 'COMPLETE' | 'FAIL'

  // Form states
  const [reference, setReference] = useState("");
  const [bankUsed, setBankUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [failReason, setFailReason] = useState("");

  const handleProcess = async () => {
    setLoading(true);
    try {
      await processPharmacyPayout(payout.payout_id, {
        manual_reference: reference.trim() || undefined,
        manual_bank_used: bankUsed.trim() || undefined,
        manual_notes: notes.trim() || undefined,
      });
      toast.success("Success", "Payout is now in processing");
      setShowInputForm(null);
      onTransitioned();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to process payout");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!paymentDate) return toast.error("Validation", "Payment date is required");
    setLoading(true);
    try {
      await completePharmacyPayout(payout.payout_id, {
        manual_payment_date: paymentDate,
        manual_reference: reference.trim() || undefined,
      });
      toast.success("Success", "Payout completed and marked as paid");
      setShowInputForm(null);
      onTransitioned();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to complete payout");
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async () => {
    if (!failReason.trim()) return toast.error("Validation", "Fail reason is required");
    setLoading(true);
    try {
      await failPharmacyPayout(payout.payout_id, {
        failed_reason: failReason.trim(),
      });
      toast.success("Success", "Payout marked as failed");
      setShowInputForm(null);
      onTransitioned();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to flag payout failure");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      await retryPharmacyPayout(payout.payout_id, {});
      toast.success("Success", "Payout reset back to processing status");
      onTransitioned();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to retry payout");
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToDraft = async () => {
  if (!window.confirm("Revert this payout back to DRAFT? This unlocks recalculation.")) return;
  setLoading(true);
  try {
    await revertDraftPharmacyPayout(payout.payout_id);
    toast.success("Reverted", "Payout status returned to DRAFT");
    onTransitioned();
  } catch (err) {
    toast.error("Error", err.response?.data?.message || "Failed to revert payout");
  } finally {
    setLoading(false);
  }
};
  if (payout.status === "COMPLETED") {
    return (
      <div className="flex items-center justify-between text-xs py-1 bg-emerald-50 rounded-lg px-3 border border-emerald-200">
        <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
          <CheckCircle size={14} /> Payout settled on {payout.manual_payment_date || payout.updated_at?.split("T")[0]}
        </span>
        {payout.manual_reference && (
          <span className="text-gray-600">
            Bank Ref/UTR: <strong className="text-gray-900 font-mono">{payout.manual_reference}</strong>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Forms for transitions */}
      {showInputForm === "PROCESS" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Start Payout Processing</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">UTR / Reference (Optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="IMPS/NEFT Ref"
                className="w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Debit Bank (Optional)</label>
              <input
                type="text"
                value={bankUsed}
                onChange={(e) => setBankUsed(e.target.value)}
                placeholder="HDFC Current A/c"
                className="w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Disbursal Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent via NetBanking bulk upload"
              className="w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowInputForm(null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Confirm Disbursal Started
            </button>
          </div>
        </div>
      )}

      {showInputForm === "COMPLETE" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Mark Payout as Completed (Paid)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Bank UTR / Transaction ID</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="IMPS1234567"
                className="w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowInputForm(null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Confirm Settlement Finalized
            </button>
          </div>
        </div>
      )}

      {showInputForm === "FAIL" && (
        <div className="bg-white border border-rose-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">Flag Disbursal Failure</h4>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Reason for Failure</label>
            <input
              type="text"
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="e.g. Beneficiary IFSC invalid or account frozen"
              className="w-full h-8 px-2.5 text-xs border border-rose-300 rounded-lg focus:ring-rose-200 focus:border-rose-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowInputForm(null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFail}
              disabled={loading}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Mark as Failed
            </button>
          </div>
        </div>
      )}

      {/* Main Status Bar Actions */}
      {!showInputForm && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-gray-500">
            Payout status is currently <strong className="text-gray-800 uppercase">{payout.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            {payout.status === "PENDING" && (
              <>
                <button
                  onClick={handleRevertToDraft}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Undo2 size={12} /> Revert to Draft
                </button>
                <button
                  onClick={() => {
                    setReference(payout.manual_reference || "");
                    setBankUsed(payout.manual_bank_used || "");
                    setNotes(payout.manual_notes || "");
                    setShowInputForm("PROCESS");
                  }}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Play size={12} /> Mark Processing
                </button>
              </>
            )}

            {payout.status === "PROCESSING" && (
              <>
                <button
                  onClick={() => {
                    setReference(payout.manual_reference || "");
                    setShowInputForm("COMPLETE");
                  }}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <CheckCircle size={12} /> Mark as Paid
                </button>
                <button
                  onClick={() => setShowInputForm("FAIL")}
                  disabled={loading}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <XCircle size={12} /> Flag Failed
                </button>
              </>
            )}

            {payout.status === "FAILED" && (
              <button
                onClick={handleRetry}
                disabled={loading}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} /> Retry Disbursal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTransitionBar;