// cadmin-web/src/pages/marketplace/Orders/comps/panels/StatusUpdateBox.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import { Edit3, CheckCircle2, Loader2, Save } from "lucide-react";
import { updateMarketplaceOrderStatus } from "../../../../../api/cadminMarketplaceOrders";
import { useToast } from "../../../../../components/common/Toast";

const STATUS_CONFIG = {
  PLACED: { label: "Placed", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  ACCEPTED: { label: "Accepted", dot: "bg-blue-500", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  READY_FOR_PICKUP: { label: "Ready", dot: "bg-violet-500", cls: "bg-violet-50 text-violet-700 border-violet-100" },
  COMPLETED: { label: "Completed", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  REJECTED: { label: "Rejected", dot: "bg-red-500", cls: "bg-red-50 text-red-700 border-red-100" },
  CANCELLED: { label: "Cancelled", dot: "bg-gray-400", cls: "bg-gray-50 text-gray-600 border-gray-100" },
};

const ALL_STATUSES = ["PLACED", "ACCEPTED", "READY_FOR_PICKUP", "COMPLETED", "REJECTED", "CANCELLED"];
const TERMINAL_STATES = ["COMPLETED", "REJECTED", "CANCELLED"];

const StatusUpdateBox = ({ order, onUpdated }) => {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const isTerminal = TERMINAL_STATES.includes(order.status);
  const reasonRequired = newStatus === "REJECTED" || newStatus === "CANCELLED";

  useEffect(() => {
    setNewStatus(order.status);
    setReason("");
    setEditing(false);
  }, [order.order_id, order.status]);

  const handleSave = async () => {
    if (newStatus === order.status) {
      toast.warning("No Change", "Status is already the same.");
      return;
    }
    if (reasonRequired && !reason.trim()) {
      toast.error("Required Input", "Reason is required for this action.");
      return;
    }

    setSaving(true);
    try {
      await updateMarketplaceOrderStatus(order.order_id, newStatus, reason.trim());
      toast.success("Success", `Status changed to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setEditing(false);
      setReason("");
      onUpdated();
    } catch (err) {
      toast.error("Operation Failed", err.response?.data?.message || "Failed to edit status.");
    } finally {
      setSaving(false);
    }
  };

  const currentCfg = STATUS_CONFIG[order.status] || { label: order.status, dot: "bg-gray-400", cls: "bg-gray-50 text-gray-600 border-gray-100" };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center">
            <Edit3 size={12} className="text-[#05015A]" />
          </div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Order Status</p>
        </div>
        {!isTerminal && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-bold text-[#05015A] hover:underline"
          >
            Change Status
          </button>
        )}
      </div>

      {isTerminal ? (
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${currentCfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
            {currentCfg.label}
          </span>
          <p className="text-[11px] text-gray-400">Terminal State (No edits allowed)</p>
        </div>
      ) : !editing ? (
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${currentCfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
            {currentCfg.label}
          </span>
          <p className="text-[11px] text-gray-400 font-medium">CAdmin Override Active</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((s) => {
              const active = newStatus === s;
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${
                    active
                      ? "bg-[#05015A] text-white border-[#05015A]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${active ? "bg-white" : cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Reason {reasonRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={reasonRequired ? "Provide reasons..." : "Optional comment..."}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/40 resize-none font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setNewStatus(order.status);
                setReason("");
              }}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || newStatus === order.status}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-[#05015A] text-white hover:bg-[#05015A]/90 disabled:opacity-40"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusUpdateBox;