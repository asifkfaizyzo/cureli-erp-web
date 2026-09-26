// pharmacy-web/src/pages/marketplace-orders/components/OrderCard.jsx (do not remove this comment)
// ============================================
// components/OrderCard.jsx
// ============================================

import { ShoppingBag, Clock, FileText, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  PLACED: {
    label: 'New Order',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    dot: 'bg-green-400',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-white/10 text-white/50 border-white/10',
    dot: 'bg-white/30',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    dot: 'bg-red-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-white/5 text-white/30 border-white/10',
    dot: 'bg-white/20',
  },
};

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

const OrderCard = ({ order, isSelected, onSelect }) => {
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PLACED;

  return (
    <button
      onClick={() => onSelect(order.order_id)}
      className={`
        w-full text-left px-4 py-4 border-b border-white/[0.04]
        transition-colors duration-100
        ${
          isSelected
            ? 'bg-white/[0.08]'
            : 'hover:bg-white/[0.04]'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          {/* Order number + status */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-white">
              {order.order_number}
            </span>
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border
                ${statusCfg.color}
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {order.requires_prescription && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-purple-500/20 text-purple-300 border-purple-500/30">
                <FileText size={9} />
                Rx
              </span>
            )}
          </div>

          {/* Customer */}
          <p className="text-sm text-white/70 font-medium truncate">
            {order.customer_name}
          </p>

          {/* Items summary */}
          <p className="text-xs text-white/35 mt-1 truncate">
            {order.item_count} item{order.item_count !== 1 ? 's' : ''}
            {order.items?.[0]?.medicine_name
              ? ` · ${order.items[0].medicine_name}${order.item_count > 1 ? ` +${order.item_count - 1}` : ''}`
              : ''}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-sm font-bold text-white">
            ₹{Number(order.total_amount).toFixed(2)}
          </span>
          <div className="flex items-center gap-1 text-white/30">
            <Clock size={10} />
            <span className="text-[10px]">
              {formatDate(order.placed_at)} {formatTime(order.placed_at)}
            </span>
          </div>
          <ChevronRight size={14} className="text-white/20 mt-1" />
        </div>
      </div>
    </button>
  );
};

export default OrderCard;