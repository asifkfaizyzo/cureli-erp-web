// src/pages/Communications/pages/Broadcast/Email/comps/EmailDraftsList.jsx

import { useState, useEffect } from "react";
import { Edit2, Trash2, FileText, Loader2, Mail } from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";
import Pagination from "../../../../../../components/common/Pagination";
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

function EmailDraftsList({ refreshTrigger, onCountChange, onEdit }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadDrafts();
  }, [refreshTrigger, page, rowsPerPage]);

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBroadcastAPI.getDrafts(page, rowsPerPage);

   

      //  FIXED: Handle both response formats
      let draftsData = [];
      let pagination = { page: 1, limit: 10, total: 0, total_pages: 1 };

      if (response && response.success) {
        draftsData = response.data?.drafts || [];
        pagination = response.data?.pagination || pagination;
      } else if (response && response.drafts) {
        draftsData = response.drafts || [];
        pagination = response.pagination || pagination;
      }

      setDrafts(draftsData);
      setTotalPages(pagination.total_pages || 1);
      setTotalItems(pagination.total || 0);
      onCountChange?.(pagination.total || 0);
    } catch (err) {
      console.error("[EmailDraftsList] Load error:", err);
      setError(err.response?.data?.message || "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId, subject) => {
    if (!window.confirm(`Delete draft "${subject}"?`)) return;

    try {
      await emailBroadcastAPI.deleteDraft(draftId);
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
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <div className={styles.emptyState.iconWrapper}>
          <FileText size={48} className={styles.emptyState.icon} />
        </div>
        <p className={styles.emptyState.title}>No email drafts yet</p>
        <p className={styles.emptyState.subtitle}>
          Saved drafts will appear here
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
              <th className={styles.header.cell}>Message Preview</th>
              <th className={`${styles.header.cell} text-center`}>
                Recipients
              </th>
              <th className={`${styles.header.cell} text-center`}>
                Attachments
              </th>
              <th className={styles.header.cell}>Last Updated</th>
              <th className={styles.header.cell}>Created By</th>
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
                <td className={styles.cell.base}>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className={`${styles.cell.primary} line-clamp-1`}>
                      {draft.subject}
                    </span>
                  </div>
                </td>

                <td className={styles.cell.base}>
                  <p className={`${styles.cell.secondary} line-clamp-2`}>
                    {draft.message_text?.substring(0, 80)}
                    {draft.message_text?.length > 80 && "..."}
                  </p>
                </td>

                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>
                    {draft.recipient_count || "N/A"}
                  </span>
                </td>

                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.muted}>
                    {(draft.attachments?.length || 0) +
                      (draft.inline_image ? 1 : 0)}
                  </span>
                </td>

                <td className={styles.cell.base}>
                  <span className={styles.cell.muted}>
                    {formatDateTime(draft.updated_at)}
                  </span>
                </td>

                <td className={styles.cell.base}>
                  <span className={styles.cell.primary}>
                    {draft.cadmin_name}
                  </span>
                </td>

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
                      onClick={() =>
                        handleDelete(draft.campaign_id, draft.subject)
                      }
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

      <Pagination
        currentPage={page}
        setCurrentPage={setPage}
        totalItems={totalItems}
        rowsPerPage={rowsPerPage}
      />
    </div>
  );
}

export default EmailDraftsList;
