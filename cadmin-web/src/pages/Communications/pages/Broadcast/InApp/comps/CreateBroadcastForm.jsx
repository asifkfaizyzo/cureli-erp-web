// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/CreateBroadcastForm.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/CreateBroadcastForm.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Send,
  Save,
  Calendar,
  Eye,
  AlertTriangle,
  Users,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import AudienceFilterPanel from "./AudienceFilterPanel";
import AttachmentsPanel from "./AttachmentsPanel";
import ConfirmSendModal from "./ConfirmSendModal";
import ScheduleModal from "./ScheduleModal";
import PreviewModal from "./PreviewModal";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  {
    value: "normal",
    label: "Normal",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    value: "high",
    label: "High",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    value: "critical",
    label: "Critical",
    color: "bg-red-50 text-red-700 border-red-200",
  },
];

function CreateBroadcastForm({
  onSuccess,
  onDraftSaved,
  onScheduled,
  editDraft = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
    target_filters: {},
    attachments: [],
    action_url: "",
    action_label: "",
    target_users: true,
    target_cadmins: false,
  });

  const [recipientPreview, setRecipientPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  //  Use ref to always have latest formData in async callbacks
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const debouncedFilters = useDebounce(formData.target_filters, 600);

  // Load draft data
  useEffect(() => {
    if (editDraft) {
      setFormData({
        title: editDraft.title || "",
        message: editDraft.message || "",
        priority: editDraft.priority || "normal",
        target_filters: editDraft.target_filters || {},
        attachments: editDraft.attachments || [],
        action_url: editDraft.action_url || "",
        action_label: editDraft.action_label || "",
        target_users: editDraft.target_users ?? true,
        target_cadmins: editDraft.target_cadmins ?? false,
      });
    }
  }, [editDraft]);

  //  fetchRecipientCount reads from ref — never stale
  const fetchRecipientCount = useCallback(async () => {
    const current = formDataRef.current;

    // Must have at least one audience type selected
    if (!current.target_users && !current.target_cadmins) {
      setRecipientPreview(null);
      return;
    }

    setIsPreviewLoading(true);
    try {
      //  Merge audience flags into filters for the API call
      const filtersToSend = {
        ...current.target_filters,
        includeUsers: current.target_users,
        includeCAdmins: current.target_cadmins,
      };

      const response = await broadcastAPI.previewBroadcast(filtersToSend, true);
      if (response.data.success) {
        setRecipientPreview(response.data.data);
      }
    } catch (err) {
      console.error("Preview failed:", err);
      // Don't show error for preview — it's background
    } finally {
      setIsPreviewLoading(false);
    }
  }, []); //  Stable — uses ref internally

  //  Re-fetch when debounced filters OR audience toggles change
  useEffect(() => {
    fetchRecipientCount();
  }, [
    debouncedFilters,
    formData.target_users,
    formData.target_cadmins,
    fetchRecipientCount,
  ]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
    setSuccess(null);
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setFormData((prev) => ({ ...prev, target_filters: filters }));
    setError(null);
  }, []);

  const handleAttachmentsChange = useCallback((attachments) => {
    setFormData((prev) => ({ ...prev, attachments }));
  }, []);

  const validateForm = () => {
    if (!formData.title.trim() || formData.title.length < 3) {
      setError("Title must be at least 3 characters");
      return false;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      setError("Message must be at least 10 characters");
      return false;
    }
    if (formData.message.length > 500) {
      setError("Message must not exceed 500 characters");
      return false;
    }
    if (!formData.target_users && !formData.target_cadmins) {
      setError("Select at least one audience type");
      return false;
    }
    return true;
  };

  const preparePayload = () => {
    const cleanedAttachments = formData.attachments.map((att) => ({
      type: att.type,
      url: att.url,
      label: att.label || att.original_name || null,
      filename: att.filename || null,
      original_name: att.original_name || null,
      size: att.size || null,
    }));

    //  Merge audience flags into target_filters so backend resolveAudience gets them
    const mergedFilters = {
      ...formData.target_filters,
      includeUsers: formData.target_users,
      includeCAdmins: formData.target_cadmins,
    };

    return {
      title: formData.title,
      message: formData.message,
      priority: formData.priority,
      target_filters: mergedFilters,
      attachments: cleanedAttachments,
      action_url: formData.action_url,
      action_label: formData.action_label,
      target_users: formData.target_users,
      target_cadmins: formData.target_cadmins,
    };
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      const payload = preparePayload();
      if (editDraft?.campaign_id) {
        await broadcastAPI.updateDraft(editDraft.campaign_id, payload);
        setSuccess("Draft updated");
      } else {
        await broadcastAPI.createDraft(payload);
        setSuccess("Draft saved");
      }
      setTimeout(() => onDraftSaved?.(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const confirmSendNow = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const payload = preparePayload();
      const res = await broadcastAPI.sendBroadcastNow(payload);
      if (res.data.success) {
        setSuccess(`Sent to ${res.data.data.sent_to} recipients`);
        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = () => {
    if (!validateForm()) return;
    setShowScheduleModal(true);
  };

  const confirmSchedule = async (scheduledFor) => {
    setShowScheduleModal(false);
    setLoading(true);
    try {
      const payload = preparePayload();
      let campaignId = editDraft?.campaign_id;

      if (!campaignId) {
        const draftRes = await broadcastAPI.createDraft(payload);
        campaignId = draftRes.data.data.campaign_id;
      } else {
        await broadcastAPI.updateDraft(campaignId, payload);
      }

      await broadcastAPI.scheduleBroadcast(campaignId, scheduledFor);
      setSuccess(`Scheduled for ${new Date(scheduledFor).toLocaleString()}`);
      setTimeout(() => onScheduled?.(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule");
    } finally {
      setLoading(false);
    }
  };

  const charCount = formData.message.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Alert */}
      {(error || success) && (
        <div className="flex-shrink-0 px-6 pt-4">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
              error
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}
          >
            {error && <AlertTriangle size={14} />}
            <span className="font-medium">{error || success}</span>
            {error && (
              <button
                onClick={() => setError(null)}
                className="ml-auto p-0.5 hover:bg-red-100 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col lg:flex-row">
          {/* LEFT: Message Content */}
          <div className="lg:w-[420px] xl:w-[480px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
            <div className="p-5 space-y-5 h-full overflow-y-auto">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FileText size={16} className="text-[#05015A]" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Message Content
                </h3>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notification title..."
                  maxLength={200}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] disabled:bg-gray-50"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Write your message..."
                  rows={5}
                  maxLength={500}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] disabled:bg-gray-50"
                />
                <div className="flex justify-end mt-1">
                  <span
                    className={`text-[10px] ${charCount > 450 ? "text-amber-600" : "text-gray-400"}`}
                  >
                    {charCount}/500
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, priority: opt.value }))
                      }
                      disabled={loading}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        formData.priority === opt.value
                          ? opt.color + " ring-1 ring-offset-1 ring-gray-300"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachment */}
              <AttachmentsPanel
                attachments={formData.attachments}
                onChange={handleAttachmentsChange}
                disabled={loading}
              />

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Action Button{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="action_label"
                    value={formData.action_label}
                    onChange={handleInputChange}
                    placeholder="Button text (e.g., Learn More)"
                    maxLength={50}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
                  />
                  <input
                    type="url"
                    name="action_url"
                    value={formData.action_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Audience */}
          <div className="flex-1 bg-gray-50 min-w-0">
            <div className="p-5 h-full overflow-y-auto">
              {/* Header with recipient count */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-5">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#05015A]" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Target Audience
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {isPreviewLoading ? (
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      Counting...
                    </span>
                  ) : recipientPreview ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#05015A] rounded-lg">
                      <span className="text-sm font-bold text-white">
                        {recipientPreview.total.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/80">recipients</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Select audience
                    </span>
                  )}
                </div>
              </div>

              {/* Audience Type Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {/* ERP Users */}
                <div
                  onClick={() =>
                    !loading &&
                    handleInputChange({
                      target: {
                        name: "target_users",
                        type: "checkbox",
                        checked: !formData.target_users,
                      },
                    })
                  }
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.target_users
                      ? "border-[#05015A] bg-white shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.target_users
                          ? "bg-[#05015A]/10"
                          : "bg-gray-100"
                      }`}
                    >
                      <Users
                        size={18}
                        className={
                          formData.target_users
                            ? "text-[#05015A]"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">
                        ERP Users
                      </span>
                      <p className="text-xs text-gray-500">
                        Shop owners & staff
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.target_users
                        ? "border-[#05015A] bg-[#05015A]"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.target_users && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Admins */}
                <div
                  onClick={() =>
                    !loading &&
                    handleInputChange({
                      target: {
                        name: "target_cadmins",
                        type: "checkbox",
                        checked: !formData.target_cadmins,
                      },
                    })
                  }
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.target_cadmins
                      ? "border-[#05015A] bg-white shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.target_cadmins
                          ? "bg-[#05015A]/10"
                          : "bg-gray-100"
                      }`}
                    >
                      <Users
                        size={18}
                        className={
                          formData.target_cadmins
                            ? "text-[#05015A]"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">
                        Admins
                      </span>
                      <p className="text-xs text-gray-500">
                        Internal team members
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.target_cadmins
                        ? "border-[#05015A] bg-[#05015A]"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.target_cadmins && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <AudienceFilterPanel
                  filters={formData.target_filters}
                  onChange={handleFiltersChange}
                  disabled={loading}
                  showUserFilters={formData.target_users}
                  showCAdminFilters={formData.target_cadmins}
                  recipientPreview={recipientPreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {editDraft && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
              Editing Draft
            </span>
          )}
          {recipientPreview && !isPreviewLoading && (
            <span className="text-xs text-gray-500">
              {recipientPreview.by_type?.users || 0} users,{" "}
              {recipientPreview.by_type?.cadmins || 0} admins
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={loading || !recipientPreview?.total}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Calendar size={15} />
            Schedule
          </button>
          <button
            type="button"
            onClick={handleSendNow}
            disabled={loading || !recipientPreview?.total}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Send Now
          </button>
        </div>
      </div>

      {/* Modals */}
      {showConfirmModal && (
        <ConfirmSendModal
          title={formData.title}
          message={formData.message}
          recipientCount={recipientPreview?.total || 0}
          recipientBreakdown={recipientPreview?.by_type}
          attachments={formData.attachments}
          onConfirm={confirmSendNow}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
      {showScheduleModal && (
        <ScheduleModal
          onConfirm={confirmSchedule}
          onCancel={() => setShowScheduleModal(false)}
        />
      )}
      {showPreviewModal && recipientPreview && (
        <PreviewModal
          data={recipientPreview}
          formData={formData}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}

export default CreateBroadcastForm;
