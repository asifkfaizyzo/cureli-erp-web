// cadmin-web/src/pages/marketplace/Orders/comps/BatchHistoryCard.jsx
import { useState } from "react";
import {
  Truck,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Ban,
  Package,
  Clock,
} from "lucide-react";

const BADGE_STYLES = {
  Delivered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-amber-100 text-amber-700",
};

const DELIVERY_STATUS_META = {
  DELIVERED: { Icon: CheckCircle2, cls: "text-emerald-500" },
  FAILED: { Icon: XCircle, cls: "text-red-500" },
  CANCELLED: { Icon: Ban, cls: "text-gray-400" },
};

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes) {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/**
 * Read-only card for a completed/cancelled Same Day batch (Batch History tab).
 * No trash / reassign / add-order actions — everything here is terminal.
 * Expand to see all orders; clicking an order row opens OrderDetailModal
 * via the onOrderClick callback (handled by the parent SameDayTab).
 */
const BatchHistoryCard = ({ batch, onOrderClick }) => {
  const [expanded, setExpanded] = useState(false);
  const badgeCls = BADGE_STYLES[batch.badge] || "bg-gray-100 text-gray-600";

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/60"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Truck size={14} className="text-gray-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900 truncate">
                {batch.rider_name || "Unknown Rider"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}
              >
                {batch.badge}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {batch.batch_group_id.slice(0, 12)}…
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone size={9} />
                {batch.rider_phone || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Package size={9} />
                {batch.order_count} orders
              </span>
              <span className="flex items-center gap-1">
                <Clock size={9} />
                {formatDuration(batch.duration_minutes)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs font-bold text-emerald-600">
                {batch.delivered_count}
              </div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                Delivered
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-red-600">
                {batch.failed_count}
              </div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                Failed
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-gray-500">
                {batch.cancelled_count}
              </div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                Cancelled
              </div>
            </div>
            <div className="text-center min-w-[90px]">
              <div className="text-xs font-bold text-gray-800">
                {formatDateTime(batch.completed_at)}
              </div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                Completed
              </div>
            </div>
          </div>

          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 space-y-1.5">
          {batch.orders.map((o) => {
            const meta = DELIVERY_STATUS_META[o.delivery_status] || {
              Icon: Package,
              cls: "text-gray-400",
            };
            const { Icon, cls } = meta;

            return (
              <div
                key={o.delivery_id}
                onClick={() => onOrderClick?.(o.order_id)}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100 cursor-pointer hover:bg-[#05015A]/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon size={14} className={`${cls} flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 font-mono">
                        {o.order_number}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {o.delivery_status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      {o.customer_name} · {o.branch_name}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">
                    {formatDateTime(o.delivered_at || o.failed_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BatchHistoryCard;