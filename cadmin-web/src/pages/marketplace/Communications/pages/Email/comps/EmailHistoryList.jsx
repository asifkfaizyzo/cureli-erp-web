// ============================================
// src/pages/Communications/pages/Broadcast/Email/comps/EmailHistoryList.jsx
// ============================================

import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Ban,
  Loader2,
  Mail,
  RefreshCw,
  Eye,
  X,
  User,
  Paperclip,
  Image,
  ExternalLink,
} from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";
import Pagination             from "../../../../../../components/common/Pagination";
import { TABLE_CONFIG }       from "../../../../../../config/tableConfig";
import useDynamicRowCount     from "../../../../../../hooks/useDynamicRowCount";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format raw bytes into a human-readable string.
 * e.g. 1536 → "1.5 KB", 2097152 → "2.0 MB"
 */
const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (dateString, style = "medium") => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: style,
      timeStyle: "short",
    });
  } catch {
    return "N/A";
  }
};

const getStatusConfig = (status) => {
  const configs = {
    sent: {
      bg: "bg-green-100", text: "text-green-700",
      icon: CheckCircle, label: "Sent",
    },
    partial_failure: {
      bg: "bg-amber-100", text: "text-amber-700",
      icon: AlertTriangle, label: "Partial Failure",
    },
    failed: {
      bg: "bg-red-100", text: "text-red-700",
      icon: XCircle, label: "Failed",
    },
    cancelled: {
      bg: "bg-gray-100", text: "text-gray-600",
      icon: Ban, label: "Cancelled",
    },
  };
  return configs[status?.toLowerCase()] || configs.sent;
};

const canRetry = (status) =>
  ["failed", "partial_failure"].includes(status?.toLowerCase());

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL PREVIEW TABS
// ─────────────────────────────────────────────────────────────────────────────

function EmailPreviewTabs({ campaign }) {
  const hasAttachments = campaign.attachments?.length > 0;

  const tabs = [
    { id: "html",  label: "Email Preview" },
    { id: "text",  label: "Plain Text" },
    hasAttachments && {
      id:    "files",
      label: `Files (${campaign.attachments.length})`,
    },
  ].filter(Boolean);

  const [activeTab, setActiveTab] = useState("html");

  return (
    <div className="flex flex-col h-full">

      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-[#05015A] text-[#05015A] bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-gray-100">

        {/* ── HTML Preview ── */}
        {activeTab === "html" && (
          <div className="h-full overflow-auto p-4">
            {campaign.message_html ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <iframe
                  srcDoc={campaign.message_html}
                  title="Email Preview"
                  className="w-full border-0"
                  style={{ minHeight: "600px" }}
                  sandbox="allow-same-origin"
                  onLoad={(e) => {
                    try {
                      const doc = e.target.contentDocument;
                      if (doc) {
                        e.target.style.height =
                          doc.documentElement.scrollHeight + "px";
                      }
                    } catch {
                      // cross-origin — minHeight handles it
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Mail size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No HTML content available</p>
              </div>
            )}
          </div>
        )}

        {/* ── Plain Text ── */}
        {activeTab === "text" && (
          <div className="h-full overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {campaign.message_text ? (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {campaign.message_text}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Mail size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">No plain text content available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Files Tab ── */}
        {activeTab === "files" && (
          <div className="h-full overflow-auto p-4">
            <div className="space-y-3">
              {campaign.attachments?.map((att, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
                >
                  {/* Image preview */}
                  {att.mime_type?.startsWith("image/") && att.url && (
                    <div className="bg-gray-50 border-b border-gray-200 flex items-center justify-center p-4">
                      <img
                        src={att.url}
                        alt={att.original_name || `Attachment ${i + 1}`}
                        className="max-w-full max-h-64 object-contain rounded"
                      />
                    </div>
                  )}

                  {/* PDF placeholder */}
                  {att.mime_type === "application/pdf" && att.url && (
                    <div className="bg-gray-50 border-b border-gray-200 p-4 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Paperclip size={28} className="text-red-500" />
                      </div>
                      <p className="text-sm text-gray-500">PDF Document</p>
                    </div>
                  )}

                  {/* File info row */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {att.original_name || att.filename || `Attachment ${i + 1}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {att.mime_type || "Unknown type"}
                        {att.size ? ` · ${formatFileSize(att.size)}` : ""}
                      </p>
                    </div>
                    {att.url && (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#05015A] text-white text-xs font-medium rounded-lg hover:bg-[#0a0280] transition-colors"
                      >
                        <ExternalLink size={12} />
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL PREVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

function EmailPreviewModal({ campaign, onClose }) {
  if (!campaign) return null;

  const statusConfig = getStatusConfig(campaign.status);
  const StatusIcon   = statusConfig.icon;

  const deliveryRate =
    campaign.recipient_count > 0
      ? Math.round((campaign.delivered_count / campaign.recipient_count) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "900px", maxWidth: "95vw", height: "88vh", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#05015A] flex items-center justify-center">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 line-clamp-1">
                {campaign.subject}
              </h2>
              <p className="text-xs text-gray-500">Campaign Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left Panel — Meta Info */}
          <div className="flex-shrink-0 w-64 border-r border-gray-200 overflow-y-auto bg-gray-50 p-4 space-y-4">

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Status
              </p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
            </div>

            {/* Delivery Stats */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Delivery Stats
              </p>
              <div className="space-y-2">
                {/* Rate bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Delivery Rate</span>
                    <span className="font-semibold text-gray-800">{deliveryRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        deliveryRate >= 90 ? "bg-green-500"
                        : deliveryRate >= 70 ? "bg-amber-500"
                        : "bg-red-500"
                      }`}
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>

                {/* Stat rows */}
                {[
                  { label: "Total Recipients", value: campaign.recipient_count || 0, color: "text-gray-800" },
                  { label: "Delivered",        value: campaign.delivered_count  || 0, color: "text-green-600" },
                  { label: "Failed",           value: campaign.failed_count     || 0, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold ${color}`}>
                      {value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Target Audience
              </p>
              <div className="flex flex-wrap gap-1.5">
                {campaign.target_users && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Shop Owners
                  </span>
                )}
                {campaign.target_cadmins && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    CAdmins
                  </span>
                )}
                {!campaign.target_users && !campaign.target_cadmins && (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>

            {/* Sender */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Sent By
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#05015A] flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
                <span className="text-xs text-gray-700 font-medium">
                  {campaign.cadmin_name}
                </span>
              </div>
            </div>

            {/* From */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                From
              </p>
              <p className="text-xs text-gray-700 font-medium">{campaign.from_name}</p>
              <p className="text-xs text-gray-500">{campaign.from_email}</p>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Timeline
              </p>
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-xs text-gray-700">
                    {formatDateTime(campaign.created_at, "long")}
                  </p>
                </div>
                {campaign.sent_at && (
                  <div>
                    <p className="text-xs text-gray-400">Sent</p>
                    <p className="text-xs text-gray-700">
                      {formatDateTime(campaign.sent_at, "long")}
                    </p>
                  </div>
                )}
                {campaign.completed_at && (
                  <div>
                    <p className="text-xs text-gray-400">Completed</p>
                    <p className="text-xs text-gray-700">
                      {formatDateTime(campaign.completed_at, "long")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Attachments (Step 3 — clickable with size + download) ────── */}
            {(campaign.attachments?.length > 0 || campaign.inline_image) && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Attachments
                </p>
                <div className="space-y-2">

                  {/* Inline Image */}
                  {campaign.inline_image?.url && (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={campaign.inline_image.url}
                        alt={campaign.inline_image.original_name || "Inline Image"}
                        className="w-full object-cover"
                        style={{ maxHeight: "120px" }}
                      />
                      <div className="px-2 py-1.5 bg-gray-50 flex items-center gap-1.5">
                        <Image size={11} className="text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate flex-1">
                          {campaign.inline_image.original_name || "Inline Image"}
                        </span>
                        <a
                          href={campaign.inline_image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#05015A] hover:underline flex-shrink-0"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* File Attachments */}
                  {campaign.attachments?.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg"
                    >
                      {/* Icon */}
                      <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {att.mime_type?.startsWith("image/") ? (
                          <Image size={14} className="text-blue-500" />
                        ) : (
                          <Paperclip size={14} className="text-gray-400" />
                        )}
                      </div>

                      {/* Name + size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 font-medium truncate">
                          {att.original_name || att.filename || `File ${i + 1}`}
                        </p>
                        {att.size && (
                          <p className="text-xs text-gray-400">
                            {formatFileSize(att.size)}
                          </p>
                        )}
                      </div>

                      {/* Open link */}
                      {att.url && (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded text-[#05015A]"
                          title="Open attachment"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            )}
            {/* ─────────────────────────────────────────────────────────────── */}

            {/* CTA Button */}
            {campaign.action_url && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  CTA Button
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#05015A]">
                  <ExternalLink size={12} />
                  <span className="line-clamp-1">
                    {campaign.action_label || "Button"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {campaign.action_url}
                </p>
              </div>
            )}

            {/* Last Error */}
            {campaign.last_error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-semibold text-red-600 mb-1">Last Error</p>
                <p className="text-xs text-red-500">{campaign.last_error}</p>
              </div>
            )}
          </div>

          {/* Right Panel — Email Preview Tabs */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <EmailPreviewTabs campaign={campaign} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function EmailHistoryList({ refreshTrigger, onRetry }) {
  const [campaigns,      setCampaigns]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [totalItems,     setTotalItems]     = useState(0);
  const [search,         setSearch]         = useState("");
  const [retryingId,     setRetryingId]     = useState(null);
  const [previewCampaign, setPreviewCampaign] = useState(null);

  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadCampaigns();
  }, [refreshTrigger, page, rowsPerPage, search]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await emailBroadcastAPI.getHistory(page, rowsPerPage, search);

      let historyData = [];
      let pagination  = { page: 1, limit: 10, total: 0, total_pages: 1 };

      if (response?.success) {
        historyData = response.data?.history    || [];
        pagination  = response.data?.pagination || pagination;
      } else if (response?.history) {
        historyData = response.history    || [];
        pagination  = response.pagination || pagination;
      }

      setCampaigns(historyData);
      setTotalPages(pagination.total_pages || 1);
      setTotalItems(pagination.total       || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch the full campaign record before opening the preview modal so that
   * resolved attachment URLs are always available.
   */
  const handleOpenPreview = async (campaign) => {
    try {
      const response = await emailBroadcastAPI.getCampaignById(campaign.campaign_id);
      const full     = response?.data || response;
      setPreviewCampaign({ ...campaign, ...full });
    } catch {
      // Fallback to list data if the detail fetch fails
      setPreviewCampaign(campaign);
    }
  };

  const handleRetry = async (campaignId) => {
    if (!window.confirm("Retry sending this campaign?")) return;
    setRetryingId(campaignId);
    try {
      await emailBroadcastAPI.retryCampaign(campaignId);
      loadCampaigns();
      onRetry?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to retry campaign");
    } finally {
      setRetryingId(null);
    }
  };

  const { styles } = TABLE_CONFIG;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && campaigns.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading history...</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className={styles.container.wrapper}>

        {/* Search */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by subject or sender..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
          />
        </div>

        {campaigns.length === 0 ? (
          <div className={styles.emptyState.container}>
            <div className={styles.emptyState.iconWrapper}>
              <Mail size={48} className={styles.emptyState.icon} />
            </div>
            <p className={styles.emptyState.title}>No email history</p>
            <p className={styles.emptyState.subtitle}>
              Sent campaigns will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table
                className="w-full border-collapse text-sm"
                style={{ minWidth: "1000px" }}
              >
                <thead className="sticky top-0 z-10">
                  <tr className={styles.header.row}>
                    <th className={styles.header.cell}>Subject</th>
                    <th className={`${styles.header.cell} text-center`}>Status</th>
                    <th className={`${styles.header.cell} text-center`}>Delivered</th>
                    <th className={`${styles.header.cell} text-center`}>Failed</th>
                    <th className={`${styles.header.cell} text-center`}>Rate</th>
                    <th className={styles.header.cell}>Sent At</th>
                    <th className={styles.header.cell}>Sent By</th>
                    <th className={`${styles.header.cell} text-center`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => {
                    const statusConfig = getStatusConfig(campaign.status);
                    const StatusIcon   = statusConfig.icon;

                    return (
                      <tr
                        key={campaign.campaign_id}
                        className={`
                          ${styles.row.base}
                          ${index % 2 === 0 ? styles.row.even : styles.row.odd}
                          ${styles.row.hover}
                        `}
                        style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
                      >
                        {/* Subject */}
                        <td className={styles.cell.base}>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400 flex-shrink-0" />
                            <button
                              onClick={() => handleOpenPreview(campaign)}
                              className="text-left hover:text-[#05015A] hover:underline transition-colors"
                            >
                              <span className={`${styles.cell.primary} line-clamp-1`}>
                                {campaign.subject}
                              </span>
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Delivered */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <span className="text-green-600 font-medium">
                            {campaign.delivered_count || 0}
                          </span>
                        </td>

                        {/* Failed */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <span className={
                            campaign.failed_count > 0
                              ? "text-red-600 font-medium"
                              : "text-gray-400"
                          }>
                            {campaign.failed_count || 0}
                          </span>
                        </td>

                        {/* Rate */}
                        <td className={`${styles.cell.base} ${styles.cell.center}`}>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (campaign.delivery_rate || 0) >= 90
                                    ? "bg-green-500"
                                    : (campaign.delivery_rate || 0) >= 70
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${campaign.delivery_rate || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium">
                              {campaign.delivery_rate || 0}%
                            </span>
                          </div>
                        </td>

                        {/* Sent At */}
                        <td className={styles.cell.base}>
                          <span className={styles.cell.muted}>
                            {formatDateTime(campaign.sent_at)}
                          </span>
                        </td>

                        {/* Sent By */}
                        <td className={styles.cell.base}>
                          <span className={styles.cell.primary}>
                            {campaign.cadmin_name}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className={styles.cell.base}>
                          <div className={styles.actions.container}>
                            {/* Preview */}
                            <button
                              onClick={() => handleOpenPreview(campaign)}
                              className={`${styles.actions.button.base} text-[#05015A] hover:bg-[#05015A]/10`}
                              title="Preview Email"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Retry */}
                            {canRetry(campaign.status) && (
                              <button
                                onClick={() => handleRetry(campaign.campaign_id)}
                                disabled={retryingId === campaign.campaign_id}
                                className={`${styles.actions.button.base} text-amber-600 hover:bg-amber-50`}
                                title="Retry Campaign"
                              >
                                {retryingId === campaign.campaign_id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              setCurrentPage={setPage}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
            />
          </>
        )}
      </div>

      {/* Email Preview Modal */}
      {previewCampaign && (
        <EmailPreviewModal
          campaign={previewCampaign}
          onClose={() => setPreviewCampaign(null)}
        />
      )}
    </>
  );
}

export default EmailHistoryList;