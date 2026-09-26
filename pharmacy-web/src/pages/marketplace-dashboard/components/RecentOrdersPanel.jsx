// pharmacy-web/src/pages/marketplace-dashboard/components/RecentOrdersPanel.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/RecentOrdersPanel.jsx

import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Ban,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED: {
    label: 'New',
    icon:  Clock,
    color: 'text-amber-400',
    bg:    'bg-amber-500/10',
    dot:   'bg-amber-400',
    pulse: true,
  },
  ACCEPTED: {
    label: 'Accepted',
    icon:  CheckCircle2,
    color: 'text-blue-400',
    bg:    'bg-blue-500/10',
    dot:   'bg-blue-400',
    pulse: false,
  },
  READY_FOR_PICKUP: {
    label: 'Ready',
    icon:  PackageCheck,
    color: 'text-purple-400',
    bg:    'bg-purple-500/10',
    dot:   'bg-purple-400',
    pulse: false,
  },
  COMPLETED: {
    label: 'Completed',
    icon:  CheckCircle2,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10',
    dot:   'bg-emerald-400',
    pulse: false,
  },
  REJECTED: {
    label: 'Rejected',
    icon:  XCircle,
    color: 'text-red-400',
    bg:    'bg-red-500/10',
    dot:   'bg-red-400',
    pulse: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    icon:  Ban,
    color: 'text-white/30',
    bg:    'bg-white/[0.04]',
    dot:   'bg-white/20',
    pulse: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (val) =>
  `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const timeAgo = (iso) => {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '—';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ROW
// ─────────────────────────────────────────────────────────────────────────────

const OrderRow = ({ order, index }) => {
  const navigate = useNavigate();
  const config   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PLACED;
  const Icon     = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay: index * 0.05 }}
      onClick={() => navigate('/marketplace/orders')}
      className="
        grid items-center gap-3 px-4 py-3 rounded-xl
        border border-white/[0.06] bg-white/[0.02]
        hover:bg-white/[0.05] hover:border-white/[0.10]
        transition-all duration-150 cursor-pointer group
      "
      style={{ gridTemplateColumns: '0.9fr 1.4fr 0.7fr 0.5fr 0.8fr 0.6fr 28px' }}
    >
      {/* Order number */}
      <div>
        <p className="text-[11px] font-mono font-bold text-white/60 group-hover:text-white/80 transition-colors">
          {order.order_number}
        </p>
        <p className="text-[9px] text-white/25 mt-0.5">
          {timeAgo(order.placed_at)}
        </p>
      </div>

      {/* Customer */}
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-white/70 truncate">
          {order.customer_name}
        </p>
        {order.branch_name && (
          <p className="text-[9px] text-white/25 truncate mt-0.5">
            {order.branch_name}
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <span
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            text-[9px] font-bold
            ${config.bg} ${config.color}
          `}
        >
          <span className="relative flex h-1.5 w-1.5">
            {config.pulse && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
          </span>
          {config.label}
        </span>
      </div>

      {/* Items */}
      <div className="text-center">
        <p className="text-[11px] text-white/50">
          {order.item_count}
        </p>
        <p className="text-[9px] text-white/25">items</p>
      </div>

      {/* Prescription badge */}
      <div>
        {order.requires_prescription && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-semibold border border-blue-500/20">
            <FileText size={8} />
            Rx
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="text-[12px] font-bold text-white/70">
          {formatCurrency(order.total_amount)}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight
        size={12}
        className="text-white/20 group-hover:text-white/50 transition-colors"
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE HEADER
// ─────────────────────────────────────────────────────────────────────────────

const OrderTableHeader = () => (
  <div
    className="grid items-center gap-3 px-4 py-2"
    style={{ gridTemplateColumns: '0.9fr 1.4fr 0.7fr 0.5fr 0.8fr 0.6fr 28px' }}
  >
    {['Order', 'Customer', 'Status', 'Items', 'Rx', 'Amount', ''].map((col, i) => (
      <div key={i} className={i === 3 ? 'text-center' : i === 5 ? 'text-right' : ''}>
        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-wider">
          {col}
        </span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

const EmptyOrders = () => (
  <div className="py-10 flex flex-col items-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
      <ShoppingBag size={20} className="text-white/20" />
    </div>
    <p className="text-[12px] text-white/25 text-center">
      No orders yet. Share your storefront to start receiving orders.
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const RecentOrdersPanel = ({ orders }) => {
  const navigate = useNavigate();

  const hasOrders = orders && orders.length > 0;

  // Count actionable orders
  const actionableCount = orders?.filter(
    (o) => o.status === 'PLACED' || o.status === 'READY_FOR_PICKUP',
  ).length ?? 0;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShoppingBag size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">
            Recent Orders
          </h2>
          {actionableCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/20 animate-pulse">
              {actionableCount} need action
            </span>
          )}
        </div>

        <button
          onClick={() => navigate('/marketplace/orders')}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          View all orders
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Content */}
      {hasOrders ? (
        <>
          <OrderTableHeader />
          <div className="flex flex-col gap-1.5 px-2 pb-3">
            {orders.map((order, i) => (
              <OrderRow key={order.order_id} order={order} index={i} />
            ))}
          </div>
        </>
      ) : (
        <EmptyOrders />
      )}
    </div>
  );
};

export default RecentOrdersPanel;