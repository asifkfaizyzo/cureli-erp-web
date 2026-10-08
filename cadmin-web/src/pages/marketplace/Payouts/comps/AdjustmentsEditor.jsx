import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { updatePharmacyPayoutAdjustments } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

const AdjustmentsEditor = ({ payout, onUpdated }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);

  // Fix: Sync with prop whenever parent re-fetches payout
  useEffect(() => {
    if (payout?.adjustments && Array.isArray(payout.adjustments)) {
      setItems(payout.adjustments);
    } else {
      setItems([]);
    }
  }, [payout?.adjustments]);

  const isMutable = payout?.status === "DRAFT" || payout?.status === "PENDING" || payout?.status === "FAILED";

  const addItem = (type) => {
    setItems((prev) => [
      ...prev,
      { id: `adj-${Date.now()}`, type, label: "", amount: 0, note: "", by: "cadmin", at: new Date().toISOString() },
    ]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    const invalid = items.find((a) => !a.label?.trim() || !a.amount || Number(a.amount) <= 0);
    if (invalid) {
      toast.error("Validation", "All adjustments need a description label and positive amount");
      return;
    }
    setSaving(true);
    try {
      await updatePharmacyPayoutAdjustments(payout.payout_id, items);
      toast.success("Saved", "Adjustments updated and net payout recalculated");
      onUpdated();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to save adjustments");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalAdj = items.reduce((s, a) => s + (a.type === "ADDITION" ? Number(a.amount || 0) : -Number(a.amount || 0)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Settlement Adjustments</h3>
          <p className="text-xs text-gray-500">Apply deductions (e.g. refunds, damaged items) or additions (corrections)</p>
        </div>
        {isMutable && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => addItem("DEDUCTION")}
              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <ArrowDownCircle size={13} /> Deduction
            </button>
            <button
              onClick={() => addItem("ADDITION")}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <ArrowUpCircle size={13} /> Addition
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-400">No manual adjustments for this payout week.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`p-3 rounded-xl border ${
                item.type === "ADDITION" ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    item.type === "ADDITION" ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"
                  }`}
                >
                  {item.type}
                </span>
                {isMutable && (
                  <button onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Reason / Label (e.g. Returned Order #1002)"
                  value={item.label}
                  onChange={(e) => updateItem(idx, "label", e.target.value)}
                  disabled={!isMutable}
                  className="h-8 px-2.5 text-xs border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={item.amount || ""}
                  onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                  disabled={!isMutable}
                  className="h-8 px-2.5 text-xs border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
                  min="0"
                  step="0.01"
                />
              </div>
              <input
                type="text"
                placeholder="Internal audit note (optional)"
                value={item.note || ""}
                onChange={(e) => updateItem(idx, "note", e.target.value)}
                disabled={!isMutable}
                className="mt-2 w-full h-8 px-2.5 text-xs border border-gray-300 rounded-lg bg-white disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-xs font-semibold text-gray-700">Net Adjustments Reconciled:</span>
          <span className={`text-sm font-bold ${totalAdj >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {totalAdj >= 0 ? "+" : ""}{fmt(totalAdj)}
          </span>
        </div>
      )}

      {isMutable && items.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-[#05015A] hover:bg-[#05015A]/90 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Adjustments & Update Net"}
        </button>
      )}
    </div>
  );
};

export default AdjustmentsEditor;