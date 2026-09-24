// cadmin-web/src/pages/marketplace/Dashboard/MarketplaceDashboard.jsx (do not remove this comment)
// src/pages/marketplace/Dashboard/MarketplaceDashboard.jsx

import { useEffect, useState } from "react";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
} from "lucide-react";

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, trend, trendUp }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className="w-10 h-10 rounded-lg bg-[#05015A]/8 flex items-center justify-center flex-shrink-0">
      <Icon size={20} className="text-[#05015A]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {trend !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs font-medium ${
            trendUp ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
);

// ── Skeleton ───────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-7 w-16 bg-gray-200 rounded" />
        <div className="h-2.5 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────
const MarketplaceDashboard = () => {
  const [loading, setLoading] = useState(true);

  // Replace with real API call
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const stats = [
    {
      label: "Total App Users",
      value: "—",
      sub: "Registered on mobile app",
      icon: Users,
      trend: "—",
      trendUp: true,
    },
    {
      label: "Total Orders",
      value: "—",
      sub: "All time",
      icon: ShoppingBag,
      trend: "—",
      trendUp: true,
    },
    {
      label: "Active Orders",
      value: "—",
      sub: "In progress right now",
      icon: Activity,
      trend: "—",
      trendUp: true,
    },
    {
      label: "Revenue",
      value: "—",
      sub: "This month",
      icon: TrendingUp,
      trend: "—",
      trendUp: true,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Marketplace Overview
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Monitor app users, delivery orders and platform activity
        </p>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Placeholder panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-[#05015A]" />
            <h2 className="text-sm font-semibold text-gray-800">
              Recent Orders
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package size={32} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">
              Order data will appear here
            </p>
          </div>
        </div>

        {/* Recent Sign-ups */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#05015A]" />
            <h2 className="text-sm font-semibold text-gray-800">
              Recent Sign-ups
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users size={32} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">
              New user sign-ups will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDashboard;