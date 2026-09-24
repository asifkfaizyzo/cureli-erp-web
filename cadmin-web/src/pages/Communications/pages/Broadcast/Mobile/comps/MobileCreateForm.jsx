// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileCreateForm.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileCreateForm.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send, Save, Calendar, Eye,
  AlertTriangle, Users, X, Smartphone, Loader2,
} from 'lucide-react';
import ConfirmSendModal   from '../../InApp/comps/ConfirmSendModal';
import ScheduleModal      from '../../InApp/comps/ScheduleModal';
import MobilePreviewModal from './MobilePreviewModal';
import * as api from '../../../../../../api/cadminMobileBroadcast';
import { useDebounce } from '../../../../../../hooks/useDebounce';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'promotions',            label: 'Promotions',            color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'prescription_updates',  label: 'Prescription Updates',  color: 'bg-blue-50 text-blue-700 border-blue-200'       },
  { value: 'system_messages',       label: 'System Messages',       color: 'bg-gray-50 text-gray-700 border-gray-200'       },
  { value: 'cart_abandonment',      label: 'Cart Reminders',        color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const TAP_ACTIONS = [
  { value: 'home',                 label: 'Home Screen'         },
  { value: 'cart',                 label: 'Cart'                },
  { value: 'product',              label: 'Specific Product'    },
  { value: 'category',             label: 'Product Category'    },
  { value: 'prescription_upload',  label: 'Prescription Upload' },
];

// ── Component ─────────────────────────────────────────────────────────────────

function MobileCreateForm({ editDraft, onSuccess, onDraftSaved, onScheduled }) {
  const [form, setForm] = useState({
    title:            '',
    body:             '',
    category:         'promotions',
    tap_action:       'home',
    tap_params:       {},
    audience_filters: { target_all: true },
  });

  const [audiencePreview,    setAudiencePreview]    = useState(null);
  const [isPreviewLoading,   setIsPreviewLoading]   = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState(null);
  const [success,            setSuccess]            = useState(null);
  const [showConfirm,        setShowConfirm]        = useState(false);
  const [showSchedule,       setShowSchedule]       = useState(false);
  const [showPreview,        setShowPreview]        = useState(false);

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const debouncedFilters = useDebounce(form.audience_filters, 600);

  // ── Load draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (editDraft) {
      setForm({
        title:            editDraft.title            || '',
        body:             editDraft.body             || '',
        category:         editDraft.category         || 'promotions',
        tap_action:       editDraft.tap_action       || 'home',
        tap_params:       editDraft.tap_params       || {},
        audience_filters: editDraft.audience_filters || { target_all: true },
      });
    }
  }, [editDraft]);

  // ── Audience preview ────────────────────────────────────────────────────
  const fetchPreview = useCallback(async () => {
    setIsPreviewLoading(true);
    try {
      const res = await api.previewMobileAudience(formRef.current.audience_filters);
      if (res.data.success) setAudiencePreview(res.data.data);
    } catch {
      // Silent — preview is non-critical
    } finally {
      setIsPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview();
  }, [debouncedFilters, fetchPreview]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const handleTapParamChange = (key, value) => {
    setForm((p) => ({
      ...p,
      tap_params: value ? { ...p.tap_params, [key]: value } : {},
    }));
  };

  const validate = () => {
    if (!form.title.trim() || form.title.length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }
    if (!form.body.trim() || form.body.length < 10) {
      setError('Body must be at least 10 characters');
      return false;
    }
    if (form.body.length > 500) {
      setError('Body must not exceed 500 characters');
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    title:            form.title.trim(),
    body:             form.body.trim(),
    category:         form.category,
    tap_action:       form.tap_action,
    tap_params:       form.tap_params,
    audience_filters: form.audience_filters,
  });

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (editDraft?.campaign_id) {
        await api.updateMobileDraft(editDraft.campaign_id, buildPayload());
        setSuccess('Draft updated');
      } else {
        await api.createMobileDraft(buildPayload());
        setSuccess('Draft saved');
      }
      setTimeout(() => onDraftSaved?.(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await api.sendMobileBroadcastNow(buildPayload());
      if (res.data.success) {
        const { pushed, targeted } = res.data.data;
        setSuccess(`Sent to ${pushed} of ${targeted} devices`);
        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  const confirmSchedule = async (scheduledFor) => {
    setShowSchedule(false);
    setLoading(true);
    try {
      let campaignId = editDraft?.campaign_id;
      if (!campaignId) {
        const res = await api.createMobileDraft(buildPayload());
        campaignId = res.data.data.campaign_id;
      } else {
        await api.updateMobileDraft(campaignId, buildPayload());
      }
      await api.scheduleMobileBroadcast(campaignId, scheduledFor);
      setSuccess(`Scheduled for ${new Date(scheduledFor).toLocaleString()}`);
      setTimeout(() => onScheduled?.(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  const charCount = form.body.length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Alert */}
      {(error || success) && (
        <div className="flex-shrink-0 px-6 pt-4">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
            error
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {error && <AlertTriangle size={14} />}
            <span className="font-medium">{error || success}</span>
            {error && (
              <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:bg-red-100 rounded">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col lg:flex-row">

          {/* LEFT — Message content */}
          <div className="lg:w-[420px] xl:w-[480px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
            <div className="p-5 space-y-5 h-full overflow-y-auto">

              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Smartphone size={16} className="text-[#05015A]" />
                <h3 className="text-sm font-semibold text-gray-900">Push Notification</h3>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Notification title..."
                  maxLength={200}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] disabled:bg-gray-50"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleChange}
                  placeholder="Write your push notification message..."
                  rows={4}
                  maxLength={500}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] disabled:bg-gray-50"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">
                    Keep it short — push notifications are truncated on small screens
                  </span>
                  <span className={`text-[10px] ${charCount > 450 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {charCount}/500
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                      disabled={loading}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        form.category === cat.value
                          ? cat.color + ' ring-1 ring-offset-1 ring-gray-300'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tap action */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  When tapped, open...
                </label>
                <select
                  name="tap_action"
                  value={form.tap_action}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A] bg-white"
                >
                  {TAP_ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>

                {/* Tap param inputs */}
                {form.tap_action === 'product' && (
                  <input
                    type="text"
                    placeholder="Product ID"
                    value={form.tap_params?.productId || ''}
                    onChange={(e) => handleTapParamChange('productId', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                )}
                {form.tap_action === 'category' && (
                  <input
                    type="text"
                    placeholder="Category name (e.g. DERMA)"
                    value={form.tap_params?.categoryName || ''}
                    onChange={(e) => handleTapParamChange('categoryName', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                )}

                <p className="text-[10px] text-gray-400 mt-1.5">
                  Determines where the user lands after tapping the notification
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Audience */}
          <div className="flex-1 bg-gray-50 min-w-0">
            <div className="p-5 h-full overflow-y-auto">

              {/* Audience header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-5">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#05015A]" />
                  <h3 className="text-sm font-semibold text-gray-900">Target Audience</h3>
                </div>
                <div className="flex items-center gap-3">
                  {isPreviewLoading ? (
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      Counting...
                    </span>
                  ) : audiencePreview ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#05015A] rounded-lg">
                        <span className="text-sm font-bold text-white">
                          {audiencePreview.total.toLocaleString()}
                        </span>
                        <span className="text-xs text-white/80">users</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-lg">
                        <Smartphone size={12} className="text-green-700" />
                        <span className="text-sm font-bold text-green-700">
                          {audiencePreview.with_push_token.toLocaleString()}
                        </span>
                        <span className="text-xs text-green-600">with token</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Loading...</span>
                  )}
                </div>
              </div>

              {/* Audience filter card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">

                {/* Target all toggle */}
                <div
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      audience_filters: {
                        ...p.audience_filters,
                        target_all: !p.audience_filters.target_all,
                      },
                    }))
                  }
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.audience_filters.target_all
                      ? 'border-[#05015A] bg-[#05015A]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">All App Users</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Send to every active user with push notifications enabled
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    form.audience_filters.target_all
                      ? 'border-[#05015A] bg-[#05015A]'
                      : 'border-gray-300'
                  }`}>
                    {form.audience_filters.target_all && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Advanced filters — shown when not targeting all */}
                {!form.audience_filters.target_all && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Filter Options
                    </p>

                    {/* Registration date range */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                        Registered Between
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={form.audience_filters.registered_from || ''}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              audience_filters: {
                                ...p.audience_filters,
                                registered_from: e.target.value || undefined,
                              },
                            }))
                          }
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        />
                        <input
                          type="date"
                          value={form.audience_filters.registered_to || ''}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              audience_filters: {
                                ...p.audience_filters,
                                registered_to: e.target.value || undefined,
                              },
                            }))
                          }
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Has orders toggle */}
                    <div
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          audience_filters: {
                            ...p.audience_filters,
                            has_orders: !p.audience_filters.has_orders,
                          },
                        }))
                      }
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        form.audience_filters.has_orders
                          ? 'border-[#05015A] bg-[#05015A]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">Users with orders only</p>
                        <p className="text-xs text-gray-500">
                          Only users who have placed at least one order
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        form.audience_filters.has_orders
                          ? 'border-[#05015A] bg-[#05015A]'
                          : 'border-gray-300'
                      }`}>
                        {form.audience_filters.has_orders && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info note about push tokens */}
                {audiencePreview && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <Smartphone size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>{audiencePreview.with_push_token}</strong> of{' '}
                        <strong>{audiencePreview.total}</strong> users have push notifications
                        enabled. Only users with active tokens will receive the push.
                        All users will see it in their notification inbox.
                      </p>
                    </div>
                  </div>
                )}
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
          {audiencePreview && (
            <span className="text-xs text-gray-500">
              {audiencePreview.with_push_token} devices will receive push
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={loading || !form.title || !form.body}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save size={15} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => { if (validate()) setShowSchedule(true); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Calendar size={15} />
            Schedule
          </button>
          <button
            type="button"
            onClick={() => { if (validate()) setShowConfirm(true); }}
            disabled={loading || !audiencePreview?.total}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Send Now
          </button>
        </div>
      </div>

      {/* Modals */}
      {showConfirm && (
        <ConfirmSendModal
          title={form.title}
          message={form.body}
          recipientCount={audiencePreview?.with_push_token || 0}
          recipientBreakdown={null}
          attachments={[]}
          onConfirm={confirmSend}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showSchedule && (
        <ScheduleModal
          onConfirm={confirmSchedule}
          onCancel={() => setShowSchedule(false)}
        />
      )}
      {showPreview && (
        <MobilePreviewModal
          form={form}
          audiencePreview={audiencePreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default MobileCreateForm;