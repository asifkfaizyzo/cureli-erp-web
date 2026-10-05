// cadmin-web/src/pages/Fleet/Payouts/comps/DeductionsEditor.jsx (do not remove this comment)
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { updateRiderPayoutDeductions } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const DeductionsEditor = ({ payout, onUpdated }) => {
  const toast = useToast();
  const [deductions, setDeductions] = useState(() => {
    const existing = payout?.deductions;
    return Array.isArray(existing) ? existing : [];
  });
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");

  const canEdit = payout && payout.status !== "PROCESSING" && payout.status !== "COMPLETED";

  const handleAdd = () => {
    if (!newLabel.trim() || !newAmount) return;
    setDeductions([...deductions, { label: newLabel.trim(), amount: Number(newAmount), note: newNote.trim() }]);
    setNewLabel("");
    setNewAmount("");
    setNewNote("");
  };

  const handleRemove = (index) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!payout?.payout_id) return;
    setSaving(true);
    try {
      await updateRiderPayoutDeductions(payout.payout_id, deductions);
      toast.success("Saved", "Deductions updated");
      onUpdated();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const totalDeductions = deductions.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Deductions</h3>
        <span className="text-sm font-bold text-red-600">-₹{totalDeductions.toLocaleString("en-IN")}</span>
      </div>

      {/* Existing deductions */}
      {deductions.length > 0 && (
        <div className="space-y-2">
          {deductions.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg text-sm">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{d.label}</span>
                {d.note && <span className="text-gray-400 ml-2 text-xs">({d.note})</span>}
              </div>
              <span className="font-semibold text-red-600">-₹{Number(d.amount).toLocaleString("en-IN")}</span>
              {canEdit && (
                <button onClick={() => handleRemove(i)} className="p-1 rounded hover:bg-red-100 transition-colors">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      {canEdit && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-gray-600">Add Deduction</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Label (e.g., COD Reconciliation)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim() || !newAmount}
              className="px-3 h-9 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-40 flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      )}

      {canEdit && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-[#05015A] text-white rounded-lg text-sm font-medium hover:bg-[#0a0280] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Deductions
        </button>
      )}

      {!canEdit && payout && (
        <p className="text-xs text-gray-400">Deductions cannot be modified in {payout.status} status.</p>
      )}
    </div>
  );
};

export default DeductionsEditor;