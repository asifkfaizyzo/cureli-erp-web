import { useState, useEffect, useCallback } from "react";
import {
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link2,
  XCircle,
  EyeOff,
  Unlink,
  RotateCcw,
  PlusCircle,
  Image,
  Pill,
  Bot,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StyledDateFilter from "../../../components/common/StyledDateFilter";
import {
  getAdminActivitySummary,
  getAdminActivityDetail,
} from "../../../api/cadminMasterMedicines";

// ── Helpers ──────────────────────────────────────────────────────

const getDefaultDateRange = () => {
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { from: fmt(thirtyAgo), to: fmt(now) };
};

const ACTION_ICON = {
  linked: Link2,
  rejected: XCircle,
  ignored: EyeOff,
  unlinked: Unlink,
  unignored: RotateCcw,
  created: PlusCircle,
  images: Image,
};

const ACTION_COLOR = {
  linked: "text-emerald-600 bg-emerald-50",
  rejected: "text-red-600 bg-red-50",
  ignored: "text-amber-600 bg-amber-50",
  unlinked: "text-orange-600 bg-orange-50",
  unignored: "text-blue-600 bg-blue-50",
  created: "text-purple-600 bg-purple-50",
  images: "text-cyan-600 bg-cyan-50",
};

const DETAIL_ACTION_BADGE = {
  MEDICINE_MATCHED_TO_VARIANT: { label: "Linked", cls: "bg-emerald-100 text-emerald-700" },
  MEDICINE_MATCH_ACCEPTED: { label: "Accepted", cls: "bg-emerald-100 text-emerald-700" },
  MEDICINE_MATCH_REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  UNMAPPED_MEDICINES_IGNORED: { label: "Ignored", cls: "bg-amber-100 text-amber-700" },
  MEDICINE_UNLINKED: { label: "Unlinked", cls: "bg-orange-100 text-orange-700" },
  MEDICINE_UNIGNORED: { label: "Unignored", cls: "bg-blue-100 text-blue-700" },
  MASTER_MEDICINE_CREATED: { label: "Created", cls: "bg-purple-100 text-purple-700" },
  MASTER_MEDICINE_IMAGE_UPLOADED: { label: "Image ↑", cls: "bg-cyan-100 text-cyan-700" },
  MASTER_MEDICINE_IMAGE_DELETED: { label: "Image ↓", cls: "bg-cyan-100 text-cyan-700" },
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// ── Component ────────────────────────────────────────────────────

const AdminActivityModal = ({ isOpen, onClose, zIndex = 50 }) => {
  const defaults = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);

  // Summary state
  const [summary, setSummary] = useState([]);
  const [summaryMeta, setSummaryMeta] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Drilldown state
  const [expandedActor, setExpandedActor] = useState(null); // { actorId, actorType, actorName }
  const [detailData, setDetailData] = useState([]);
  const [detailMeta, setDetailMeta] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailPage, setDetailPage] = useState(1);

  // ── Fetch Summary ──────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const res = await getAdminActivitySummary({ dateFrom, dateTo });
      const data = res.data?.data;
      if (data) {
        setSummary(data.summary || []);
        setSummaryMeta(data.meta || null);
      }
    } catch (err) {
      console.error("Admin activity summary error:", err);
    } finally {
      setLoadingSummary(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (isOpen) fetchSummary();
  }, [isOpen, fetchSummary]);

  // ── Fetch Detail (Drilldown) ───────────────────────────────────

  const fetchDetail = useCallback(
    async (actor, page = 1) => {
      try {
        setLoadingDetail(true);
        const res = await getAdminActivityDetail({
          actorId: actor.actorId,
          actorType: actor.actorType,
          dateFrom,
          dateTo,
          page,
          limit: 15,
        });
        const data = res.data?.data;
        if (data) {
          if (page === 1) {
            setDetailData(data.actions || []);
          } else {
            setDetailData((prev) => [...prev, ...(data.actions || [])]);
          }
          setDetailMeta(data.meta || null);
        }
      } catch (err) {
        console.error("Admin activity detail error:", err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [dateFrom, dateTo],
  );

  // ── Row Expand / Collapse ──────────────────────────────────────

  const handleToggleRow = (row) => {
    const key = `${row.actorType}:${row.actorId || "SYSTEM"}`;
    const expandedKey = expandedActor
      ? `${expandedActor.actorType}:${expandedActor.actorId || "SYSTEM"}`
      : null;

    if (key === expandedKey) {
      setExpandedActor(null);
      setDetailData([]);
      setDetailMeta(null);
      setDetailPage(1);
    } else {
      const actor = {
        actorId: row.actorId,
        actorType: row.actorType,
        actorName: row.actorName,
      };
      setExpandedActor(actor);
      setDetailData([]);
      setDetailMeta(null);
      setDetailPage(1);
      fetchDetail(actor, 1);
    }
  };

  const handleLoadMore = () => {
    if (!expandedActor || !detailMeta?.hasNext) return;
    const nextPage = detailPage + 1;
    setDetailPage(nextPage);
    fetchDetail(expandedActor, nextPage);
  };

  // ── Reset on close ─────────────────────────────────────────────

  const handleClose = () => {
    setExpandedActor(null);
    setDetailData([]);
    setDetailMeta(null);
    setDetailPage(1);
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────

  if (!isOpen) return null;

  const isExpanded = (row) => {
    if (!expandedActor) return false;
    const key = `${row.actorType}:${row.actorId || "SYSTEM"}`;
    const expandedKey = `${expandedActor.actorType}:${expandedActor.actorId || "SYSTEM"}`;
    return key === expandedKey;
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style={{ zIndex: zIndex + 1 }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#000060]/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#000060] flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Admin Activity
                </h2>
                <p className="text-xs text-gray-500">
                  Per-admin medicine mapping activity breakdown
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Date Filters */}
          <div className="flex items-end gap-3 mt-4 flex-wrap">
            <div className="w-44">
              <StyledDateFilter
                label="From Date"
                date={dateFrom}
                setDate={setDateFrom}
              />
            </div>
            <div className="w-44">
              <StyledDateFilter
                label="To Date"
                date={dateTo}
                setDate={setDateTo}
              />
            </div>
            <button
              onClick={fetchSummary}
              disabled={loadingSummary}
              className="h-10 px-4 bg-[#000060] text-white rounded-lg text-sm font-semibold
                         hover:bg-[#000080] transition-colors flex items-center gap-2
                         disabled:opacity-50"
            >
              {loadingSummary ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh
            </button>
            {summaryMeta && (
              <span className="text-xs text-gray-400 ml-auto pb-2">
                {summaryMeta.totalAdmins} actor{summaryMeta.totalAdmins !== 1 ? "s" : ""} tracked
              </span>
            )}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
          {loadingSummary && summary.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#000060]" />
            </div>
          ) : summary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users size={48} strokeWidth={1} />
              <p className="mt-3 text-sm font-medium">
                No activity found in this period
              </p>
              <p className="text-xs mt-1">
                Try adjusting the date range
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-lg text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Admin</div>
                <div className="col-span-1 text-center">Linked</div>
                <div className="col-span-1 text-center">Rejected</div>
                <div className="col-span-1 text-center">Ignored</div>
                <div className="col-span-1 text-center">Unlinked</div>
                <div className="col-span-1 text-center">Unignored</div>
                <div className="col-span-1 text-center">Created</div>
                <div className="col-span-1 text-center">Images</div>
                <div className="col-span-2 text-center">Total</div>
              </div>

              {/* Rows */}
              {summary.map((row) => {
                const expanded = isExpanded(row);
                const isSystem = row.actorType === "system";

                return (
                  <div key={`${row.actorType}:${row.actorId || "SYSTEM"}`}>
                    {/* Summary Row */}
                    <button
                      onClick={() => handleToggleRow(row)}
                      className={`w-full grid grid-cols-12 gap-2 px-3 py-3 rounded-lg text-sm
                                  transition-all duration-150 text-left
                                  ${
                                    expanded
                                      ? "bg-[#000060]/5 ring-1 ring-[#000060]/20"
                                      : "hover:bg-gray-50"
                                  }`}
                    >
                      {/* Admin Name */}
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSystem
                              ? "bg-purple-100 text-purple-600"
                              : row.isActive
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isSystem ? (
                            <Bot size={14} />
                          ) : row.isActive ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserX size={14} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-xs">
                            {row.actorName}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {isSystem
                              ? "Auto-linker"
                              : row.actorRole === "SUPER_CADMIN"
                                ? "Super Admin"
                                : row.actorRole === "ERP_USER"
                                  ? "Shop User"
                                  : "Admin"}
                          </p>
                        </div>
                        {expanded ? (
                          <ChevronUp
                            size={14}
                            className="text-[#000060] flex-shrink-0 ml-auto"
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="text-gray-300 flex-shrink-0 ml-auto"
                          />
                        )}
                      </div>

                      {/* Stat Cells */}
                      <StatCell value={row.linked} color="emerald" />
                      <StatCell value={row.rejected} color="red" />
                      <StatCell value={row.ignored} color="amber" />
                      <StatCell value={row.unlinked} color="orange" />
                      <StatCell value={row.unignored} color="blue" />
                      <StatCell value={row.created} color="purple" />
                      <StatCell value={row.images} color="cyan" />

                      {/* Total */}
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="px-2.5 py-1 rounded-full bg-[#000060] text-white text-xs font-bold">
                          {row.totalActions}
                        </span>
                      </div>
                    </button>

                    {/* Drilldown Panel */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mr-2 mb-2 mt-1 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-600">
                                Actions by {row.actorName}
                              </span>
                              {detailMeta && (
                                <span className="text-[10px] text-gray-400">
                                  {detailMeta.total} total action
                                  {detailMeta.total !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>

                            {loadingDetail && detailData.length === 0 ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2
                                  size={20}
                                  className="animate-spin text-gray-400"
                                />
                              </div>
                            ) : detailData.length === 0 ? (
                              <div className="text-center py-8 text-xs text-gray-400">
                                No actions found
                              </div>
                            ) : (
                              <>
                                <div className="divide-y divide-gray-50">
                                  {detailData.map((action) => {
                                    const badge =
                                      DETAIL_ACTION_BADGE[action.action] || {
                                        label: action.action,
                                        cls: "bg-gray-100 text-gray-600",
                                      };

                                    return (
                                      <div
                                        key={action.id}
                                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                                      >
                                        {/* Badge */}
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${badge.cls}`}
                                        >
                                          {badge.label}
                                        </span>

                                        {/* Subject */}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-800 truncate">
                                            {action.medicineName ||
                                              action.masterName ||
                                              action.actionLabel}
                                            {action.bulkCount &&
                                              action.bulkCount > 1 && (
                                                <span className="text-gray-400 font-normal">
                                                  {" "}
                                                  (×{action.bulkCount})
                                                </span>
                                              )}
                                          </p>
                                          {action.variantName && (
                                            <p className="text-[10px] text-gray-400 truncate">
                                              → {action.variantName}
                                              {action.variantSku
                                                ? ` (${action.variantSku})`
                                                : ""}
                                            </p>
                                          )}
                                          {action.shopName && (
                                            <p className="text-[10px] text-gray-400 truncate">
                                              Shop: {action.shopName}
                                            </p>
                                          )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-[10px] font-medium text-gray-600">
                                            {formatDate(action.timestamp)}
                                          </p>
                                          <p className="text-[10px] text-gray-400">
                                            {formatTime(action.timestamp)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Load More */}
                                {detailMeta?.hasNext && (
                                  <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                                    <button
                                      onClick={handleLoadMore}
                                      disabled={loadingDetail}
                                      className="px-4 py-1.5 text-xs font-semibold text-[#000060]
                                                 hover:bg-[#000060]/5 rounded-lg transition-colors
                                                 flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      {loadingDetail ? (
                                        <Loader2
                                          size={12}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <ChevronDown size={12} />
                                      )}
                                      Load More (
                                      {detailData.length}/{detailMeta.total})
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Data sourced from audit logs • Actions: Link, Accept, Reject,
            Ignore, Unlink, Unignore, Create, Image
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900
                       hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Stat Cell Sub-component ──────────────────────────────────────

const StatCell = ({ value, color }) => {
  const colorMap = {
    emerald: "text-emerald-700",
    red: "text-red-700",
    amber: "text-amber-700",
    orange: "text-orange-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
    cyan: "text-cyan-700",
    gray: "text-gray-700",
  };

  return (
    <div className="col-span-1 flex items-center justify-center">
      <span
        className={`text-xs font-bold ${value > 0 ? colorMap[color] || "text-gray-700" : "text-gray-300"}`}
      >
        {value || "—"}
      </span>
    </div>
  );
};

export default AdminActivityModal;