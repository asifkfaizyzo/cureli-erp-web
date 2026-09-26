// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/ScheduledList.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/ScheduledList.jsx
import { useState, useEffect } from "react";
import { Calendar, X, Loader2, Clock } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from "../../../../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

function ScheduledList({ refreshTrigger, onCountChange }) {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  //  Dynamic row count
  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadScheduled();
  }, [refreshTrigger, page, rowsPerPage]);

  const loadScheduled = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await broadcastAPI.getScheduled(page, rowsPerPage);
      if (response.data.success) {
        const { scheduled: scheduledData, pagination } = response.data.data;
        setScheduled(scheduledData);
        setTotalPages(pagination.total_pages);
        setTotalItems(pagination.total);
        onCountChange?.(pagination.total);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load scheduled broadcasts",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (campaignId, title) => {
    if (!window.confirm(`Cancel scheduled broadcast "${title}"?`)) return;

    try {
      await broadcastAPI.cancelScheduled(campaignId);
      loadScheduled();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel broadcast");
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

  const getTimeUntil = (dateString) => {
    const scheduledTime = new Date(dateString);
    const now = new Date();
    const diffMs = scheduledTime - now;

    if (diffMs < 0) return "Sending soon...";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    if (hours < 24)
      return `in ${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} min`;

    const days = Math.floor(hours / 24);
    return `in ${days} day${days !== 1 ? "s" : ""}`;
  };

  const { styles } = TABLE_CONFIG;

  if (loading) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading scheduled broadcasts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (scheduled.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <div className={styles.emptyState.iconWrapper}>
          <Calendar size={48} className={styles.emptyState.icon} />
        </div>
        <p className={styles.emptyState.title}>No scheduled broadcasts</p>
        <p className={styles.emptyState.subtitle}>
          Schedule a broadcast to see it here
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container.wrapper}>
      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "1000px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Title</th>
              <th className={styles.header.cell}>Message Preview</th>
              <th className={`${styles.header.cell} text-center`}>
                Recipients
              </th>
              <th className={styles.header.cell}>Scheduled For</th>
              <th className={`${styles.header.cell} text-center`}>
                Time Until
              </th>
              <th className={styles.header.cell}>Created By</th>
              <th className={`${styles.header.cell} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scheduled.map((item, index) => (
              <tr
                key={item.campaign_id}
                className={`
                  ${styles.row.base}
                  ${index % 2 === 0 ? styles.row.even : styles.row.odd}
                  ${styles.row.hover}
                `}
                style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
              >
                {/* Title */}
                <td className={styles.cell.base}>
                  <span className={`${styles.cell.primary} line-clamp-2`}>
                    {item.title}
                  </span>
                </td>

                {/* Message Preview */}
                <td className={styles.cell.base}>
                  <p className={`${styles.cell.secondary} line-clamp-2`}>
                    {item.message.substring(0, 60)}
                    {item.message.length > 60 && "..."}
                  </p>
                </td>

                {/* Recipients */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>
                    {item.recipient_count || "N/A"}
                  </span>
                </td>

                {/* Scheduled For */}
                <td className={styles.cell.base}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span className={styles.cell.muted}>
                      {formatDateTime(item.scheduled_for)}
                    </span>
                  </div>
                </td>

                {/* Time Until */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    <Clock size={12} />
                    {getTimeUntil(item.scheduled_for)}
                  </span>
                </td>

                {/* Created By */}
                <td className={styles.cell.base}>
                  <span className={styles.cell.primary}>
                    {item.cadmin_name}
                  </span>
                </td>

                {/* Actions */}
                <td className={styles.cell.base}>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleCancel(item.campaign_id, item.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-200 transition-all"
                      title="Cancel"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        setCurrentPage={setPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
}

export default ScheduledList;
