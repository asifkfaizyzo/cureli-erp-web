// pharmacy-web/src/pages/marketplace-dashboard/components/AlertsPanel.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/AlertsPanel.jsx

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_CONFIG = {
  danger: {
    icon:      AlertCircle,
    iconColor: 'text-red-400',
    bg:        'bg-red-500/[0.07] hover:bg-red-500/[0.10]',
    border:    'border-red-500/20',
    dot:       'bg-red-400',
  },
  warning: {
    icon:      AlertTriangle,
    iconColor: 'text-amber-400',
    bg:        'bg-amber-500/[0.07] hover:bg-amber-500/[0.10]',
    border:    'border-amber-500/20',
    dot:       'bg-amber-400',
  },
  info: {
    icon:      Info,
    iconColor: 'text-blue-400',
    bg:        'bg-blue-500/[0.05] hover:bg-blue-500/[0.08]',
    border:    'border-blue-500/15',
    dot:       'bg-blue-400',
  },
};

// Map alert codes to navigation targets
const ALERT_NAV = {
  ORDERS_PENDING:       '/marketplace/orders',
  ORDERS_READY:         '/marketplace/orders',
  OUT_OF_STOCK:         '/marketplace/listings',
  LOW_STOCK:            '/marketplace/listings',
  BRANCH_DISABLED:      '/marketplace/storefront',
  BRANCH_NO_LOCATION:   '/marketplace/storefront',
  MARKETPLACE_SUSPENDED:'/marketplace/storefront',
  MISSING_LOGO:         '/marketplace/storefront',
  MISSING_SUPPORT_PHONE:'/marketplace/storefront',
};

// ─────────────────────────────────────────────────────────────────────────────
// ALERT ITEM
// ─────────────────────────────────────────────────────────────────────────────

const AlertItem = ({ alert, index, onClick }) => {
  const config = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.info;
  const Icon   = config.icon;
  const isNav  = Boolean(ALERT_NAV[alert.code]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: index * 0.05 }}
      onClick={isNav ? onClick : undefined}
      className={`
        flex items-start gap-2.5 p-2.5 rounded-xl border
        transition-colors duration-150
        ${config.bg} ${config.border}
        ${isNav ? 'cursor-pointer' : ''}
      `}
    >
      {/* Icon */}
      <Icon
        size={14}
        className={`${config.iconColor} flex-shrink-0 mt-0.5`}
      />

      {/* Message */}
      <p className="text-[11px] text-white/60 leading-relaxed flex-1">
        {alert.message}
      </p>

      {/* Nav arrow */}
      {isNav && (
        <ArrowRight
          size={11}
          className="text-white/20 flex-shrink-0 mt-0.5"
        />
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AlertsPanel = ({ alerts }) => {
  const navigate = useNavigate();

  const hasAlerts    = alerts && alerts.length > 0;
  const dangerCount  = alerts?.filter((a) => a.type === 'danger').length  ?? 0;
  const warningCount = alerts?.filter((a) => a.type === 'warning').length ?? 0;

  return (
    <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">
            Alerts
          </h2>
          {(dangerCount > 0 || warningCount > 0) && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/20">
              {dangerCount + warningCount} action needed
            </span>
          )}
        </div>
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {hasAlerts ? (
            alerts.map((alert, i) => (
              <AlertItem
                key={alert.code}
                alert={alert}
                index={i}
                onClick={() => navigate(ALERT_NAV[alert.code])}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6"
            >
              <CheckCircle2 size={22} className="text-emerald-400/40" />
              <p className="text-[11px] text-white/25 text-center">
                All clear — no alerts right now.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertsPanel;