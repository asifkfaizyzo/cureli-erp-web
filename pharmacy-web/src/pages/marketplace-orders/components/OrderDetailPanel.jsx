// pharmacy-web/src/pages/marketplace-orders/components/OrderDetailPanel.jsx (do not remove this comment)

import { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  User,
  Users,
  MapPin,
  Package,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Download,
  RefreshCw,
  KeyRound,
  Bike,
  Phone,
  Navigation,
  Store,
  AlertTriangle,
  Copy,
  Check,
  IndianRupee,
} from "lucide-react";

// ── Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED: {
    label: "Placed",
    color: "bg-amber-500/25 text-amber-200 border-amber-400/40",
    dot: "bg-amber-400",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-blue-500/25 text-blue-200 border-blue-400/40",
    dot: "bg-blue-400",
  },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup",
    color: "bg-green-500/25 text-green-200 border-green-400/40",
    dot: "bg-green-400",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-white/10 text-white/70 border-white/15",
    dot: "bg-white/50",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-500/25 text-red-200 border-red-400/40",
    dot: "bg-red-400",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-white/8 text-white/50 border-white/15",
    dot: "bg-white/40",
  },
};

const DELIVERY_STATUS_LABELS = {
  PENDING_ASSIGNMENT: "Pending Assignment",
  RIDER_NOTIFIED: "Rider Notified",
  ACCEPTED: "Accepted by Rider",
  ARRIVED_AT_PHARMACY: "At Pharmacy",
  PICKED_UP: "Picked Up",
  EN_ROUTE: "En Route",
  ARRIVED_AT_CUSTOMER: "At Customer",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

const EXPECTED_DELIVERY = {
  COMPLETED: ["DELIVERED"],
  CANCELLED: ["CANCELLED", "FAILED"],
  REJECTED: ["FAILED", "CANCELLED"],
};

const SEX_LABEL = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

// ── Helpers ──────────────────────────────────────────────────────────

function formatPrice(v) {
  const n = Number(v);
  return v == null || isNaN(n) ? "0.00" : n.toFixed(2);
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeOnly(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPhone(phone) {
  if (!phone) return "—";
  const c = phone.replace(/\D/g, "");
  if (c.length === 10) return `+91 ${c.slice(0, 5)} ${c.slice(5)}`;
  if (c.length === 12 && c.startsWith("91"))
    return `+91 ${c.slice(2, 7)} ${c.slice(7)}`;
  return phone;
}

function hasCAdminOverride(statusHistory) {
  if (!Array.isArray(statusHistory) || statusHistory.length === 0) return false;
  return statusHistory.some((h) => h.changed_by_type === "cadmin");
}

function isOutOfSync(orderStatus, deliveryStatus) {
  if (!deliveryStatus) return false;
  const expected = EXPECTED_DELIVERY[orderStatus];
  if (!expected) return false;
  return !expected.includes(deliveryStatus);
}

// ── Primitives ───────────────────────────────────────────────────────

const SectionCard = ({
  title,
  icon: Icon,
  children,
  accent = "default",
  compact = false,
}) => {
  const styles = {
    default: "bg-white/[0.04] border-white/[0.08]",
    highlight: "bg-indigo-500/[0.06] border-indigo-400/20",
    warning: "bg-amber-500/[0.06] border-amber-400/20",
    danger: "bg-red-500/[0.06] border-red-400/20",
  };
  const iconClr =
    accent === "highlight"
      ? "text-indigo-300"
      : accent === "danger"
        ? "text-red-300"
        : accent === "warning"
          ? "text-amber-300"
          : "text-white/60";
  const titleClr =
    accent === "highlight"
      ? "text-indigo-200"
      : accent === "danger"
        ? "text-red-200"
        : accent === "warning"
          ? "text-amber-200"
          : "text-white/60";

  return (
    <div
      className={`${styles[accent]} border rounded-lg ${compact ? "p-3" : "p-3.5"} space-y-2`}
    >
      {title && (
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={iconClr} />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${titleClr}`}
          >
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-[11px] text-white/50 flex-shrink-0 font-medium">
      {label}
    </span>
    <span
      className={`text-[11px] text-white/90 text-right font-medium ${mono ? "font-mono" : ""}`}
    >
      {value || "—"}
    </span>
  </div>
);

const StickySectionHeader = ({ icon: Icon, label }) => (
  <div className="sticky top-0 z-[5] bg-[#0a0825]/95 backdrop-blur-sm py-1.5 -mx-1 px-1 flex items-center gap-1.5 border-b border-white/[0.06] mb-2">
    <Icon size={11} className="text-white/50" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
      {label}
    </span>
  </div>
);

// ── Copyable Phone ───────────────────────────────────────────────────

const CopyablePhone = ({ phone }) => {
  const [copied, setCopied] = useState(false);
  const formatted = formatPhone(phone);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(phone?.replace(/\D/g, "") || "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <span className="inline-flex items-center gap-1.5 group">
      <span className="text-[11px] text-white/90 font-mono font-medium select-all">
        {formatted}
      </span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/[0.10]"
        title="Copy number"
      >
        {copied ? (
          <Check size={10} className="text-emerald-400" />
        ) : (
          <Copy size={10} className="text-white/50" />
        )}
      </button>
    </span>
  );
};

// ── Delivery Progress ────────────────────────────────────────────────

const DELIVERY_MILESTONES = [
  { key: "accepted_at", label: "Rider Assigned", icon: Bike },
  { key: "arrived_at_pharmacy_at", label: "At Pharmacy", icon: Store },
  { key: "picked_up_at", label: "Picked Up", icon: Package },
  { key: "arrived_at_customer_at", label: "At Customer", icon: Navigation },
  { key: "delivered_at", label: "Delivered", icon: CheckCircle },
];

function DeliveryProgressTracker({ delivery }) {
  if (!delivery) return null;

  if (delivery.status === "PENDING_ASSIGNMENT") {
    return (
      <SectionCard
        title="Delivery Progress"
        icon={Bike}
        accent="warning"
        compact
      >
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={13} className="text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-200">
              Waiting for Rider Assignment
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              {delivery.rider_name
                ? "Previous rider was unassigned. Awaiting new assignment."
                : "No rider assigned yet. CAdmin will assign a delivery partner."}
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  if (!delivery.status) return null;

  const timestamps = delivery.timestamps || {};
  const statusOrder = [
    "ACCEPTED",
    "ARRIVED_AT_PHARMACY",
    "PICKED_UP",
    "EN_ROUTE",
    "ARRIVED_AT_CUSTOMER",
    "DELIVERED",
  ];
  const currentIdx = statusOrder.indexOf(delivery.status);

  return (
    <SectionCard
      title="Delivery Progress"
      icon={Bike}
      accent="highlight"
      compact
    >
      {/* Rider Info Row */}
      {delivery.rider_name && (
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
            <Bike size={13} className="text-blue-200" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {delivery.rider_name}
            </p>
            <p className="text-[10px] text-white/50 font-medium">
              {delivery.rider_vehicle || "Cureli Rider"}
            </p>
          </div>
          {delivery.rider_phone && (
            <div className="flex-shrink-0">
              <CopyablePhone phone={delivery.rider_phone} />
            </div>
          )}
        </div>
      )}

      {/* Compact Milestone Timeline */}
      <div className="space-y-0">
        {DELIVERY_MILESTONES.map((milestone, idx) => {
          const isComplete = timestamps[milestone.key] != null;
          const isCurrent =
            !isComplete &&
            idx <= currentIdx + 1 &&
            idx ===
              DELIVERY_MILESTONES.findIndex((m) => timestamps[m.key] == null);
          const Icon = milestone.icon;

          return (
            <div key={milestone.key} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    isComplete
                      ? "bg-emerald-500/20 border-emerald-400/40"
                      : isCurrent
                        ? "bg-blue-500/20 border-blue-400/40 animate-pulse"
                        : "bg-white/[0.03] border-white/[0.08]"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle size={12} className="text-emerald-300" />
                  ) : (
                    <Icon
                      size={11}
                      className={isCurrent ? "text-blue-300" : "text-white/30"}
                    />
                  )}
                </div>
                {idx < DELIVERY_MILESTONES.length - 1 && (
                  <div
                    className={`w-0.5 h-5 ${isComplete ? "bg-emerald-400/30" : "bg-white/[0.08]"}`}
                  />
                )}
              </div>
              <div className="flex-1 pb-2 pt-0.5">
                <p
                  className={`text-[11px] font-bold ${isComplete ? "text-emerald-200" : isCurrent ? "text-blue-200" : "text-white/35"}`}
                >
                  {milestone.label}
                </p>
                {isComplete && timestamps[milestone.key] && (
                  <p className="text-[9px] text-white/45 mt-0.5 font-medium">
                    {formatTimeOnly(timestamps[milestone.key])}
                  </p>
                )}
                {isCurrent && (
                  <p className="text-[9px] text-blue-300/70 mt-0.5 font-medium">
                    In progress...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Pickup PIN ───────────────────────────────────────────────────────

function PickupPinCard({ pin, isReady, delivery }) {
  if (!pin) return null;
  const ds = delivery?.status;
  const isPickedUp =
    ds &&
    ["PICKED_UP", "EN_ROUTE", "ARRIVED_AT_CUSTOMER", "DELIVERED"].includes(ds);

  if (isPickedUp) {
    return (
      <div className="rounded-lg p-3 border bg-emerald-500/[0.08] border-emerald-400/20 flex items-center gap-2.5">
        <CheckCircle size={14} className="text-emerald-300 flex-shrink-0" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            Handover Complete
          </span>
          <p className="text-[10px] text-emerald-300/70 mt-0.5">
            {ds === "DELIVERED"
              ? "Delivered to customer"
              : ds === "EN_ROUTE"
                ? "Rider en route to customer"
                : "Rider has collected the order"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg p-3 border ${isReady ? "bg-emerald-500/[0.08] border-emerald-400/20" : "bg-white/[0.04] border-white/[0.08]"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound
            size={12}
            className={isReady ? "text-emerald-300" : "text-white/60"}
          />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${isReady ? "text-emerald-200" : "text-white/60"}`}
          >
            Pickup PIN
          </span>
        </div>
        <span className="text-xl font-mono font-bold tracking-[0.2em] text-white">
          {pin}
        </span>
      </div>
      {isReady && (
        <p className="text-[9px] text-emerald-300/60 mt-1 font-medium">
          {ds === "ARRIVED_AT_PHARMACY"
            ? "Rider at your location — share PIN on handover"
            : "Share with delivery rider on pickup"}
        </p>
      )}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────

const OrderDetailPanel = ({
  orderId,
  orderDetail,
  isLoading,
  error,
  actionLoading,
  actionError,
  onClose,
  onBillAndAccept,
  onOpenReject,
  onMarkReady,
  onComplete,
  onGetPrescriptionUrl,
  onGetInvoiceUrl,
  onRegenerateInvoice,
}) => {
  const [loadingRxId, setLoadingRxId] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoicePending, setInvoicePending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [orderId]);

  const handleOpenRx = useCallback(
    async (rxId) => {
      setLoadingRxId(rxId);
      try {
        const url = await onGetPrescriptionUrl(orderId, rxId);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        setLoadingRxId(null);
      }
    },
    [orderId, onGetPrescriptionUrl],
  );

  const handleDownloadInvoice = useCallback(async () => {
    setInvoiceLoading(true);
    setInvoicePending(false);
    try {
      const r = await onGetInvoiceUrl(orderId);
      if (r?.url) window.open(r.url, "_blank", "noopener,noreferrer");
      else if (r?.pending) setInvoicePending(true);
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, onGetInvoiceUrl]);

  const handleRegenerate = useCallback(async () => {
    if (!onRegenerateInvoice) return;
    setRegenerating(true);
    setInvoicePending(false);
    try {
      if (await onRegenerateInvoice(orderId)) {
        setTimeout(async () => {
          const r = await onGetInvoiceUrl(orderId);
          if (r?.url) window.open(r.url, "_blank", "noopener,noreferrer");
          else setInvoicePending(true);
        }, 3000);
      }
    } finally {
      setRegenerating(false);
    }
  }, [orderId, onRegenerateInvoice, onGetInvoiceUrl]);

  // ── Empty / Loading / Error States ──
  if (!orderId)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
          <Package size={22} className="text-white/40" />
        </div>
        <p className="text-sm text-white/50 text-center font-medium">
          Select an order to view details
        </p>
      </div>
    );

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={22} className="animate-spin text-white/40" />
        <p className="text-xs text-white/50 font-medium">Loading order...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <p className="text-sm text-red-300 text-center">{error}</p>
      </div>
    );

  if (!orderDetail) return null;

  const {
    order_number,
    status,
    customer_name,
    customer_phone,
    delivery_address,
    items,
    prescriptions,
    total_amount,
    subtotal,
    commission_rate,
    commission_amount,
    pharmacy_earning,
    service_charge,
    delivery_fee,
    km_surcharge,
    tip,
    requires_prescription,
    notes,
    rejection_reason,
    rejection_reason_other,
    placed_at,
    accepted_at,
    ready_at,
    completed_at,
    rejected_at,
    cancelled_at,
    payment_method,
    payment_status,
    patient,
    pickup_otp,
    delivery,
    status_history,
  } = orderDetail;

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PLACED;
  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(status);
  const deliveryMode = delivery?.delivery_mode || "CURELI";
  const canBillAndAccept = status === "PLACED";
  const canMarkReady = status === "ACCEPTED";
  const canComplete = status === "READY_FOR_PICKUP" && deliveryMode === "SELF";
  const hasInvoice = ["READY_FOR_PICKUP", "COMPLETED"].includes(status);
  const showPickupPin =
    !!pickup_otp &&
    (status === "ACCEPTED" || status === "READY_FOR_PICKUP") &&
    !isTerminal;
  const outOfSync = isOutOfSync(status, delivery?.status);
  const cadminOverride = hasCAdminOverride(status_history);

  // ── Commission / Earning flags ──
  const hasCommissionSnapshot =
    commission_amount !== null && commission_amount !== undefined;
  const earningAmount = Number(pharmacy_earning ?? subtotal ?? 0);
  const commissionRateNum = Number(commission_rate ?? 0);
  const commissionAmountNum = Number(commission_amount ?? 0);

  const hasActions =
    hasInvoice ||
    (!isTerminal && (canBillAndAccept || canMarkReady || canComplete));

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* ── STICKY COMPACT HEADER WITH ACTIONS Beside metadata ── */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b border-white/[0.08] bg-white/[0.03] z-10 rounded-t-xl">
        {/* Left Side: Order & Status Metadata */}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-white">{order_number}</h2>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusCfg.color}`}
            >
              <span className={`w-1 h-1 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {delivery?.status && (
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                  outOfSync
                    ? "bg-red-500/15 text-red-300 border-red-400/30"
                    : "bg-white/[0.05] text-white/50 border-white/[0.10]"
                }`}
              >
                {DELIVERY_STATUS_LABELS[delivery.status] || delivery.status}
              </span>
            )}
          </div>
          {placed_at && (
            <span className="text-[10px] text-white/40 font-medium">
              {formatDateTime(placed_at)}
            </span>
          )}
        </div>

        {/* Right Side: Header Integrated Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasActions && (
            <div className="flex items-center gap-1.5">
              {hasInvoice &&
                onGetInvoiceUrl &&
                (invoicePending ? (
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded text-amber-200 text-[10px] font-bold">
                    <Clock size={10} className="animate-pulse" />
                    <span>Invoice generating</span>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="ml-1 p-0.5 rounded bg-white/10 hover:bg-white/20 transition-all"
                    >
                      {regenerating ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <RefreshCw size={10} />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={invoiceLoading}
                    className="h-7 px-2.5 rounded text-[10px] font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] text-white/90 transition-all flex items-center gap-1"
                  >
                    {invoiceLoading ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Download size={10} />
                    )}
                    Invoice PDF
                  </button>
                ))}

              {!isTerminal && (
                <div className="flex items-center gap-1">
                  {canBillAndAccept && (
                    <>
                      <button
                        onClick={() => onBillAndAccept(orderDetail.order_id)}
                        disabled={actionLoading}
                        className="h-7 px-2.5 rounded text-[10px] font-bold bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-100 transition-all flex items-center gap-1"
                      >
                        {actionLoading ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={10} />
                        )}
                        Bill & Accept
                      </button>
                      <button
                        onClick={() => onOpenReject(orderDetail.order_id)}
                        disabled={actionLoading}
                        className="h-7 px-2.5 rounded text-[10px] font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-100 transition-all flex items-center gap-1"
                      >
                        <XCircle size={10} /> Reject
                      </button>
                    </>
                  )}
                  {canMarkReady && (
                    <button
                      onClick={() => onMarkReady(orderDetail.order_id)}
                      disabled={actionLoading}
                      className="h-7 px-2.5 rounded text-[10px] font-bold bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-100 transition-all flex items-center gap-1"
                    >
                      {actionLoading ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <CheckCircle size={10} />
                      )}
                      Mark Ready
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={() => onComplete(orderDetail.order_id)}
                      disabled={actionLoading}
                      className="h-7 px-2.5 rounded text-[10px] font-bold bg-white/[0.10] hover:bg-white/[0.15] border border-white/[0.12] text-white transition-all flex items-center gap-1"
                    >
                      {actionLoading ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <CheckCircle size={10} />
                      )}
                      Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {actionError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/20 text-xs text-red-200">
            <AlertCircle size={12} className="flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* Admin Override Banner */}
        {cadminOverride && (
          <div
            className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[10px] font-semibold leading-relaxed ${
              outOfSync
                ? "bg-red-500/10 border-red-400/25 text-red-200"
                : "bg-indigo-500/10 border-indigo-400/20 text-indigo-200"
            }`}
          >
            {outOfSync ? (
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            )}
            {outOfSync
              ? `Order status (${status.replace(/_/g, " ")}) and delivery status (${DELIVERY_STATUS_LABELS[delivery?.status] || delivery?.status}) are out of sync. CAdmin may have manually overridden this order.`
              : "This order was manually modified by a Cureli admin. Some statuses may differ from the normal flow."}
          </div>
        )}

        {/* Pickup PIN */}
        {showPickupPin && (
          <PickupPinCard
            pin={pickup_otp}
            isReady={status === "READY_FOR_PICKUP"}
            delivery={delivery}
          />
        )}

        {/* Delivery Progress */}
        {delivery && <DeliveryProgressTracker delivery={delivery} />}

        {/* Prescriptions */}
        {requires_prescription && prescriptions?.length > 0 && (
          <SectionCard title="Prescriptions" icon={FileText} compact>
            <div className="flex flex-wrap gap-1.5">
              {prescriptions.map((p) => (
                <button
                  key={p.prescription_id}
                  onClick={() => handleOpenRx(p.prescription_id)}
                  disabled={loadingRxId === p.prescription_id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-[11px] text-white/85 font-medium transition-colors disabled:opacity-50"
                >
                  {loadingRxId === p.prescription_id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <FileText size={11} />
                  )}
                  {p.original_name}
                  <ExternalLink size={9} className="text-white/40" />
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── 2-COLUMN GRID (xl+) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {/* LEFT COLUMN */}
          <div className="space-y-3">
            <StickySectionHeader icon={User} label="Customer & Delivery" />

            <SectionCard title="Customer" icon={User} compact>
              <InfoRow label="Name" value={customer_name} />
              <InfoRow
                label="Phone"
                value={<CopyablePhone phone={customer_phone} />}
              />
            </SectionCard>

            {patient &&
              (patient.name || patient.age !== null || patient.sex) && (
                <SectionCard title="Patient" icon={Users} compact>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/90 font-semibold">
                      {patient.name || customer_name}
                    </span>
                    {patient.is_self && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-white/[0.10] text-white/70 border border-white/[0.12] uppercase">
                        Self
                      </span>
                    )}
                  </div>
                  {[
                    patient.sex
                      ? (SEX_LABEL[patient.sex] ?? patient.sex)
                      : null,
                    patient.age !== null ? `${patient.age} yrs` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") && (
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {[
                        patient.sex
                          ? (SEX_LABEL[patient.sex] ?? patient.sex)
                          : null,
                        patient.age !== null ? `${patient.age} yrs` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </SectionCard>
              )}

            {delivery_address && (
              <SectionCard title="Delivery Address" icon={MapPin} compact>
                <p className="text-[11px] text-white/85 leading-relaxed font-medium">
                  {[
                    delivery_address.address_line_1,
                    delivery_address.address_line_2,
                    delivery_address.landmark,
                    delivery_address.city,
                    delivery_address.state,
                    delivery_address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {delivery_address.recipient_name && (
                  <InfoRow
                    label="Recipient"
                    value={delivery_address.recipient_name}
                  />
                )}
                {delivery_address.recipient_phone && (
                  <InfoRow
                    label="Phone"
                    value={
                      <CopyablePhone phone={delivery_address.recipient_phone} />
                    }
                  />
                )}
              </SectionCard>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3">
            <StickySectionHeader icon={Package} label="Items & Earnings" />

            <SectionCard title="Order Items" icon={Package} compact>
              <div className="space-y-2">
                {items?.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white font-semibold truncate">
                        {item.medicine_name}
                      </p>
                      <p className="text-[10px] text-white/50 mt-0.5">
                        {[item.brand, item.pack_size]
                          .filter(Boolean)
                          .join(" · ")}{" "}
                        · Qty: {item.quantity} × ₹{formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-white flex-shrink-0">
                      ₹{formatPrice(item.line_total)}
                    </span>
                  </div>
                ))}

                {/* ── PHARMACY EARNING BREAKDOWN ── */}
                <div className="pt-2 border-t border-white/[0.08] space-y-1">
                  <InfoRow
                    label="Medicine Subtotal"
                    value={`₹${formatPrice(subtotal)}`}
                  />

                  {hasCommissionSnapshot ? (
                    <>
                      <InfoRow
                        label={`Commission (${commissionRateNum}%)`}
                        value={
                          <span className="text-orange-300">
                            −₹{formatPrice(commissionAmountNum)}
                          </span>
                        }
                      />
                      <div className="flex justify-between items-center pt-1.5 mt-1 px-2 py-1.5 rounded-md bg-emerald-500/[0.10] border border-emerald-400/20">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee size={12} className="text-emerald-300" />
                          <span className="text-xs font-bold text-emerald-200">
                            Your Earning
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-300">
                          ₹{formatPrice(earningAmount)}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/35 text-right mt-0.5 font-medium">
                        Settled weekly via payout
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center pt-1.5 mt-1 px-2 py-1.5 rounded-md bg-emerald-500/[0.10] border border-emerald-400/20">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee size={12} className="text-emerald-300" />
                          <span className="text-xs font-bold text-emerald-200">
                            Your Earning
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-300">
                          ₹{formatPrice(earningAmount)}
                        </span>
                      </div>
                      <p className="text-[9px] text-amber-300/60 text-right mt-0.5 italic font-medium">
                        (commission applied at settlement)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </SectionCard>

            {notes && (
              <SectionCard title="Notes" icon={FileText} compact>
                <p className="text-[11px] text-white/85 leading-relaxed">
                  {notes}
                </p>
              </SectionCard>
            )}

            {status === "REJECTED" && rejection_reason && (
              <SectionCard
                title="Rejection"
                icon={XCircle}
                accent="danger"
                compact
              >
                <InfoRow
                  label="Reason"
                  value={rejection_reason.replace(/_/g, " ")}
                />
                {rejection_reason_other && (
                  <InfoRow label="Details" value={rejection_reason_other} />
                )}
              </SectionCard>
            )}

            <SectionCard title="Timeline" icon={Clock} compact>
              <div className="space-y-1">
                {placed_at && (
                  <InfoRow
                    label="Placed"
                    value={formatDateTime(placed_at)}
                    mono
                  />
                )}
                {accepted_at && (
                  <InfoRow
                    label="Accepted"
                    value={formatDateTime(accepted_at)}
                    mono
                  />
                )}
                {ready_at && (
                  <InfoRow
                    label="Ready"
                    value={formatDateTime(ready_at)}
                    mono
                  />
                )}
                {completed_at && (
                  <InfoRow
                    label="Completed"
                    value={formatDateTime(completed_at)}
                    mono
                  />
                )}
                {rejected_at && (
                  <InfoRow
                    label="Rejected"
                    value={formatDateTime(rejected_at)}
                    mono
                  />
                )}
                {cancelled_at && (
                  <InfoRow
                    label="Cancelled"
                    value={formatDateTime(cancelled_at)}
                    mono
                  />
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPanel;
