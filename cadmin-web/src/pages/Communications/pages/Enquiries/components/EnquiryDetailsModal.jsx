// cadmin-web/src/pages/Communications/pages/Enquiries/components/EnquiryDetailsModal.jsx (do not remove this comment)
// cadmin-web\src\pages\Communications\pages\Enquiries\components\EnquiryDetailsModal.jsx
import {
  X,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  AlertCircle,
  Loader2,
  Circle,
  Lock,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getEnquiryDetails,
  updateEnquiryStatus,
} from "../../../../../api/cadminEnquiries";
import { useToast } from "../../../../../components/common/Toast";
import StyledSelect from "../../../../../components/common/StyledSelect";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const statusConfig = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
    label: "Pending",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Circle,
    label: "In Progress",
  },
  REPLIED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: CheckCircle,
    label: "Replied",
  },
  CLOSED: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    icon: Lock,
    label: "Closed",
  },
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (date) => {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

const EnquiryDetailsModal = ({
  enquiry,
  isOpen,
  onClose,
  onReply,
  onStatusChange,
}) => {
  const toast = useToast();
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!enquiry?.enquiry_id) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await getEnquiryDetails(enquiry.enquiry_id);

      let enquiryData = null;

      if (response?.data?.data?.enquiry) {
        enquiryData = response.data.data.enquiry;
      } else if (response?.data?.enquiry) {
        enquiryData = response.data.enquiry;
      } else if (response?.enquiry) {
        enquiryData = response.enquiry;
      } else if (response?.data?.data) {
        enquiryData = response.data.data;
      } else if (response?.data) {
        enquiryData = response.data;
      }

      setDetails(enquiryData);
    } catch (err) {
      console.error("Failed to fetch enquiry details:", err);
      setError("Failed to load enquiry details");
      toast.error("Error", "Failed to load enquiry details");
    } finally {
      setIsLoading(false);
    }
  }, [enquiry?.enquiry_id, toast]);

  useEffect(() => {
    if (isOpen && enquiry?.enquiry_id) {
      fetchDetails();
    } else {
      setDetails(null);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, enquiry?.enquiry_id, fetchDetails]);

  const handleStatusChange = async (newStatus) => {
    if (!details || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await updateEnquiryStatus(enquiry.enquiry_id, newStatus);
      setDetails((prev) => ({ ...prev, status: newStatus }));
      onStatusChange?.();
      toast.success(
        "Status Updated",
        `Status changed to ${newStatus.replace("_", " ")}`,
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Error", "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReplyClick = () => {
    onReply(details || enquiry);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStatus = statusConfig[details?.status] || statusConfig.PENDING;
  const StatusIcon = currentStatus.icon;

  // Status options for StyledSelect
  const statusOptions = [
    {
      value: "PENDING",
      label: (
        <>
          <Clock className="w-3.5 h-3.5" />
          <span>Pending</span>
        </>
      ),
    },
    {
      value: "IN_PROGRESS",
      label: (
        <>
          <Circle className="w-3.5 h-3.5" />
          <span>In Progress</span>
        </>
      ),
    },
    {
      value: "REPLIED",
      label: (
        <>
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Replied</span>
        </>
      ),
    },
    {
      value: "CLOSED",
      label: (
        <>
          <Lock className="w-3.5 h-3.5" />
          <span>Closed</span>
        </>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-poppins">
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          <motion.div
            className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3 bg-gradient-to-r from-[#000060] to-[#0000a0] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Enquiry Details
                  </h2>
                  <p className="text-xs text-white/70">
                    {enquiry?.enquiry_number}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {details && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentStatus.bg} ${currentStatus.text}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="font-semibold text-xs">
                      {currentStatus.label}
                    </span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8">
                <Loader2 className="w-8 h-8 text-[#000060] animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Loading details...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchDetails}
                  className="mt-4 px-4 py-2 text-sm font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : details ? (
              <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Customer Info & Message */}
                <div className="w-2/5 border-r border-gray-100 bg-gray-50 p-4 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer Details
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    {/* Name */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#000060]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#000060] font-bold text-sm">
                          {details.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {details.name}
                        </p>
                        <p className="text-xs text-gray-500">Customer Name</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-[#000060]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={`mailto:${details.email}`}
                          className="font-medium text-gray-900 text-sm hover:text-[#000060] transition-colors truncate block"
                        >
                          {details.email}
                        </a>
                        <p className="text-xs text-gray-500">Email Address</p>
                      </div>
                    </div>

                    {/* Phone */}
                    {details.phone && (
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-[#000060]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <a
                            href={`tel:${details.phone}`}
                            className="font-medium text-gray-900 text-sm hover:text-[#000060] transition-colors"
                          >
                            {details.phone}
                          </a>
                          <p className="text-xs text-gray-500">Phone Number</p>
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-[#000060]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {formatDate(details.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(details.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Management */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Status Management
                      </label>
                      {isUpdatingStatus && (
                        <Loader2 className="w-3.5 h-3.5 text-[#000060] animate-spin" />
                      )}
                    </div>
                    <StyledSelect
                      value={details.status}
                      onChange={handleStatusChange}
                      options={statusOptions}
                      placeholder="Select status"
                      disabled={isUpdatingStatus}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Update the enquiry status to track progress
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Customer Message
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto custom-scrollbar">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {details.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Replies */}
                <div className="w-3/5 flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Reply History
                      </span>
                      {details.replies?.length > 0 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          {details.replies.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleReplyClick}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#000060] to-[#0000a0] rounded-lg hover:shadow-lg hover:shadow-[#000060]/25 transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Reply
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {details.replies?.length > 0 ? (
                      <div className="space-y-3">
                        {details.replies.map((reply, index) => (
                          <motion.div
                            key={reply.reply_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Send className="w-3 h-3 text-green-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 text-xs truncate">
                                    {reply.subject}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    by {reply.replied_by?.name || "Admin"}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                                {formatRelativeTime(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed mb-2 pl-8">
                              {reply.message}
                            </p>
                            <div className="pl-8">
                              {reply.email_sent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  Email Sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium">
                                  <XCircle className="w-3 h-3" />
                                  Email Failed
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium text-sm mb-1">
                            No replies yet
                          </p>
                          <p className="text-xs text-gray-400 mb-3">
                            Send your first response to this enquiry
                          </p>
                          <button
                            onClick={handleReplyClick}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 p-8">
                <p className="text-gray-500">No data available</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-gray-400">
                {details?.enquiry_number && `ID: ${details.enquiry_number}`}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnquiryDetailsModal;
