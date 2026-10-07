import { useState } from "react";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { updatePharmacyPayoutAdjustments } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

const AdjustmentsEditor = ({ payout, onUpdated }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState(() => {
    if (payout?.adjustments && Array.isArray(payout.adjustments)) return payout.adjustments;
    return [];
  });

  const isMutable = payout?.status === "DRAFT" || payout?.status === "PENDING" || payout?.status === "FAILED";

  const addItem = (type) => {
    setItems([
      ...items,
      { id: `new-${Date.now()}`, type, label: "", amount: 0, note: "", by: "cadmin", at: new Date().toISOString() },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async () => {
    const invalid = items.find((a) => !a.label?.trim() || !a.amount || a.amount <= 0);
    if (invalid) {
      toast.error("Validation", "All adjustments need a label and positive amount");
      return;
    }
    setSaving(true);
    try {
      await updatePharmacyPayoutAdjustments(payout.payout_id, items);
      toast.success("Saved", "Adjustments updated");
      onUpdated();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const totalAdj = items.reduce((s, a) => s + (a.type === "ADDITION" ? Number(a.amount) : -Number(a.amount)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Adjustments</h3>
        {isMutable && (
          <div className="flex items-center gap-2">
            <button onClick={() => addItem("DEDUCTION")} className="px-2 py-1 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg flex items-center gap-1">
              <ArrowDownCircle size={12} /> Deduction
            </button>
            <button onClick={() => addItem("ADDITION")} className="px-2 py-1 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg flex items-center gap-1">
              <ArrowUpCircle size={12} /> Addition
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No adjustments. Add deductions for refunds or additions for corrections.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id || idx} className={`p-3 rounded-lg border ${item.type === "ADDITION" ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === "ADDITION" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                  {item.type}
                </span>
                {isMutable && (
                  <button onClick={() => removeItem(idx)} className="ml-auto p-1 text-gray-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Label (e.g., Refund MKT-001)"
                  value={item.label}
                  onChange={(e) => updateItem(idx, "label", e.target.value)}
                  disabled={!isMutable}
                  className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount || ""}
                  onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                  disabled={!isMutable}
                  className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
                  min="0"
                  step="0.01"
                />
              </div>
              <input
                type="text"
                placeholder="Note (optional)"
                value={item.note || ""}
                onChange={(e) => updateItem(idx, "note", e.target.value)}
                disabled={!isMutable}
                className="mt-2 w-full h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-semibold text-gray-700">Net Adjustment:</span>
          <span className={`text-sm font-bold ${totalAdj >= 0 ? "text-green-700" : "text-red-700"}`}>
            {totalAdj >= 0 ? "+" : ""}{fmt(totalAdj)}
          </span>
        </div>
      )}

      {isMutable && items.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#05015A]/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Adjustments"}
        </button>
      )}
    </div>
  );
};

export default AdjustmentsEditor;