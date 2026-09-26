// cadmin-web/src/pages/Communications/CommunicationsPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/CommunicationsPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Ticket,
  Mail,
  Radio,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate }                from "react-router-dom";
import { useMenuStore }               from "../../store/useMenuStore";
import { useToast }                   from "../../components/common/Toast";
import { useCAdminPermission }        from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS }         from "../../config/cadminPermissions";
import { useCommunicationBadgeStore } from "../../store/useCommunicationBadgeStore";

// ============================================
// BROADCAST PERMISSIONS
// ============================================
const BROADCAST_ANY_PERMISSIONS = [
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD,
  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_UPLOAD,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS,
  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES,
];

// ============================================
// STAT ITEM COMPONENT
// ============================================
const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
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
  const navigate       = useNavigate();
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
        ${isComingSoon
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="relative inline-flex">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
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
// COMMUNICATIONS PAGE
// ============================================
const CommunicationsPage = () => {
  const toast = useToast();
  const { hasPermission, hasAnyPermission } = useCAdminPermission();

  // Badges (pending counters)
  const pendingTickets   = useCommunicationBadgeStore((s) => s.pendingTickets);
  const pendingEnquiries = useCommunicationBadgeStore((s) => s.pendingEnquiries);
  const isLoadingBadge   = useCommunicationBadgeStore((s) => s.isLoading);
  const refreshBadge     = useCommunicationBadgeStore((s) => s.refresh);

  // Communications totals states
  const [totalTickets,   setTotalTickets]   = useState(0);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [loadingTotals,  setLoadingTotals]  = useState(true);

  const fetchTotals = useCallback(async () => {
    try {
      setLoadingTotals(true);

      const [
        { getAllTickets },
        { getEnquiryStats },
      ] = await Promise.all([
        import("../../api/cadminTickets"),
        import("../../api/cadminEnquiries"),
      ]);

      const [ticketsRes, enquiriesRes] = await Promise.allSettled([
        getAllTickets({ page: 1, limit: 1 }),
        getEnquiryStats(),
      ]);

      if (ticketsRes.status === "fulfilled") {
        setTotalTickets(ticketsRes.value?.data?.data?.pagination?.total ?? 0);
      }

      if (enquiriesRes.status === "fulfilled") {
        const d =
          enquiriesRes.value?.data?.data?.stats ??
          enquiriesRes.value?.data?.data ??
          enquiriesRes.value?.data ??
          {};
        setTotalEnquiries(d.total ?? d.totalEnquiries ?? 0);
      }
    } catch (err) {
      console.error("Communications failed to load totals:", err);
    } finally {
      setLoadingTotals(false);
    }
  }, []);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  const handleRefresh = useCallback(() => {
    toast.info("Refreshing", "Loading latest data…");
    refreshBadge();
    fetchTotals();
  }, [toast, refreshBadge, fetchTotals]);

  const isLoading = isLoadingBadge || loadingTotals;
  const totalPending = pendingTickets + pendingEnquiries;

  // ============================================
  // CHANNEL CARDS CONFIG
  // ============================================
  const channels = useMemo(() => {
    const all = [
      {
        id:          "tickets",
        title:       "Shop Tickets",
        description: "Manage technical, billing, and profile issues raised by ERP shops",
        icon:        Ticket,
        path:        "/communications/tickets",
        breadcrumbs: ["Communications", "Tickets"],
        iconBg:      "bg-blue-100",
        iconColor:   "text-blue-600",
        isLoading:   isLoadingBadge,
        visible:     hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
        hasBadge:    pendingTickets > 0,
        stats: [
          { icon: TrendingUp, label: "Total",   value: totalTickets,   color: "bg-blue-50 text-blue-600" },
          { icon: Clock,      label: "Pending", value: pendingTickets, color: "bg-amber-50 text-amber-600" },
        ],
      },
      {
        id:          "enquiries",
        title:       "Enquiries",
        description: "Handle general inquiries and respond to customer questions and doubts",
        icon:        Mail,
        path:        "/communications/enquiries",
        breadcrumbs: ["Communications", "Enquiries"],
        iconBg:      "bg-emerald-100",
        iconColor:   "text-emerald-600",
        isLoading:   isLoadingBadge,
        visible:     hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),
        hasBadge:    pendingEnquiries > 0,
        stats: [
          { icon: TrendingUp, label: "Total",   value: totalEnquiries,   color: "bg-emerald-50 text-emerald-600" },
          { icon: Clock,      label: "Pending", value: pendingEnquiries, color: "bg-amber-50 text-amber-600" },
        ],
      },
      {
        id:          "broadcast",
        title:       "Broadcast",
        description: "Send announcements and notifications to ERP users and shops",
        icon:        Radio,
        path:        "/communications/broadcast",
        breadcrumbs: ["Communications", "Broadcast"],
        iconBg:      "bg-violet-100",
        iconColor:   "text-violet-600",
        isLoading:   false,
        isComingSoon: false,
        visible:     hasAnyPermission(...BROADCAST_ANY_PERMISSIONS),
        hasBadge:    false,
        stats:       null,
      },
    ];

    return all.filter((c) => c.visible);
  }, [
    isLoadingBadge,
    pendingTickets,
    pendingEnquiries,
    totalTickets,
    totalEnquiries,
    hasPermission,
    hasAnyPermission,
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
              <h1 className="text-xl font-bold text-gray-900 truncate">Communications</h1>
              <p className="text-sm text-gray-500">Manage pharmacy tickets & announcements</p>
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
        {/* Summary bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-blue-600 rounded-full" />
              <p className="text-sm font-medium text-gray-700">Quick Overview</p>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {/* Shop Tickets */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingTotals ? "…" : totalTickets}
                  </p>
                  <p className="text-xs text-gray-500">Shop Tickets</p>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-200 hidden sm:block" />

              {/* Enquiries total */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {loadingTotals ? "…" : totalEnquiries}
                  </p>
                  <p className="text-xs text-gray-500">Enquiries</p>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-200 hidden sm:block" />

              {/* Action Needed pending total */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {isLoading ? "…" : totalPending}
                  </p>
                  <p className="text-xs text-gray-500">Action Pending</p>
                </div>
                {!isLoading && totalPending > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                    Action needed
                  </span>
                )}
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

export default CommunicationsPage;