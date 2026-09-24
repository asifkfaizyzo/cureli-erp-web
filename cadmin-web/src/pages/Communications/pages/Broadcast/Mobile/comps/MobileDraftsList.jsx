// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileDraftsList.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileDraftsList.jsx

import { useState, useEffect } from 'react';
import { Edit2, Trash2, FileText, Loader2 } from 'lucide-react';
import * as api from '../../../../../../api/cadminMobileBroadcast';
import Pagination from '../../../../../../components/common/Pagination';
import { TABLE_CONFIG } from '../../../../../../config/tableConfig';
import useDynamicRowCount from '../../../../../../hooks/useDynamicRowCount';

function MobileDraftsList({ refreshTrigger, onCountChange, onEdit }) {
  const [drafts,      setDrafts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);
  const [totalItems,  setTotalItems]  = useState(0);
  const rowsPerPage = useDynamicRowCount();

  useEffect(() => { load(); }, [refreshTrigger, page, rowsPerPage]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMobileDrafts(page, rowsPerPage);
      if (res.data.success) {
        const { drafts: data, pagination } = res.data.data;
        setDrafts(data);
        setTotalItems(pagination.total);
        onCountChange?.(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft?')) return;
    try {
      await api.deleteMobileDraft(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

  const { styles } = TABLE_CONFIG;

  if (loading) return (
    <div className={styles.emptyState.container}>
      <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
      <p className="text-sm text-gray-500">Loading drafts...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-4">
      <p className="text-sm font-medium">{error}</p>
    </div>
  );

  if (drafts.length === 0) return (
    <div className={styles.emptyState.container}>
      <div className={styles.emptyState.iconWrapper}>
        <FileText size={48} className={styles.emptyState.icon} />
      </div>
      <p className={styles.emptyState.title}>No mobile drafts yet</p>
      <p className={styles.emptyState.subtitle}>Saved drafts will appear here</p>
    </div>
  );

  return (
    <div className={styles.container.wrapper}>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: '800px' }}>
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Title</th>
              <th className={styles.header.cell}>Body Preview</th>
              <th className={`${styles.header.cell} text-center`}>Category</th>
              <th className={`${styles.header.cell} text-center`}>Tap Action</th>
              <th className={`${styles.header.cell} text-center`}>Est. Audience</th>
              <th className={styles.header.cell}>Last Updated</th>
              <th className={`${styles.header.cell} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft, index) => (
              <tr
                key={draft.campaign_id}
                className={`${styles.row.base} ${index % 2 === 0 ? styles.row.even : styles.row.odd} ${styles.row.hover}`}
                style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
              >
                <td className={styles.cell.base}>
                  <span className={`${styles.cell.primary} line-clamp-2`}>{draft.title}</span>
                </td>
                <td className={styles.cell.base}>
                  <p className={`${styles.cell.secondary} line-clamp-2`}>
                    {draft.body.substring(0, 80)}{draft.body.length > 80 && '...'}
                  </p>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    {draft.category?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.muted}>{draft.tap_action}</span>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>{draft.targeted_count || '—'}</span>
                </td>
                <td className={styles.cell.base}>
                  <span className={styles.cell.muted}>{fmt(draft.updated_at)}</span>
                </td>
                <td className={styles.cell.base}>
                  <div className={styles.actions.container}>
                    <button
                      onClick={() => onEdit?.(draft)}
                      className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(draft.campaign_id)}
                      className={`${styles.actions.button.base} ${styles.actions.button.delete}`}
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
      <Pagination currentPage={page} setCurrentPage={setPage} totalItems={totalItems} rowsPerPage={rowsPerPage} />
    </div>
  );
}

export default MobileDraftsList;