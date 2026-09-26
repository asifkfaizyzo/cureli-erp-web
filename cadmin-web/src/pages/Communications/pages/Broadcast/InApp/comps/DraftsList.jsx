// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/DraftsList.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/DraftsList.jsx
import { useState, useEffect } from "react";
import { Edit2, Trash2, FileText, Loader2 } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from "../../../../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

function DraftsList({ refreshTrigger, onCountChange, onEdit }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  //  Dynamic row count based on screen height
  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadDrafts();
  }, [refreshTrigger, page, rowsPerPage]); //  Added rowsPerPage dependency

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await broadcastAPI.getDrafts(page, rowsPerPage);
      if (response.data.success) {
        const { drafts: draftData, pagination } = response.data.data;
        setDrafts(draftData);
        setTotalPages(pagination.total_pages);
        setTotalItems(pagination.total);
        onCountChange?.(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;

    try {
      await broadcastAPI.deleteDraft(draftId);
      loadDrafts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete draft");
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

  const getPriorityBadgeClass = (priority) => {
    const map = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      normal: "bg-blue-100 text-blue-700 border-blue-200",
      low: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return map[priority] || map.normal;
  };

  // Get styles from config
  const { styles } = TABLE_CONFIG;

  if (loading) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading drafts...</p>
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

  if (drafts.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <div className={styles.emptyState.iconWrapper}>
          <FileText size={48} className={styles.emptyState.icon} />
        </div>
        <p className={styles.emptyState.title}>No drafts yet</p>
        <p className={styles.emptyState.subtitle}>
          Saved drafts will appear here
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
          style={{ minWidth: "900px" }}
        >
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Title</th>
              <th className={styles.header.cell}>Message Preview</th>
              <th className={`${styles.header.cell} text-center`}>
                Recipients
              </th>
              <th className={`${styles.header.cell} text-center`}>Priority</th>
              <th className={styles.header.cell}>Last Updated</th>
              <th className={`${styles.header.cell} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft, index) => (
              <tr
                key={draft.campaign_id}
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
                    {draft.title}
                  </span>
                </td>

                {/* Message Preview */}
                <td className={styles.cell.base}>
                  <p className={`${styles.cell.secondary} line-clamp-2`}>
                    {draft.message.substring(0, 80)}
                    {draft.message.length > 80 && "..."}
                  </p>
                </td>

                {/* Recipients Count */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>
                    {draft.recipient_count || "N/A"}
                  </span>
                </td>

                {/* Priority Badge */}
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeClass(
                      draft.priority,
                    )}`}
                  >
                    {draft.priority}
                  </span>
                </td>

                {/* Last Updated */}
                <td className={styles.cell.base}>
                  <span className={styles.cell.muted}>
                    {formatDateTime(draft.updated_at)}
                  </span>
                </td>

                {/* Actions */}
                <td className={styles.cell.base}>
                  <div className={styles.actions.container}>
                    <button
                      onClick={() => onEdit(draft)}
                      className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                      title="Edit Draft"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(draft.campaign_id)}
                      className={`${styles.actions.button.base} ${styles.actions.button.delete}`}
                      title="Delete Draft"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Always show if there are items */}
      <Pagination
        currentPage={page}
        setCurrentPage={setPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
}

export default DraftsList;
