import { useState } from "react";
import { Play, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import {
  processPharmacyPayout,
  completePharmacyPayout,
  failPharmacyPayout,
  retryPharmacyPayout,
} from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

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

  if (payout.status === "COMPLETED") {
    return (
      <div className="flex items-center justify-between text-sm py-1 bg-green-50/50 rounded-lg px-3">
        <span className="text-green-700 font-semibold flex items-center gap-1.5">
          <CheckCircle size={15} /> Payout settled on {payout.manual_payment_date || payout.updated_at?.split("T")[0]}
        </span>
        {payout.manual_reference && (
          <span className="text-gray-500 text-xs">Ref/UTR: <strong className="text-gray-700">{payout.manual_reference}</strong></span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Input Action Forms */}
      {showInputForm === "PROCESS" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Start Payout Processing</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">UTR / Reference No. (Optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="IMPS/NEFT UTR"
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Paying Bank / Account (Optional)</label>
              <input
                type="text"
                value={bankUsed}
                onChange={(e) => setBankUsed(e.target.value)}
                placeholder="HDFC Current A/c"
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Notes / Disbursal Details</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent via NetBanking bulk upload file"
              className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowInputForm(null)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button onClick={handleProcess} disabled={loading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
              Confirm Disbursal Started
            </button>
          </div>
        </div>
      )}

      {showInputForm === "COMPLETE" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mark Payout as Completed (Paid)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">UTR / Bank Reference No.</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="IMPS1234567"
                className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowInputForm(null)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button onClick={handleComplete} disabled={loading} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold">
              Confirm Settlement Finalized
            </button>
          </div>
        </div>
      )}

      {showInputForm === "FAIL" && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Flag Disbursal Failure</h4>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Reason for Failure</label>
            <input
              type="text"
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="e.g. Beneficiary IFSC code invalid or account blocked"
              className="w-full h-9 px-3 text-xs border border-gray-300 rounded-lg border-red-200 focus:ring-red-200 focus:border-red-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowInputForm(null)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button onClick={handleFail} disabled={loading} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold">
              Mark as Failed
            </button>
          </div>
        </div>
      )}

      {/* Main Action Bar Buttons */}
      {!showInputForm && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-gray-500">
            Payout status is currenty <strong className="text-gray-700 uppercase">{payout.status}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            {payout.status === "PENDING" && (
              <button
                onClick={() => {
                  setReference(payout.manual_reference || "");
                  setBankUsed(payout.manual_bank_used || "");
                  setNotes(payout.manual_notes || "");
                  setShowInputForm("PROCESS");
                }}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Play size={12} /> Mark Processing
              </button>
            )}

            {payout.status === "PROCESSING" && (
              <>
                <button
                  onClick={() => {
                    setReference(payout.manual_reference || "");
                    setShowInputForm("COMPLETE");
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <CheckCircle size={12} /> Mark as Paid
                </button>
                <button
                  onClick={() => setShowInputForm("FAIL")}
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <XCircle size={12} /> Flag Failed
                </button>
              </>
            )}

            {payout.status === "FAILED" && (
              <button
                onClick={handleRetry}
                disabled={loading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
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