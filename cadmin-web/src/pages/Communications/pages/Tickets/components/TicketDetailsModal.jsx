// cadmin-web/src/pages/Communications/pages/Tickets/components/TicketDetailsModal.jsx (do not remove this comment)
import { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  User,
  Building2,
  Phone,
  AlertTriangle,
  Save,
  Paperclip,
  Clock,
  Tag,
  FileText,
  MessageSquare,
  ExternalLink,
  Loader2,
  CheckCircle,
  Info,
  RotateCcw,
  History,
  ArrowRight,
  ImageOff,
  Download,
} from "lucide-react";
import {
  updateTicketStatus,
  getTicketActivities,
  addTicketComment,
} from "../../../../../api/cadminTickets";
import { format } from "date-fns";
import {
  getStatusConfig,
  getCategoryConfig,
  getPriorityConfig,
  UPDATABLE_STATUSES,
} from "../../../../../config/ticketConfigs";
import toast from "react-hot-toast";
import NoPermission from "../../../../../components/common/NoPermission";

// ============================================
// STATUS NOTE MODAL
// ============================================
const StatusNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  loading,
}) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen]);

  if (!isOpen) return null;

  const currentConfig = getStatusConfig(currentStatus);
  const newConfig = getStatusConfig(newStatus);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Confirm Status Change</h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center gap-3 py-3 bg-gray-50 rounded-lg">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${currentConfig.bg} ${currentConfig.text} border ${currentConfig.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentConfig.dot}`} />
              {currentConfig.label}
            </span>

            <ArrowRight size={18} className="text-gray-400" />

            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${newConfig.bg} ${newConfig.text} border ${newConfig.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${newConfig.dot}`} />
              {newConfig.label}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Add context about this status change..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm
                         text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2
                         focus:ring-[#05015A]/20 focus:border-[#05015A] transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {note.length}/1000
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirm(note)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ACTIVITY HELPERS
// ============================================
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

const getActorTypeLabel = (actorType) => {
  if (actorType === "ERP_USER") return "User";
  if (actorType === "CADMIN") return "Admin";
  return "Support";
};

const StatusChip = ({ status, small = false }) => {
  if (!status) return null;

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
};

const ActivityItem = ({ activity, isLast, showInternalBadge = false }) => {
  const showStatusChange = activity.from_status && activity.to_status;
  const isInternal = Boolean(showInternalBadge || activity.is_internal);

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

      <div
        className={`flex-1 rounded-lg border p-3 shadow-sm ${
          isInternal
            ? "bg-yellow-50 border-yellow-200"
            : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {showStatusChange && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusChip status={activity.from_status} small />
                <ArrowRight size={12} className="text-gray-400" />
                <StatusChip status={activity.to_status} small />
                {isInternal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                    Internal
                  </span>
                )}
              </div>
            )}

            {activity.type === "COMMENT" && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  Note
                </p>
                {isInternal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                    Internal
                  </span>
                )}
              </div>
            )}

            {!showStatusChange &&
              activity.type !== "COMMENT" && (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {getActivityTitle(activity.type)}
                  </p>
                  {isInternal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                      Internal
                    </span>
                  )}
                </div>
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
                ({getActorTypeLabel(activity.actor_type)})
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

const ActivityEmptyState = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
    <History size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No activity available</p>
    <p className="text-xs text-gray-400 mt-1">
      Status changes and notes will appear here
    </p>
  </div>
);

// ============================================
// INFO ROW
// ============================================
const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start justify-between gap-2">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <div className="flex items-center gap-1.5 text-right">
      {icon}
      <span className="text-sm font-medium text-gray-900 truncate max-w-[170px]">
        {value}
      </span>
    </div>
  </div>
);

// ============================================
// ATTACHMENT CARD
// ============================================
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

// ============================================
// MAIN MODAL
// ============================================
const TicketDetailsModal = ({
  isOpen,
  onClose,
  ticket,
  loading,
  onRefresh,
  canViewHistory = false, // reused for Activity tab visibility
  canUpdateStatus = false,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [error, setError] = useState("");

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  const [showNoteModal, setShowNoteModal] = useState(false);

  const [commentNote, setCommentNote] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (ticket) {
      setSelectedStatus("");
      setError("");
      setActiveTab("details");
      setActivities([]);
      setActivitiesLoaded(false);
      setCommentNote("");
      setIsInternalComment(false);
    }
  }, [ticket?.ticket_id]);

  useEffect(() => {
    if (activeTab === "activity" && !canViewHistory) {
      setActiveTab("details");
    }
  }, [activeTab, canViewHistory]);

  useEffect(() => {
    if (activeTab === "update" && !canUpdateStatus) {
      setActiveTab("details");
    }
  }, [activeTab, canUpdateStatus]);

  const fetchActivities = useCallback(async () => {
    if (!ticket?.ticket_id) return;

    setLoadingActivities(true);
    try {
      const response = await getTicketActivities(ticket.ticket_id);
      const data = response?.data?.data;
      setActivities(data?.activities || []);
      setActivitiesLoaded(true);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      toast.error("Failed to load ticket activity");
    } finally {
      setLoadingActivities(false);
    }
  }, [ticket?.ticket_id]);

  useEffect(() => {
    if (
      activeTab === "activity" &&
      canViewHistory &&
      ticket?.ticket_id &&
      !activitiesLoaded
    ) {
      fetchActivities();
    }
  }, [
    activeTab,
    canViewHistory,
    ticket?.ticket_id,
    activitiesLoaded,
    fetchActivities,
  ]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !showNoteModal) handleClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, showNoteModal]);

  if (!isOpen) return null;

  if (loading || !ticket) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Loader2 size={40} className="animate-spin text-[#05015A]" />
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

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

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setError("");
  };

  const handleUpdateClick = () => {
    if (!selectedStatus) {
      setError("Please select a status");
      return;
    }

    if (selectedStatus === ticket.status) {
      setError("Status is already " + getStatusConfig(selectedStatus).label);
      return;
    }

    setShowNoteModal(true);
  };

  const handleConfirmUpdate = async (note) => {
    setUpdating(true);
    setError("");

    try {
      await updateTicketStatus(ticket.ticket_id, {
        status: selectedStatus,
        note: note || undefined,
      });

      toast.success("Ticket updated successfully");
      setShowNoteModal(false);
      setActivitiesLoaded(false);
      onRefresh?.();
      onClose();
    } catch (err) {
      console.error("Failed to update ticket:", err);
      const errorMsg = err.response?.data?.message || "Failed to update ticket";
      setError(errorMsg);
      toast.error(errorMsg);
      setShowNoteModal(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    const note = commentNote.trim();

    if (note.length < 2) return;

    setAddingComment(true);
    try {
      await addTicketComment(ticket.ticket_id, {
        note,
        is_internal: isInternalComment,
      });

      toast.success("Note added successfully");
      setCommentNote("");
      setIsInternalComment(false);
      await fetchActivities();
      onRefresh?.();
    } catch (err) {
      console.error("Failed to add comment:", err);
      const errorMsg = err.response?.data?.message || "Failed to add note";
      toast.error(errorMsg);
    } finally {
      setAddingComment(false);
    }
  };

  const handleClose = () => {
    if (!updating) onClose();
  };

  const currentStatusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const categoryConfig = getCategoryConfig(ticket.category);
  const canUpdate = ticket.status !== "CANCELLED";

  const tabs = [
    { id: "details", label: "Details", icon: Info },
    canViewHistory && { id: "activity", label: "Activity", icon: History },
    {
      id: "attachments",
      label: "Attachments",
      icon: Paperclip,
      count: ticket.attachments?.length || 0,
    },
    canUpdateStatus && canUpdate && { id: "update", label: "Update", icon: Save },
  ].filter(Boolean);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="text-white" size={24} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-lg font-semibold">
                      {ticket.ticket_number}
                    </h2>

                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentStatusConfig.darkBg} ${currentStatusConfig.darkText}`}
                    >
                      {currentStatusConfig.label}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text} border ${priorityConfig.border} ${
                        priorityConfig.pulse ? "animate-pulse" : ""
                      }`}
                    >
                      {priorityConfig.label} Priority
                    </span>

                    {ticket.reopen_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 flex items-center gap-1">
                        <RotateCcw size={12} />
                        Reopened {ticket.reopen_count}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-white/70 text-sm mt-1 flex-wrap">
                    <Calendar size={14} />
                    <span>{formatDate(ticket.created_at)}</span>
                    <span className="text-white/40">•</span>
                    <span>{categoryConfig.fullLabel}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={updating}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-1 px-6 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                    ${
                      isActive
                        ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CONTENT */}
          <div className="p-6 h-[60vh] overflow-auto bg-gray-50">
            {/* DETAILS TAB */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {!canUpdateStatus && (
                  <NoPermission
                    variant="inline"
                    icon="eye"
                    title="Read-only view"
                    description="You can view ticket details but cannot update the ticket status."
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Shop Info */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <Building2 size={20} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Shop Information
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow label="Shop Name" value={ticket.shop_name || "-"} />
                      <InfoRow
                        label="Branch"
                        value={ticket.branch_name || "Main"}
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <User size={20} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Contact Details
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow
                        label="Created By"
                        value={ticket.created_by_name || "Unknown"}
                      />
                      <InfoRow
                        label="Role"
                        value={ticket.created_by_role?.replace(/_/g, " ") || "-"}
                      />
                      <InfoRow
                        label="Phone"
                        value={ticket.contact_number || "-"}
                        icon={<Phone size={14} className="text-gray-400" />}
                      />
                    </div>
                  </div>

                  {/* Ticket Meta */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <Tag size={20} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Ticket Info</h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow label="Category" value={categoryConfig.fullLabel} />
                      <InfoRow label="Priority" value={priorityConfig.label} />
                      <InfoRow label="Status" value={currentStatusConfig.label} />
                      <InfoRow label="Created" value={formatDate(ticket.created_at)} />
                      <InfoRow
                        label="Reopened"
                        value={`${ticket.reopen_count || 0} time(s)`}
                      />
                      {ticket.preferred_slot && (
                        <InfoRow
                          label="Preferred Time"
                          value={ticket.preferred_slot}
                          icon={<Clock size={14} className="text-gray-400" />}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                      <MessageSquare size={20} className="text-[#05015A]" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Ticket Content
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Subject
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900">
                          {ticket.subject}
                        </p>
                      </div>
                    </div>

                    {ticket.description && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Description
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {ticket.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === "activity" && (
              <>
                {!canViewHistory ? (
                  <NoPermission
                    variant="block"
                    icon="lock"
                    title="Access Restricted"
                    description="You don't have permission to view ticket activity."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-3">
                        <History size={18} className="text-[#05015A]" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Ticket Activity
                          </p>
                          <p className="text-xs text-gray-500">
                            Unified timeline of status changes and notes
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={fetchActivities}
                        disabled={loadingActivities}
                        className="text-xs text-[#05015A] hover:underline disabled:opacity-50"
                      >
                        {loadingActivities ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>

                    {canUpdateStatus && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Add Note
                        </h4>

                        <textarea
                          value={commentNote}
                          onChange={(e) => setCommentNote(e.target.value)}
                          rows={2}
                          maxLength={1000}
                          placeholder="Add a note to this ticket..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />

                        <div className="flex items-center justify-between mt-2 gap-3">
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isInternalComment}
                              onChange={(e) =>
                                setIsInternalComment(e.target.checked)
                              }
                              className="accent-indigo-600"
                            />
                            Internal note (not visible to user)
                          </label>

                          <button
                            onClick={handleAddComment}
                            disabled={
                              commentNote.trim().length < 2 || addingComment
                            }
                            className="px-3 py-1.5 bg-[#05015A] text-white text-xs font-medium rounded-lg disabled:opacity-50"
                          >
                            {addingComment ? "Adding..." : "Add Note"}
                          </button>
                        </div>
                      </div>
                    )}

                    {loadingActivities && activities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2
                          size={32}
                          className="animate-spin text-[#05015A] mb-3"
                        />
                        <p className="text-sm text-gray-500">
                          Loading activity...
                        </p>
                      </div>
                    ) : activities.length === 0 ? (
                      <ActivityEmptyState />
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity, idx) => (
                          <ActivityItem
                            key={
                              activity.activity_id ||
                              `${activity.type}-${activity.created_at}-${idx}`
                            }
                            activity={activity}
                            isFirst={idx === 0}
                            isLast={idx === activities.length - 1}
                            showInternalBadge={activity.is_internal}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ATTACHMENTS TAB */}
            {activeTab === "attachments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <Paperclip size={18} className="text-[#05015A]" />
                    <span className="text-sm font-medium text-gray-700">
                      {ticket.attachments?.length || 0} Attachment(s)
                    </span>
                  </div>
                </div>

                {!ticket.attachments || ticket.attachments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Paperclip size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No attachments for this ticket</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ticket.attachments.map((attachment) => (
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

            {/* UPDATE TAB */}
            {activeTab === "update" && (
              <>
                {!canUpdateStatus ? (
                  <NoPermission
                    variant="block"
                    icon="lock"
                    title="Access Restricted"
                    description="You don't have permission to update ticket status."
                  />
                ) : (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                          <Save size={20} className="text-[#05015A]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Update Ticket Status
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Select a new status to update this ticket
                          </p>
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          Current Status
                        </p>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${currentStatusConfig.bg} ${currentStatusConfig.text} border ${currentStatusConfig.border}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${currentStatusConfig.dot}`}
                          />
                          {currentStatusConfig.label}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-gray-500 font-medium">
                          Select New Status
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {UPDATABLE_STATUSES.map((status) => {
                            const config = getStatusConfig(status);
                            const isSelected = selectedStatus === status;
                            const isCurrent = ticket.status === status;

                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusSelect(status)}
                                disabled={isCurrent}
                                className={`
                                  relative flex items-center gap-2 p-4 rounded-xl border-2 transition-all
                                  ${
                                    isSelected
                                      ? `${config.bg} ${config.border} ring-2 ring-[#05015A]/10 shadow-sm`
                                      : isCurrent
                                      ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
                                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                  }
                                `}
                              >
                                <span
                                  className={`w-3 h-3 rounded-full ${config.dot}`}
                                />
                                <span
                                  className={`font-medium ${
                                    isSelected ? config.text : "text-gray-700"
                                  }`}
                                >
                                  {config.label}
                                </span>

                                {isCurrent && (
                                  <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                    Current
                                  </span>
                                )}

                                {isSelected && !isCurrent && (
                                  <CheckCircle
                                    size={16}
                                    className={`absolute top-2 right-2 ${config.text}`}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {error && (
                        <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle
                            size={20}
                            className="text-red-500 flex-shrink-0 mt-0.5"
                          />
                          <p className="text-sm text-red-700 font-medium">
                            {error}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                        <button
                          onClick={handleUpdateClick}
                          disabled={
                            !selectedStatus || selectedStatus === ticket.status
                          }
                          className={`
                            flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all
                            ${
                              selectedStatus && selectedStatus !== ticket.status
                                ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }
                          `}
                        >
                          <Save size={18} />
                          Update Status
                        </button>

                        <button
                          onClick={handleClose}
                          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <p>
                Ticket ID: {ticket.ticket_id?.slice(0, 8)}... • Created:{" "}
                {formatDate(ticket.created_at)}
              </p>
              <p>
                {ticket.shop_name} • {ticket.branch_name || "Main Branch"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <StatusNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onConfirm={handleConfirmUpdate}
        currentStatus={ticket.status}
        newStatus={selectedStatus}
        loading={updating}
      />
    </>
  );
};

export default TicketDetailsModal;