// cadmin-web/src/pages/Fleet/Payouts/comps/TeamAmountEditor.jsx (do not remove this comment)
import { useState } from "react";
import { IndianRupee, Pencil, Loader2, Check, X } from "lucide-react";
import { updateTeamPayoutAmount } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const TeamAmountEditor = ({ payout, onUpdated }) => {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit =
    payout &&
    payout.status !== "PROCESSING" &&
    payout.status !== "COMPLETED";

  const currentAmount = payout?.gross_amount || 0;

  const handleStartEdit = () => {
    setAmount(String(currentAmount));
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setAmount("");
  };

  const handleSave = async () => {
    if (!amount || Number(amount) < 0) return;
    setSaving(true);
    try {
      await updateTeamPayoutAmount(payout.payout_id, Number(amount));
      toast.success("Updated", `Amount changed to ₹${Number(amount).toLocaleString("en-IN")}`);
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <IndianRupee size={18} className="text-gray-400" />
        <div>
          <p className="text-xs text-gray-500">Payout Amount</p>
          <p className="text-xl font-bold text-gray-900">
            ₹{currentAmount.toLocaleString("en-IN")}
          </p>
        </div>
        <span className="ml-auto text-xs text-gray-400">
          Locked ({payout?.status})
        </span>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
        <IndianRupee size={18} className="text-purple-500" />
        <div className="flex-1">
          <p className="text-xs text-purple-600">Payout Amount</p>
          <p className="text-xl font-bold text-purple-900">
            ₹{currentAmount.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          onClick={handleStartEdit}
          className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
          title="Edit amount"
        >
          <Pencil size={14} className="text-purple-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-purple-50 rounded-lg space-y-3">
      <p className="text-xs font-semibold text-purple-800">Edit Payout Amount</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-10 pl-8 pr-3 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200"
            min="0"
            autoFocus
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !amount}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
        <button
          onClick={handleCancel}
          className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default TeamAmountEditor;