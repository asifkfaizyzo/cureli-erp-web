// cadmin-web/src/pages/marketplace/Orders/comps/OrderDetailModal.jsx (do not remove this comment)

import { useState, useEffect, useCallback, useRef } from "react";
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
  Copy,
  Check,
  Truck,
  Search,
  Compass,
  Navigation,
  Key,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import {
  getMarketplaceOrderById,
  updateMarketplaceOrderStatus,
  updateMarketplaceOrderPaymentStatus,
} from "../../../../api/cadminMarketplaceOrders";
import {
  getAvailableRidersForOrder,
  assignRiderToOrder,
} from "../../../../api/cadminDelivery";

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
  { key: "delivery", label: "Delivery Tracking" },
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

const buildMapsUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${Number(lat)},${Number(lng)}`;

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

const CopyLocationButton = ({ latitude, longitude, onToast }) => {
  const [copied, setCopied] = useState(false);

  // Hide entirely if coordinates are missing
  if (latitude == null || longitude == null) return null;

  const handleCopy = async () => {
    const url = buildMapsUrl(latitude, longitude);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onToast?.("Location link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      onToast?.("Location link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy Google Maps pin link"
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border transition-all ${
        copied
          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
          : "bg-white text-[#05015A] border-gray-200 hover:border-[#05015A]/30 hover:bg-[#05015A]/5"
      }`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy Pin"}
    </button>
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

const HorizontalCard = ({ children, className = "" }) => (
  <div className={`bg-gray-50/70 rounded-xl border border-gray-100 p-4 ${className}`}>
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
// NEW: RIDER ASSIGNMENT & TRACKING COMPONENT
// ─────────────────────────────────────────────

const DeliveryTrackingPanel = ({ order, onUpdated, onToast }) => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("TEAM"); // TEAM first default
  const [forceReassign, setForceReassign] = useState(false);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAvailableRidersForOrder(order.order_id, {
        rider_type: typeFilter,
        search: searchQuery,
      });
      setRiders(res.data?.data?.riders || []);
    } catch (err) {
      onToast("Failed to fetch available partners", "error");
    } finally {
      setLoading(false);
    }
  }, [order.order_id, searchQuery, typeFilter, onToast]);

  useEffect(() => {
    // If we can assign (or forced to reassign), fetch the list
    if (
      (!order.delivery?.rider_id && ["ACCEPTED", "READY_FOR_PICKUP"].includes(order.status)) ||
      forceReassign
    ) {
      fetchRiders();
    }
  }, [order.delivery?.rider_id, order.status, forceReassign, fetchRiders]);

  const handleAssign = async (riderId, name) => {
    setAssigningId(riderId);
    try {
      await assignRiderToOrder(order.order_id, riderId);
      onToast(`Successfully assigned ${name} to this delivery.`);
      setForceReassign(false);
      onUpdated();
    } catch (err) {
      onToast(err.response?.data?.message || "Assignment failed", "error");
    } finally {
      setAssigningId(null);
    }
  };

  // 1. Guard: Order Placed state (Waiting for pharmacy acceptance)
  if (order.status === "PLACED") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border border-gray-100">
        <Store size={36} className="text-gray-300 mb-3" />
        <h3 className="text-sm font-semibold text-gray-700">Awaiting Pharmacy Acceptance</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm px-6">
          The pharmacy must accept this order and verify item availability before you can assign a delivery rider.
        </p>
      </div>
    );
  }

  // 2. Guard: Order Terminal Rejection / Cancellation states
  if (["REJECTED", "CANCELLED"].includes(order.status) && !order.delivery?.rider_id) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border border-gray-100">
        <AlertCircle size={36} className="text-red-300 mb-3" />
        <h3 className="text-sm font-semibold text-gray-700">Order Terminated</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          This order was {order.status.toLowerCase()} — delivery scheduling is suspended.
        </p>
      </div>
    );
  }

  const hasAssignedRider = order.delivery?.rider_id && !forceReassign;

  // 3. Show Active Tracking Stepper & Live Status Dashboard
  if (hasAssignedRider) {
    const delivery = order.delivery;
    
    // Status milestones map
    const milestones = [
      { key: "RIDER_NOTIFIED", label: "Rider Notified" },
      { key: "ACCEPTED", label: "Accepted" },
      { key: "ARRIVED_AT_PHARMACY", label: "Arrived at Shop" },
      { key: "PICKED_UP", label: "Picked Up" },
      { key: "DELIVERED", label: "Delivered" },
    ];

    const getStatusIndex = (currentStatus) => {
      if (currentStatus === "PENDING_ASSIGNMENT") return -1;
      if (currentStatus === "RIDER_NOTIFIED") return 0;
      if (currentStatus === "ACCEPTED") return 1;
      if (currentStatus === "ARRIVED_AT_PHARMACY") return 2;
      if (["PICKED_UP", "EN_ROUTE"].includes(currentStatus)) return 3;
      if (["ARRIVED_AT_CUSTOMER", "DELIVERED"].includes(currentStatus)) return 4;
      return 0;
    };

    const activeIndex = getStatusIndex(delivery.status);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Rider card */}
        <div className="lg:col-span-1 space-y-4">
          <HorizontalCard className="border-l-4 border-l-[#05015A] bg-white shadow-sm">
            <SectionTitle icon={UserCheck} title="Assigned Rider" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#05015A]/10 flex items-center justify-center">
                  <User size={18} className="text-[#05015A]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">
                    {delivery.rider?.full_name || "Rahul Kumar (Team Rider)"}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {delivery.rider?.phone || "+91 90821 21321"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Rider Class:</span>
                  <span className="font-semibold text-[#05015A]">
                    {delivery.rider?.rider_type === "TEAM" ? "Fixed salary (Team)" : "Per order (Independent)"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Telemetry status:</span>
                  <span className={`font-semibold ${delivery.rider?.is_online ? "text-emerald-600" : "text-gray-400"}`}>
                    {delivery.rider?.is_online ? "Active Online" : "Offline / Unreachable"}
                  </span>
                </div>
              </div>

              {["ACCEPTED", "ARRIVED_AT_PHARMACY", "PENDING_ASSIGNMENT", "RIDER_NOTIFIED"].includes(delivery.status) && (
                <button
                  onClick={() => setForceReassign(true)}
                  className="w-full mt-2 py-2 text-center border border-dashed border-gray-200 hover:border-[#05015A]/30 text-[11px] font-bold text-gray-600 hover:text-[#05015A] bg-gray-50/50 hover:bg-[#05015A]/5 rounded-lg transition-all"
                >
                  Reassign Delivery Partner
                </button>
              )}
            </div>
          </HorizontalCard>

          {/* Secure Handover OTP Overrides card */}
          <HorizontalCard className="bg-amber-50/40 border border-amber-100/60 shadow-sm">
            <SectionTitle icon={Key} title="Secure Handover Verification" />
            <p className="text-[11px] text-amber-700/80 leading-normal mb-3">
              If riders face tech or connectivity issues, give them these PIN codes manually to verify the handovers.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-2.5 border border-amber-100 shadow-sm text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pickup OTP (Shop)</p>
                <p className="text-lg font-extrabold text-amber-800 font-mono mt-1 tracking-widest">
                  {order.pickup_otp || "—"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-amber-100 shadow-sm text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Delivery OTP (User)</p>
                <p className="text-lg font-extrabold text-emerald-800 font-mono mt-1 tracking-widest">
                  {order.delivery_otp || "—"}
                </p>
              </div>
            </div>
          </HorizontalCard>
        </div>

        {/* Live Stepper tracker */}
        <div className="lg:col-span-2">
          <HorizontalCard className="bg-white shadow-sm h-full flex flex-col justify-between">
            <div>
              <SectionTitle icon={Compass} title="Live Logistics Milestones" />
              <div className="relative mt-6 pl-4 space-y-6">
                {milestones.map((step, idx) => {
                  const completed = idx <= activeIndex;
                  const active = idx === activeIndex;

                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      {/* Connecting Line */}
                      {idx < milestones.length - 1 && (
                        <div
                          className={`absolute left-3 top-6 w-0.5 h-12 -translate-x-1/2 ${
                            idx < activeIndex ? "bg-emerald-500" : "bg-gray-100"
                          }`}
                        />
                      )}

                      {/* Dot icon indicator */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 border transition-all ${
                          completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : active
                            ? "bg-white border-[#05015A] text-[#05015A]"
                            : "bg-white border-gray-200 text-gray-300"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="pt-0.5">
                        <h5 className={`text-xs font-bold ${completed ? "text-gray-800" : "text-gray-400"}`}>
                          {step.label}
                        </h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {idx === 0 && delivery.assigned_at && `Assigned: ${fmtTime(delivery.assigned_at)}`}
                          {idx === 1 && delivery.accepted_at && `Rider accepted: ${fmtTime(delivery.accepted_at)}`}
                          {idx === 2 && delivery.arrived_at_pharmacy_at && `Arrived at shop: ${fmtTime(delivery.arrived_at_pharmacy_at)}`}
                          {idx === 3 && delivery.picked_up_at && `Picked up & driving: ${fmtTime(delivery.picked_up_at)}`}
                          {idx === 4 && delivery.delivered_at && `Delivered & completed: ${fmtTime(delivery.delivered_at)}`}

                          {/* Fallbacks if not done yet */}
                          {!completed && idx === 3 && order.status !== "READY_FOR_PICKUP" && (
                            <span className="text-amber-600 font-medium">Waiting for shop to mark READY FOR PICKUP</span>
                          )}
                          {!completed && idx === 3 && order.status === "READY_FOR_PICKUP" && (
                            <span className="text-violet-600 font-medium">Shop ready! Awaiting rider pickup confirmation</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Delivery ID: <span className="font-mono">{delivery.delivery_id}</span></span>
              <span>Attempts: {delivery.assignment_attempts}</span>
            </div>
          </HorizontalCard>
        </div>
      </div>
    );
  }

  // 4. Show Rider Assignment search drawer & List selection
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <SectionTitle
        icon={Truck}
        title="Assign Delivery Partner"
        action={
          <button
            onClick={fetchRiders}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="Refresh Rider List"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 mt-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search active riders by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTypeFilter("TEAM")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              typeFilter === "TEAM" ? "bg-white text-[#05015A] shadow-sm" : "text-gray-500"
            }`}
          >
            Team Riders (Fixed Salary)
          </button>
          <button
            onClick={() => setTypeFilter("INDEPENDENT")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              typeFilter === "INDEPENDENT" ? "bg-white text-[#05015A] shadow-sm" : "text-gray-500"
            }`}
          >
            Independent Partners
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#05015A] mb-2" />
          <p className="text-xs text-gray-400">Searching active delivery partners nearby...</p>
        </div>
      ) : riders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
          <Search size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-600">No active delivery partners found</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Make sure filters match online onboarding riders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {riders.map((rider) => {
            const hasOngoing = rider.has_active_delivery;
            const isOnline = rider.is_online;
            const isBusy = hasOngoing || !isOnline;

            return (
              <div
                key={rider.rider_id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isBusy
                    ? "bg-gray-50/70 border-gray-100 opacity-60"
                    : "bg-white border-gray-100 hover:border-[#05015A]/30 hover:shadow-sm"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-800 truncate">{rider.full_name}</h4>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{rider.phone}</p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {rider.distance_to_pharmacy_km != null ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">
                        <Navigation size={9} />
                        {rider.distance_to_pharmacy_km} km away
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">GPS missing</span>
                    )}

                    {hasOngoing ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                        Busy: {rider.active_delivery_status?.replace(/_/g, " ")}
                      </span>
                    ) : (
                      isOnline && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                          Ready
                        </span>
                      )
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleAssign(rider.rider_id, rider.full_name)}
                  disabled={isBusy || assigningId != null}
                  className="flex-shrink-0 px-3 py-1.5 text-[11px] font-extrabold rounded-lg bg-[#05015A] text-white hover:bg-[#05015A]/90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
                >
                  {assigningId === rider.rider_id ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Truck size={10} />
                  )}
                  {assigningId === rider.rider_id ? "Assigning" : "Assign"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {forceReassign && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setForceReassign(false)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 hover:underline"
          >
            Keep current rider
          </button>
        </div>
      )}
    </div>
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

  // Handle SSE Delivery status changes to automatically update the Modal view dynamically
  useEffect(() => {
    const handleSseUpdate = () => {
      loadOrder();
    };

    window.addEventListener("sse-delivery-status-changed", handleSseUpdate);
    window.addEventListener("sse-marketplace-order-status-changed", handleSseUpdate);

    return () => {
      window.removeEventListener("sse-delivery-status-changed", handleSseUpdate);
      window.removeEventListener("sse-marketplace-order-status-changed", handleSseUpdate);
    };
  }, [loadOrder]);

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
              {/* ── Shop & Branch ── */}
              <HorizontalCard>
                <SectionTitle
                  icon={Store}
                  title="Shop & Branch"
                  action={
                    <CopyLocationButton
                      latitude={order.branch?.latitude}
                      longitude={order.branch?.longitude}
                      onToast={onToast}
                    />
                  }
                />
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

              {/* ── Customer ── */}
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

              {/* ── Delivery Address ── */}
              <HorizontalCard>
                <SectionTitle
                  icon={MapPin}
                  title="Delivery Address"
                  action={
                    <CopyLocationButton
                      latitude={order.delivery_address?.latitude}
                      longitude={order.delivery_address?.longitude}
                      onToast={onToast}
                    />
                  }
                />
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

          {/* New Tab View Panel */}
          {order && activeTab === "delivery" && (
            <DeliveryTrackingPanel
              order={order}
              onUpdated={handleUpdated}
              onToast={onToast}
            />
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