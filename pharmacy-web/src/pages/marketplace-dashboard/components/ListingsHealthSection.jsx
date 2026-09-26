// pharmacy-web/src/pages/marketplace-dashboard/components/ListingsHealthSection.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/ListingsHealthSection.jsx

import { motion } from 'framer-motion';
import {
  Pill,
  Eye,
  EyeOff,
  PackageX,
  TrendingDown,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color, bg, border, delay, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut', delay }}
    onClick={onClick}
    className={`
      flex items-center gap-3 px-3 py-2.5 rounded-xl border
      transition-colors duration-150
      ${bg} ${border}
      ${onClick ? 'cursor-pointer hover:brightness-110' : ''}
    `}
  >
    <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
      <Icon size={14} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-white/35 leading-tight truncate">{label}</p>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ListingsHealthSection = ({ listings }) => {
  const navigate = useNavigate();

  const livePercent = listings.total_linked > 0
    ? Math.round((listings.live / listings.total_linked) * 100)
    : 0;

  const stats = [
    {
      icon:   Eye,
      label:  'Live Listings',
      value:  listings.live,
      color:  'text-emerald-400',
      bg:     'bg-emerald-500/[0.06]',
      border: 'border-emerald-500/15',
    },
    {
      icon:   EyeOff,
      label:  'Hidden',
      value:  listings.hidden,
      color:  'text-white/50',
      bg:     'bg-white/[0.03]',
      border: 'border-white/[0.07]',
    },
    {
      icon:   PackageX,
      label:  'Out of Stock',
      value:  listings.out_of_stock,
      color:  listings.out_of_stock > 0 ? 'text-red-400'  : 'text-white/40',
      bg:     listings.out_of_stock > 0 ? 'bg-red-500/[0.06]'   : 'bg-white/[0.03]',
      border: listings.out_of_stock > 0 ? 'border-red-500/15'   : 'border-white/[0.07]',
    },
    {
      icon:   TrendingDown,
      label:  'Low Stock',
      value:  listings.low_stock,
      color:  listings.low_stock > 0 ? 'text-amber-400' : 'text-white/40',
      bg:     listings.low_stock > 0 ? 'bg-amber-500/[0.06]' : 'bg-white/[0.03]',
      border: listings.low_stock > 0 ? 'border-amber-500/15' : 'border-white/[0.07]',
    },
    {
      icon:   FileText,
      label:  'Needs Prescription',
      value:  listings.requires_prescription,
      color:  'text-blue-400',
      bg:     'bg-blue-500/[0.05]',
      border: 'border-blue-500/15',
    },
  ];

  return (
    <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">
            Listings Health
          </h2>
        </div>
        <button
          onClick={() => navigate('/marketplace/listings')}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          Manage
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Total + live % bar */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-white">
              {listings.total_linked}
            </p>
            <p className="text-[11px] text-white/35">Total linked medicines</p>
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold pb-1">
            {livePercent}% live
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${livePercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full bg-emerald-500/60"
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-col gap-2 flex-1">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            {...stat}
            delay={i * 0.06}
            onClick={() => navigate('/marketplace/listings')}
          />
        ))}
      </div>
    </div>
  );
};

export default ListingsHealthSection;