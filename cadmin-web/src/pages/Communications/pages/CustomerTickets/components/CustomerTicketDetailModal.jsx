// cadmin-web/src/pages/Communications/pages/CustomerTickets/components/CustomerTicketDetailModal.jsx (do not remove this comment)
import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Store,
  ShoppingBag,
  Paperclip,
  Send,
  Lock,
  Clock,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import {
  getCustomerStatusConfig,
  getCustomerCategoryConfig,
  UPDATABLE_STATUSES,
} from "../../../../../config/customerTicketConfigs";
import {
  updateCustomerTicketStatus,
  addCustomerTicketReply,
} from "../../../../../api/cadminCustomerTickets";
import { useToast } from "../../../../../components/common/Toast";
import { resolveFileUrl } from "../../../../../utils/resolveFileUrl";

const CustomerTicketDetailModal = ({
  isOpen,
  onClose,
  ticket,
  loading,
  onRefresh,
  canUpdateStatus,
  canReply,
}) => {
  const toast = useToast();

  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [zoomImage, setZoomImage] = useState(null);

  if (!isOpen) return null;

  // ── Helper to resolve attachment full URL ──────────────────────────────
  const getAttachmentUrl = (att) => {
    if (!att) return "";
    if (att.url && (att.url.startsWith("http://") || att.url.startsWith("https://"))) {
      return att.url;
    }
    if (att.url && att.url.startsWith("/")) {
      const backendOrigin = import.meta.env.VITE_API_URL || "http://localhost:5000";
      return `${backendOrigin}${att.url}`;
    }
    try {
      return resolveFileUrl(att.storage_key, "customer_tickets");
    } catch {
      const backendOrigin = import.meta.env.VITE_API_URL || "http://localhost:5000";
      return `${backendOrigin}/api/files/customer_tickets/${att.storage_key}`;
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === ticket?.status) return;

    setIsUpdatingStatus(true);
    try {
      await updateCustomerTicketStatus(ticket.ticket_id, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
      toast.success("Status Updated", `Ticket moved to ${newStatus}`);
      setStatusNote("");
      setNewStatus("");
      onRefresh();
    } catch (err) {
      toast.error(
        "Update Failed",
        err.response?.data?.message || "Could not change status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      await addCustomerTicketReply(ticket.ticket_id, {
        message: replyMessage.trim(),
        is_internal: isInternalNote,
      });
      toast.success(
        isInternalNote ? "Note Added" : "Reply Sent",
        isInternalNote
          ? "Internal note saved"
          : "Customer will receive a push notification"
      );
      setReplyMessage("");
      onRefresh();
    } catch (err) {
      toast.error(
        "Reply Failed",
        err.response?.data?.message || "Could not send reply"
      );
    } finally {
      setIsSendingReply(false);
    }
  };

  const statusCfg = ticket ? getCustomerStatusConfig(ticket.status) : {};
  const catCfg = ticket ? getCustomerCategoryConfig(ticket.category) : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] text-white flex items-center justify-center font-bold">
              #{ticket?.ticket_number?.split("-").pop() || "TKT"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Ticket #{ticket?.ticket_number}
                </h2>
                {ticket && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Created on {ticket && new Date(ticket.created_at).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        {loading || !ticket ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Left Column: Context & Metadata */}
            <div className="lg:w-5/12 overflow-y-auto p-5 space-y-5 bg-gray-50/30">
              {/* Category & Subject */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Issue Category
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                  >
                    {catCfg.fullLabel}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{ticket.subject}</h3>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {ticket.description}
                </p>
              </div>

              {/* Customer Snapshot */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-gray-400" /> Customer Details
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-semibold text-gray-900">
                      {ticket.customer?.full_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {ticket.customer?.phone || "—"}
                    </span>
                  </div>
                  {ticket.customer?.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Mail size={12} className="text-gray-400" />
                        {ticket.customer.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Snapshot */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-gray-400" /> Order Info
                  </h4>
                  <span className="text-xs font-bold text-indigo-600">
                    {ticket.order?.order_number}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pharmacy</span>
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      <Store size={12} className="text-gray-400" />
                      {ticket.shop?.business_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Bill</span>
                    <span className="font-bold text-emerald-600">
                      ₹{ticket.order?.total_amount}
                    </span>
                  </div>
                </div>

                {/* Items */}
                {ticket.order?.items && ticket.order.items.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase">
                      Ordered Items ({ticket.order.items.length})
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {ticket.order.items.map((item) => (
                        <div
                          key={item.item_id}
                          className="flex justify-between text-xs text-gray-700 bg-gray-50 p-1.5 rounded"
                        >
                          <span className="truncate pr-2">
                            {item.medicine_name_snapshot} × {item.quantity}
                          </span>
                          <span className="font-medium flex-shrink-0">
                            ₹{item.line_total || item.unit_price_snapshot * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments / Photos */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2.5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip size={14} className="text-gray-400" />
                    Photos / Attachments ({ticket.attachments.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {ticket.attachments.map((att) => {
                      const fullUrl = getAttachmentUrl(att);
                      return (
                        <div
                          key={att.attachment_id}
                          onClick={() => fullUrl && setZoomImage(fullUrl)}
                          className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100 cursor-pointer flex items-center justify-center"
                        >
                          {fullUrl ? (
                            <img
                              src={fullUrl}
                              alt={att.original_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div className="hidden flex-col items-center justify-center p-2 text-gray-400 text-center">
                            <ImageIcon size={20} />
                            <span className="text-[10px] mt-1 truncate max-w-full">
                              {att.original_name}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink size={16} className="text-white" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Timeline & Action Form */}
            <div className="lg:w-7/12 flex flex-col h-full overflow-hidden bg-white">
              {/* Status Update Bar */}
              {canUpdateStatus && (
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                      Change Status:
                    </span>
                    <select
                      value={newStatus || ticket.status}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="text-xs font-medium border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                    >
                      {UPDATABLE_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {newStatus && newStatus !== ticket.status && (
                      <input
                        type="text"
                        placeholder="Optional transition note..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 flex-1 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    )}
                  </div>
                  {newStatus && newStatus !== ticket.status && (
                    <button
                      onClick={handleStatusChange}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdatingStatus ? "Updating..." : "Save Status"}
                    </button>
                  )}
                </div>
              )}

              {/* Timeline Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {ticket.activities?.map((act) => {
                  const isInternal = act.is_internal;
                  const isCustomer = act.actor_type === "CUSTOMER";
                  const isStatusChange = act.type === "STATUS_CHANGED";

                  if (isStatusChange) {
                    return (
                      <div
                        key={act.activity_id}
                        className="flex items-center gap-3 my-2 text-xs text-gray-400"
                      >
                        <div className="h-px bg-gray-200 flex-1" />
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                          <Clock size={12} />
                          {act.message || `Moved to ${act.to_status}`}
                        </span>
                        <div className="h-px bg-gray-200 flex-1" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={act.activity_id}
                      className={`flex flex-col max-w-[85%] rounded-xl p-3.5 border space-y-1.5 ${
                        isInternal
                          ? "bg-amber-50/70 border-amber-200 self-center w-full max-w-full text-amber-950"
                          : isCustomer
                          ? "bg-gray-100 border-gray-200 self-start text-gray-900"
                          : "bg-indigo-50/80 border-indigo-200 self-end text-indigo-950"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            isInternal
                              ? "text-amber-800"
                              : isCustomer
                              ? "text-gray-700"
                              : "text-indigo-700"
                          }`}
                        >
                          {isInternal && <Lock size={12} />}
                          {isCustomer
                            ? act.actor_name || "Customer"
                            : isInternal
                            ? `Internal Note (${act.actor_name})`
                            : `Support Team (${act.actor_name})`}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(act.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">
                        {act.message}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {canReply && (
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-2 flex-shrink-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          !isInternalNote
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        Public Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                          isInternalNote
                            ? "bg-amber-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        <Lock size={11} /> Internal Note
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {isInternalNote
                        ? "Visible only to Admins"
                        : "Customer will be notified via Push"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      placeholder={
                        isInternalNote
                          ? "Add a private admin note..."
                          : "Type a response to the customer..."
                      }
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className={`w-full text-xs p-2.5 rounded-xl border focus:ring-2 focus:outline-hidden transition-all resize-none ${
                        isInternalNote
                          ? "bg-amber-50/30 border-amber-300 focus:ring-amber-500/20 focus:border-amber-500"
                          : "bg-white border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim() || isSendingReply}
                      className={`px-4 rounded-xl text-white font-semibold flex items-center justify-center transition-all disabled:opacity-40 ${
                        isInternalNote
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {isSendingReply ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/40 hover:bg-black/60"
          >
            <X size={24} />
          </button>
          <img
            src={zoomImage}
            alt="Enlarged preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default CustomerTicketDetailModal;