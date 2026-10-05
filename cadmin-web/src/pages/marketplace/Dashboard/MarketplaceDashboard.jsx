// cadmin-web/src/pages/marketplace/Dashboard/MarketplaceDashboard.jsx (do not remove this comment)
// src/pages/marketplace/Dashboard/MarketplaceDashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getMarketplaceDashboard } from "../../../api/cadminMarketplaceDashboard";

// ── Currency Formatter ──────────────────────────────────────
const formatCurrency = (v) => {
  const n = parseFloat(v) || 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ── Date/Time Formatter ──────────────────────────────────────
const formatTime = (d) => {
  if (!d) return "Never";
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

// ── Order Status Styling Map ────────────────────────────────
const STATUS_STYLES = {
  PLACED: "bg-blue-50 text-blue-700 border border-blue-100",
  ACCEPTED: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  READY_FOR_PICKUP: "bg-amber-50 text-amber-700 border border-amber-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  REJECTED: "bg-red-50 text-red-700 border border-red-100",
  CANCELLED: "bg-gray-100 text-gray-600 border border-gray-200",
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PLACED;
  const label = status ? status.replace(/_/g, " ") : "PLACED";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${style}`}>
      {label}
    </span>
  );
};

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, trend, trendUp, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 transition-all duration-200 ${
      onClick
        ? "cursor-pointer hover:shadow-md hover:border-indigo-200/80 hover:-translate-y-0.5 group"
        : ""
    }`}
  >
    <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#05015A]/15 group-hover:scale-105 transition-all">
      <Icon size={20} className="text-[#05015A]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium group-hover:text-gray-700 transition-colors">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      {trend && (
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
    {onClick && (
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-[#05015A] group-hover:translate-x-0.5 transition-all self-center"
      />
    )}
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const res = await getMarketplaceDashboard();
        const payload = res?.data || res;
        setData(payload);
      } catch (err) {
        console.error("Marketplace Dashboard load error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = data?.kpis || {};
  const recentOrders = data?.recent_orders || [];
  const recentSignups = data?.recent_signups || [];

  const stats = [
    {
      label: "Total App Users",
      value: kpis.total_app_users ?? "0",
      sub: `${kpis.active_app_users ?? 0} active on mobile app`,
      icon: Users,
      onClick: () => navigate("/marketplace/users"),
    },
    {
      label: "Total Orders",
      value: kpis.total_orders ?? "0",
      sub: `${kpis.orders_today ?? 0} received today`,
      icon: ShoppingBag,
      onClick: () => navigate("/marketplace/orders"),
    },
    {
      label: "Active Orders",
      value: kpis.active_orders ?? "0",
      sub: "In progress right now",
      icon: Activity,
      onClick: () => navigate("/marketplace/orders?status=PLACED,ACCEPTED,READY_FOR_PICKUP"),
    },
    // {
    //   label: "Revenue",
    //   value: formatCurrency(kpis.revenue_this_month || 0),
    //   sub: `${formatCurrency(kpis.revenue_today || 0)} today`,
    //   icon: TrendingUp,
    //   onClick: () => navigate("/marketplace/orders?status=COMPLETED"),
    // },
  ];

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle size={40} className="text-red-500 mb-3" />
        <h2 className="text-base font-bold text-gray-900 mb-1">Failed to load Dashboard</h2>
        <p className="text-sm text-gray-500 max-w-xs text-center">{error}</p>
      </div>
    );
  }

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

      {/* ── Marketplace Real-Time Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Recent Orders Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-[#05015A]" />
              <h2 className="text-sm font-semibold text-gray-800">
                Recent Orders
              </h2>
            </div>
            <button
              onClick={() => navigate("/marketplace/orders")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Package size={32} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Order data will appear here</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[350px] pr-1">
              {recentOrders.map((order) => (
                <div
                  key={order.order_id}
                  onClick={() => navigate(`/marketplace/orders?search=${encodeURIComponent(order.order_number)}`)}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-900">{order.order_number}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {order.customer_name} · {order.shop_name || "Direct Marketplace"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(order.placed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sign-ups Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#05015A]" />
              <h2 className="text-sm font-semibold text-gray-800">
                Recent Sign-ups
              </h2>
            </div>
            <button
              onClick={() => navigate("/marketplace/users")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          ) : recentSignups.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Users size={32} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">New user sign-ups will appear here</p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-50 overflow-y-auto max-h-[350px] pr-1">
              {recentSignups.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => navigate(`/marketplace/users?search=${encodeURIComponent(user.phone)}`)}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#05015A]/10 flex items-center justify-center flex-shrink-0 font-bold text-xs text-[#05015A]">
                    {(user.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {user.full_name || "Unnamed Consumer"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Phone size={8} /> {user.phone}</span>
                      {user.email && <span className="flex items-center gap-0.5"><Mail size={8} /> {user.email}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {user.phone_verified && (
                        <span className="text-[9px] px-1 bg-emerald-50 text-emerald-600 rounded font-semibold border border-emerald-100">Verified</span>
                      )}
                      {user.total_orders > 0 && (
                        <span className="text-[9px] px-1 bg-indigo-50 text-indigo-600 rounded font-semibold border border-indigo-100">{user.total_orders} orders</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(user.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MarketplaceDashboard;