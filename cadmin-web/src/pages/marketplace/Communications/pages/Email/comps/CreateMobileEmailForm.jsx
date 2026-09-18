// cadmin-web/src/pages/marketplace/Communications/pages/Email/comps/CreateMobileEmailForm.jsx

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
import MobileEmailAudienceFilterPanel from "./MobileEmailAudienceFilterPanel";
import EmailInlineImageUpload from "./EmailInlineImageUpload";
import EmailAttachmentsPanel from "./EmailAttachmentsPanel";
import EmailConfirmSendModal from "./EmailConfirmSendModal";
import EmailScheduleModal from "./EmailScheduleModal";
import EmailPreviewModal from "./EmailPreviewModal";
import * as mobileEmailAPI from "../../../../../../api/cadminMobileEmailBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

function CreateMobileEmailForm({
  onSuccess,
  onDraftSaved,
  onScheduled,
  editDraft = null,
}) {
  const [formData, setFormData] = useState({
    subject: "",
    message_text: "",
    target_filters: { target_all: true },
    inline_image: null,
    attachments: [],
    action_url: "",
    action_label: "",
  });

  const [recipientPreview, setRecipientPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const debouncedFilters = useDebounce(formData.target_filters, 400);

  useEffect(() => {
    if (editDraft) {
      setFormData({
        subject: editDraft.subject || "",
        message_text: editDraft.message_text || "",
        target_filters: editDraft.target_filters || { target_all: true },
        inline_image: editDraft.inline_image || null,
        attachments: editDraft.attachments || [],
        action_url: editDraft.action_url || "",
        action_label: editDraft.action_label || "",
      });
    }
  }, [editDraft]);

  // ◄ FIXED: Dependent on stable debouncedFilters + Unwraps Axios response correctly
  const fetchRecipientCount = useCallback(async () => {
    setIsPreviewLoading(true);
    try {
      const response = await mobileEmailAPI.previewCustomerRecipients(
        debouncedFilters
      );
      const payload = response.data; // Unpack Axios response wrapper
      if (payload && payload.success) {
        setRecipientPreview(payload.data);
      } else if (payload && payload.total !== undefined) {
        setRecipientPreview(payload);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchRecipientCount();
  }, [fetchRecipientCount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (formData.action_url && !formData.action_label) {
      setError("Button text is required when URL is provided");
      return false;
    }
    return true;
  };

  // ◄ FIXED: Unwraps Axios test email response
  const handleSendTest = async () => {
    if (!validateForm()) return;
    setTestLoading(true);
    setError(null);

    try {
      const res = await mobileEmailAPI.sendCustomerTestEmail(formData);
      const payload = res.data;
      if (payload && (payload.success || payload.data?.sent_to)) {
        setSuccess(`Test email sent to ${payload.data?.sent_to || "your email"}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send test email");
    } finally {
      setTestLoading(false);
    }
  };

  // ◄ FIXED: Unwraps Axios drafts response
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    try {
      if (editDraft?.campaign_id) {
        const res = await mobileEmailAPI.updateCustomerDraft(editDraft.campaign_id, formData);
        const payload = res.data;
        if (payload && (payload.success || payload.data)) {
          setSuccess("Draft updated");
        }
      } else {
        const res = await mobileEmailAPI.createCustomerDraft(formData);
        const payload = res.data;
        if (payload && (payload.success || payload.data)) {
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

  // ◄ FIXED: Unwraps Axios sendNow response
  const confirmSendNow = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const res = await mobileEmailAPI.sendCustomerEmailNow(formData);
      const payload = res.data;
      if (payload && (payload.success || payload.data?.campaign_id)) {
        setSuccess("Broadcast queued successfully");
        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  // ◄ FIXED: Unwraps Axios schedule response
  const confirmSchedule = async (scheduledFor) => {
    setShowScheduleModal(false);
    setLoading(true);
    try {
      let campaignId = editDraft?.campaign_id;
      if (!campaignId) {
        const draftRes = await mobileEmailAPI.createCustomerDraft(formData);
        const draftPayload = draftRes.data;
        campaignId = draftPayload.data?.campaign_id || draftPayload.campaign_id;
      }
      const res = await mobileEmailAPI.scheduleCustomerCampaign(campaignId, scheduledFor);
      const payload = res.data;
      if (payload && (payload.success || payload.data)) {
        setSuccess("Scheduled successfully");
        setTimeout(() => onScheduled?.(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans">
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
              <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:bg-red-100 rounded">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col lg:flex-row">
          {/* LEFT: Content */}
          <div className="lg:w-[480px] xl:w-[540px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
            <div className="p-5 space-y-5 h-full overflow-y-auto">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Mail size={16} className="text-[#05015A]" />
                <h3 className="text-sm font-semibold text-gray-900">Email Content</h3>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g. Exclusive Weekend Healthcare Offers"
                  maxLength={200}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message_text"
                  value={formData.message_text}
                  onChange={handleInputChange}
                  placeholder="Write your email body for mobile app customers..."
                  rows={8}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
                />
              </div>

              <EmailInlineImageUpload
                image={formData.inline_image}
                onChange={handleInlineImageChange}
                disabled={loading}
              />

              <EmailAttachmentsPanel
                attachments={formData.attachments}
                onChange={handleAttachmentsChange}
                disabled={loading}
              />

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <label className="text-xs font-medium text-gray-600 block">
                  Call to Action Button <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="action_label"
                  value={formData.action_label}
                  onChange={handleInputChange}
                  placeholder="Button label (e.g. Order Now)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="url"
                  name="action_url"
                  value={formData.action_url}
                  onChange={handleInputChange}
                  placeholder="https://cureli.in/promo"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Customer Audience */}
          <div className="flex-1 bg-gray-50 min-w-0">
            <div className="p-5 h-full overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#05015A]" />
                  <h3 className="text-sm font-semibold text-gray-900">Target App Customers</h3>
                </div>

                {isPreviewLoading ? (
                  <span className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Counting...
                  </span>
                ) : recipientPreview ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#05015A] rounded-lg">
                    <span className="text-sm font-bold text-white">
                      {(recipientPreview.total_after_unsubscribe || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-white/80">recipients</span>
                  </div>
                ) : null}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <MobileEmailAudienceFilterPanel
                  filters={formData.target_filters}
                  onChange={handleFiltersChange}
                  disabled={loading}
                  recipientPreview={recipientPreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {recipientPreview && `${recipientPreview.total_after_unsubscribe || 0} active customer emails`}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTest}
            disabled={loading || testLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
          >
            {testLoading ? <Loader2 size={15} className="animate-spin" /> : <TestTube size={15} />}
            Test Email
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={loading || !recipientPreview?.total}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Eye size={15} /> Preview
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save size={15} /> Save Draft
          </button>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Calendar size={15} /> Schedule
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={loading || !recipientPreview?.total_after_unsubscribe}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Send to Customers
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <EmailConfirmSendModal
          subject={formData.subject}
          message={formData.message_text}
          recipientCount={recipientPreview?.total_after_unsubscribe || 0}
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

export default CreateMobileEmailForm;