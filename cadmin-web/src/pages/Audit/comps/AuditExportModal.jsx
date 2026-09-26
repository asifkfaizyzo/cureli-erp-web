// cadmin-web/src/pages/Audit/comps/AuditExportModal.jsx (do not remove this comment)
// ============================================
// AUDIT EXPORT MODAL
// ============================================

import { useState } from 'react';
import {
  X,
  Download,
  Calendar,
  Filter,
  Loader2,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';

import { useToast } from '../../../components/common/Toast';
import { exportAuditLogsCSV, downloadCSV } from '../../../api/cadminAudit';

// ============================================
// MAIN COMPONENT
// ============================================

const AuditExportModal = ({ isOpen, onClose, currentFilters }) => {
  const toast = useToast();

  // State
  const [exportMode, setExportMode] = useState('current'); // 'current' | 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleExport = async () => {
    setLoading(true);

    try {
      let filters = {};

      if (exportMode === 'current') {
        // Use current view filters
        filters = { ...currentFilters };
      } else {
        // Use custom date range
        if (customDateFrom) filters.date_from = customDateFrom;
        if (customDateTo) filters.date_to = customDateTo;
      }

      const blob = await exportAuditLogsCSV(filters);
      
      // Generate filename
      const now = new Date();
      let filename = `audit_logs_${now.toISOString().split('T')[0]}`;
      if (exportMode === 'custom' && customDateFrom && customDateTo) {
        filename = `audit_logs_${customDateFrom}_to_${customDateTo}`;
      }
      filename += '.csv';

      downloadCSV(blob, filename);

      toast.success('Export Complete', 'Audit logs exported successfully');
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export Failed', err.response?.data?.message || 'Failed to export audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setExportMode('current');
      setCustomDateFrom('');
      setCustomDateTo('');
      onClose();
    }
  };

  // Quick date presets
  const setPreset = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    setCustomDateFrom(from.toISOString().split('T')[0]);
    setCustomDateTo(to.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  // Count active filters in current view
  const activeFilterCount = Object.values(currentFilters).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Audit Logs</h2>
                <p className="text-sm text-gray-500">Download as CSV file</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Export Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Export Options</label>
            
            {/* Current View Option */}
            <button
              type="button"
              onClick={() => setExportMode('current')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                exportMode === 'current'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${exportMode === 'current' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Filter size={18} className={exportMode === 'current' ? 'text-indigo-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${exportMode === 'current' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Export Current View
                    </span>
                    {exportMode === 'current' && (
                      <CheckCircle size={16} className="text-indigo-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Uses your current search and filters
                  </p>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex mt-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Custom Date Range Option */}
            <button
              type="button"
              onClick={() => setExportMode('custom')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                exportMode === 'custom'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${exportMode === 'custom' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Calendar size={18} className={exportMode === 'custom' ? 'text-indigo-600' : 'text-gray-500'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${exportMode === 'custom' ? 'text-indigo-900' : 'text-gray-900'}`}>
                      Custom Date Range
                    </span>
                    {exportMode === 'custom' && (
                      <CheckCircle size={16} className="text-indigo-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Export logs from a specific period
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Custom Date Range Inputs */}
          {exportMode === 'custom' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreset(7)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(30)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 30 days
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(90)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 90 days
                </button>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    max={customDateTo || undefined}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm 
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    min={customDateFrom || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm 
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Export is limited to 10,000 records. For larger exports, use date filters to break into smaller batches.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || (exportMode === 'custom' && !customDateFrom && !customDateTo)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
                       rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditExportModal;