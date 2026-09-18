// cadmin-web/src/pages/marketplace/Communications/MarketplaceCommunicationsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Smartphone,
  Radio,
  Mail,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMenuStore } from "../../../store/useMenuStore";
import { useToast } from "../../../components/common/Toast";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions";
import { useCommunicationBadgeStore } from "../../../store/useCommunicationBadgeStore";
import { getCustomerTicketStats } from "../../../api/cadminCustomerTickets";
import {
  getMobileHistory,
  getMobileScheduled,
} from "../../../api/cadminMobileBroadcast";

// ============================================
// STAT ITEM COMPONENT
// ============================================
const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </p>
    </div>
  </div>
);

// ============================================
// CARD COMPONENT
// ============================================
const CommunicationCard = ({
  title,
  description,
  icon: Icon,
  path,
  breadcrumbs,
  iconBg,
  iconColor,
  stats,
  isLoading,
  isComingSoon,
  hasBadge,
}) => {
  const navigate = useNavigate();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const handleClick = () => {
    if (isComingSoon) return;
    setBreadcrumbs(breadcrumbs);
    navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-xl border border-gray-200 p-5
        transition-all duration-200
        ${
          isComingSoon
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="relative inline-flex">
          <div
            className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {hasBadge && (
            <span
              className="
                absolute -top-1 -right-1
                w-2.5 h-2.5 rounded-full bg-red-500
                ring-2 ring-white
              "
            />
          )}
        </div>

        {isComingSoon && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-md uppercase">
            Coming Soon
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{description}</p>

      <div className="min-h-[44px]">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : stats && stats.length > 0 ? (
          <div className="flex items-center gap-6">
            {stats.map((stat, index) => (
              <StatItem
                key={index}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
              />
            ))}
          </div>
        ) : null}
      </div>

      {!isComingSoon && (
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-[#000060]">View all</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#000060]" />
        </div>
      )}
    </div>
  );
};

// ============================================
// MARKETPLACE COMMUNICATIONS PAGE
// ============================================
const MarketplaceCommunicationsPage = () => {
  const toast = useToast();
  const { hasPermission } = useCAdminPermission();

  const pendingCustomerTickets = useCommunicationBadgeStore(
    (s) => s.pendingCustomerTickets,
  );
  const isLoadingBadge = useCommunicationBadgeStore((s) => s.isLoading);
  const refreshBadge = useCommunicationBadgeStore((s) => s.refresh);

  const [totalCustomerTickets, setTotalCustomerTickets] = useState(0);
  const [totalPushSent, setTotalPushSent] = useState(0);
  const [totalPushScheduled, setTotalPushScheduled] = useState(0);
  const [loadingTotals, setLoadingTotals] = useState(true);

  const fetchTotals = useCallback(async () => {
    try {
      setLoadingTotals(true);

      const [ticketStatsRes, historyRes, scheduledRes] =
        await Promise.allSettled([
          getCustomerTicketStats(),
          getMobileHistory(1, 1),
          getMobileScheduled(1, 1),
        ]);

      if (ticketStatsRes.status === "fulfilled") {
        const data = ticketStatsRes.value?.data?.data || {};
        setTotalCustomerTickets(data.total ?? 0);
      }

      if (historyRes.status === "fulfilled") {
        const data =
          historyRes.value?.data?.data || historyRes.value?.data || {};
        setTotalPushSent(data.pagination?.total ?? 0);
      }

      if (scheduledRes.status === "fulfilled") {
        const data =
          scheduledRes.value?.data?.data || scheduledRes.value?.data || {};
        setTotalPushScheduled(data.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error("Marketplace Comms failed to load totals:", err);
    } finally {
      setLoadingTotals(false);
    }
  }, []);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  const handleRefresh = useCallback(() => {
    toast.info("Refreshing", "Loading latest marketplace communications data…");
    refreshBadge();
    fetchTotals();
  }, [toast, refreshBadge, fetchTotals]);

  const isLoading = isLoadingBadge || loadingTotals;

  const channels = useMemo(() => {
    const all = [
      {
        id: "customer-tickets",
        title: "Customer Tickets",
        description:
          "Review and respond to post-order and support issues raised by mobile app customers",
        icon: Smartphone,
        path: "/marketplace/communications/customer-tickets",
        breadcrumbs: ["Marketplace", "Communications", "Customer Tickets"],
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        isLoading: loadingTotals,
        visible: hasPermission(CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW),
        hasBadge: pendingCustomerTickets > 0,
        stats: [
          {
            icon: TrendingUp,
            label: "Total",
            value: totalCustomerTickets,
            color: "bg-amber-50 text-amber-600",
          },
          {
            icon: Clock,
            label: "Open/IP",
            value: pendingCustomerTickets,
            color: "bg-red-50 text-red-600",
          },
        ],
      },
      {
        id: "push-broadcast",
        title: "Push Notifications",
        description:
          "Create and send custom push notifications directly to customer app devices",
        icon: Radio,
        path: "/marketplace/communications/push",
        breadcrumbs: ["Marketplace", "Communications", "Push Notifications"],
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        isLoading: loadingTotals,
        visible: hasPermission(CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND),
        hasBadge: false,
        stats: [
          {
            icon: Send,
            label: "Sent",
            value: totalPushSent,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            icon: Clock,
            label: "Scheduled",
            value: totalPushScheduled,
            color: "bg-purple-50 text-purple-600",
          },
        ],
      },
      {
        id: "email-broadcast",
        title: "Customer Email Broadcast",
        description:
          "Send promotional, informational, and healthcare updates directly to customer email addresses",
        icon: Mail,
        path: "/marketplace/communications/email",
        breadcrumbs: ["Marketplace", "Communications", "Email Broadcast"],
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        isLoading: false,
        isComingSoon: false,
        visible: hasPermission(CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND),
        hasBadge: false,
        stats: null,
      },
    ];

    return all.filter((c) => c.visible);
  }, [
    loadingTotals,
    pendingCustomerTickets,
    totalCustomerTickets,
    totalPushSent,
    totalPushScheduled,
    hasPermission,
  ]);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Marketplace Communications
              </h1>
              <p className="text-sm text-gray-500">
                Manage mobile app customer support & push broadcasts
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4">
        {/* Summary Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-amber-500 rounded-full" />
              <p className="text-sm font-medium text-gray-700">
                Quick Overview
              </p>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {/* Customer Tickets Total */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingTotals ? "…" : totalCustomerTickets}
                  </p>
                  <p className="text-xs text-gray-500">Total Tickets</p>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-200 hidden sm:block" />

              {/* Action Pending Tickets */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {isLoading ? "…" : pendingCustomerTickets}
                  </p>
                  <p className="text-xs text-gray-500">Open / In Progress</p>
                </div>
                {!isLoading && pendingCustomerTickets > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                    Action needed
                  </span>
                )}
              </div>

              <div className="w-px h-10 bg-gray-200 hidden sm:block" />

              {/* Push Sent Total */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingTotals ? "…" : totalPushSent}
                  </p>
                  <p className="text-xs text-gray-500">Push Campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <CommunicationCard
              key={channel.id}
              title={channel.title}
              description={channel.description}
              icon={channel.icon}
              path={channel.path}
              breadcrumbs={channel.breadcrumbs}
              iconBg={channel.iconBg}
              iconColor={channel.iconColor}
              stats={channel.stats}
              isLoading={channel.isLoading}
              isComingSoon={channel.isComingSoon}
              hasBadge={channel.hasBadge}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCommunicationsPage;
