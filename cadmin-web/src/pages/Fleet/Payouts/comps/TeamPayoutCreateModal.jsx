// cadmin-web/src/pages/Fleet/Payouts/comps/TeamPayoutCreateModal.jsx (do not remove this comment)
import { useState } from "react";
import { X, Loader2, UserPlus, IndianRupee } from "lucide-react";
import { createTeamPayout } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const TeamPayoutCreateModal = ({ rider, weekStart, onClose, onSuccess }) => {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) < 0) {
      toast.error("Validation", "Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      await createTeamPayout({
        rider_id: rider.rider_id,
        week_start: weekStart,
        amount: Number(amount),
        notes: notes.trim(),
      });
      toast.success("Created", `Payout of ₹${Number(amount).toLocaleString("en-IN")} created for ${rider.full_name}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to create payout");
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
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <UserPlus size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create Team Payout</h2>
              <p className="text-xs text-gray-500">{rider.full_name} · {rider.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-700">
            Week: {weekStart} to{" "}
            {(() => {
              const [y, m, d] = weekStart.split("-").map(Number);
              const end = new Date(y, m - 1, d + 6);
              return end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
            })()}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Payout Amount *
            </label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                placeholder="e.g., 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                min="0"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              placeholder="e.g., Monthly salary for October, 2 days leave deducted"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 resize-none"
            />
          </div>
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
            disabled={loading || !amount}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 flex items-center gap-1.5"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create Payout
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamPayoutCreateModal;