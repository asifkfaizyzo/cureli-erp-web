// pharmacy-web/src/pages/marketplace-dashboard/components/MarketplaceStatusBanner.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/MarketplaceStatusBanner.jsx

import { motion } from 'framer-motion';
import { AlertTriangle, PauseCircle, FileEdit, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Per-status banner config ──────────────────────────────────────────────────

const BANNER_CONFIG = {
  SUSPENDED: {
    icon:        PauseCircle,
    bg:          'bg-amber-500/10 border-amber-500/20',
    iconColor:   'text-amber-400',
    titleColor:  'text-amber-300',
    textColor:   'text-amber-400/80',
    title:       'Marketplace Suspended',
    description: 'Your marketplace is currently offline. Customers cannot browse or place orders.',
    cta:         'Manage Storefront',
    ctaPath:     '/marketplace/storefront',
    ctaStyle:    'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30',
  },
  DRAFT: {
    icon:        FileEdit,
    bg:          'bg-blue-500/10 border-blue-500/20',
    iconColor:   'text-blue-400',
    titleColor:  'text-blue-300',
    textColor:   'text-blue-400/80',
    title:       'Setup Incomplete',
    description: 'Your marketplace setup is still in draft. Complete onboarding to go live.',
    cta:         'Complete Setup',
    ctaPath:     '/marketplace/onboarding',
    ctaStyle:    'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30',
  },
  NOT_STARTED: {
    icon:        AlertTriangle,
    bg:          'bg-white/[0.04] border-white/[0.08]',
    iconColor:   'text-white/40',
    titleColor:  'text-white/60',
    textColor:   'text-white/30',
    title:       'Marketplace Not Set Up',
    description: 'You have not started marketplace onboarding yet.',
    cta:         'Start Setup',
    ctaPath:     '/marketplace/onboarding',
    ctaStyle:    'bg-white/[0.06] hover:bg-white/[0.10] text-white/50 border-white/[0.08]',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

const MarketplaceStatusBanner = ({ marketplace_status }) => {
  const navigate = useNavigate();

  // Only render for non-live states
  if (marketplace_status === 'LIVE') return null;

  const config = BANNER_CONFIG[marketplace_status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        mx-6 mt-4 rounded-2xl border p-4
        flex items-center justify-between gap-4
        ${config.bg}
      `}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <Icon size={18} className={config.iconColor} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${config.titleColor}`}>
            {config.title}
          </p>
          <p className={`text-xs mt-0.5 ${config.textColor}`}>
            {config.description}
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate(config.ctaPath)}
        className={`
          flex-shrink-0 flex items-center gap-1.5
          px-3 py-1.5 rounded-lg border text-xs font-semibold
          transition-all
          ${config.ctaStyle}
        `}
      >
        {config.cta}
        <ArrowRight size={12} />
      </button>
    </motion.div>
  );
};

export default MarketplaceStatusBanner;