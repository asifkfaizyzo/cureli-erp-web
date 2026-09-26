// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileHistoryList.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/Mobile/comps/MobileHistoryList.jsx

import { useState, useEffect } from 'react';
import { History, CheckCircle, Loader2, Smartphone } from 'lucide-react';
import * as api from '../../../../../../api/cadminMobileBroadcast';
import Pagination from '../../../../../../components/common/Pagination';
import { TABLE_CONFIG } from '../../../../../../config/tableConfig';
import useDynamicRowCount from '../../../../../../hooks/useDynamicRowCount';

function MobileHistoryList({ refreshTrigger }) {
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
      const res = await api.getMobileHistory(page, rowsPerPage);
      if (res.data.success) {
        const { history, pagination } = res.data.data;
        setItems(history);
        setTotalItems(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

  const getDeliveryRate = (item) => {
    if (!item.targeted_count) return '—';
    const rate = ((item.sent_count / item.targeted_count) * 100).toFixed(1);
    return `${rate}%`;
  };

  const getStatusBadge = (status) => {
    const map = {
      sent:      'bg-green-100 text-green-700 border-green-200',
      failed:    'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const { styles } = TABLE_CONFIG;

  if (loading) return (
    <div className={styles.emptyState.container}>
      <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
      <p className="text-sm text-gray-500">Loading history...</p>
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
        <History size={48} className={styles.emptyState.icon} />
      </div>
      <p className={styles.emptyState.title}>No sent broadcasts yet</p>
      <p className={styles.emptyState.subtitle}>Sent mobile push broadcasts will appear here</p>
    </div>
  );

  return (
    <div className={styles.container.wrapper}>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: '1000px' }}>
          <thead className="sticky top-0 z-10">
            <tr className={styles.header.row}>
              <th className={styles.header.cell}>Title</th>
              <th className={styles.header.cell}>Body Preview</th>
              <th className={`${styles.header.cell} text-center`}>Status</th>
              <th className={`${styles.header.cell} text-center`}>Targeted</th>
              <th className={`${styles.header.cell} text-center`}>Pushed</th>
              <th className={`${styles.header.cell} text-center`}>Delivery Rate</th>
              <th className={styles.header.cell}>Sent At</th>
              <th className={styles.header.cell}>Sent By</th>
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
                    {item.body?.substring(0, 70)}{item.body?.length > 70 && '...'}
                  </p>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={styles.cell.primary}>{item.targeted_count || 0}</span>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Smartphone size={13} className="text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      {item.sent_count || 0}
                    </span>
                  </div>
                </td>
                <td className={`${styles.cell.base} ${styles.cell.center}`}>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    parseFloat(getDeliveryRate(item)) >= 70
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {getDeliveryRate(item)}
                  </span>
                </td>
                <td className={styles.cell.base}>
                  <span className={styles.cell.muted}>{fmt(item.sent_at)}</span>
                </td>
                <td className={styles.cell.base}>
                  <span className={styles.cell.primary}>{item.cadmin_name}</span>
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

export default MobileHistoryList;