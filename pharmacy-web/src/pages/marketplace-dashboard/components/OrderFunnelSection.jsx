// pharmacy-web/src/pages/marketplace-dashboard/components/OrderFunnelSection.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/OrderFunnelSection.jsx

import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const FUNNEL_STEPS = [
  {
    status:    'PLACED',
    label:     'New',
    color:     'text-amber-300',
    bg:        'bg-amber-500/10',
    border:    'border-amber-500/20',
    dot:       'bg-amber-400',
    ringColor: 'ring-amber-500/30',
    pulse:     true,
  },
  {
    status:    'ACCEPTED',
    label:     'Accepted',
    color:     'text-blue-300',
    bg:        'bg-blue-500/10',
    border:    'border-blue-500/20',
    dot:       'bg-blue-400',
    ringColor: 'ring-blue-500/30',
    pulse:     false,
  },
  {
    status:    'READY_FOR_PICKUP',
    label:     'Ready',
    color:     'text-purple-300',
    bg:        'bg-purple-500/10',
    border:    'border-purple-500/20',
    dot:       'bg-purple-400',
    ringColor: 'ring-purple-500/30',
    pulse:     false,
  },
  {
    status:    'COMPLETED',
    label:     'Completed',
    color:     'text-emerald-300',
    bg:        'bg-emerald-500/10',
    border:    'border-emerald-500/20',
    dot:       'bg-emerald-400',
    ringColor: 'ring-emerald-500/30',
    pulse:     false,
  },
];

const TERMINAL_STEPS = [
  {
    status:    'REJECTED',
    label:     'Rejected',
    color:     'text-red-300',
    bg:        'bg-red-500/10',
    border:    'border-red-500/20',
    dot:       'bg-red-400',
  },
  {
    status:    'CANCELLED',
    label:     'Cancelled',
    color:     'text-white/40',
    bg:        'bg-white/[0.04]',
    border:    'border-white/[0.07]',
    dot:       'bg-white/20',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL STEP CARD
// ─────────────────────────────────────────────────────────────────────────────

const FunnelStep = ({ step, count, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, ease: 'easeOut', delay }}
    className={`
      flex-1 rounded-xl border p-3 flex flex-col items-center gap-1.5
      min-w-0
      ${step.bg} ${step.border}
    `}
  >
    {/* Dot indicator */}
    <span className="relative flex h-2 w-2 mb-0.5">
      {step.pulse && count > 0 && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${step.dot}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${step.dot}`} />
    </span>

    {/* Count */}
    <p className={`text-xl font-bold tracking-tight ${step.color}`}>
      {count}
    </p>

    {/* Label */}
    <p className="text-[10px] text-white/35 font-medium text-center leading-tight">
      {step.label}
    </p>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const OrderFunnelSection = ({ counts }) => {
  const navigate = useNavigate();

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">
            Order Pipeline
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 text-[10px] font-semibold">
            {total} total
          </span>
        </div>

        <button
          onClick={() => navigate('/marketplace/orders')}
          className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          View all
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Active pipeline */}
      <div className="flex items-center gap-1.5">
        {FUNNEL_STEPS.map((step, i) => (
          <div key={step.status} className="flex items-center gap-1.5 flex-1 min-w-0">
            <FunnelStep
              step={step}
              count={counts[step.status] ?? 0}
              delay={i * 0.06}
            />
            {i < FUNNEL_STEPS.length - 1 && (
              <ArrowRight size={12} className="text-white/15 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Terminal statuses */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-white/25 flex-shrink-0">
          Terminal
        </span>
        <div className="flex items-center gap-2 flex-1">
          {TERMINAL_STEPS.map((step) => (
            <div
              key={step.status}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1
                ${step.bg} ${step.border}
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.dot}`} />
              <span className={`text-xs font-semibold ${step.color}`}>
                {counts[step.status] ?? 0}
              </span>
              <span className="text-[10px] text-white/30">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderFunnelSection;