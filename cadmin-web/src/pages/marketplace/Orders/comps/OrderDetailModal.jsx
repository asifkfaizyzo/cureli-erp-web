import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  AlertCircle,
  Receipt,
  Store,
  User,
  MapPin,
  ShoppingBag,
  CreditCard,
  Clock,
  FileText,
  CheckCircle2,
  Edit3,
  Save,
} from "lucide-react";
import {
  getMarketplaceOrderById,
  updateMarketplaceOrderStatus,
  updateMarketplaceOrderPaymentStatus,
} from "../../../../api/cadminMarketplaceOrders";

// Import your custom select component (Adjust this relative path if necessary)
import StyledSelect from "../../../../components/common/StyledSelect";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED: {
    label: "Placed",
    dot: "bg-amber-500",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-blue-500",
    cls: "bg-blue-50 text-blue-700 border-blue-100",
  },
  READY_FOR_PICKUP: {
    label: "Ready",
    dot: "bg-violet-500",
    cls: "bg-violet-50 text-violet-700 border-violet-100",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-500",
    cls: "bg-red-50 text-red-700 border-red-100",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  },
};

const ALL_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

const TERMINAL_STATES = ["COMPLETED", "REJECTED", "CANCELLED"];

const PAYMENT_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PAID: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    cls: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  REFUNDED: {
    label: "Refunded",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  PARTIALLY_REFUNDED: {
    label: "Partially Refunded",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
};

const ALL_PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

const PAYMENT_REASON_REQUIRED = ["REFUNDED", "PARTIALLY_REFUNDED"];

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "items", label: "Items" },
  { key: "status", label: "Status & Payment" },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const fmtTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtAmount = (n) =>
  `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─────────────────────────────────────────────
// REUSABLE BITS
// ─────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PaymentStatusBadge = ({ status }) => {
  const cfg = PAYMENT_STATUS_CONFIG[status] || {
    label: status,
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const SectionTitle = ({ icon: Icon, title, action = null }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-[#05015A]" />
      </div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </p>
    </div>
    {action}
  </div>
);

const DetailRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500 flex-shrink-0 w-36">{label}</span>
    <span
      className={`text-xs font-medium text-gray-800 text-right ${
        mono ? "font-mono" : ""
      }`}
    >
      {value || "—"}
    </span>
  </div>
);

const HorizontalCard = ({ children }) => (
  <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
    {children}
  </div>
);

// ─────────────────────────────────────────────
// STATUS UPDATE BOX
// ─────────────────────────────────────────────

const StatusUpdateBox = ({ order, onUpdated, onToast }) => {
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const isTerminal = TERMINAL_STATES.includes(order.status);
  const reasonRequired =
    newStatus === "REJECTED" || newStatus === "CANCELLED";

  useEffect(() => {
    setNewStatus(order.status);
    setReason("");
    setEditing(false);
  }, [order.order_id, order.status]);

  const handleSave = async () => {
    if (newStatus === order.status) {
      onToast("Status unchanged", "warning");
      return;
    }

    if (reasonRequired && !reason.trim()) {
      onToast("Reason is required for this status", "error");
      return;
    }

    setSaving(true);
    try {
      await updateMarketplaceOrderStatus(
        order.order_id,
        newStatus,
        reason.trim()
      );
      onToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setEditing(false);
      setReason("");
      onUpdated();
    } catch (err) {
      onToast(
        err.response?.data?.message || "Failed to update status",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (isTerminal) {
    return (
      <HorizontalCard>
        <SectionTitle icon={CheckCircle2} title="Order Status" />
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <p className="text-[11px] text-gray-400">
            Terminal state — cannot be changed
          </p>
        </div>
      </HorizontalCard>
    );
  }

  return (
    <HorizontalCard>
      <SectionTitle
        icon={Edit3}
        title="Order Status"
        action={
          !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#05015A] hover:underline"
            >
              <Edit3 size={11} />
              Change Status
            </button>
          )
        }
      />

      {!editing ? (
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <p className="text-[11px] text-gray-400">
            CAdmin can override the current status
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = newStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? "bg-[#05015A] text-white border-[#05015A] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-white" : cfg.dot
                    }`}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
              Reason {reasonRequired && <span className="text-red-500">*</span>}
              {!reasonRequired && (
                <span className="text-gray-400 font-normal ml-1">
                  (optional)
                </span>
              )}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={
                reasonRequired
                  ? "Why is this order being rejected/cancelled?"
                  : "Optional note for the status change..."
              }
              className="mt-1.5 w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#05015A]/40 focus:ring-2 focus:ring-[#05015A]/10 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setEditing(false);
                setNewStatus(order.status);
                setReason("");
              }}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || newStatus === order.status}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#05015A] text-white hover:bg-[#05015A]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </HorizontalCard>
  );
};

// ─────────────────────────────────────────────
// PAYMENT STATUS DROPDOWN (USING STYLED SELECT)
// ─────────────────────────────────────────────

const PaymentStatusBox = ({ order, onUpdated, onToast }) => {
  const [editing, setEditing] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState(
    order.payment_status || "PENDING"
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const reasonRequired = PAYMENT_REASON_REQUIRED.includes(newPaymentStatus);

  useEffect(() => {
    setNewPaymentStatus(order.payment_status || "PENDING");
    setReason("");
    setEditing(false);
  }, [order.order_id, order.payment_status]);

  // Construct options array in the format `{ value, label }` expected by StyledSelect
  const paymentStatusOptions = ALL_PAYMENT_STATUSES.map((status) => ({
    value: status,
    label: PAYMENT_STATUS_CONFIG[status]?.label || status,
  }));

  const handleSave = async () => {
    if (newPaymentStatus === order.payment_status) {
      onToast("Payment status unchanged", "warning");
      return;
    }

    if (reasonRequired && !reason.trim()) {
      onToast("Reason is required for refund", "error");
      return;
    }

    setSaving(true);
    try {
      await updateMarketplaceOrderPaymentStatus(
        order.order_id,
        newPaymentStatus,
        reason.trim()
      );
      onToast(
        `Payment status updated to ${PAYMENT_STATUS_CONFIG[newPaymentStatus]?.label || newPaymentStatus}`
      );
      setEditing(false);
      setReason("");
      onUpdated();
    } catch (err) {
      onToast(
        err.response?.data?.message || "Failed to update payment status",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <HorizontalCard>
      <SectionTitle
        icon={CreditCard}
        title="Payment"
        action={
          !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#05015A] hover:underline"
            >
              <Edit3 size={11} />
              Change
            </button>
          )
        }
      />

      {!editing ? (
        <div>
          <DetailRow label="Method" value={order.payment_method} />
          <div className="flex items-start justify-between gap-4 py-2">
            <span className="text-xs text-gray-500 flex-shrink-0 w-36">
              Status
            </span>
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Replaced standard HTML <select> with StyledSelect */}
          <div>
            <StyledSelect
              label="Payment Status"
              value={newPaymentStatus}
              onChange={(val) => setNewPaymentStatus(val)}
              options={paymentStatusOptions}
              placeholder="Select payment status..."
            />
          </div>

          {reasonRequired && (
            <div>
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Why is this payment being refunded?"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#05015A]/40 focus:ring-2 focus:ring-[#05015A]/10 resize-none"
              />
            </div>
          )}

          {PAYMENT_REASON_REQUIRED.includes(newPaymentStatus) && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100">
              <AlertCircle size={12} className="text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-violet-700">
                The customer will receive a push notification and email about
                this refund immediately.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setEditing(false);
                setNewPaymentStatus(order.payment_status || "PENDING");
                setReason("");
              }}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || newPaymentStatus === order.payment_status}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#05015A] text-white hover:bg-[#05015A]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </HorizontalCard>
  );
};

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────

const OrderDetailModal = ({ orderId, onClose, onStatusUpdated, onToast }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadOrder = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMarketplaceOrderById(orderId)
      .then((res) => {
        if (!cancelled) setOrder(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load order details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    const cleanup = loadOrder();
    return cleanup;
  }, [loadOrder]);

  useEffect(() => {
    setActiveTab("overview");
  }, [orderId]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleUpdated = () => {
    loadOrder();
    onStatusUpdated();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <Receipt size={18} className="text-[#05015A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {order ? `Order ${order.order_number}` : "Order Details"}
              </h2>
              {order && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Placed {fmtTime(order.placed_at)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {order && <StatusBadge status={order.status} />}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-[#05015A]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#05015A]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#05015A] mb-3" />
              <p className="text-sm text-gray-400">Loading order...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {order && activeTab === "overview" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <HorizontalCard>
                <SectionTitle icon={Store} title="Shop & Branch" />
                <div>
                  <DetailRow label="Shop" value={order.shop?.business_name} />
                  <DetailRow
                    label="Shop Location"
                    value={
                      order.shop
                        ? [order.shop.city, order.shop.state]
                            .filter(Boolean)
                            .join(", ")
                        : null
                    }
                  />
                  <DetailRow label="Branch" value={order.branch?.branch_name} />
                  <DetailRow
                    label="Branch Type"
                    value={
                      order.branch?.branch_type
                        ? order.branch.branch_type.charAt(0).toUpperCase() +
                          order.branch.branch_type.slice(1)
                        : null
                    }
                  />
                </div>
              </HorizontalCard>

              <HorizontalCard>
                <SectionTitle icon={User} title="Customer" />
                <div>
                  <DetailRow label="Name" value={order.customer_name} />
                  <DetailRow label="Phone" value={order.customer_phone} mono />
                  <DetailRow
                    label="Account Status"
                    value={
                      order.customer?.status
                        ? order.customer.status.charAt(0).toUpperCase() +
                          order.customer.status.slice(1)
                        : null
                    }
                  />
                </div>
              </HorizontalCard>

              <HorizontalCard>
                <SectionTitle icon={MapPin} title="Delivery Address" />
                <div className="text-xs text-gray-700 leading-relaxed space-y-1">
                  {order.delivery_address?.recipient_name && (
                    <p className="font-medium">
                      {order.delivery_address.recipient_name}
                      {order.delivery_address.recipient_phone
                        ? ` · ${order.delivery_address.recipient_phone}`
                        : ""}
                    </p>
                  )}
                  <p>{order.delivery_address?.address_line_1}</p>
                  {order.delivery_address?.address_line_2 && (
                    <p>{order.delivery_address.address_line_2}</p>
                  )}
                  {order.delivery_address?.landmark && (
                    <p>{order.delivery_address.landmark}</p>
                  )}
                  <p>
                    {[
                      order.delivery_address?.city,
                      order.delivery_address?.state,
                      order.delivery_address?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </HorizontalCard>
            </div>
          )}

          {order && activeTab === "items" && (
            <div className="space-y-4">
              <HorizontalCard>
                <SectionTitle icon={ShoppingBag} title="Items List" />
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.medicine_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.brand && (
                            <span className="text-[11px] text-gray-500">
                              {item.brand}
                            </span>
                          )}
                          {item.pack_size && (
                            <span className="text-[11px] text-gray-400">
                              · {item.pack_size}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-gray-400">
                            SKU: {item.sku}
                          </span>
                          {item.requires_prescription && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                          MRP: {fmtAmount(item.mrp)} · Qty: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-800">
                          {fmtAmount(item.line_total)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          @ {fmtAmount(item.unit_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Subtotal</span>
                    <span className="text-xs font-medium text-gray-700">
                      {fmtAmount(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">Total</span>
                    <span className="text-base font-bold text-gray-900">
                      {fmtAmount(order.total_amount)}
                    </span>
                  </div>
                </div>
              </HorizontalCard>

              {order.prescriptions?.length > 0 && (
                <HorizontalCard>
                  <SectionTitle icon={FileText} title="Prescriptions" />
                  <div className="space-y-2">
                    {order.prescriptions.map((p) => (
                      <div
                        key={p.prescription_id}
                        className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-amber-100"
                      >
                        <FileText size={14} className="text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {p.original_name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {p.mime_type} · {(p.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </HorizontalCard>
              )}
            </div>
          )}

          {order && activeTab === "status" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-1">
                <StatusUpdateBox
                  order={order}
                  onUpdated={handleUpdated}
                  onToast={onToast}
                />
              </div>

              <div className="xl:col-span-1">
                <PaymentStatusBox
                  order={order}
                  onUpdated={handleUpdated}
                  onToast={onToast}
                />
              </div>

              <div className="xl:col-span-1">
                <HorizontalCard>
                  <SectionTitle icon={Clock} title="Status Timeline" />
                  <div className="space-y-2">
                    {order.status_history.map((h, idx) => (
                      <div key={h.history_id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                              STATUS_CONFIG[h.to_status]?.dot || "bg-gray-400"
                            }`}
                          />
                          {idx < order.status_history.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[12px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-700">
                              {h.to_status.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              by{" "}
                              {h.changed_by_type.charAt(0).toUpperCase() +
                                h.changed_by_type.slice(1)}
                            </span>
                          </div>
                          {h.reason && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {h.reason.replace(/_/g, " ")}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {fmtTime(h.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </HorizontalCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;