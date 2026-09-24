// pharmacy-web/src/pages/marketplace-dashboard/components/KpiRow.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/KpiRow.jsx

import { motion } from 'framer-motion';
import {
  Clock,
  PackageCheck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  IndianRupee,
  Store,
  Ban,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (val) => {
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000)   return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const formatCount = (val) => {
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return String(val);
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────

const KpiCard = ({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor   = 'text-white',
  subLabel     = null,
  subValue     = null,
  urgent       = false,
  delay        = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut', delay }}
    className={`
      relative rounded-2xl border p-4 flex flex-col gap-3
      transition-colors duration-200
      ${urgent
        ? 'bg-amber-500/[0.07] border-amber-500/20 hover:bg-amber-500/[0.10]'
        : 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.06]'
      }
    `}
  >
    {/* Urgent pulse ring */}
    {urgent && (
      <span className="absolute top-3 right-3 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
      </span>
    )}

    {/* Icon */}
    <div
      className={`
        w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
        ${iconBg}
      `}
    >
      <Icon size={17} className={iconColor} />
    </div>

    {/* Value */}
    <div>
      <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>
        {value}
      </p>
      <p className="text-[11px] text-white/40 mt-0.5 leading-tight">
        {label}
      </p>
    </div>

    {/* Sub value */}
    {subLabel && subValue !== null && (
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] text-white/30">{subLabel}</span>
        <span className="text-[11px] text-white/50 font-semibold">{subValue}</span>
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KPI ROW
// ─────────────────────────────────────────────────────────────────────────────

const KpiRow = ({ kpis, overview }) => {
  const cards = [
    {
      label:      'Pending Action',
      value:      formatCount(kpis.pending_action),
      icon:       Clock,
      iconBg:     kpis.pending_action > 0
                    ? 'bg-amber-500/20'
                    : 'bg-white/[0.06]',
      iconColor:  kpis.pending_action > 0
                    ? 'text-amber-400'
                    : 'text-white/40',
      valueColor: kpis.pending_action > 0
                    ? 'text-amber-300'
                    : 'text-white',
      urgent:     kpis.pending_action > 0,
    },
    {
      label:      'Ready for Pickup',
      value:      formatCount(kpis.ready_for_pickup),
      icon:       PackageCheck,
      iconBg:     kpis.ready_for_pickup > 0
                    ? 'bg-blue-500/20'
                    : 'bg-white/[0.06]',
      iconColor:  kpis.ready_for_pickup > 0
                    ? 'text-blue-400'
                    : 'text-white/40',
      valueColor: kpis.ready_for_pickup > 0
                    ? 'text-blue-300'
                    : 'text-white',
      urgent:     false,
    },
    {
      label:      'Orders Today',
      value:      formatCount(kpis.orders_today),
      icon:       ShoppingBag,
      iconBg:     'bg-white/[0.06]',
      iconColor:  'text-white/50',
      subLabel:   'Value today',
      subValue:   formatCurrency(kpis.order_value_today),
      urgent:     false,
    },
    {
      label:      'Total Completed',
      value:      formatCount(kpis.completed_total),
      icon:       CheckCircle2,
      iconBg:     'bg-emerald-500/10',
      iconColor:  'text-emerald-400',
      valueColor: 'text-emerald-300',
      subLabel:   'Order value',
      subValue:   formatCurrency(kpis.order_value_total),
      urgent:     false,
    },
    {
      label:      'Rejected',
      value:      formatCount(kpis.rejected_total),
      icon:       XCircle,
      iconBg:     kpis.rejected_total > 0
                    ? 'bg-red-500/10'
                    : 'bg-white/[0.06]',
      iconColor:  kpis.rejected_total > 0
                    ? 'text-red-400'
                    : 'text-white/40',
      valueColor: kpis.rejected_total > 0
                    ? 'text-red-300'
                    : 'text-white',
      subLabel:   'Cancelled',
      subValue:   formatCount(kpis.cancelled_total),
      urgent:     false,
    },
    {
      label:      'Active Branches',
      value:      `${overview.enabled_branches}/${overview.total_branches}`,
      icon:       overview.enabled_branches === 0 ? Ban : Store,
      iconBg:     overview.enabled_branches === 0
                    ? 'bg-red-500/10'
                    : 'bg-white/[0.06]',
      iconColor:  overview.enabled_branches === 0
                    ? 'text-red-400'
                    : 'text-white/50',
      urgent:     false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} delay={i * 0.05} />
      ))}
    </div>
  );
};

export default KpiRow;