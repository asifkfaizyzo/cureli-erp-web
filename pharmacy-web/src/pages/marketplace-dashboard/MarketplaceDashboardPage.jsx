// pharmacy-web/src/pages/marketplace-dashboard/MarketplaceDashboardPage.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/MarketplaceDashboardPage.jsx

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useDashboard }           from '../../hooks/marketplace/useDashboard';
import DashboardSkeleton          from './components/DashboardSkeleton';
import DashboardHeader            from './components/DashboardHeader';
import MarketplaceStatusBanner    from './components/MarketplaceStatusBanner';
import KpiRow                     from './components/KpiRow';
import OrderFunnelSection         from './components/OrderFunnelSection';
import AlertsPanel                from './components/AlertsPanel';
import ListingsHealthSection      from './components/ListingsHealthSection';
import TrendChart                 from './components/TrendChart';
import BranchPerformanceTable     from './components/BranchPerformanceTable';
import RecentOrdersPanel          from './components/RecentOrdersPanel';

// Banking Banner and Stores
import BankingPendingBanner from '../../components/common/BankingPendingBanner';
import { useMarketplaceStore } from '../../store/useMarketplaceStore';
import { useAuthStore, selectIsSuperAdmin } from '../../store/useAuthStore';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

const contentVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration:        0.4,
      ease:            'easeOut',
      staggerChildren: 0.07,
    },
  },
};

const sectionVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y:       0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const MarketplaceDashboardPage = () => {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    usingDummy,
    refresh,
  } = useDashboard();

  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const banking = useMarketplaceStore((s) => s.banking);
  const isStatusLoaded = useMarketplaceStore((s) => s.isStatusLoaded);
  const isStatusLoading = useMarketplaceStore((s) => s.isStatusLoading);
  const loadStatus = useMarketplaceStore((s) => s.loadStatus);

  // Refresh status on load to ensure data accuracy
  useEffect(() => {
    if (!isStatusLoaded && !isStatusLoading) {
      loadStatus();
    }
  }, [isStatusLoaded, isStatusLoading, loadStatus]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#010015]">
        <DashboardSkeleton />
      </div>
    );
  }

  // ── No data guard ───────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="min-h-screen bg-[#010015] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/40 text-sm">
            Could not load dashboard.
          </p>
          <button
            onClick={refresh}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-white/[0.06] hover:bg-white/[0.10]
              text-white/50 hover:text-white/70
              border border-white/[0.08]
              transition-all
            "
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    overview,
    kpis,
    order_status_counts,
    listings,
    branches,
    recent_orders,
    trend_7d,
    alerts,
  } = data;

  const bankingPending = isSuperAdmin && !banking.bank_account_holder;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#010015]">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <DashboardHeader
        storefront_name={overview.storefront_name}
        marketplace_status={overview.marketplace_status}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        usingDummy={usingDummy}
        onRefresh={refresh}
      />

      {/* ── Soft error banner (shown only on refresh failures) ───────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mt-3"
          >
            <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Marketplace status banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        <MarketplaceStatusBanner
          marketplace_status={overview.marketplace_status}
        />
      </AnimatePresence>

      {/* ── Banking Pending Alert Banner ── */}
      <AnimatePresence>
        {bankingPending && (
          <motion.div
            key="banking-warning-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-3"
          >
            <BankingPendingBanner onAction={() => navigate("/marketplace/storefront")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dashboard body ───────────────────────────────────────────────────── */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pb-12 space-y-5 mt-5"
      >

        {/* 1 — KPI strip */}
        <motion.div variants={sectionVariants}>
          <KpiRow kpis={kpis} overview={overview} />
        </motion.div>

        {/* 2 — Order pipeline + Alerts */}
        <motion.div
          variants={sectionVariants}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        >
          <div className="lg:col-span-3">
            <OrderFunnelSection counts={order_status_counts} />
          </div>
          <div className="lg:col-span-2">
            <AlertsPanel alerts={alerts} />
          </div>
        </motion.div>

        {/* 3 — Listings health + 7-day trend */}
        <motion.div
          variants={sectionVariants}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        >
          <div className="lg:col-span-2">
            <ListingsHealthSection listings={listings} />
          </div>
          <div className="lg:col-span-3">
            <TrendChart trend={trend_7d} />
          </div>
        </motion.div>

        {/* 4 — Branch performance */}
        <motion.div variants={sectionVariants}>
          <BranchPerformanceTable branches={branches} />
        </motion.div>

        {/* 5 — Recent orders */}
        <motion.div variants={sectionVariants}>
          <RecentOrdersPanel orders={recent_orders} />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default MarketplaceDashboardPage;