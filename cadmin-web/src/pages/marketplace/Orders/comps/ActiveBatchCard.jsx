// cadmin-web/src/pages/marketplace/Orders/comps/ActiveBatchCard.jsx (do not remove this comment)
import { useState } from "react";
import {
  Truck,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Package,
} from "lucide-react";
import { removeOrderFromBatch } from "../../../../api/cadminDelivery";

const STATUS_BADGE = {
  PENDING_ASSIGNMENT: {
    label: "Pending",
    cls: "bg-gray-100 text-gray-600",
  },
  RIDER_NOTIFIED: {
    label: "Notified",
    cls: "bg-amber-100 text-amber-700",
  },
  ACCEPTED: { label: "Accepted", cls: "bg-blue-100 text-blue-700" },
  ARRIVED_AT_PHARMACY: {
    label: "At Pharmacy",
    cls: "bg-violet-100 text-violet-700",
  },
  PICKED_UP: { label: "Picked Up", cls: "bg-indigo-100 text-indigo-700" },
  EN_ROUTE: { label: "En Route", cls: "bg-indigo-100 text-indigo-700" },
  ARRIVED_AT_CUSTOMER: {
    label: "At Customer",
    cls: "bg-sky-100 text-sky-700",
  },
  DELIVERED: {
    label: "Delivered",
    cls: "bg-emerald-100 text-emerald-700",
  },
};

const REMOVABLE_STATUSES = [
  "PENDING_ASSIGNMENT",
  "RIDER_NOTIFIED",
  "ACCEPTED",
  "ARRIVED_AT_PHARMACY",
];

const ActiveBatchCard = ({ batch, onAddOrders, onChanged, onOrderClick, toast }) => {
  const [expanded, setExpanded] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (deliveryId, orderNumber) => {
    if (
      !window.confirm(
        `Remove order ${orderNumber} from this batch? It will reappear in the unassigned list.`,
      )
    )
      return;

    setRemovingId(deliveryId);
    try {
      await removeOrderFromBatch(deliveryId);
      toast.success("Removed", `Order ${orderNumber} removed from batch`);
      onChanged?.();
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Could not remove order",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const progressPct =
    batch.order_count > 0
      ? Math.round((batch.delivered_count / batch.order_count) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:border-[#05015A]/30 transition-colors">
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/60"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-[#05015A]/10 flex items-center justify-center flex-shrink-0">
            <Truck size={14} className="text-[#05015A]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900 truncate">
                {batch.rider_name || "Unassigned"}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {batch.batch_group_id.slice(0, 12)}…
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Phone size={9} />
                {batch.rider_phone || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Package size={9} />
                {batch.order_count} orders
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Progress stats */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-600">
                {batch.delivered_count}/{batch.order_count}
              </div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                Delivered
              </div>
            </div>
            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddOrders();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#05015A] bg-[#05015A]/10 hover:bg-[#05015A]/15 border border-[#05015A]/20 transition-colors"
            title="Add more orders to this batch"
          >
            <Plus size={11} />
            Add
          </button>

          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded order list */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 space-y-1.5">
          {batch.orders.map((o) => {
            const status = STATUS_BADGE[o.delivery_status] || {
              label: o.delivery_status,
              cls: "bg-gray-100 text-gray-600",
            };
            const canRemove = REMOVABLE_STATUSES.includes(o.delivery_status);
            const isRemoving = removingId === o.delivery_id;

            return (
              <div
                key={o.delivery_id}
                onClick={() => onOrderClick?.(o.order_id)}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100 cursor-pointer hover:bg-[#05015A]/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {o.delivery_status === "DELIVERED" ? (
                    <CheckCircle2
                      size={14}
                      className="text-emerald-500 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 font-mono">
                        {o.order_number}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      {o.customer_name} · {o.branch_name}
                    </p>
                  </div>
                </div>
                {canRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(o.delivery_id, o.order_number); }}
                    disabled={isRemoving}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    title="Remove from batch"
                  >
                    {isRemoving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveBatchCard;