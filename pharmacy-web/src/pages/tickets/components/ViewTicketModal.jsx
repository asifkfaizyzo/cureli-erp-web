// pharmacy-web/src/pages/tickets/components/ViewTicketModal.jsx (do not remove this comment)
import { useState, useEffect, useRef } from "react";
import {
  X,
  CircleOff,
  Download,
  Phone,
  User,
  Building2,
  Clock,
  Paperclip,
  MessageSquare,
  RotateCcw,
  Calendar,
  FileText,
  ExternalLink,
  Info,
  History,
  ImageOff,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import ReopenTicketModal from "./ReopenTicketModal";
import Tooltip from "../../../components/common/Tooltip";
import { getTicketById } from "../../../api/tickets";
import {
  TICKET_CATEGORIES,
  CATEGORY_COLORS,
  STATUS_TOOLTIP_MESSAGES,
  REOPEN_LIMIT,
  canReopenByCount,
  REOPEN_LIMIT_MESSAGE,
} from "../../../constant/tickets";

const ViewTicketModal = ({
  isOpen,
  onClose,
  ticket,
  onCancelClick,
  onReopenClick,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(ticket || null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const tabIndicatorRef = useRef(null);
  const tabsContainerRef = useRef(null);

  const tabs = [
    { id: "details", label: "Ticket Info", icon: Info, order: 0 },
    {
      id: "attachments",
      label: "Files",
      icon: Paperclip,
      count: ticketDetails?.attachments?.length || ticket?.attachments?.length || 0,
      order: 1,
    },
    { id: "activity", label: "Activity", icon: History, order: 2 },
  ];

  const getTabOrder = (tabId) => tabs.find((t) => t.id === tabId)?.order ?? 0;

  const handleTabChange = (newTabId) => {
    if (newTabId === activeTab || isAnimating) return;

    const currentOrder = getTabOrder(activeTab);
    const newOrder = getTabOrder(newTabId);

    setSlideDirection(newOrder > currentOrder ? "left" : "right");
    setIsAnimating(true);

    setTimeout(() => {
      setActiveTab(newTabId);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 150);
  };

  useEffect(() => {
    if (tabsContainerRef.current && tabIndicatorRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(
        `[data-tab="${activeTab}"]`
      );

      if (activeTabElement) {
        const containerRect = tabsContainerRef.current.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();

        tabIndicatorRef.current.style.left = `${tabRect.left - containerRect.left}px`;
        tabIndicatorRef.current.style.width = `${tabRect.width}px`;
      }
    }
  }, [
    activeTab,
    ticketDetails?.attachments?.length,
    ticket?.attachments?.length,
  ]);

  useEffect(() => {
    if (ticket) {
      setActiveTab("details");
      setIsAnimating(false);
      setTicketDetails(ticket);
    }
  }, [ticket?.ticket_id]);

  useEffect(() => {
    if (!isOpen || !ticket?.ticket_id) return;

    let cancelled = false;

    const fetchFullTicket = async () => {
      setLoadingTicket(true);
      try {
        const response = await getTicketById(ticket.ticket_id);
        const data = response?.data?.data;
        const nextTicket = data?.ticket || data || ticket;

        if (!cancelled) {
          setTicketDetails(nextTicket);
        }
      } catch (error) {
        console.error("Failed to fetch full ticket details:", error);
        if (!cancelled) {
          setTicketDetails(ticket);
        }
      } finally {
        if (!cancelled) {
          setLoadingTicket(false);
        }
      }
    };

    fetchFullTicket();

    return () => {
      cancelled = true;
    };
  }, [isOpen, ticket?.ticket_id]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !showReopenModal) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, showReopenModal, onClose]);

  const ticketData = ticketDetails || ticket;

  if (!isOpen || !ticketData) return null;

  const getAttachmentUrl = (storageKey) => {
    const baseURL = import.meta.env.VITE_API_URL;
    return `${baseURL}/api/files/tickets/${storageKey}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch {
      return "N/A";
    }
  };

  const statusConfig = {
    PENDING: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-300",
      label: "Pending",
    },
    IN_PROGRESS: {
      bg: "bg-blue-500/20",
      text: "text-blue-300",
      label: "In Progress",
    },
    RESOLVED: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      label: "Resolved",
    },
    CLOSED: {
      bg: "bg-gray-500/20",
      text: "text-gray-300",
      label: "Closed",
    },
    CANCELLED: {
      bg: "bg-red-500/20",
      text: "text-red-300",
      label: "Cancelled",
    },
  };

  const canCancel =
    ticketData.status === "PENDING" || ticketData.status === "IN_PROGRESS";
  const canReopenStatus =
    ticketData.status === "RESOLVED" || ticketData.status === "CLOSED";
  const canReopenCount = canReopenByCount(ticketData.reopen_count || 0);

  const handleReopenConfirm = async (reason) => {
    await onReopenClick(ticketData, reason);
    setShowReopenModal(false);
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const tooltipMessage = STATUS_TOOLTIP_MESSAGES[status];

    const badge = (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} cursor-default`}
        tabIndex={tooltipMessage ? 0 : -1}
      >
        {config.label}
      </span>
    );

    if (tooltipMessage) {
      return (
        <Tooltip
          content={tooltipMessage}
          position="bottom"
          contentClassName="max-w-xs whitespace-normal"
        >
          {badge}
        </Tooltip>
      );
    }

    return badge;
  };

  const getAnimationClasses = () => {
    if (isAnimating) {
      return slideDirection === "left"
        ? "opacity-0 -translate-x-8"
        : "opacity-0 translate-x-8";
    }
    return "opacity-100 translate-x-0";
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="text-white" size={20} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-lg font-semibold truncate">
                      {ticketData.ticket_number}
                    </h2>
                    {getStatusBadge(ticketData.status)}
                    {loadingTicket && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
                        <Loader2 size={12} className="animate-spin" />
                        Refreshing
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-white/70 text-xs flex-wrap">
                    <Calendar size={12} />
                    <span>{formatDate(ticketData.created_at)}</span>
                    <span className="text-white/40">•</span>
                    <span>
                      {TICKET_CATEGORIES[ticketData.category] || ticketData.category}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="relative px-6 pt-3 pb-0 bg-white border-b border-gray-200 flex-shrink-0">
            <div ref={tabsContainerRef} className="flex gap-1 relative">
              <div
                ref={tabIndicatorRef}
                className="absolute bottom-0 h-0.5 bg-[#05015A] transition-all duration-300 ease-out rounded-full"
                style={{ left: 0, width: 0 }}
              />

              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={isAnimating}
                    className={`
                      relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                      transition-all duration-200 rounded-t-lg
                      ${
                        isActive
                          ? "text-[#05015A]"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }
                      ${isAnimating ? "pointer-events-none" : ""}
                    `}
                  >
                    <Icon size={16} className={isActive ? "text-[#05015A]" : ""} />
                    <span>{tab.label}</span>

                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`
                          px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                          ${
                            isActive
                              ? "bg-[#05015A]/10 text-[#05015A]"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div
              className={`
                h-full overflow-auto p-6
                transition-all duration-300 ease-out
                ${getAnimationClasses()}
              `}
            >
              {/* DETAILS TAB */}
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                          <MessageSquare size={16} className="text-[#05015A]" />
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          Ticket Content
                        </h3>
                        <CategoryBadge
                          category={ticketData.category}
                          otherText={ticketData.other_category_text}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Subject
                          </label>
                          <p className="text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            {ticketData.subject}
                          </p>
                        </div>

                        {ticketData.description && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Description
                            </label>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-auto">
                              {ticketData.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                      <h3 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">
                        Ticket Information
                      </h3>

                      <InfoRow
                        icon={<Phone size={16} />}
                        label="Contact"
                        value={ticketData.contact_number || "N/A"}
                      />
                      <InfoRow
                        icon={<Clock size={16} />}
                        label="Preferred Time"
                        value={ticketData.preferred_slot || "N/A"}
                      />
                      <InfoRow
                        icon={<Building2 size={16} />}
                        label="Branch"
                        value={ticketData.branch_name || "Main Branch"}
                      />
                      <InfoRow
                        icon={<User size={16} />}
                        label="Created By"
                        value={ticketData.created_by_name || "Unknown"}
                      />
                      <InfoRow
                        icon={<Calendar size={16} />}
                        label="Created At"
                        value={formatDate(ticketData.created_at)}
                      />
                    </div>

                    {canReopenStatus && (
                      <div
                        className={`rounded-xl border p-4 shadow-sm ${
                          canReopenCount
                            ? "bg-blue-50 border-blue-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <RotateCcw
                            size={14}
                            className={canReopenCount ? "text-blue-600" : "text-red-600"}
                          />
                          <h3
                            className={`font-semibold text-sm ${
                              canReopenCount ? "text-blue-900" : "text-red-900"
                            }`}
                          >
                            Reopen Status
                          </h3>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={canReopenCount ? "text-blue-700" : "text-red-700"}>
                              Reopened:
                            </span>
                            <span
                              className={`font-semibold ${
                                canReopenCount ? "text-blue-900" : "text-red-900"
                              }`}
                            >
                              {ticketData.reopen_count || 0} / {REOPEN_LIMIT}
                            </span>
                          </div>

                          {!canReopenCount && (
                            <p className="text-xs text-red-600 mt-2">
                              Maximum reopen limit reached.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ATTACHMENTS TAB */}
              {activeTab === "attachments" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Paperclip size={16} className="text-[#05015A]" />
                    <span>{ticketData.attachments?.length || 0} Attachment(s)</span>
                  </div>

                  {!ticketData.attachments || ticketData.attachments.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Paperclip size={28} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Attachments
                      </h3>
                      <p className="text-gray-500 text-sm">
                        No files were attached to this ticket.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ticketData.attachments.map((attachment) => (
                        <AttachmentCard
                          key={attachment.attachment_id}
                          attachment={attachment}
                          getUrl={getAttachmentUrl}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === "activity" && (
                <div className="max-w-3xl mx-auto space-y-3">
                  {loadingTicket && !ticketDetails?.activities ? (
                    <LoadingState />
                  ) : !ticketData.activities || ticketData.activities.length === 0 ? (
                    <EmptyState />
                  ) : (
                    ticketData.activities.map((activity, idx) => (
                      <ActivityItem
                        key={
                          activity.activity_id ||
                          `${activity.type}-${activity.created_at}-${idx}`
                        }
                        activity={activity}
                        isFirst={idx === 0}
                        isLast={idx === ticketData.activities.length - 1}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                ID: {ticketData.ticket_id?.substring(0, 8)}...
              </p>

              <div className="flex items-center gap-2">
                {canReopenStatus &&
                  (canReopenCount ? (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all"
                    >
                      <RotateCcw size={14} />
                      Reopen Ticket
                    </button>
                  ) : (
                    <Tooltip
                      content={REOPEN_LIMIT_MESSAGE}
                      position="top"
                      contentClassName="max-w-xs whitespace-normal"
                    >
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                      >
                        <AlertTriangle size={14} />
                        Reopen Limit Reached
                      </button>
                    </Tooltip>
                  ))}

                {canCancel && (
                  <button
                    onClick={() => {
                      onClose();
                      onCancelClick(ticketData);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/80 text-white hover:bg-red-600 transition-all"
                  >
                    <CircleOff size={14} />
                    Cancel Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReopenTicketModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        ticket={ticketData}
        onConfirm={handleReopenConfirm}
      />
    </>
  );
};

// ============================================
// HELPERS
// ============================================

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="text-gray-400">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

const CategoryBadge = ({ category, otherText }) => {
  const colors = CATEGORY_COLORS?.[category] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  };

  const label =
    category === "OTHER" && otherText
      ? otherText
      : TICKET_CATEGORIES[category] || category;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      {label}
    </span>
  );
};

const STATUS_CHIP_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const StatusChip = ({ status, small = false }) => {
  if (!status) return null;

  const config = STATUS_CHIP_CONFIG[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
};

const ACTIVITY_COLORS = {
  CREATED: "bg-blue-500",
  STATUS_CHANGED: "bg-indigo-500",
  REOPENED: "bg-orange-500",
  CANCELLED: "bg-red-500",
  COMMENT: "bg-gray-400",
};

const getActivityTitle = (type) => {
  switch (type) {
    case "CREATED":
      return "Ticket Created";
    case "REOPENED":
      return "Ticket Reopened";
    case "CANCELLED":
      return "Ticket Cancelled";
    case "STATUS_CHANGED":
      return "Status Updated";
    case "COMMENT":
      return "Note";
    default:
      return "Activity";
  }
};

const ActivityItem = ({ activity, isLast }) => {
  const isUserAction = activity.actor_type === "ERP_USER";
  const showStatusChange = activity.from_status && activity.to_status;

  return (
    <div className="relative flex gap-3 pl-6">
      {!isLast && (
        <div className="absolute left-2.5 top-4 bottom-0 w-0.5 bg-gray-200" />
      )}

      <div
        className={`absolute left-0 top-1.5 w-5 h-5 rounded-full ${
          ACTIVITY_COLORS[activity.type] || "bg-gray-400"
        } ring-4 ring-white flex-shrink-0`}
      />

      <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {showStatusChange && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusChip status={activity.from_status} small />
                <ArrowRight size={12} className="text-gray-400" />
                <StatusChip status={activity.to_status} small />
              </div>
            )}

            {activity.type === "CREATED" && !showStatusChange && (
              <p className="text-sm font-medium text-gray-900">Ticket Created</p>
            )}

            {activity.type === "COMMENT" && (
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                Note
              </p>
            )}

            {!showStatusChange &&
              activity.type !== "CREATED" &&
              activity.type !== "COMMENT" && (
                <p className="text-sm font-medium text-gray-900">
                  {getActivityTitle(activity.type)}
                </p>
              )}

            {activity.note && (
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {activity.note}
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <User size={10} />
              <span className="font-medium">{activity.actor_name || "Unknown"}</span>
              <span className="text-gray-400">
                ({isUserAction ? "User" : "Support"})
              </span>
            </p>
          </div>

          <span className="text-[10px] text-gray-400 whitespace-nowrap">
            {activity.created_at
              ? format(new Date(activity.created_at), "dd MMM, HH:mm")
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <History size={28} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
    <p className="text-gray-500 text-sm">
      Ticket activity will appear here once updates are made.
    </p>
  </div>
);

const LoadingState = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
    <Loader2 size={28} className="text-[#05015A] animate-spin mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Activity</h3>
    <p className="text-gray-500 text-sm">Fetching the latest ticket details...</p>
  </div>
);

const AttachmentCard = ({ attachment, getUrl }) => {
  const [imageError, setImageError] = useState(false);
  const isImage = attachment.mime_type?.startsWith("image/");
  const url = getUrl(attachment.storage_key);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {isImage && !imageError ? (
          <div className="h-32 bg-gray-100 overflow-hidden">
            <img
              src={url}
              alt={attachment.original_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="h-32 bg-gray-50 flex flex-col items-center justify-center gap-2">
            {imageError ? (
              <>
                <ImageOff size={24} className="text-gray-300" />
                <span className="text-xs text-gray-400">Failed to load</span>
              </>
            ) : (
              <Download size={24} className="text-gray-300" />
            )}
          </div>
        )}
      </a>

      <div className="p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium text-gray-900 truncate"
              title={attachment.original_name}
            >
              {attachment.original_name}
            </p>
            <p className="text-[10px] text-gray-500">
              {(attachment.file_size / 1024).toFixed(1)} KB
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded bg-[#05015A]/10 text-[#05015A] hover:bg-[#05015A]/20 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ViewTicketModal;