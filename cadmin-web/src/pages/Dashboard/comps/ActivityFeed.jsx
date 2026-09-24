// cadmin-web/src/pages/Dashboard/comps/ActivityFeed.jsx (do not remove this comment)
// src/pages/Dashboard/comps/ActivityFeed.jsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  UserPlus,
  Store,
  CreditCard,
  ShieldCheck,
  Ticket,
  Settings,
  Bell,
  Loader2,
  AlertCircle,
  RefreshCw,
  Circle,
} from "lucide-react";
import { getRecentActivity } from "../../../api/cadminDashboard";

/* ───────────────── Activity Type Config ───────────────── */
const ACTIVITY_CONFIG = {
  user_created: {
    icon: UserPlus,
    bg: "bg-blue-50",
    color: "text-blue-600",
    ring: "ring-blue-100",
    dot: "bg-blue-500",
    label: "New User",
  },
  user_suspended: {
    icon: UserPlus,
    bg: "bg-red-50",
    color: "text-red-600",
    ring: "ring-red-100",
    dot: "bg-red-500",
    label: "Suspended",
  },
  user_activated: {
    icon: UserPlus,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
    label: "Activated",
  },
  shop_created: {
    icon: Store,
    bg: "bg-indigo-50",
    color: "text-indigo-600",
    ring: "ring-indigo-100",
    dot: "bg-indigo-500",
    label: "New Shop",
  },
  shop_verified: {
    icon: ShieldCheck,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
    label: "Verified",
  },
  shop_suspended: {
    icon: Store,
    bg: "bg-red-50",
    color: "text-red-600",
    ring: "ring-red-100",
    dot: "bg-red-500",
    label: "Suspended",
  },
  subscription_created: {
    icon: CreditCard,
    bg: "bg-violet-50",
    color: "text-violet-600",
    ring: "ring-violet-100",
    dot: "bg-violet-500",
    label: "Subscription",
  },
  ticket_resolved: {
    icon: Ticket,
    bg: "bg-orange-50",
    color: "text-orange-600",
    ring: "ring-orange-100",
    dot: "bg-orange-500",
    label: "Resolved",
  },
  broadcast_sent: {
    icon: Bell,
    bg: "bg-amber-50",
    color: "text-amber-600",
    ring: "ring-amber-100",
    dot: "bg-amber-500",
    label: "Broadcast",
  },
  plan_updated: {
    icon: CreditCard,
    bg: "bg-indigo-50",
    color: "text-indigo-600",
    ring: "ring-indigo-100",
    dot: "bg-indigo-500",
    label: "Plan Update",
  },
  settings_updated: {
    icon: Settings,
    bg: "bg-gray-50",
    color: "text-gray-600",
    ring: "ring-gray-100",
    dot: "bg-gray-500",
    label: "Settings",
  },
};

const DEFAULT_CONFIG = ACTIVITY_CONFIG.settings_updated;

/* ───────────────── Time Formatter ───────────────── */
const formatTime = (d) => {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const isRecent = (d) => {
  if (!d) return false;
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  return diff < 5;
};

/* ───────────────── Live Pulse Dot ───────────────── */
const LiveDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </span>
);

/* ───────────────── Activity Item ───────────────── */
const ActivityItem = ({ activity, index, isLast }) => {
  const cfg = ACTIVITY_CONFIG[activity.type] || DEFAULT_CONFIG;
  const Icon = cfg.icon;
  const recent = isRecent(activity.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className="relative flex gap-3 group"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent" />
      )}

      {/* Icon */}
      <div className="relative z-10 flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.15 }}
          className={`
            w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color}
            flex items-center justify-center
            ring-2 ${cfg.ring} ring-offset-1 ring-offset-white
            transition-shadow duration-200
            group-hover:shadow-md
          `}
        >
          <Icon size={12} />
        </motion.div>

        {/* Recent indicator */}
        {recent && (
          <span className="absolute -top-0.5 -right-0.5">
            <LiveDot />
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className={`
          flex-1 min-w-0 pb-3 
          rounded-lg px-2 py-1.5 -ml-1
          transition-colors duration-150
          group-hover:bg-gray-50/80
        `}
      >
        {/* Message */}
        <p className="text-[11px] text-gray-800 leading-snug line-clamp-2 group-hover:text-gray-900 transition-colors">
          {activity.message}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mt-1">
          {/* Activity type badge */}
          <span
            className={`
              inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider
              ${cfg.bg} ${cfg.color}
            `}
          >
            {cfg.label}
          </span>

          <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />

          {/* Actor */}
          {activity.actor && (
            <>
              <span className="text-[9px] text-gray-500 truncate max-w-[80px]">
                {activity.actor}
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
            </>
          )}

          {/* Time */}
          <span
            className={`text-[9px] flex-shrink-0 ${
              recent
                ? "text-emerald-600 font-semibold"
                : "text-gray-400"
            }`}
          >
            {formatTime(activity.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ───────────────── Loading Skeleton ───────────────── */
const ActivitySkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex gap-3 animate-pulse">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-1.5 pt-0.5">
          <div className="h-3 bg-gray-100 rounded-md w-[85%]" />
          <div className="flex gap-2">
            <div className="h-2.5 bg-gray-100 rounded w-12" />
            <div className="h-2.5 bg-gray-100 rounded w-8" />
            <div className="h-2.5 bg-gray-100 rounded w-10" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ───────────────── Main Component ───────────────── */
const ActivityFeed = ({ limit = 8 }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchActivity = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await getRecentActivity(limit);
        setData(res.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivity(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const hasRecentActivity = data.some((a) => isRecent(a.timestamp));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-sm">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-gray-900">Activity</h3>
              {hasRecentActivity && <LiveDot />}
            </div>
            <p className="text-[9px] text-gray-400">
              {data.length > 0
                ? `${data.length} recent events`
                : "System events"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Refresh button */}
          <motion.button
            onClick={() => fetchActivity(true)}
            disabled={refreshing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-6 h-6 rounded-md flex items-center justify-center 
                       text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                       transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={10}
              className={refreshing ? "animate-spin" : ""}
            />
          </motion.button>

          {/* View all link */}
          <button
            onClick={() => navigate("/audits")}
            className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 
                       hover:text-indigo-700 hover:underline transition-colors"
          >
            All logs <ArrowRight size={10} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ActivitySkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="h-[200px] flex flex-col items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <p className="text-[11px] text-gray-500 mb-2">{error}</p>
              <button
                onClick={() => fetchActivity()}
                className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center gap-1"
              >
                <RefreshCw size={10} />
                Retry
              </button>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="h-[200px] flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <Activity size={20} className="text-gray-300" />
              </div>
              <p className="text-[11px] font-medium text-gray-400">
                No recent activity
              </p>
              <p className="text-[9px] text-gray-300 mt-0.5">
                Events will appear here
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5 overflow-y-auto max-h-[320px] pr-1
                         scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
            >
              {data.map((activity, i) => (
                <ActivityItem
                  key={activity.id || i}
                  activity={activity}
                  index={i}
                  isLast={i === data.length - 1}
                />
              ))}

              {/* Bottom fade + "View more" */}
              {data.length >= limit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: data.length * 0.05 }}
                  className="pt-2 flex justify-center"
                >
                  <button
                    onClick={() => navigate("/audits")}
                    className="text-[10px] text-gray-400 hover:text-indigo-600 
                               font-medium flex items-center gap-1 
                               px-3 py-1.5 rounded-full hover:bg-indigo-50
                               transition-all duration-200"
                  >
                    <Circle size={6} className="fill-current" />
                    View all activity
                    <Circle size={6} className="fill-current" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ActivityFeed;