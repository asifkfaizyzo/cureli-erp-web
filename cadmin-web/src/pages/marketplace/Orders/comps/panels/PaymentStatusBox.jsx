// cadmin-web/src/pages/marketplace/Orders/comps/panels/PaymentStatusBox.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import { CreditCard, Edit3, Save, Loader2, AlertCircle } from "lucide-react";
import { updateMarketplaceOrderPaymentStatus } from "../../../../../api/cadminMarketplaceOrders";
import StyledSelect from "../../../../../components/common/StyledSelect";
import { useToast } from "../../../../../components/common/Toast";

const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  FAILED: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  REFUNDED: { label: "Refunded", cls: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  PARTIALLY_REFUNDED: { label: "Partially Refunded", cls: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
};

const ALL_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
const PAYMENT_REASON_REQUIRED = ["REFUNDED", "PARTIALLY_REFUNDED"];

const PaymentStatusBox = ({ order, onUpdated }) => {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState(order.payment_status || "PENDING");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const reasonRequired = PAYMENT_REASON_REQUIRED.includes(newPaymentStatus);

  useEffect(() => {
    setNewPaymentStatus(order.payment_status || "PENDING");
    setReason("");
    setEditing(false);
  }, [order.order_id, order.payment_status]);

  const paymentStatusOptions = ALL_PAYMENT_STATUSES.map((status) => ({
    value: status,
    label: PAYMENT_STATUS_CONFIG[status]?.label || status,
  }));

  const handleSave = async () => {
    if (newPaymentStatus === order.payment_status) {
      toast.warning("No Change", "Payment status matches current value.");
      return;
    }
    if (reasonRequired && !reason.trim()) {
      toast.error("Required Input", "Reason is required for refunds.");
      return;
    }

    setSaving(true);
    try {
      await updateMarketplaceOrderPaymentStatus(order.order_id, newPaymentStatus, reason.trim());
      toast.success("Success", `Payment updated to ${PAYMENT_STATUS_CONFIG[newPaymentStatus]?.label || newPaymentStatus}`);
      setEditing(false);
      setReason("");
      onUpdated();
    } catch (err) {
      toast.error("Operation Failed", err.response?.data?.message || "Failed to update payment status.");
    } finally {
      setSaving(false);
    }
  };

  const currentCfg = PAYMENT_STATUS_CONFIG[order.payment_status] || { label: order.payment_status, dot: "bg-gray-400", cls: "bg-gray-50 text-gray-600" };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center">
            <CreditCard size={12} className="text-[#05015A]" />
          </div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Info</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-bold text-[#05015A] hover:underline flex items-center gap-1"
          >
            <Edit3 size={11} />
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <span className="text-xs text-gray-500">Method</span>
            <span className="text-xs font-semibold text-gray-800">{order.payment_method || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentCfg.dot}`} />
              {currentCfg.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <StyledSelect
            label="Payment Status"
            value={newPaymentStatus}
            onChange={(val) => setNewPaymentStatus(val)}
            options={paymentStatusOptions}
            placeholder="Select status..."
          />

          {reasonRequired && (
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Reason for change..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/40 resize-none font-medium"
              />
            </div>
          )}

          {PAYMENT_REASON_REQUIRED.includes(newPaymentStatus) && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-50 border border-violet-100">
              <AlertCircle size={12} className="text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-violet-700 leading-tight">
                An automatic notification will be dispatched immediately to the customer regarding this refund.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setNewPaymentStatus(order.payment_status || "PENDING");
                setReason("");
              }}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || newPaymentStatus === order.payment_status}
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

export default PaymentStatusBox;