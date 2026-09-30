// cadmin-web/src/pages/marketplace/Orders/comps/tabs/StatusTab.jsx (do not remove this comment)
import { useState } from "react";
import {
  Clock,
  Truck,
  AlertTriangle,
  Bike,
  ShoppingBag,
  UserX,
  Loader2,
  Store,
  CheckCircle2,
  CreditCard,
  MapPin,
  User,
  Phone,
  FileText,
  Package,
  Receipt,
} from "lucide-react";
import StatusUpdateBox from "../panels/StatusUpdateBox";
import PaymentStatusBox from "../panels/PaymentStatusBox";
import { unassignRiderFromOrder } from "../../../../../api/cadminDelivery";
import { useToast } from "../../../../../components/common/Toast";

// ── Order Status Config ──────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  ACCEPTED: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  READY_FOR_PICKUP: {
    dot: "bg-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  REJECTED: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  CANCELLED: { dot: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-50" },
};

const DELIVERY_STATUS_CONFIG = {
  PENDING_ASSIGNMENT: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
    label: "Pending Assignment",
  },
  RIDER_NOTIFIED: {
    dot: "bg-sky-400",
    text: "text-sky-700",
    bg: "bg-sky-50",
    label: "Rider Notified",
  },
  ACCEPTED: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    label: "Accepted by Rider",
  },
  ARRIVED_AT_PHARMACY: {
    dot: "bg-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
    label: "At Pharmacy",
  },
  PICKED_UP: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Picked Up",
  },
  EN_ROUTE: {
    dot: "bg-amber-600",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "En Route",
  },
  ARRIVED_AT_CUSTOMER: {
    dot: "bg-emerald-400",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    label: "At Customer",
  },
  DELIVERED: {
    dot: "bg-emerald-600",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    label: "Delivered",
  },
  FAILED: {
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    label: "Failed",
  },
  CANCELLED: {
    dot: "bg-gray-500",
    text: "text-gray-600",
    bg: "bg-gray-50",
    label: "Cancelled",
  },
};

const EXPECTED_DELIVERY_STATUS = {
  COMPLETED: ["DELIVERED"],
  CANCELLED: ["CANCELLED", "FAILED"],
  REJECTED: ["FAILED", "CANCELLED"],
};

function isDeliveryOutOfSync(orderStatus, deliveryStatus) {
  if (!deliveryStatus) return false;
  const expected = EXPECTED_DELIVERY_STATUS[orderStatus];
  if (!expected) return false;
  return !expected.includes(deliveryStatus);
}

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
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Shared UI Primitives ─────────────────────────────────────────────

const Card = ({ children, className = "", accent = null }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden ${
      accent ? `border-l-4 ${accent}` : ""
    } ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, badge = null, action = null }) => (
  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/40">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center flex-shrink-0">
        <Icon size={12} className="text-[#05015A]" />
      </div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </p>
      {badge}
    </div>
    {action}
  </div>
);

const LayerBadge = ({ icon: Icon, label, color }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${color}`}
  >
    <Icon size={9} />
    {label}
  </span>
);

const InfoRow = ({
  label,
  value,
  valueClass = "text-gray-800",
  mono = false,
}) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
      {label}
    </span>
    <span
      className={`text-[11px] font-semibold ${valueClass} ${mono ? "font-mono" : ""}`}
    >
      {value}
    </span>
  </div>
);

// ── Compact Pharmacy Prep (Horizontal Stepper) ───────────────────────

const PharmacyPrepStrip = ({ order }) => {
  const isBilled = !!order.sales_invoice_id;
  const isReady =
    order.status === "READY_FOR_PICKUP" || ["COMPLETED"].includes(order.status);
  const isAccepted = ["ACCEPTED", "READY_FOR_PICKUP", "COMPLETED"].includes(
    order.status,
  );
  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(
    order.status,
  );
  const hasPrescriptions =
    order.requires_prescription && order.prescriptions?.length > 0;

  const steps = [
    { label: "Received", done: true, time: order.placed_at },
    { label: "Accepted", done: isAccepted, time: order.accepted_at },
    { label: "Invoiced", done: isBilled, time: null },
    { label: "Ready", done: isReady, time: order.ready_at },
  ];

  return (
    <Card accent="border-l-blue-400">
      <CardHeader
        icon={Store}
        title="Pharmacy Prep"
        badge={
          <LayerBadge
            icon={Store}
            label="ERP"
            color="bg-blue-50 text-blue-600"
          />
        }
      />
      <div className="p-4">
        {/* Horizontal Stepper */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div
              key={step.label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    step.done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white border-gray-200 text-gray-300"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <span className="text-[9px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <p
                  className={`text-[9px] font-bold uppercase tracking-wide ${
                    step.done ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.done && step.time && (
                  <span className="text-[8px] text-gray-400 font-mono leading-tight text-center">
                    {new Date(step.time).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 -mt-4 ${
                    steps[idx + 1].done ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-3 border-t border-gray-100">
          <InfoRow
            label="Invoice"
            value={isBilled ? order.sales_invoice_id : "Not Generated"}
            valueClass={isBilled ? "text-emerald-600" : "text-gray-400"}
          />
          <InfoRow
            label="Items"
            value={`${order.items?.length || 0} medicines`}
          />
          {hasPrescriptions && (
            <InfoRow
              label="Prescriptions"
              value={`${order.prescriptions.length} uploaded`}
              valueClass="text-violet-600"
            />
          )}
          {isTerminal && (
            <InfoRow
              label="Resolved"
              value={fmtTime(
                order.completed_at || order.rejected_at || order.cancelled_at,
              )}
              valueClass="text-gray-600"
              mono
            />
          )}
        </div>
      </div>
    </Card>
  );
};

// ── Logistics + Payout (Combined Card) ───────────────────────────────

const LogisticsCard = ({ order, onUpdated }) => {
  const toast = useToast();
  const [unassigning, setUnassigning] = useState(false);
  const delivery = order.delivery;
  const orderStatus = order.status;
  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(
    orderStatus,
  );
  const TERMINAL_DELIVERY = ["DELIVERED", "FAILED", "CANCELLED"];

  const canUnassign =
    delivery?.rider_id &&
    !isTerminal &&
    !TERMINAL_DELIVERY.includes(delivery.status);

  const hasDeliveryEarnings =
    delivery &&
    (delivery.total_rider_earning != null ||
      delivery.pickup_fee != null ||
      delivery.drop_fee != null);

  const handleUnassign = async () => {
    if (
      !window.confirm(
        `Unassign ${delivery.rider?.full_name || "rider"} from this order?`,
      )
    )
      return;
    setUnassigning(true);
    try {
      await unassignRiderFromOrder(order.order_id);
      toast.success(
        "Unassigned",
        "Rider removed. Order returned to assignment pool.",
      );
      onUpdated();
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Could not unassign rider.",
      );
    } finally {
      setUnassigning(false);
    }
  };

  if (!delivery) {
    return (
      <Card accent="border-l-gray-200">
        <CardHeader
          icon={Bike}
          title="Logistics & Payout"
          badge={
            <LayerBadge
              icon={Bike}
              label="Rider"
              color="bg-emerald-50 text-emerald-600"
            />
          }
        />
        <div className="p-6 text-center">
          <p className="text-xs text-gray-400 font-medium">
            No delivery record yet
          </p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            Created when order is accepted
          </p>
        </div>
      </Card>
    );
  }

  const dStatus = delivery.status;
  const dCfg = DELIVERY_STATUS_CONFIG[dStatus] || {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
    label: dStatus,
  };
  const outOfSync = isDeliveryOutOfSync(orderStatus, dStatus);

  return (
    <Card accent={outOfSync ? "border-l-red-400" : "border-l-emerald-400"}>
      <CardHeader
        icon={Bike}
        title="Logistics & Payout"
        badge={
          <LayerBadge
            icon={Bike}
            label="Rider"
            color="bg-emerald-50 text-emerald-600"
          />
        }
        action={
          outOfSync && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-extrabold uppercase tracking-wider border border-red-100">
              <AlertTriangle size={9} />
              Out of Sync
            </span>
          )
        }
      />

      <div className="p-4 space-y-3">
        {outOfSync && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
            <p className="text-[10px] text-red-600 font-semibold leading-relaxed">
              Order is <strong>{orderStatus.replace(/_/g, " ")}</strong> but
              delivery is <strong>{dCfg.label}</strong>.
            </p>
          </div>
        )}

        {/* Status Pill */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
            Status
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${dCfg.bg} ${dCfg.text} border-current/10`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dCfg.dot}`} />
            {dCfg.label}
          </span>
        </div>

        {/* Two-column layout: Rider info | Timing */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          {/* Left: Rider */}
          <div className="space-y-2">
            <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">
              Rider Details
            </p>
            {delivery.rider ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <User size={10} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-800 truncate">
                    {delivery.rider.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={10} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[11px] font-mono text-gray-600">
                    {delivery.rider.phone}
                  </span>
                </div>
                {delivery.total_distance_km != null && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-700">
                      {delivery.total_distance_km} km
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">Not assigned</p>
            )}
          </div>

          {/* Right: Timeline */}
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
              Timeline
            </p>
            {delivery.assigned_at && (
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400">Assigned</span>
                <span className="text-[10px] text-gray-600 font-mono">
                  {fmtTime(delivery.assigned_at)}
                </span>
              </div>
            )}
            {delivery.arrived_at_pharmacy_at && (
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400">At Pharmacy</span>
                <span className="text-[10px] text-gray-600 font-mono">
                  {fmtTime(delivery.arrived_at_pharmacy_at)}
                </span>
              </div>
            )}
            {delivery.picked_up_at && (
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400">Picked Up</span>
                <span className="text-[10px] text-gray-600 font-mono">
                  {fmtTime(delivery.picked_up_at)}
                </span>
              </div>
            )}
            {delivery.delivered_at && (
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400">Delivered</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">
                  {fmtTime(delivery.delivered_at)}
                </span>
              </div>
            )}
            {delivery.failed_at && (
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400">Failed</span>
                <span className="text-[10px] text-red-500 font-mono font-bold">
                  {fmtTime(delivery.failed_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {delivery.failure_note && (
          <div className="p-2 rounded bg-red-50/50 border border-red-100">
            <p className="text-[10px] text-red-600 font-medium">
              {delivery.failure_note}
            </p>
          </div>
        )}

        {/* Payout Row */}
        {hasDeliveryEarnings && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Truck size={11} className="text-gray-500" />
              <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider">
                Payout Breakdown
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <InfoRow
                label="Pickup Fee"
                value={fmtAmount(delivery.pickup_fee)}
              />
              <InfoRow label="Drop Fee" value={fmtAmount(delivery.drop_fee)} />
              {delivery.surge_fee > 0 && (
                <InfoRow
                  label="Surge"
                  value={`+${fmtAmount(delivery.surge_fee)}`}
                  valueClass="text-amber-600"
                />
              )}
              <div className="col-span-2 flex justify-between items-center pt-1.5 mt-1 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wide">
                  Total Payout
                </span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {fmtAmount(delivery.total_rider_earning)}
                </span>
              </div>
            </div>
          </div>
        )}

        {!hasDeliveryEarnings && delivery.total_distance_km == null && (
          <div className="pt-3 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">No payout data yet</p>
          </div>
        )}

        {canUnassign && (
          <button
            onClick={handleUnassign}
            disabled={unassigning}
            className="w-full py-2 flex items-center justify-center gap-1.5 border border-dashed border-red-200 hover:border-red-400 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-all disabled:opacity-50"
          >
            {unassigning ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <UserX size={11} />
            )}
            Unassign Rider
          </button>
        )}
      </div>
    </Card>
  );
};

// ── Main StatusTab (Restructured Layout) ─────────────────────────────

const StatusTab = ({ order, onUpdated }) => {
  return (
    <div className="space-y-4">
      {/* ── ROW 1: Customer Status + Payment (side by side, both compact) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute -top-2 left-3 z-10">
            <LayerBadge
              icon={ShoppingBag}
              label="Patient View"
              color="bg-amber-100 text-amber-700 border border-amber-200"
            />
          </div>
          <div className="border-l-4 border-l-amber-400 rounded-xl overflow-hidden">
            <StatusUpdateBox order={order} onUpdated={onUpdated} />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-2 left-3 z-10">
            <LayerBadge
              icon={CreditCard}
              label="Finance"
              color="bg-violet-100 text-violet-700 border border-violet-200"
            />
          </div>
          <div className="border-l-4 border-l-violet-400 rounded-xl overflow-hidden">
            <PaymentStatusBox order={order} onUpdated={onUpdated} />
          </div>
        </div>
      </div>

      {/* ── ROW 2: Pharmacy Prep (horizontal stepper - full width) ── */}
      <PharmacyPrepStrip order={order} />

      {/* ── ROW 3: Logistics + Payout (Combined, full width, dense) ── */}
      <LogisticsCard order={order} onUpdated={onUpdated} />

      {/* ── ROW 4: Audit Timeline ── */}
      <Card>
        <CardHeader icon={Clock} title="Order Audit Timeline" />
        <div className="p-4">
          {!order.status_history || order.status_history.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center font-medium">
              No history recorded yet
            </p>
          ) : (
            <div className="relative pl-2 pt-2 space-y-4">
              {order.status_history.map((h, idx) => {
                const cfg = STATUS_CONFIG[h.to_status] || {
                  dot: "bg-gray-400",
                  text: "text-gray-700",
                  bg: "bg-gray-50",
                };
                return (
                  <div
                    key={h.history_id || idx}
                    className="flex items-start gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${cfg.dot}`}
                      />
                      {idx < order.status_history.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[22px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${cfg.text}`}>
                          {h.to_status?.replace(/_/g, " ")}
                        </span>
                        {h.from_status && (
                          <span className="text-[10px] text-gray-400">
                            (from {h.from_status.replace(/_/g, " ")})
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">
                          by{" "}
                          {h.changed_by_type
                            ? h.changed_by_type.charAt(0).toUpperCase() +
                              h.changed_by_type.slice(1)
                            : "System"}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-[11px] text-gray-600 mt-0.5 font-medium bg-gray-50 rounded px-2 py-0.5 inline-block">
                          {h.reason}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        {fmtTime(h.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StatusTab;
