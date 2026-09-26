// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/HistoryList.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/HistoryList.jsx

import { useState, useEffect } from "react";
import { History, CheckCircle, Loader2, Eye, X, Megaphone, Clock, Users, Send } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import Pagination from '../../../../../../components/common/Pagination';
import { TABLE_CONFIG } from "../../../../../../config/tableConfig";
import useDynamicRowCount from "../../../../../../hooks/useDynamicRowCount";

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

function BroadcastDetailModal({ item, onClose }) {
  if (!item) return null;

  const getPriorityBadgeClass = (priority) => {
    const map = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high:     "bg-orange-100 text-orange-700 border-orange-200",
      normal:   "bg-blue-100 text-blue-700 border-blue-200",
      low:      "bg-gray-100 text-gray-700 border-gray-200",
    };
    return map[priority] || map.normal;
  };

  const getReadRateClass = (rate) => {
    const n = parseFloat(rate);
    if (n >= 70) return "bg-emerald-100 text-emerald-700";
    if (n >= 40) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#05015A] px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Megaphone size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base leading-snug">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPriorityBadgeClass(item.priority)}`}>
                  {item.priority?.toUpperCase()}
                </span>
                <span className="text-white/60 text-[10px] flex items-center gap-1">
                  <Clock size={9} />
                  {formatDateTime(item.sent_at)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Full message */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Message
            </p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words bg-gray-50 rounded-xl p-4 border border-gray-100">
              {item.message}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">
                Recipients
              </p>
              <p className="text-xl font-bold text-gray-900">
                {(item.recipient_count || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide mb-1">
                Delivered
              </p>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-emerald-500" />
                <p className="text-xl font-bold text-emerald-700">
                  {(item.delivered_count || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide mb-1">
                Read
              </p>
              <p className="text-xl font-bold text-blue-700">
                {(item.read_count || 0).toLocaleString()}
              </p>
            </div>

            <div className={`rounded-xl p-3 border ${getReadRateClass(item.read_rate)} bg-opacity-20`}>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-1 opacity-70">
                Read Rate
              </p>
              <p className="text-xl font-bold">
                {item.read_rate}%
              </p>
            </div>
          </div>

          {/* Sent by */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                Sent by
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {item.cadmin_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                Sent at
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {formatDateTime(item.sent_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HISTORY LIST
// ─────────────────────────────────────────────────────────────────────────────

function HistoryList({ refreshTrigger }) {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const rowsPerPage = useDynamicRowCount();

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger, page, rowsPerPage]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await broadcastAPI.getHistory(page, rowsPerPage);
      if (response.data.success) {
        const { history: historyData, pagination } = response.data.data;
        setHistory(historyData);
        setTotalItems(pagination.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load history");
    } finally {
      setLoading(false);
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

  const getReadRateClass = (rate) => {
    const n = parseFloat(rate);
    if (n >= 70) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (n >= 40) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getPriorityBadgeClass = (priority) => {
    const map = {
      critical: "bg-red-100 text-red-700 border-red-200",
      high:     "bg-orange-100 text-orange-700 border-orange-200",
      normal:   "bg-blue-100 text-blue-700 border-blue-200",
      low:      "bg-gray-100 text-gray-700 border-gray-200",
    };
    return map[priority] || map.normal;
  };

  const { styles } = TABLE_CONFIG;

  if (loading) {
    return (
      <div className={styles.emptyState.container}>
        <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
        <p className="text-sm text-gray-500">Loading broadcast history...</p>
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

  if (history.length === 0) {
    return (
      <div className={styles.emptyState.container}>
        <div className={styles.emptyState.iconWrapper}>
          <History size={48} className={styles.emptyState.icon} />
        </div>
        <p className={styles.emptyState.title}>No sent broadcasts yet</p>
        <p className={styles.emptyState.subtitle}>Sent broadcasts will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container.wrapper}>
        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "1100px" }}>
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <th className={styles.header.cell}>Title</th>
                <th className={styles.header.cell}>Message Preview</th>
                <th className={`${styles.header.cell} text-center`}>Recipients</th>
                <th className={`${styles.header.cell} text-center`}>Delivered</th>
                <th className={`${styles.header.cell} text-center`}>Read</th>
                <th className={`${styles.header.cell} text-center`}>Read Rate</th>
                <th className={styles.header.cell}>Sent At</th>
                <th className={styles.header.cell}>Sent By</th>
                <th className={`${styles.header.cell} text-center`}>Details</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr
                  key={item.campaign_id}
                  className={`
                    ${styles.row.base}
                    ${index % 2 === 0 ? styles.row.even : styles.row.odd}
                    ${styles.row.hover}
                  `}
                  style={{ height: `${TABLE_CONFIG.heights.bodyRow}px` }}
                >
                  {/* Title + Priority */}
                  <td className={styles.cell.base}>
                    <div className="flex items-start gap-2">
                      <span className={`${styles.cell.primary} line-clamp-2 flex-1`}>
                        {item.title}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getPriorityBadgeClass(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                  </td>

                  {/* Message Preview */}
                  <td className={styles.cell.base}>
                    <p className={`${styles.cell.secondary} line-clamp-2`}>
                      {item.message.substring(0, 70)}
                      {item.message.length > 70 && "..."}
                    </p>
                  </td>

                  {/* Recipients */}
                  <td className={`${styles.cell.base} ${styles.cell.center}`}>
                    <span className={styles.cell.primary}>{item.recipient_count || 0}</span>
                  </td>

                  {/* Delivered */}
                  <td className={`${styles.cell.base} ${styles.cell.center}`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">
                        {item.delivered_count || 0}
                      </span>
                    </div>
                  </td>

                  {/* Read */}
                  <td className={`${styles.cell.base} ${styles.cell.center}`}>
                    <span className={styles.cell.primary}>{item.read_count || 0}</span>
                  </td>

                  {/* Read Rate */}
                  <td className={`${styles.cell.base} ${styles.cell.center}`}>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getReadRateClass(item.read_rate)}`}>
                      {item.read_rate}%
                    </span>
                  </td>

                  {/* Sent At */}
                  <td className={styles.cell.base}>
                    <span className={styles.cell.muted}>{formatDateTime(item.sent_at)}</span>
                  </td>

                  {/* Sent By */}
                  <td className={styles.cell.base}>
                    <span className={styles.cell.primary}>{item.cadmin_name}</span>
                  </td>

                  {/* View Details */}
                  <td className={`${styles.cell.base} ${styles.cell.center}`}>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#05015A] bg-[#05015A]/5 hover:bg-[#05015A]/10 border border-[#05015A]/10 rounded-lg transition-colors"
                      title="View full message"
                    >
                      <Eye size={13} />
                      View
                    </button>
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

      {/* Detail Modal */}
      {selectedItem && (
        <BroadcastDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}

export default HistoryList;