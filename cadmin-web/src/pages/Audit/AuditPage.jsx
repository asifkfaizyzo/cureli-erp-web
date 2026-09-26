// cadmin-web/src/pages/Audit/AuditPage.jsx (do not remove this comment)
// ============================================
// AUDIT PAGE - Main Container
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ScrollText,
  RefreshCw,
  Download,
  AlertCircle,
  X,
  Filter,
  Search,
  Calendar,
  Activity,
} from 'lucide-react';

import AuditTable from './comps/AuditTable';
import AuditDetailPanel from './comps/AuditDetailPanel';
import AuditExportModal from './comps/AuditExportModal';
import StyledSelect from '../../components/common/StyledSelect';
import StyledDateFilter from '../../components/common/StyledDateFilter';
import { useToast } from '../../components/common/Toast';
import useDynamicRowCount from '../../hooks/useDynamicRowCount';

import { getAuditLogs, getAuditStats } from '../../api/cadminAudit';
import {
  getCategoryOptions,
  getEntityTypeOptions,
  getActorTypeOptions,
  AUDIT_CATEGORIES,
} from '../../config/modules/auditConfig';
import { useCAdminPermission } from '../../hooks/useCAdminPermission';
import { CADMIN_PERMISSIONS } from '../../config/cadminPermissions';

// ============================================
// FILTER OPTIONS
// ============================================

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...getCategoryOptions().map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
];

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  ...getEntityTypeOptions().map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
];

const ACTOR_TYPE_OPTIONS = [
  { value: '', label: 'All Actors' },
  ...getActorTypeOptions().map(opt => ({
    value: opt.value,
    label: opt.label,
  })),
];

// ============================================
// MAIN COMPONENT
// ============================================

const AuditPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const rowsPerPage = useDynamicRowCount();
  const { hasPermission } = useCAdminPermission();

  // Check export permission
  const canExport = hasPermission(CADMIN_PERMISSIONS.AUDIT_EXPORT);

  // ============================================
  // STATE
  // ============================================

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actorTypeFilter, setActorTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'created_at',
    order: 'desc',
  });

  // Data
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detail Panel
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // ============================================
  // COMPUTED
  // ============================================

  const activeFiltersCount = useMemo(() => {
    return [categoryFilter, entityTypeFilter, actorTypeFilter, dateFrom, dateTo].filter(Boolean).length;
  }, [categoryFilter, entityTypeFilter, actorTypeFilter, dateFrom, dateTo]);

  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0 || searchText.trim().length > 0;
  }, [activeFiltersCount, searchText]);

  const currentFilters = useMemo(() => ({
    search: searchText || undefined,
    category: categoryFilter || undefined,
    entity_type: entityTypeFilter || undefined,
    actor_type: actorTypeFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }), [searchText, categoryFilter, entityTypeFilter, actorTypeFilter, dateFrom, dateTo]);

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build params
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        sort: sortConfig.sortBy,
        order: sortConfig.order,
        search: searchText || undefined,
        entity_type: entityTypeFilter || undefined,
        actor_type: actorTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      // Handle category filter (expand to actions)
      if (categoryFilter) {
        const category = AUDIT_CATEGORIES[categoryFilter];
        if (category) {
          params.action = category.actions.join(',');
        }
      }

      const response = await getAuditLogs(params);
      const result = response.data;

      setAuditLogs(result.data?.data || []);
      setTotalItems(result.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load audit logs';
      setError(errorMessage);
      setAuditLogs([]);
      setTotalItems(0);
      toast.error('Failed to Load', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, sortConfig, searchText, categoryFilter, entityTypeFilter, actorTypeFilter, dateFrom, dateTo, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await getAuditStats();
      setStats(response.data?.data || response.data);
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, categoryFilter, entityTypeFilter, actorTypeFilter, dateFrom, dateTo, sortConfig]);

  // Update URL params
  useEffect(() => {
    if (searchText) {
      setSearchParams({ search: searchText });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  }, [searchText]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    toast.info('Refreshing', 'Loading latest audit data...', 2000);
    fetchAuditLogs();
    fetchStats();
  }, [fetchAuditLogs, fetchStats, toast]);

  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setCategoryFilter('');
    setEntityTypeFilter('');
    setActorTypeFilter('');
    setDateFrom('');
    setDateTo('');
    searchParams.delete('search');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((column) => {
    setSortConfig(prev => ({
      sortBy: column,
      order: prev.sortBy === column && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleRowClick = useCallback((log) => {
    setSelectedLog(log);
    setDetailPanelOpen(true);
  }, []);

  const handleCloseDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
    setTimeout(() => setSelectedLog(null), 300);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* ════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Title Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <ScrollText size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Audit Logs
              </h1>
              <p className="text-sm text-gray-500">
                {stats?.total?.toLocaleString() || totalItems?.toLocaleString() || 0} total events
                {stats?.today ? ` • ${stats.today} today` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={() => setExportModalOpen(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                           hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                         disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SEARCH & FILTERS
        ════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search in logs..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                           bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 
                           focus:border-[#000060] transition-all"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                             text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 sm:px-4 h-10 sm:h-11 rounded-lg text-sm font-medium flex items-center gap-2
                         transition-all shadow-sm relative flex-shrink-0
                         ${showFilters || activeFiltersCount > 0
                           ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200'
                           : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                         }`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white 
                                 text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="pt-3 border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <StyledSelect
                  label="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={CATEGORY_OPTIONS}
                  placeholder="All Categories"
                />

                <StyledSelect
                  label="Entity Type"
                  value={entityTypeFilter}
                  onChange={setEntityTypeFilter}
                  options={ENTITY_TYPE_OPTIONS}
                  placeholder="All Entities"
                />

                <StyledSelect
                  label="Actor Type"
                  value={actorTypeFilter}
                  onChange={setActorTypeFilter}
                  options={ACTOR_TYPE_OPTIONS}
                  placeholder="All Actors"
                />

                <StyledDateFilter
                  label="From Date"
                  date={dateFrom}
                  setDate={setDateFrom}
                />

                <StyledDateFilter
                  label="To Date"
                  date={dateTo}
                  setDate={setDateTo}
                />
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 
                               hover:bg-red-50 rounded-lg transition-all flex items-center gap-2"
                  >
                    <X size={16} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-700 hover:text-red-900 font-medium underline text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          TABLE
      ════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <AuditTable
          logs={auditLogs}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
        />
      </div>

      {/* ════════════════════════════════════════════
          DETAIL PANEL (Slide-in from right)
      ════════════════════════════════════════════ */}
      <AuditDetailPanel
        log={selectedLog}
        isOpen={detailPanelOpen}
        onClose={handleCloseDetailPanel}
      />

      {/* ════════════════════════════════════════════
          EXPORT MODAL
      ════════════════════════════════════════════ */}
      {canExport && (
        <AuditExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          currentFilters={currentFilters}
        />
      )}
    </div>
  );
};

export default AuditPage;