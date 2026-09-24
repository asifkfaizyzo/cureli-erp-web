// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileScheduledList.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileScheduledList.jsx

import { useState, useEffect } from 'react';
import { Calendar, X, Loader2, Clock } from 'lucide-react';
import * as api from '../../../../../../api/cadminMobileBroadcast';
import Pagination from '../../../../../../components/common/Pagination';
import { TABLE_CONFIG } from '../../../../../../config/tableConfig';
import useDynamicRowCount from '../../../../../../hooks/useDynamicRowCount';

function MobileScheduledList({ refreshTrigger, onCountChange }) {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const rowsPerPage = useDynamicRowCount();

  useEffect(() => { load(); }, [refreshTrigger, page, rowsPerPage]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMobileScheduled(page, rowsPerPage);
      if (res.data.success) {
        const { scheduled, pagination } = res.data.data;
        setItems(scheduled);
        setTotalItems(pagination.total);
        onCountChange?.(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id, title) => {
    if (!window.confirm(`Cancel scheduled broadcast "${title}"?`)) return;
    try {
      await api.cancelMobileScheduled(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

  const getTimeUntil = (d) => {
    const diff = new Date(d) - new Date();
    if (diff < 0) return 'Sending soon...';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 1)  return `in ${mins}m`;
    if (hours < 24) return `in ${hours}h ${mins}m`;
    return `in ${Math.floor(hours / 24)}d`;
  };

  const { styles } = TABLE_CONFIG;

  if (loading) return (
    <div className={styles.emptyState.container}>
      <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-4">
      <p className="text-sm font-medium">{error}</p>
    </div>
  );

  if (items.length === 0) return (
    <div className={styles.emptyState.container}>
      <div className={styles.emptyState.iconWrapper}>
        <Calendar size={48} className={styles.emptyState.icon} />
      </div>
      <p className={styles.emptyState.title}>No scheduled broadcasts</p>
      <p className={styles.emptyState.subtitle}>Scheduled pushes will appear here</p>
    </div>
  );

  return (
    <div className={styles.container.wrapper}>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: '900px' }}>
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Title</th>
              <th className={styles.header.cell}>Body Preview</th>
              <th className={`${styles.header.cell} text-center`}>Audience</th>
              <th className={styles.header.cell}>Scheduled For</th>
              <th className={`${styles.header.cell} text-center`}>Time Until</th>
              <th className={styles.header.cell}>Created By</th>
              <th className={`${styles.header.cell} text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.campaign_id}
                className={`${styles.row.base} ${index % 2 === 0 ? styles.row.even : styles.row.odd} ${styles.row.hover}`}
                style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
              >
                <td className={styles.cell.base}>
                  <span className={`${styles.cell.primary} line-clamp-2`}>{item.title}</span>
                </td>
                <td className={styles.cell.base}>
                  <p className={`${styles.cell.secondary} line-clamp-2`}>
                    {item.body?.substring(0, 60)}{item.body?.length > 60 && '...'}
                  </p>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>{item.targeted_count || '—'}</span>
                </td>
                <td className={styles.cell.base}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span className={styles.cell.muted}>{fmt(item.scheduled_for)}</span>
                  </div>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    <Clock size={11} />
                    {getTimeUntil(item.scheduled_for)}
                  </span>
                </td>
                <td className={styles.cell.base}>
                  <span className={styles.cell.primary}>{item.cadmin_name}</span>
                </td>
                <td className={styles.cell.base}>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleCancel(item.campaign_id, item.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-200 transition-all"
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
      <Pagination currentPage={page} setCurrentPage={setPage} totalItems={totalItems} rowsPerPage={rowsPerPage} />
    </div>
  );
}

export default MobileScheduledList;