// cadmin-web/src/pages/Communications/pages/Broadcast/Email/comps/CreateEmailForm.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/Email/comps/CreateEmailForm.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Save,
  Calendar,
  Eye,
  AlertTriangle,
  Users,
  X,
  Mail,
  Loader2,
  TestTube,
  CheckCircle,
} from "lucide-react";
import EmailAudienceFilterPanel from "./EmailAudienceFilterPanel";
import EmailInlineImageUpload from "./EmailInlineImageUpload";
import EmailAttachmentsPanel from "./EmailAttachmentsPanel";
import EmailConfirmSendModal from "./EmailConfirmSendModal";
import EmailScheduleModal from "./EmailScheduleModal";
import EmailPreviewModal from "./EmailPreviewModal";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

function CreateEmailForm({
  onSuccess,
  onDraftSaved,
  onScheduled,
  editDraft = null,
  quota,
}) {
  // Form state
  const [formData, setFormData] = useState({
    subject: "",
    message_text: "",
    target_filters: {},
    target_users: true,
    target_cadmins: false,
    inline_image: null,
    attachments: [],
    action_url: "",
    action_label: "",
  });

  // UI state
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Debounced filters for auto-preview
  const debouncedFilters = useDebounce(formData.target_filters, 500);

  // Load draft data
  useEffect(() => {
    if (editDraft) {
      setFormData({
        subject: editDraft.subject || "",
        message_text: editDraft.message_text || "",
        target_filters: editDraft.target_filters || {},
        target_users: editDraft.target_users ?? true,
        target_cadmins: editDraft.target_cadmins ?? false,
        inline_image: editDraft.inline_image || null,
        attachments: editDraft.attachments || [],
        action_url: editDraft.action_url || "",
        action_label: editDraft.action_label || "",
      });
    }
  }, [editDraft]);

  // Auto-preview recipient count when filters change
  useEffect(() => {
    const hasAudience = formData.target_users || formData.target_cadmins;
    if (hasAudience) {
      fetchRecipientCount();
    } else {
      setRecipientPreview(null);
    }
  }, [debouncedFilters, formData.target_users, formData.target_cadmins]);

  //  FIXED: Proper response parsing
  const fetchRecipientCount = async () => {
    setIsPreviewLoading(true);
    try {
      const response = await emailBroadcastAPI.previewRecipients(
        formData.target_filters,
        formData.target_users,
        formData.target_cadmins,
      );



      // API returns response.data, so response is already the data object
      if (response && response.success) {
        setRecipientPreview(response.data);
      } else if (response && response.total !== undefined) {
        // Direct data format
        setRecipientPreview(response);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleFiltersChange = useCallback((filters) => {
    setFormData((prev) => ({ ...prev, target_filters: filters }));
    setError(null);
  }, []);

  const handleInlineImageChange = useCallback((image) => {
    setFormData((prev) => ({ ...prev, inline_image: image }));
  }, []);

  const handleAttachmentsChange = useCallback((attachments) => {
    setFormData((prev) => ({ ...prev, attachments }));
  }, []);

  const validateForm = () => {
    if (!formData.subject.trim() || formData.subject.length < 3) {
      setError("Subject must be at least 3 characters");
      return false;
    }
    if (!formData.message_text.trim() || formData.message_text.length < 10) {
      setError("Message must be at least 10 characters");
      return false;
    }
    if (!formData.target_users && !formData.target_cadmins) {
      setError("Select at least one audience type");
      return false;
    }
    if (formData.action_url && !formData.action_label) {
      setError("Button text is required when URL is provided");
      return false;
    }
    return true;
  };

  const prepareSubmissionData = () => {
    return {
      subject: formData.subject,
      message_text: formData.message_text,
      target_filters: formData.target_filters,
      target_users: formData.target_users,
      target_cadmins: formData.target_cadmins,
      inline_image: formData.inline_image,
      attachments: formData.attachments,
      action_url: formData.action_url || null,
      action_label: formData.action_label || null,
    };
  };

  // ============================================
  // ACTIONS
  // ============================================

  //  FIXED: Proper response parsing
  const handleSendTestEmail = async () => {
    if (!validateForm()) return;

    setTestLoading(true);
    setError(null);

    try {
      const testData = {
        subject: formData.subject,
        message_text: formData.message_text,
        inline_image: formData.inline_image,
        attachments: formData.attachments,
        action_url: formData.action_url || null,
        action_label: formData.action_label || null,
      };

      const res = await emailBroadcastAPI.sendTestEmail(testData);

    

      // API returns response.data, so res is already the data object
      if (res && res.success) {
        setSuccess(`Test email sent to ${res.data?.sent_to || "your email"}`);
      } else if (res && res.sent_to) {
        setSuccess(`Test email sent to ${res.sent_to}`);
      } else {
        throw new Error(res?.message || "Failed to send test email");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to send test email",
      );
    } finally {
      setTestLoading(false);
    }
  };

  //  FIXED: Proper response parsing
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    try {
      const submissionData = prepareSubmissionData();

      let res;
      if (editDraft?.campaign_id) {
        res = await emailBroadcastAPI.updateDraft(
          editDraft.campaign_id,
          submissionData,
        );
      
        if (res && (res.success || res.campaign_id)) {
          setSuccess("Draft updated");
        }
      } else {
        res = await emailBroadcastAPI.createDraft(submissionData);
       
        if (res && (res.success || res.campaign_id)) {
          setSuccess("Draft saved");
        }
      }

      setTimeout(() => onDraftSaved?.(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  //  FIXED: Proper response parsing
  const confirmSendNow = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const submissionData = prepareSubmissionData();
      const res = await emailBroadcastAPI.sendEmailNow(submissionData);

    

      // API returns response.data, so res is already the data object
      if (res && (res.success || res.campaign_id)) {
        const recipientCount =
          res.data?.recipient_count || res.recipient_count || 0;
        setSuccess(`Sending to ${recipientCount} recipients`);
        setTimeout(() => onSuccess?.(), 1500);
      } else {
        throw new Error(res?.message || "Failed to send");
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

  //  FIXED: Proper response parsing
  const confirmSchedule = async (scheduledFor) => {
    setShowScheduleModal(false);
    setLoading(true);

    try {
      const submissionData = prepareSubmissionData();
      let campaignId = editDraft?.campaign_id;

      if (!campaignId) {
        const draftRes = await emailBroadcastAPI.createDraft(submissionData);
        
        campaignId = draftRes.data?.campaign_id || draftRes.campaign_id;
      } else {
        await emailBroadcastAPI.updateDraft(campaignId, submissionData);
      }

      const scheduleRes = await emailBroadcastAPI.scheduleCampaign(
        campaignId,
        scheduledFor,
      );
      

      setSuccess(`Scheduled for ${new Date(scheduledFor).toLocaleString()}`);
      setTimeout(() => onScheduled?.(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule");
    } finally {
      setLoading(false);
    }
  };

  const charCount = formData.message_text.length;

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
            {error ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
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

      {/* Main Content - Horizontal Layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col lg:flex-row">
          {/* LEFT: Email Content */}
          <div className="lg:w-[480px] xl:w-[540px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
            <div className="p-5 space-y-5 h-full overflow-y-auto">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Mail size={16} className="text-[#05015A]" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Email Content
                </h3>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject line..."
                  maxLength={200}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] disabled:bg-gray-50"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-gray-400">
                    {formData.subject.length}/200
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message_text"
                  value={formData.message_text}
                  onChange={handleInputChange}
                  placeholder="Write your email message...

URLs will be automatically converted to clickable links."
                  rows={8}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] disabled:bg-gray-50 font-mono"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">
                    Plain text • URLs auto-linked
                  </span>
                  <span
                    className={`text-[10px] ${
                      charCount > 2000 ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {charCount.toLocaleString()} characters
                  </span>
                </div>
              </div>

              {/* Inline Image */}
              <EmailInlineImageUpload
                image={formData.inline_image}
                onChange={handleInlineImageChange}
                disabled={loading}
              />

              {/* File Attachments */}
              <EmailAttachmentsPanel
                attachments={formData.attachments}
                onChange={handleAttachmentsChange}
                disabled={loading}
              />

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Call to Action Button{" "}
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
                    <div className="flex items-center gap-2">
                      {recipientPreview.unsubscribed_count > 0 && (
                        <span className="text-xs text-gray-400">
                          ({recipientPreview.unsubscribed_count} unsubscribed)
                        </span>
                      )}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#05015A] rounded-lg">
                        <span className="text-sm font-bold text-white">
                          {(
                            recipientPreview.total_after_unsubscribe ||
                            recipientPreview.total ||
                            0
                          ).toLocaleString()}
                        </span>
                        <span className="text-xs text-white/80">
                          recipients
                        </span>
                      </div>
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
                {/* Shop Owners Card */}
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
                  className={`
                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${
                      formData.target_users
                        ? "border-[#05015A] bg-white shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${formData.target_users ? "bg-[#05015A]/10" : "bg-gray-100"}
                    `}
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
                        Shop Owners
                      </span>
                      <p className="text-xs text-gray-500">
                        ERP super admins with email
                      </p>
                    </div>
                  </div>
                  <div
                    className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${
                      formData.target_users
                        ? "border-[#05015A] bg-[#05015A]"
                        : "border-gray-300"
                    }
                  `}
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

                {/* CAdmins Card */}
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
                  className={`
                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${
                      formData.target_cadmins
                        ? "border-[#05015A] bg-white shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${formData.target_cadmins ? "bg-[#05015A]/10" : "bg-gray-100"}
                    `}
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
                        CAdmins
                      </span>
                      <p className="text-xs text-gray-500">
                        Internal team members
                      </p>
                    </div>
                  </div>
                  <div
                    className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${
                      formData.target_cadmins
                        ? "border-[#05015A] bg-[#05015A]"
                        : "border-gray-300"
                    }
                  `}
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
                <EmailAudienceFilterPanel
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
              {recipientPreview.by_type?.users || 0} shop owners,{" "}
              {recipientPreview.by_type?.cadmins || 0} admins
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Test Email */}
          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={loading || testLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
          >
            {testLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <TestTube size={15} />
            )}
            Test Email
          </button>

          {/* Preview */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={loading || !recipientPreview?.total}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Eye size={15} />
            Preview
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            Save Draft
          </button>

          {/* Schedule */}
          <button
            type="button"
            onClick={handleSchedule}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Calendar size={15} />
            Schedule
          </button>

          {/* Send Now */}
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
        <EmailConfirmSendModal
          subject={formData.subject}
          message={formData.message_text}
          recipientCount={recipientPreview?.total_after_unsubscribe || 0}
          recipientBreakdown={recipientPreview?.by_type}
          quota={quota}
          onConfirm={confirmSendNow}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {showScheduleModal && (
        <EmailScheduleModal
          onConfirm={confirmSchedule}
          onCancel={() => setShowScheduleModal(false)}
        />
      )}

      {showPreviewModal && recipientPreview && (
        <EmailPreviewModal
          data={recipientPreview}
          formData={formData}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}

export default CreateEmailForm;
