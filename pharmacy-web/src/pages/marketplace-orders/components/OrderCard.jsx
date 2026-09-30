// pharmacy-web/src/pages/marketplace-orders/components/OrderCard.jsx (do not remove this comment)
import { Clock, FileText, ChevronRight, Bike } from "lucide-react";

const STATUS_CONFIG = {
  PLACED: {
    label: "New",
    color: "bg-amber-500/25 text-amber-200 border-amber-400/40",
    dot: "bg-amber-400",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-blue-500/25 text-blue-200 border-blue-400/40",
    dot: "bg-blue-400",
  },
  READY_FOR_PICKUP: {
    label: "Ready",
    color: "bg-green-500/25 text-green-200 border-green-400/40",
    dot: "bg-green-400",
  },
  COMPLETED: {
    label: "Done",
    color: "bg-white/10 text-white/60 border-white/12",
    dot: "bg-white/40",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-500/25 text-red-200 border-red-400/40",
    dot: "bg-red-400",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-white/8 text-white/40 border-white/10",
    dot: "bg-white/30",
  },
};

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const OrderCard = ({ order, isSelected, onSelect }) => {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PLACED;
  const hasRider = order.has_rider || order.delivery_status;

  return (
    <button
      onClick={() => onSelect(order.order_id)}
      className={`w-full text-left px-3.5 py-2.5 border-b border-white/[0.05] transition-all duration-150 relative
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-inset
        ${isSelected ? "bg-indigo-500/10 border-l-2 border-l-indigo-400" : "hover:bg-white/[0.04] border-l-2 border-l-transparent"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`text-[13px] font-bold ${isSelected ? "text-white" : "text-white/90"}`}
            >
              {order.order_number}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${cfg.color}`}
            >
              <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {order.requires_prescription && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border bg-purple-500/20 text-purple-200 border-purple-400/30">
                <FileText size={8} /> Rx
              </span>
            )}
            {hasRider && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-400/20">
                <Bike size={8} /> Rider
              </span>
            )}
          </div>
          <p className="text-[12px] text-white/80 font-medium truncate">
            {order.customer_name}
          </p>
          <p className="text-[10px] text-white/45 mt-0.5 truncate">
            {order.item_count} item{order.item_count !== 1 ? "s" : ""}
            {order.items?.[0]?.medicine_name
              ? ` · ${order.items[0].medicine_name}`
              : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="text-[13px] font-bold text-white">
            ₹{Number(order.total_amount).toFixed(2)}
          </span>
          <div className="flex items-center gap-1 text-white/40">
            <Clock size={9} />
            <span className="text-[9px] font-medium">
              {formatDate(order.placed_at)} · {formatTime(order.placed_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default OrderCard;
