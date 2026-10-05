// cadmin-web/src/pages/Fleet/Payouts/comps/StatusTransitionBar.jsx (do not remove this comment)
import { useState } from "react";
import { Play, CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";
import {
  processRiderPayout,
  completeRiderPayout,
  failRiderPayout,
  retryRiderPayout,
} from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const StatusTransitionBar = ({ payout, onTransitioned }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(null); // "process" | "complete" | "fail" | "retry"
  const [formData, setFormData] = useState({});

  const status = payout?.status;

  const execute = async (fn, data, successMsg) => {
    setLoading(true);
    try {
      await fn(payout.payout_id, data);
      toast.success("Success", successMsg);
      setShowForm(null);
      setFormData({});
      onTransitioned();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  if (status === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle size={16} /> Payout completed on{" "}
        {payout.manual_payment_date || "—"}
        {payout.manual_reference && ` · Ref: ${payout.manual_reference}`}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {status === "PENDING" && (
          <button
            onClick={() => setShowForm("process")}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
          >
            <Play size={12} /> Start Processing
          </button>
        )}

        {status === "PROCESSING" && (
          <>
            <button
              onClick={() => setShowForm("complete")}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1"
            >
              <CheckCircle size={12} /> Mark as Paid
            </button>
            <button
              onClick={() => setShowForm("fail")}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 flex items-center gap-1"
            >
              <XCircle size={12} /> Mark as Failed
            </button>
          </>
        )}

        {status === "FAILED" && (
          <button
            onClick={() => setShowForm("retry")}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Retry Payment
          </button>
        )}
      </div>

      {/* Inline Forms */}
      {showForm === "process" && (
        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-blue-800">Start Processing</p>
          <input
            type="text"
            placeholder="UTR / Reference Number *"
            value={formData.manual_reference || ""}
            onChange={(e) => setFormData({ ...formData, manual_reference: e.target.value })}
            className="w-full h-8 px-2 border border-blue-200 rounded text-sm"
          />
          <input
            type="text"
            placeholder="Bank Used (e.g., HDFC)"
            value={formData.manual_bank_used || ""}
            onChange={(e) => setFormData({ ...formData, manual_bank_used: e.target.value })}
            className="w-full h-8 px-2 border border-blue-200 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => execute(processRiderPayout, formData, "Moved to processing")}
              disabled={loading || !formData.manual_reference}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-40 flex items-center gap-1"
            >
              {loading && <Loader2 size={12} className="animate-spin" />} Confirm
            </button>
            <button onClick={() => setShowForm(null)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {showForm === "complete" && (
        <div className="p-3 bg-green-50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-green-800">Confirm Payment</p>
          <input
            type="date"
            value={formData.manual_payment_date || ""}
            onChange={(e) => setFormData({ ...formData, manual_payment_date: e.target.value })}
            className="w-full h-8 px-2 border border-green-200 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => execute(completeRiderPayout, formData, "Marked as paid")}
              disabled={loading || !formData.manual_payment_date}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium disabled:opacity-40 flex items-center gap-1"
            >
              {loading && <Loader2 size={12} className="animate-spin" />} Confirm Paid
            </button>
            <button onClick={() => setShowForm(null)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {showForm === "fail" && (
        <div className="p-3 bg-red-50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-red-800">Mark as Failed</p>
          <input
            type="text"
            placeholder="Reason for failure *"
            value={formData.failed_reason || ""}
            onChange={(e) => setFormData({ ...formData, failed_reason: e.target.value })}
            className="w-full h-8 px-2 border border-red-200 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => execute(failRiderPayout, formData, "Marked as failed")}
              disabled={loading || !formData.failed_reason}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium disabled:opacity-40 flex items-center gap-1"
            >
              {loading && <Loader2 size={12} className="animate-spin" />} Confirm
            </button>
            <button onClick={() => setShowForm(null)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {showForm === "retry" && (
        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-blue-800">Retry Payment</p>
          <input
            type="text"
            placeholder="New UTR / Reference Number *"
            value={formData.manual_reference || ""}
            onChange={(e) => setFormData({ ...formData, manual_reference: e.target.value })}
            className="w-full h-8 px-2 border border-blue-200 rounded text-sm"
          />
          <input
            type="text"
            placeholder="New Bank Used (e.g. HDFC)"
            value={formData.manual_bank_used || ""}
            onChange={(e) => setFormData({ ...formData, manual_bank_used: e.target.value })}
            className="w-full h-8 px-2 border border-blue-200 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => execute(retryRiderPayout, formData, "Payout retry initiated")}
              disabled={loading || !formData.manual_reference}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-40 flex items-center gap-1"
            >
              {loading && <Loader2 size={12} className="animate-spin" />} Confirm Retry
            </button>
            <button onClick={() => setShowForm(null)} className="px-3 py-1.5 text-xs text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTransitionBar;