// src/pages/Communications/pages/Broadcast/Email/comps/EmailScheduledList.jsx

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  X,
  Loader2,
  Mail,
  Users,
  AlertCircle,
  Pause,
} from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";
import Pagination from "../../../../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

function EmailScheduledList({ refreshTrigger, onCountChange, onCancelled }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);

  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadCampaigns();
  }, [refreshTrigger, page, rowsPerPage]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBroadcastAPI.getScheduled(page, rowsPerPage);

      

      //  FIXED: Handle both response formats
      let scheduledData = [];
      let pagination = { page: 1, limit: 10, total: 0, total_pages: 1 };

      if (response && response.success) {
        scheduledData = response.data?.scheduled || [];
        pagination = response.data?.pagination || pagination;
      } else if (response && response.scheduled) {
        scheduledData = response.scheduled || [];
        pagination = response.pagination || pagination;
      }

      setCampaigns(scheduledData);
      setTotalPages(pagination.total_pages || 1);
      setTotalItems(pagination.total || 0);
      onCountChange?.(pagination.total || 0);
    } catch (err) {
      console.error("[EmailScheduledList] Load error:", err);
      setError(
        err.response?.data?.message || "Failed to load scheduled campaigns",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (campaignId, subject) => {
    if (!window.confirm(`Cancel scheduled campaign "${subject}"?`)) return;

    setCancellingId(campaignId);
    try {
      await emailBroadcastAPI.cancelCampaign(campaignId);
      loadCampaigns();
      onCancelled?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel campaign");
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || "";
    const statusConfig = {
      scheduled: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: Calendar,
        label: "Scheduled",
      },
      paused: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        icon: Pause,
        label: "Paused (Quota)",
      },
    };

    const config = statusConfig[statusLower] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const { styles } = TABLE_CONFIG;

  if (loading) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading scheduled campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <div className={styles.emptyState.iconWrapper}>
          <Calendar size={48} className={styles.emptyState.icon} />
        </div>
        <p className={styles.emptyState.title}>No scheduled campaigns</p>
        <p className={styles.emptyState.subtitle}>
          Scheduled emails will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container.wrapper}>
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "900px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Subject</th>
              <th className={`${styles.header.cell} text-center`}>Status</th>
              <th className={`${styles.header.cell} text-center`}>
                Recipients
              </th>
              <th className={styles.header.cell}>Scheduled For</th>
              <th className={styles.header.cell}>Time Until</th>
              <th className={styles.header.cell}>Created By</th>
              <th className={`${styles.header.cell} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, index) => (
              <tr
                key={campaign.campaign_id}
                className={`
                  ${styles.row.base}
                  ${index % 2 === 0 ? styles.row.even : styles.row.odd}
                  ${styles.row.hover}
                `}
                style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
              >
                <td className={styles.cell.base}>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className={`${styles.cell.primary} line-clamp-1`}>
                      {campaign.subject}
                    </span>
                  </div>
                </td>

                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  {getStatusBadge(campaign.status)}
                </td>

                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <div className="flex items-center justify-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className={styles.cell.primary}>
                      {campaign.recipient_count || "N/A"}
                    </span>
                  </div>
                </td>

                <td className={styles.cell.base}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    <span className={styles.cell.primary}>
                      {formatDateTime(campaign.scheduled_for)}
                    </span>
                  </div>
                </td>

                <td className={styles.cell.base}>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-500" />
                    <span className={`${styles.cell.secondary} font-medium`}>
                      {campaign.time_until || "Sending soon..."}
                    </span>
                  </div>
                </td>

                <td className={styles.cell.base}>
                  <span className={styles.cell.primary}>
                    {campaign.cadmin_name}
                  </span>
                </td>

                <td className={styles.cell.base}>
                  <div className={styles.actions.container}>
                    <button
                      onClick={() =>
                        handleCancel(campaign.campaign_id, campaign.subject)
                      }
                      disabled={cancellingId === campaign.campaign_id}
                      className={`${styles.actions.button.base} ${styles.actions.button.delete}`}
                      title="Cancel Campaign"
                    >
                      {cancellingId === campaign.campaign_id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paused Campaign Info */}
      {campaigns.some((c) => c.status?.toLowerCase() === "paused") && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle size={14} />
            <span className="text-xs">
              Paused campaigns will automatically resume when daily quota resets
              (midnight IST)
            </span>
          </div>
        </div>
      )}

      <Pagination
        currentPage={page}
        setCurrentPage={setPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
}

export default EmailScheduledList;
