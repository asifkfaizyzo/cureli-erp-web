// cadmin-web/src/pages/Dashboard/AdminDashboard.jsx (do not remove this comment)
// src/pages/Dashboard/AdminDashboard.jsx

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, LayoutDashboard, Loader2, AlertCircle, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth }        from "../../context/AuthContext";
import { useToast }       from "../../components/common/Toast";
import { useMenuStore }   from "../../store/useMenuStore";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS }  from "../../config/cadminPermissions";
import NoPermission        from "../../components/common/NoPermission";

// Dashboard sub-components
import WelcomeBanner      from "./comps/WelcomeBanner";
import AlertsBanner       from "./comps/AlertsBanner";
import PeriodSelector     from "./comps/PeriodSelector";
import KPICardsGrid       from "./comps/KPICardsGrid";
import QuickActionsPanel  from "./comps/QuickActionsPanel";
import PendingActionsPanel from "./comps/PendingActionsPanel";
import RevenueChart       from "./comps/RevenueChart";
import SubscriptionDonut  from "./comps/SubscriptionDonut";
import UserGrowthChart    from "./comps/UserGrowthChart";
import OnboardingTable    from "./comps/OnboardingTable";
import TopShopsTable      from "./comps/TopShopsTable";
import ActivityFeed       from "./comps/ActivityFeed";

// API
import { getDashboardOverview, getDashboardAlerts } from "../../api/cadminDashboard";

// ─────────────────────────────────────────────────────────────────────────────
// GRID PATTERN BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
    <svg width="100%" height="100%">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const toast            = useToast();
  const { admin, pendingCounts } = useAuth();
  const setBreadcrumbs   = useMenuStore((s) => s.setBreadcrumbs);

  // ── Real permission checks — replaces the old ROLE_PERMISSIONS object ─────
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();

  const canViewDashboard    = isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.DASHBOARD_VIEW);

  // These granular checks control which dashboard sections are visible.
  // Since the dashboard is a single page all gated behind dashboard.view,
  // any admin who passes canViewDashboard will see all sections.
  // If you want per-section gating in future, split these out further.
  // For now: if you can see the dashboard you see everything on it.
  // Super admins always see everything.

  const [period, setPeriod]             = useState("30d");
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [alerts, setAlerts]             = useState([]);
  const [lastUpdated, setLastUpdated]   = useState(null);

  useEffect(() => {
    setBreadcrumbs(["Dashboard"]);
  }, [setBreadcrumbs]);

  const fetchDashboardData = useCallback(async (showToast = false) => {
    // ── Skip fetching if no permission — avoids unnecessary 403s ─────────
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }

    try {
      if (showToast) setRefreshing(true);
      else           setLoading(true);
      setError(null);

      const [overviewRes, alertsRes] = await Promise.allSettled([
        getDashboardOverview(period),
        getDashboardAlerts(),
      ]);

      if (overviewRes.status === "fulfilled") {
        setOverviewData(overviewRes.value.data);
      } else {
        setError("Failed to load dashboard data");
      }

      if (alertsRes.status === "fulfilled") {
        setAlerts(alertsRes.value.data || []);
      }

      setLastUpdated(new Date());
      if (showToast) toast.success("Refreshed", "Dashboard data updated");
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      toast.error("Error", "Could not load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, canViewDashboard, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh      = useCallback(() => fetchDashboardData(true), [fetchDashboardData]);
  const handleDismissAlert = useCallback(
    (id) => setAlerts((p) => p.filter((a) => a.id !== id)),
    []
  );

  // ── No permission — show NoPermission block, don't redirect ──────────────
  if (!canViewDashboard) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          {/* Greeting even without dashboard access
          <p className="text-sm font-semibold text-gray-600 mb-6">
            {(() => {
              const h = new Date().getHours();
              if (h < 12) return "Uh-oh";
              if (h < 17) return "Uh-oh";
              return "Uh-oh";
            })()}, {admin?.name?.split(" ")[0] || "Admin"}
          </p> */}

          <NoPermission
            variant="block"
            icon="lock"
            title="Dashboard Access Restricted"
            description="You don't have permission to view the dashboard. Use the sidebar to navigate to sections you have access to, or contact your Super Admin to request dashboard access."
          />
        </motion.div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#000060] to-violet-600
                            flex items-center justify-center">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <Loader2 size={20}
              className="absolute -bottom-1 -right-1 text-[#000060] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Loading Dashboard</p>
          <p className="text-[10px] text-gray-400">Fetching your data...</p>
        </motion.div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !overviewData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Dashboard Error</h2>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium
                       text-xs hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Full dashboard — only reached if canViewDashboard is true ─────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 relative">
      <GridPattern />

      <div className="relative max-w-[1800px] mx-auto px-3 py-3 lg:px-4 lg:py-3 space-y-3">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <WelcomeBanner
            admin={admin}
            pendingCounts={pendingCounts}
            overviewData={overviewData}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <PeriodSelector value={period} onChange={setPeriod} />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/80 backdrop-blur border border-gray-200/60
                         text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-40 shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <AlertsBanner alerts={alerts} onDismiss={handleDismissAlert} />
        )}

        {/* Quick Actions */}
        <QuickActionsPanel />

        {/* KPI Cards */}
        {overviewData && (
          <KPICardsGrid data={overviewData} period={period} loading={false} />
        )}

        {/* Pending Actions */}
        {overviewData && (
          <PendingActionsPanel data={overviewData} pendingCounts={pendingCounts} />
        )}

        {/* Charts */}
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <RevenueChart period={period} />
          </div>
          <div className="xl:col-span-5">
            <SubscriptionDonut />
          </div>
        </div>

        {/* User Growth */}
        <UserGrowthChart period={period} />

        {/* Tables */}
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          <OnboardingTable />
          <TopShopsTable period={period} />
        </div>

        {/* Activity Feed */}
        <ActivityFeed limit={8} />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          <Clock size={10} className="text-gray-400" />
          <p className="text-[10px] text-gray-400 font-medium">
            Last synced: {lastUpdated ? formatDateTime(lastUpdated) : "Syncing..."}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;