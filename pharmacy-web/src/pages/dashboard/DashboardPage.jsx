// pharmacy-web/src/pages/dashboard/DashboardPage.jsx (do not remove this comment)
// src/pages/erp/dashboard/erp/dashboardPage.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Building2,
  Layers,
  FileText,
  Activity,
  ChevronRight,
  Bell,
  CreditCard,
  Truck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Pill,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
  CircleDot,
  Boxes,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../../store/useAuthStore";
import { useToast } from "../../components/common/Toast";

import salesAPI from "../../api/sales";
import purchaseAPI from "../../api/purchase";
import inventoryAPI from "../../api/inventory";
import { fetchUnreadCount } from "../../api/notifications";
import { getMySubscription } from "../../api/subscription";

// ════════════════════════════════════════════
// CONSTANTS & HELPERS
// ════════════════════════════════════════════

const COLORS = {
  primary: "#000060",
  secondary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  teal: "#14B8A6",
  orange: "#F97316",
};

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatFullCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const getDateRange = (range) => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  let startDate = new Date();
  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate.setMonth(endDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setFullYear(endDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
  }
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

// ════════════════════════════════════════════
// HELPER: Safely extract data from API response
// ════════════════════════════════════════════

const extractData = (result, fallback = null) => {
  if (result.status !== "fulfilled") return fallback;

  const value = result.value;

  // Handle { success: true, data: {...} } structure
  if (value?.success && value?.data !== undefined) {
    return value.data;
  }

  // Handle direct data structure
  if (value?.data !== undefined) {
    return value.data;
  }

  // Handle plain object response
  return value || fallback;
};

// ════════════════════════════════════════════
// BACKGROUND PATTERN
// ════════════════════════════════════════════

const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
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

// ════════════════════════════════════════════
// PULSE DOT
// ════════════════════════════════════════════

const PulseDot = ({ color = "emerald" }) => (
  <span className="relative flex h-2 w-2">
    <span
      className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`}
    />
    <span
      className={`relative inline-flex rounded-full h-2 w-2 bg-${color}-500`}
    />
  </span>
);

// ════════════════════════════════════════════
// SKELETONS
// ════════════════════════════════════════════

const StatCardSkeleton = () => (
  <div className="bg-white/70 backdrop-blur rounded-2xl p-3.5 border border-gray-100/80 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gray-200 rounded-xl" />
      <div className="flex-1">
        <div className="h-2.5 bg-gray-200 rounded w-16 mb-1.5" />
        <div className="h-5 bg-gray-200 rounded w-24" />
      </div>
      <div className="w-12 h-5 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const ChartSkeleton = ({ h = 240 }) => (
  <div className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-gray-100/80 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
    <div className="bg-gray-100 rounded-xl" style={{ height: h }} />
  </div>
);

// ════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════

const StatCard = ({
  title,
  value,
  sub,
  change,
  trend,
  icon: Icon,
  gradient,
  onClick,
  loading,
  delay = 0,
}) => {
  if (loading) return <StatCardSkeleton />;

  const isUp = trend === "up";
  const hasChange = change !== undefined && change !== null && !isNaN(change);

  const gradients = {
    green: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-violet-600",
    amber: "from-amber-500 to-orange-600",
    red: "from-red-500 to-rose-600",
    pink: "from-pink-500 to-rose-600",
    teal: "from-teal-500 to-cyan-600",
    indigo: "from-indigo-500 to-blue-600",
    cyan: "from-cyan-500 to-blue-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: delay * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 
        border border-gray-100/80 shadow-sm hover:shadow-lg hover:border-indigo-200/60
        transition-all duration-300 group ${onClick ? "cursor-pointer" : ""}`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
          gradients[gradient] || gradients.blue
        } 
        opacity-0 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
            gradients[gradient] || gradients.blue
          } 
          flex items-center justify-center shadow-sm group-hover:shadow-md 
          group-hover:scale-110 transition-all duration-300`}
        >
          <Icon size={16} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">
            {value}
          </p>
        </div>

        {hasChange && (
          <div
            className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
            ${
              isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      {sub && (
        <p className="text-[10px] text-gray-400 mt-1.5 pl-12 truncate">{sub}</p>
      )}

      {onClick && (
        <ChevronRight
          size={14}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 
            group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
        />
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════
// QUICK ACTION PILL
// ════════════════════════════════════════════

const QuickAction = ({
  title,
  icon: Icon,
  gradient,
  onClick,
  badge,
  delay = 0,
}) => {
  const gradients = {
    green:
      "from-emerald-500 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/30",
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/30",
    purple:
      "from-purple-500 to-violet-600 shadow-purple-500/20 hover:shadow-purple-500/30",
    amber:
      "from-amber-500 to-orange-600 shadow-amber-500/20 hover:shadow-amber-500/30",
    indigo:
      "from-indigo-500 to-blue-600 shadow-indigo-500/20 hover:shadow-indigo-500/30",
    teal: "from-teal-500 to-cyan-600 shadow-teal-500/20 hover:shadow-teal-500/30",
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.08, type: "spring", stiffness: 400 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r 
        ${gradients[gradient]} text-white font-semibold text-xs shadow-lg hover:shadow-xl 
        transition-all duration-300 group overflow-hidden flex-shrink-0`}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
      <Icon
        size={16}
        className="relative z-10 group-hover:rotate-12 transition-transform"
        strokeWidth={2.5}
      />
      <span className="relative z-10 whitespace-nowrap">{title}</span>
      {badge && (
        <span className="relative z-10 bg-white/25 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </motion.button>
  );
};

// ════════════════════════════════════════════
// BRANCH BADGE
// ════════════════════════════════════════════

const BranchBadge = ({ isGlobalMode, branchName, lastUpdated }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
      ${
        isGlobalMode
          ? "bg-blue-50/80 border-blue-200/60 text-blue-700"
          : "bg-emerald-50/80 border-emerald-200/60 text-emerald-700"
      } backdrop-blur-sm`}
  >
    {isGlobalMode ? (
      <Layers size={12} className="text-blue-500" />
    ) : (
      <Building2 size={12} className="text-emerald-500" />
    )}
    <span>{isGlobalMode ? "All Branches" : branchName || "Branch"}</span>
    <PulseDot color={isGlobalMode ? "blue" : "emerald"} />
    {lastUpdated && (
      <span className="text-[10px] opacity-60 ml-1">
        {formatDateTime(lastUpdated)}
      </span>
    )}
  </motion.div>
);

// ════════════════════════════════════════════
// CHART TOOLTIP
// ════════════════════════════════════════════

const ChartTooltip = ({ active, payload, label, isCurrency = false }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 backdrop-blur-lg p-3 rounded-xl shadow-2xl border border-gray-700/50">
      <p className="text-[10px] font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-gray-400">{entry.name}:</span>
          <span className="text-[11px] font-bold text-white ml-auto pl-3">
            {isCurrency
              ? formatFullCurrency(entry.value)
              : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════
// ALERT PILL
// ════════════════════════════════════════════

const AlertPill = ({ type, title, count, icon: Icon, onClick }) => {
  const styles = {
    warning:
      "bg-amber-50/80 border-amber-200/60 text-amber-700 hover:bg-amber-100/80",
    danger: "bg-red-50/80 border-red-200/60 text-red-700 hover:bg-red-100/80",
    info: "bg-blue-50/80 border-blue-200/60 text-blue-700 hover:bg-blue-100/80",
    success:
      "bg-emerald-50/80 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100/80",
  };
  const iconStyles = {
    warning: "text-amber-500",
    danger: "text-red-500",
    info: "text-blue-500",
    success: "text-emerald-500",
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm 
        transition-all text-xs font-medium group flex-shrink-0 ${styles[type]}`}
    >
      <Icon size={14} className={iconStyles[type]} />
      <span className="truncate whitespace-nowrap">{title}</span>
      {count > 0 && (
        <span className="bg-white/60 font-bold text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {count}
        </span>
      )}
    </motion.button>
  );
};

// ════════════════════════════════════════════
// METRIC CHIP (compact secondary stat)
// ════════════════════════════════════════════

const MetricChip = ({
  icon: Icon,
  label,
  value,
  badge,
  color = "gray",
  onClick,
  loading,
}) => {
  const colors = {
    amber: "text-amber-500",
    red: "text-red-500",
    pink: "text-pink-500",
    teal: "text-teal-500",
    blue: "text-blue-500",
    green: "text-green-500",
    gray: "text-gray-500",
    indigo: "text-indigo-500",
    cyan: "text-cyan-500",
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 px-2 py-1 animate-pulse">
        <div className="w-3 h-3 bg-gray-200 rounded" />
        <div className="w-10 h-2.5 bg-gray-200 rounded" />
        <div className="w-8 h-3 bg-gray-200 rounded" />
      </div>
    );

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100/80 
        transition-all group cursor-pointer whitespace-nowrap active:scale-95"
    >
      <Icon
        size={12}
        className={`${
          colors[color] || colors.gray
        } group-hover:scale-110 transition-transform`}
      />
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      <span className="text-[11px] font-bold text-gray-800">{value}</span>
      {badge && <span className="text-[9px] text-gray-400">({badge})</span>}
    </button>
  );
};

// ════════════════════════════════════════════
// TRANSACTION ROW
// ════════════════════════════════════════════

const TransactionRow = ({ tx, onClick }) => {
  const cfg = {
    SALE: {
      icon: ShoppingCart,
      bg: "bg-emerald-100",
      color: "text-emerald-600",
    },
    PURCHASE: { icon: Truck, bg: "bg-blue-100", color: "text-blue-600" },
    RETURN: { icon: RotateCcw, bg: "bg-red-100", color: "text-red-600" },
  };
  const c = cfg[tx.type] || cfg.SALE;
  const TxIcon = c.icon;
  const statusClr = {
    CONFIRMED: "text-emerald-600 bg-emerald-50",
    DRAFT: "text-gray-500 bg-gray-50",
    PENDING: "text-amber-600 bg-amber-50",
    CANCELLED: "text-red-600 bg-red-50",
  };

  return (
    <motion.div
      whileHover={{ x: 3, backgroundColor: "rgba(99,102,241,0.03)" }}
      onClick={onClick}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors group"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg} flex-shrink-0`}
      >
        <TxIcon size={14} className={c.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-gray-900 truncate">
            {tx.invoice_number}
          </p>
          <span
            className={`text-[9px] px-1 py-px rounded font-medium ${
              statusClr[tx.status] || statusClr.DRAFT
            }`}
          >
            {tx.status}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">
          {tx.party_name || "Walk-in"} · {formatDateTime(tx.date)}
        </p>
      </div>
      <p
        className={`text-xs font-bold flex-shrink-0 ${
          tx.type === "RETURN" ? "text-red-500" : "text-gray-900"
        }`}
      >
        {tx.type === "RETURN" ? "-" : ""}
        {formatCurrency(tx.amount)}
      </p>
    </motion.div>
  );
};

// ════════════════════════════════════════════
// TOP PRODUCT BAR
// ════════════════════════════════════════════

const ProductBar = ({ product, index, maxQty }) => {
  const pct = maxQty > 0 ? (product.total_quantity / maxQty) * 100 : 0;
  const barColors = [
    "from-amber-400 to-amber-500",
    "from-gray-400 to-gray-500",
    "from-orange-400 to-orange-500",
    "from-indigo-400 to-indigo-500",
    "from-purple-400 to-purple-500",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-gray-50/80 transition-colors"
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center text-white font-bold 
        text-[10px] bg-gradient-to-br ${
          barColors[index] || barColors[4]
        } flex-shrink-0`}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-medium text-gray-800 truncate pr-2">
            {product.medicine_name}
          </p>
          <p className="text-[10px] font-bold text-gray-900 flex-shrink-0">
            {formatCurrency(product.total_revenue)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full"
            />
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {formatNumber(product.total_quantity)}u
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════
// MINI METRIC
// ════════════════════════════════════════════

const MiniMetric = ({ label, value, color }) => (
  <div className="text-center px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-100/80">
    <p className="text-[10px] text-gray-400 font-medium">{label}</p>
    <p className={`text-sm font-extrabold ${color}`}>{value}</p>
  </div>
);

// ════════════════════════════════════════════
// SECTION HEADER
// ════════════════════════════════════════════

const SectionHeader = ({
  title,
  subtitle,
  action,
  actionLabel,
  icon: Icon,
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-indigo-500" />}
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
      </div>
    </div>
    {action && (
      <button
        onClick={action}
        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold 
          flex items-center gap-1 hover:gap-1.5 transition-all"
      >
        {actionLabel || "View All"} <ExternalLink size={10} />
      </button>
    )}
  </div>
);

// ════════════════════════════════════════════
// GLASS CARD
// ════════════════════════════════════════════

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 
    shadow-sm hover:shadow-md transition-shadow p-4 ${className}`}
  >
    {children}
  </div>
);

// ════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════

const DashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const user = useAuthStore((s) => s.user);
  const isGlobalMode = branchContext.mode === "GLOBAL";
  const currentBranchName = branchContext.branch_name;

  const prevBranchRef = useRef({
    mode: branchContext.mode,
    branch_id: branchContext.branch_id,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("week");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const [salesStats, setSalesStats] = useState(null);
  const [purchaseStats, setPurchaseStats] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [notifications, setNotifications] = useState({
    total: 0,
    critical: 0,
    high: 0,
  });
  const [subscription, setSubscription] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // ════════════════════════════════════════════
  // DATA FETCHING - FIXED VERSION
  // ════════════════════════════════════════════

  const fetchDashboardData = useCallback(
    async (showLoadingState = true) => {
      if (showLoadingState) {
        setLoading(true);
        setError(null);
      }

      try {
        const { startDate, endDate } = getDateRange(dateRange);
        const dateParams = { startDate, endDate };

        const results = await Promise.allSettled([
          salesAPI.getStats(dateParams), // 0
          purchaseAPI.getStats(dateParams), // 1
          inventoryAPI.getSummary(), // 2
          inventoryAPI.getLowStock({ limit: 10 }), // 3
          inventoryAPI.getExpiringSoon(30), // 4
          fetchUnreadCount(), // 5
          salesAPI.getAll({ limit: 10, ...dateParams }), // 6
          purchaseAPI.getAll({ limit: 10, ...dateParams }), // 7
          salesAPI.getAllReturns({ limit: 5, ...dateParams }), // 8
          purchaseAPI.getAllReturns({ limit: 5, ...dateParams }), // 9
          isSuperAdmin ? getMySubscription() : Promise.resolve(null), // 10
        ]);

        //  FIXED: Properly extract data from each result

        // Sales Stats - Backend returns: { totalInvoices, totalSalesAmount, totalReceivedAmount, totalOutstandingAmount, todaySalesAmount, todayInvoiceCount }
        const salesData = extractData(results[0], {});
        setSalesStats(salesData);

        // Purchase Stats - Backend returns: { totalInvoices, totalAmount, unpaidAmount }
        const purchaseData = extractData(results[1], {});
        setPurchaseStats(purchaseData);

        // Inventory Summary - Backend returns: { totalItems, totalStockQuantity, lowStockCount, outOfStockCount, expiringSoonCount, expiredCount }
        const inventoryData = extractData(results[2], {});
        setInventorySummary(inventoryData);

        //  FIXED: Low Stock Items - Backend returns array directly, not { items: [...] }
        const lowStockData = extractData(results[3], []);
        setLowStockItems(
          Array.isArray(lowStockData)
            ? lowStockData
            : lowStockData?.items || [],
        );

        //  FIXED: Expiring Items - Backend returns array directly
        const expiringData = extractData(results[4], []);
        setExpiringItems(
          Array.isArray(expiringData)
            ? expiringData
            : expiringData?.items || [],
        );

        // Notifications - Backend returns: { total, by_priority: { critical, high, normal, low }, has_critical, has_high }
        const notifData = extractData(results[5], {});
        setNotifications({
          total: notifData?.total || 0,
          critical: notifData?.by_priority?.critical || 0,
          high: notifData?.by_priority?.high || 0,
        });

        // Recent Sales
        const recentSalesData = extractData(results[6], { invoices: [] });
        const salesInvoices = recentSalesData?.invoices || [];
        setRecentSales(
          salesInvoices.map((inv) => ({
            ...inv,
            type: "SALE",
            party_name: inv.customer?.name || inv.walkin_name,
            amount: inv.net_amount,
            date: inv.invoice_date || inv.created_at,
          })),
        );

        //  FIXED: Top products calculation - getAll doesn't include lineItems
        // Instead, calculate from sales stats or show placeholder
        // For now, we'll leave it empty as the API doesn't provide this data
        // A proper fix would require a dedicated API endpoint
        setTopProducts([]);

        // Recent Purchases
        const recentPurchasesData = extractData(results[7], { invoices: [] });
        setRecentPurchases(
          (recentPurchasesData?.invoices || []).map((inv) => ({
            ...inv,
            type: "PURCHASE",
            party_name: inv.supplier?.name,
            amount: inv.net_amount,
            date: inv.invoice_date || inv.created_at,
          })),
        );

        // Sales Returns
        const salesReturnsData = extractData(results[8], { returns: [] });
        setSalesReturns(salesReturnsData?.returns || []);

        // Purchase Returns
        const purchaseReturnsData = extractData(results[9], { returns: [] });
        setPurchaseReturns(purchaseReturnsData?.returns || []);

        // Subscription
        if (results[10].status === "fulfilled" && results[10].value) {
          const subData = extractData(results[10], null);
          setSubscription(subData);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
        toast.error(
          "Failed to load dashboard",
          err.message || "Please try refreshing",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      dateRange,
      branchContext.mode,
      branchContext.branch_id,
      isSuperAdmin,
      toast,
    ],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const prev = prevBranchRef.current;
    const changed =
      prev.mode !== branchContext.mode ||
      prev.branch_id !== branchContext.branch_id;
    if (changed) {
      prevBranchRef.current = {
        mode: branchContext.mode,
        branch_id: branchContext.branch_id,
      };
      if (branchContext.mode === "GLOBAL")
        toast.info("All Branches", "Loading combined data...");
      else if (branchContext.branch_name)
        toast.info("Branch Changed", `Loading ${branchContext.branch_name}`);
      fetchDashboardData(true);
    }
  }, [
    branchContext.mode,
    branchContext.branch_id,
    branchContext.branch_name,
    toast,
    fetchDashboardData,
  ]);

  // ════════════════════════════════════════════
  // COMPUTED DATA - FIXED FIELD NAMES
  // ════════════════════════════════════════════

  //  FIXED: Calculate "In Stock" count from available data
  const stockStatusData = useMemo(() => {
    if (!inventorySummary) return [];

    const totalItems = inventorySummary.totalItems || 0;
    const lowStock = inventorySummary.lowStockCount || 0;
    const outOfStock = inventorySummary.outOfStockCount || 0;
    const expiringSoon = inventorySummary.expiringSoonCount || 0;
    const expired = inventorySummary.expiredCount || 0;

    // Calculate healthy "In Stock" items (items that are not low, out, expiring, or expired)
    // Note: totalItems only counts items with stock > 0, so outOfStock shouldn't be subtracted
    const inStockCount = Math.max(0, totalItems - lowStock - expiringSoon);

    return [
      { name: "In Stock", value: inStockCount, color: COLORS.success },
      { name: "Low Stock", value: lowStock, color: COLORS.warning },
      { name: "Out of Stock", value: outOfStock, color: COLORS.danger },
      { name: "Expiring Soon", value: expiringSoon, color: COLORS.orange },
      { name: "Expired", value: expired, color: COLORS.purple },
    ].filter((i) => i.value > 0);
  }, [inventorySummary]);

  const revenueChartData = useMemo(() => {
    const days =
      dateRange === "today"
        ? 1
        : dateRange === "week"
          ? 7
          : dateRange === "month"
            ? 30
            : 12;
    const salesByDate = new Map();
    const purchasesByDate = new Map();

    recentSales.forEach((s) => {
      const d = new Date(s.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      salesByDate.set(d, (salesByDate.get(d) || 0) + parseFloat(s.amount || 0));
    });
    recentPurchases.forEach((p) => {
      const d = new Date(p.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      purchasesByDate.set(
        d,
        (purchasesByDate.get(d) || 0) + parseFloat(p.amount || 0),
      );
    });

    const data = [];
    for (let i = Math.min(days - 1, 6); i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const lbl = dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const sales = salesByDate.get(lbl) || 0;
      const purchases = purchasesByDate.get(lbl) || 0;
      data.push({ date: lbl, sales, purchases, profit: sales - purchases });
    }
    return data;
  }, [recentSales, recentPurchases, dateRange]);

  const recentTransactions = useMemo(
    () =>
      [...recentSales.slice(0, 5), ...recentPurchases.slice(0, 5)]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6),
    [recentSales, recentPurchases],
  );

  const maxProductSales = useMemo(
    () => Math.max(...topProducts.map((p) => p.total_quantity), 1),
    [topProducts],
  );

  const pendingReturnCount = useMemo(
    () =>
      salesReturns.filter(
        (r) => r.return_approval_status === "PENDING_APPROVAL",
      ).length +
      purchaseReturns.filter(
        (r) => r.return_approval_status === "PENDING_APPROVAL",
      ).length,
    [salesReturns, purchaseReturns],
  );

  const totalAlerts = useMemo(() => {
    let count = 0;
    if (lowStockItems.length > 0) count++;
    if (expiringItems.length > 0) count++;
    if (notifications.critical > 0) count++;
    if (pendingReturnCount > 0) count++;
    if (isSuperAdmin && subscription?.days_remaining < 30) count++;
    return count;
  }, [
    lowStockItems,
    expiringItems,
    notifications,
    pendingReturnCount,
    subscription,
    isSuperAdmin,
  ]);

  // ════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const handleQuickAction = useCallback(
    (action) => {
      if (isGlobalMode && ["new-sale", "new-purchase"].includes(action)) {
        toast.warning(
          "Select a Branch",
          "Please select a specific branch first",
        );
        return;
      }
      const routes = {
        "new-sale": "/erp/sales-billing",
        "new-purchase": "/erp/purchase-billing",
        inventory: "/erp/inventory",
        // reports: "/erp/reports-sales",
      };
      if (routes[action]) navigate(routes[action]);
    },
    [navigate, isGlobalMode, toast],
  );

  // ════════════════════════════════════════════
  // ERROR STATE
  // ════════════════════════════════════════════

  if (error && !loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Dashboard Error
          </h2>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm
              hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════

  const firstName =
    user?.name || user?.first_name || user?.full_name?.split(" ")[0] || "User";
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 relative">
      <GridPattern />

      <div className="relative max-w-[1800px] mx-auto px-3 py-3 lg:px-5 lg:py-4 space-y-3">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl lg:text-2xl font-extrabold text-gray-900 tracking-tight"
            >
              {greeting}, {firstName}
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 2, delay: 0.5 }}
                className="inline-block ml-1.5"
              >
                👋
              </motion.span>
            </motion.h1>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {isSuperAdmin && (
                <BranchBadge
                  isGlobalMode={isGlobalMode}
                  branchName={currentBranchName}
                  lastUpdated={lastUpdated}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Date Range */}
            <div className="flex bg-white/80 backdrop-blur rounded-xl border border-gray-200/60 p-0.5 shadow-sm">
              {[
                { key: "today", label: "Today" },
                { key: "week", label: "7D" },
                { key: "month", label: "30D" },
                { key: "year", label: "1Y" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setDateRange(r.key)}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                    dateRange === r.key
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-xl bg-white/80 border border-gray-200/60 text-gray-500 
                hover:bg-gray-50 transition-all disabled:opacity-40"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* ── QUICK ACTIONS + INLINE ALERTS ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <QuickAction
            title="Sale"
            icon={ShoppingCart}
            gradient="blue"
            onClick={() => handleQuickAction("new-sale")}
            badge={isGlobalMode ? "⚡" : null}
            delay={0}
          />
          <QuickAction
            title="Purchase"
            icon={Truck}
            gradient="blue"
            onClick={() => handleQuickAction("new-purchase")}
            badge={isGlobalMode ? "⚡" : null}
            delay={1}
          />
          <QuickAction
            title="Stock"
            icon={Package}
            gradient="blue"
            onClick={() => handleQuickAction("inventory")}
            badge={lowStockItems.length > 0 ? `${lowStockItems.length}` : null}
            delay={2}
          />
          {/* <QuickAction
            title="Reports"
            icon={BarChart3}
            gradient="blue"
            onClick={() => handleQuickAction("reports")}
            delay={3}
          /> */}

          {totalAlerts > 0 && (
            <>
              <div className="h-5 w-px bg-gray-200/80 mx-0.5 flex-shrink-0" />
              {lowStockItems.length > 0 && (
                <AlertPill
                  type="warning"
                  title="Low Stock"
                  count={lowStockItems.length}
                  icon={AlertTriangle}
                  onClick={() => navigate("/erp/inventory?filter=lowstock")}
                />
              )}
              {expiringItems.length > 0 && (
                <AlertPill
                  type="danger"
                  title="Expiring"
                  count={expiringItems.length}
                  icon={Clock}
                  onClick={() => navigate("/erp/inventory?filter=expiring")}
                />
              )}
              {notifications.critical > 0 && (
                <AlertPill
                  type="info"
                  title="Critical"
                  count={notifications.critical}
                  icon={Bell}
                  onClick={() => navigate("/erp/notifications?priority=critical")}
                />
              )}
              {pendingReturnCount > 0 && (
                <AlertPill
                  type="warning"
                  title="Returns"
                  count={pendingReturnCount}
                  icon={RotateCcw}
                  onClick={() => navigate("/erp/sales/returns")}
                />
              )}
              {isSuperAdmin && subscription?.days_remaining < 30 && (
                <AlertPill
                  type="info"
                  title={`Plan: ${subscription.days_remaining}d`}
                  count={subscription.days_remaining}
                  icon={CreditCard}
                  onClick={() => navigate("/erp/settings/plans")}
                />
              )}
            </>
          )}
        </div>

        {/* ── PRIMARY STATS ──  FIXED FIELD NAMES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard
            title="Sales"
            value={formatCurrency(salesStats?.totalSalesAmount || 0)}
            sub={`${formatNumber(salesStats?.totalInvoices || 0)} invoices`}
            change={salesStats?.growthPercentage}
            trend={(salesStats?.growthPercentage || 0) >= 0 ? "up" : "down"}
            icon={DollarSign}
            gradient="green"
            onClick={() => navigate("/erp/sales-invoice")}
            loading={loading}
            delay={0}
          />
          <StatCard
            title="Purchases"
            value={formatCurrency(purchaseStats?.totalAmount || 0)}
            sub={`${formatNumber(purchaseStats?.totalInvoices || 0)} invoices`}
            change={purchaseStats?.growthPercentage}
            trend={(purchaseStats?.growthPercentage || 0) >= 0 ? "up" : "down"}
            icon={Truck}
            gradient="blue"
            onClick={() => navigate("/erp/purchase-invoices")}
            loading={loading}
            delay={1}
          />
          <StatCard
            title="Products"
            value={formatNumber(inventorySummary?.totalItems || 0)}
            sub={`${formatNumber(inventorySummary?.totalStockQuantity || 0)} units`}
            icon={Package}
            gradient="purple"
            onClick={() => navigate("/erp/inventory")}
            loading={loading}
            delay={2}
          />
          <StatCard
            title="Low Stock"
            value={formatNumber(
              inventorySummary?.lowStockCount || lowStockItems.length || 0,
            )}
            sub={`${formatNumber(inventorySummary?.outOfStockCount || 0)} out of stock`}
            icon={AlertTriangle}
            gradient={
              (inventorySummary?.lowStockCount || 0) > 10 ? "red" : "amber"
            }
            onClick={() => navigate("/erp/inventory?filter=lowstock")}
            loading={loading}
            delay={3}
          />
        </div>

        {/* ── SECONDARY METRICS STRIP ──  FIXED FIELD NAMES */}
        <div
          className="flex items-center gap-0.5 bg-white/70 backdrop-blur-sm rounded-xl 
          px-2 py-1 border border-gray-100/80 overflow-x-auto scrollbar-hide"
        >
          <MetricChip
            icon={Clock}
            label="Outstanding"
            color="amber"
            value={formatCurrency(salesStats?.totalOutstandingAmount || 0)}
            onClick={() => navigate("/erp/sales-invoice?status=pending")}
            loading={loading}
          />
          <div className="h-3.5 w-px bg-gray-200 mx-0.5 flex-shrink-0" />
          <MetricChip
            icon={Calendar}
            label="Expiring"
            color="red"
            value={formatNumber(
              inventorySummary?.expiringSoonCount || expiringItems.length || 0,
            )}
            badge="30d"
            onClick={() => navigate("/erp/inventory?filter=expiring")}
            loading={loading}
          />
          <div className="h-3.5 w-px bg-gray-200 mx-0.5 flex-shrink-0" />
          <MetricChip
            icon={DollarSign}
            label="Today"
            color="green"
            value={formatCurrency(salesStats?.todaySalesAmount || 0)}
            badge={`${salesStats?.todayInvoiceCount || 0} bills`}
            onClick={() => navigate("/erp/sales-invoice")}
            loading={loading}
          />
          <div className="h-3.5 w-px bg-gray-200 mx-0.5 flex-shrink-0" />
          <MetricChip
            icon={RotateCcw}
            label="Returns"
            color="pink"
            value={formatNumber(salesReturns.length)}
            badge={`${salesReturns.filter((r) => r.return_approval_status === "PENDING_APPROVAL").length} pending`}
            onClick={() => navigate("/erp/sales-returns")}
            loading={loading}
          />
          <div className="h-3.5 w-px bg-gray-200 mx-0.5 flex-shrink-0" />
          <MetricChip
            icon={Bell}
            label="Alerts"
            color={notifications.critical > 0 ? "red" : "teal"}
            value={formatNumber(notifications.total)}
            badge={
              notifications.critical > 0
                ? `${notifications.critical} critical`
                : null
            }
            onClick={() => navigate("/erp/notifications")}
            loading={loading}
          />
        </div>

        {/* ── MAIN GRID: Charts ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Revenue Chart */}
          <GlassCard className="xl:col-span-7">
            {loading ? (
              <ChartSkeleton h={220} />
            ) : (
              <>
                <SectionHeader
                  title="Revenue Overview"
                  subtitle="Sales vs Purchases"
                  icon={Activity}
                />
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart
                    data={revenueChartData}
                    margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesG" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={COLORS.success}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.success}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip content={<ChartTooltip isCurrency />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={COLORS.success}
                      fill="url(#salesG)"
                      strokeWidth={2}
                      name="Sales"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                    <Bar
                      dataKey="purchases"
                      fill={COLORS.info}
                      radius={[3, 3, 0, 0]}
                      name="Purchases"
                      opacity={0.75}
                      maxBarSize={28}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <MiniMetric
                    label="Total Sales"
                    value={formatCurrency(
                      revenueChartData.reduce((s, d) => s + d.sales, 0),
                    )}
                    color="text-emerald-600"
                  />
                  <MiniMetric
                    label="Total Purchases"
                    value={formatCurrency(
                      revenueChartData.reduce((s, d) => s + d.purchases, 0),
                    )}
                    color="text-blue-600"
                  />
                  <MiniMetric
                    label="Net Profit"
                    value={formatCurrency(
                      revenueChartData.reduce((s, d) => s + d.profit, 0),
                    )}
                    color="text-purple-600"
                  />
                </div>
              </>
            )}
          </GlassCard>

          {/* Stock Distribution */}
          <GlassCard className="xl:col-span-5">
            {loading ? (
              <ChartSkeleton h={220} />
            ) : (
              <>
                <SectionHeader
                  title="Stock Distribution"
                  icon={PieChartIcon}
                  action={() => navigate("/erp/inventory")}
                  actionLabel="Manage"
                />
                {stockStatusData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={stockStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={800}
                          >
                            {stockStatusData.map((e, i) => (
                              <Cell key={i} fill={e.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {stockStatusData.map((s) => (
                        <div key={s.name} className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-xs text-gray-500 flex-1">
                            {s.name}
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            {formatNumber(s.value)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">
                          Total
                        </span>
                        <span className="text-sm font-extrabold text-gray-900">
                          {formatNumber(
                            stockStatusData.reduce((a, b) => a + b.value, 0),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <Boxes size={36} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No stock data</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Top Products */}
          <GlassCard className="lg:col-span-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-32" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-md" />
                    <div className="flex-1 h-3 bg-gray-200 rounded" />
                    <div className="w-12 h-3 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* <SectionHeader
                  title="Top Products"
                  subtitle="By revenue"
                  icon={Sparkles}
                  action={() => navigate("/erp/reports-sales")}
                /> */}
                {topProducts.length > 0 ? (
                  <div className="space-y-0.5">
                    {topProducts.map((p, i) => (
                      <ProductBar
                        key={p.medicine_id}
                        product={p}
                        index={i}
                        maxQty={maxProductSales}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-300">
                    <Pill size={32} className="mx-auto mb-1.5 opacity-50" />
                    <p className="text-xs">No sales data yet</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Top products will appear after sales
                    </p>
                  </div>
                )}
              </>
            )}
          </GlassCard>

          {/* Recent Transactions */}
          <GlassCard className="lg:col-span-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-36" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                    <div className="flex-1 h-3 bg-gray-200 rounded" />
                    <div className="w-14 h-3 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <SectionHeader
                  title="Recent Transactions"
                  subtitle="Sales & purchases"
                  icon={FileText}
                  action={() => navigate("/erp/sales-invoice")}
                />
                {recentTransactions.length > 0 ? (
                  <div
                    className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin 
                    scrollbar-thumb-gray-200 scrollbar-track-transparent"
                  >
                    {recentTransactions.map((tx) => (
                      <TransactionRow
                        key={`${tx.type}-${tx.invoice_id}`}
                        tx={tx}
                        onClick={() =>
                          navigate(
                            tx.type === "SALE"
                              ? "/erp/sales-invoice"
                              : "/erp/purchase-invoice",
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-300">
                    <FileText size={32} className="mx-auto mb-1.5 opacity-50" />
                    <p className="text-xs">No transactions</p>
                  </div>
                )}
              </>
            )}
          </GlassCard>

          {/* Low Stock Preview -  FIXED FIELD NAMES */}
          <GlassCard className="lg:col-span-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-28" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <SectionHeader
                  title="Low Stock Items"
                  subtitle="Needs restocking"
                  icon={AlertTriangle}
                  action={
                    lowStockItems.length > 0
                      ? () => navigate("/erp/inventory?filter=lowstock")
                      : undefined
                  }
                  actionLabel={
                    lowStockItems.length > 0
                      ? `All (${lowStockItems.length})`
                      : undefined
                  }
                />
                {lowStockItems.length > 0 ? (
                  <div
                    className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin 
                    scrollbar-thumb-gray-200 scrollbar-track-transparent"
                  >
                    {lowStockItems.slice(0, 6).map((item, i) => (
                      <motion.div
                        key={item.inventory_id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate("/erp/inventory?filter=lowstock")}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-50/60 
                          to-orange-50/40 border border-amber-100/80 hover:border-amber-200 
                          hover:shadow-sm cursor-pointer transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Pill size={14} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {/*  FIXED: Use correct field names from inventory service */}
                            {item.medicine_name ||
                              item.medicine?.name ||
                              item.name ||
                              "Unknown"}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {item.batch_number || item.batch || "-"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-amber-700">
                            {/*  FIXED: Use correct field name */}
                            {item.current_stock ??
                              item.available_stock ??
                              item.quantity ??
                              0}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            min{" "}
                            {item.minimum_stock ??
                              item.medicine_min_stock ??
                              item.min_stock_level ??
                              10}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-300">
                    <CheckCircle2
                      size={32}
                      className="mx-auto mb-1.5 text-emerald-300"
                    />
                    <p className="text-xs text-emerald-500">
                      All stock healthy
                    </p>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </div>

        {/* ── FOOTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          <CircleDot size={8} className="text-indigo-400" />
          <p className="text-[10px] text-gray-400 font-medium">
            Last synced:{" "}
            {lastUpdated ? formatDateTime(lastUpdated) : "Syncing..."}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
