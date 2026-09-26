// pharmacy-web/src/pages/marketplace-dashboard/components/BranchPerformanceTable.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/BranchPerformanceTable.jsx

import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  PackageX,
  TrendingDown,
  Truck,
  ShoppingBag,
  MapPin,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (val) => {
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000)   return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH INDICATOR
// Computes a simple health score from branch data
// ─────────────────────────────────────────────────────────────────────────────

function getBranchHealth(branch) {
  if (!branch.marketplace_enabled) {
    return { label: 'Offline', color: 'text-white/30', bg: 'bg-white/[0.04]', border: 'border-white/[0.07]', dot: 'bg-white/20' };
  }
  if (!branch.has_location) {
    return { label: 'No Location', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' };
  }
  if (branch.live_listings === 0) {
    return { label: 'No Listings', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400' };
  }
  if (branch.out_of_stock_listings > branch.live_listings) {
    return { label: 'Low Stock', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' };
  }
  return { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' };
}

// ─────────────────────────────────────────────────────────────────────────────
// FULFILLMENT PILLS
// ─────────────────────────────────────────────────────────────────────────────

const FulfillmentPills = ({ pickup, delivery }) => (
  <div className="flex items-center gap-1 flex-wrap">
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border
        ${pickup
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-white/[0.04] text-white/20 border-white/[0.06]'
        }
      `}
    >
      <ShoppingBag size={8} />
      Pickup
    </span>
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border
        ${delivery
          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
          : 'bg-white/[0.04] text-white/20 border-white/[0.06]'
        }
      `}
    >
      <Truck size={8} />
      Delivery
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HOURS LABEL
// ─────────────────────────────────────────────────────────────────────────────

const HoursLabel = ({ is24, opening, closing, enabled }) => {
  if (!enabled) return <span className="text-[10px] text-white/20">—</span>;
  if (is24) return <span className="text-[10px] text-emerald-400 font-semibold">24 hrs</span>;
  if (opening && closing) {
    return (
      <span className="text-[10px] text-white/40 font-mono">
        {opening}–{closing}
      </span>
    );
  }
  return <span className="text-[10px] text-amber-400">Not set</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// STAT CELL
// ─────────────────────────────────────────────────────────────────────────────

const StatCell = ({ value, label, color = 'text-white/70', warn = false }) => (
  <div className="text-center">
    <p className={`text-sm font-bold ${warn && value > 0 ? 'text-amber-300' : color}`}>
      {value}
    </p>
    <p className="text-[9px] text-white/25 mt-0.5">{label}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// BRANCH ROW
// ─────────────────────────────────────────────────────────────────────────────

const BranchRow = ({ branch, index }) => {
  const navigate = useNavigate();
  const health   = getBranchHealth(branch);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.06 }}
      className={`
        grid items-center gap-3 px-4 py-3 rounded-xl border
        transition-colors duration-150
        ${branch.marketplace_enabled
          ? 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05]'
          : 'bg-white/[0.01] border-white/[0.04]'
        }
      `}
      style={{ gridTemplateColumns: '1.8fr 0.8fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.9fr 0.6fr' }}
    >
      {/* Branch name + status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${branch.marketplace_enabled ? 'bg-white/[0.07]' : 'bg-white/[0.03]'}
          `}
        >
          {branch.marketplace_enabled
            ? <Wifi size={14} className="text-white/50" />
            : <WifiOff size={14} className="text-white/20" />
          }
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${branch.marketplace_enabled ? 'text-white/80' : 'text-white/30'}`}>
            {branch.branch_name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {branch.has_location
              ? <MapPin size={9} className="text-white/25" />
              : <AlertTriangle size={9} className="text-amber-400/60" />
            }
            <span className="text-[9px] text-white/25">
              {branch.has_location ? 'Location set' : 'No location'}
            </span>
          </div>
        </div>
      </div>

      {/* Health */}
      <div>
        <span
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            text-[9px] font-bold border
            ${health.bg} ${health.border} ${health.color}
          `}
        >
          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${health.dot}`} />
          {health.label}
        </span>
      </div>

      {/* Fulfillment */}
      <FulfillmentPills
        pickup={branch.pickup_enabled}
        delivery={branch.delivery_enabled}
      />

      {/* Hours */}
      <HoursLabel
        is24={branch.is_24_hours}
        opening={branch.opening_time}
        closing={branch.closing_time}
        enabled={branch.marketplace_enabled}
      />

      {/* Listing stats */}
      <StatCell
        value={branch.live_listings}
        label="Live"
        color="text-emerald-400"
      />
      <StatCell
        value={branch.out_of_stock_listings}
        label="OOS"
        warn
        color="text-white/50"
      />
      <StatCell
        value={branch.pending_orders}
        label="Pending"
        warn
        color="text-white/50"
      />

      {/* Order value */}
      <div className="text-center">
        <p className="text-sm font-bold text-white/70">
          {formatCurrency(branch.order_value_total)}
        </p>
        <p className="text-[9px] text-white/25 mt-0.5">
          {branch.completed_orders} done
        </p>
      </div>

      {/* Go to storefront */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/marketplace/storefront')}
          className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.07] flex items-center justify-center transition-all group"
        >
          <ArrowRight size={12} className="text-white/30 group-hover:text-white/60 transition-colors" />
        </button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE HEADER
// ─────────────────────────────────────────────────────────────────────────────

const TableHeader = () => (
  <div
    className="grid items-center gap-3 px-4 py-2"
    style={{ gridTemplateColumns: '1.8fr 0.8fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.9fr 0.6fr' }}
  >
    {[
      'Branch',
      'Health',
      'Fulfillment',
      'Hours',
      'Live',
      'OOS',
      'Pending',
      'Order Value',
      '',
    ].map((col, i) => (
      <div key={i} className={i >= 4 && i <= 7 ? 'text-center' : ''}>
        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-wider">
          {col}
        </span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const BranchPerformanceTable = ({ branches }) => {
  const navigate = useNavigate();

  if (!branches || branches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex items-center justify-center">
        <p className="text-white/25 text-sm">No branches configured.</p>
      </div>
    );
  }

  // Sort: enabled first, then by order value desc
  const sorted = [...branches].sort((a, b) => {
    if (a.marketplace_enabled !== b.marketplace_enabled) {
      return a.marketplace_enabled ? -1 : 1;
    }
    return b.order_value_total - a.order_value_total;
  });

  const enabledCount = branches.filter((b) => b.marketplace_enabled).length;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">
            Branch Performance
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 text-[10px] font-semibold">
            {enabledCount}/{branches.length} active
          </span>
        </div>

        <button
          onClick={() => navigate('/marketplace/storefront')}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          Manage branches
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Column headers */}
      <TableHeader />

      {/* Rows */}
      <div className="flex flex-col gap-1.5 px-2 pb-3">
        <AnimatePresence>
          {sorted.map((branch, i) => (
            <BranchRow key={branch.branch_id} branch={branch} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BranchPerformanceTable;