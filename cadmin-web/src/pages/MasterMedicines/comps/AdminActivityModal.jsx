// cadmin-web/src/pages/MasterMedicines/comps/AdminActivityModal.jsx (do not remove this comment)

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  RefreshCw,
  Loader2,
  Users,
  ChevronRight,
  ChevronLeft,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  getAdminActivitySummary,
  getAdminActivityDetail,
  downloadAdminActivityCSV,
  downloadAdminActivityDetailCSV,
} from "../../../api/cadminMasterMedicines";
import StyledDateFilter from "../../../components/common/StyledDateFilter";

// ── Month preset helpers ──────────────────────────────────────
const getMonthRange = (offset = 0) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - offset;
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
    label: from.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    }),
  };
};

const buildPresets = () => [
  { label: "This Month", ...getMonthRange(0) },
  { label: "Last Month", ...getMonthRange(1) },
  { label: "2 Months Ago", ...getMonthRange(2) },
  { label: "3 Months Ago", ...getMonthRange(3) },
  {
    label: "Last 30 Days",
    from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },
];

const MONTH_PRESETS = buildPresets();

const AdminActivityModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState([]);
  const [meta, setMeta] = useState({});
  const [apiError, setApiError] = useState(null);

  const defaultFrom = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split("T")[0];
  const defaultTo = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [activePreset, setActivePreset] = useState("Last 30 Days");

  // Detail drilldown
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [detailMeta, setDetailMeta] = useState({});
  const [detailActor, setDetailActor] = useState(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailExporting, setDetailExporting] = useState(false);

  // ── Escape key + body scroll lock ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !loading && !exporting) onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, exporting, onClose]);

  // ── Data fetching ──────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await getAdminActivitySummary({ dateFrom, dateTo });
      const data = res.data?.data;
      if (data) {
        setSummary(data.summary || []);
        setMeta(data.meta || {});
      }
    } catch (err) {
      console.error("Failed to load admin activity:", err);
      setApiError(err.response?.data?.message || "Failed to load activity data");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (isOpen) loadSummary();
  }, [isOpen, loadSummary]);

  const applyPreset = (preset) => {
    setDateFrom(preset.from);
    setDateTo(preset.to);
    setActivePreset(preset.label);
  };

  const handleDateFromChange = (val) => {
    setDateFrom(val);
    setActivePreset("");
  };

  const handleDateToChange = (val) => {
    setDateTo(val);
    setActivePreset("");
  };

  // ── Export handlers ────────────────────────────────────────
  const handleExportAll = async () => {
    try {
      setExporting(true);
      await downloadAdminActivityCSV({ dateFrom, dateTo });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportUser = async (actor, e) => {
    e?.stopPropagation();
    try {
      setDetailExporting(true);
      await downloadAdminActivityDetailCSV({
        actorId: actor.actorId,
        actorType: actor.actorType,
        dateFrom,
        dateTo,
      });
    } catch (err) {
      console.error("User export failed:", err);
    } finally {
      setDetailExporting(false);
    }
  };

  const handleExportDrilldown = async () => {
    if (!detailActor) return;
    try {
      setDetailExporting(true);
      await downloadAdminActivityDetailCSV({
        actorId: detailActor.actorId,
        actorType: detailActor.actorType,
        dateFrom,
        dateTo,
      });
    } catch (err) {
      console.error("Drilldown export failed:", err);
    } finally {
      setDetailExporting(false);
    }
  };

  // ── Drilldown ──────────────────────────────────────────────
  const handleDrilldown = async (actor, page = 1) => {
    try {
      setDetailLoading(true);
      setDetailActor(actor);
      setDetailPage(page);
      const res = await getAdminActivityDetail({
        actorId: actor.actorId,
        actorType: actor.actorType,
        dateFrom,
        dateTo,
        page,
        limit: 20,
      });
      const data = res.data?.data;
      if (data) {
        setDetailData(data.actions || []);
        setDetailMeta(data.meta || {});
      }
    } catch (err) {
      console.error("Detail load failed:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrilldown = () => {
    setDetailActor(null);
    setDetailData([]);
    setDetailMeta({});
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => !loading && !exporting && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl
                   flex flex-col overflow-hidden animate-in zoom-in-95 duration-200
                   h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Activity size={20} />
              <div>
                <h2 className="font-semibold text-lg">Admin Activity</h2>
                <p className="text-white/60 text-xs mt-0.5">
                  Per-admin medicine mapping activity breakdown
                </p>
              </div>
            </div>
            <button
              onClick={() => !loading && !exporting && onClose()}
              disabled={loading || exporting}
              className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25
                         disabled:opacity-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Filters Bar ────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-200 space-y-3">
          {/* Month presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MONTH_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activePreset === preset.label
                    ? "bg-[#05015A] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date range + actions */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-44">
              <StyledDateFilter
                label="From"
                date={dateFrom}
                setDate={handleDateFromChange}
              />
            </div>
            <div className="w-44">
              <StyledDateFilter
                label="To"
                date={dateTo}
                setDate={handleDateToChange}
              />
            </div>
            <button
              onClick={loadSummary}
              disabled={loading}
              className="h-10 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm
                         font-medium flex items-center gap-1.5 transition-colors
                         disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportAll}
              disabled={exporting || summary.length === 0}
              className="h-10 px-4 bg-[#05015A] text-white hover:bg-[#1a10a0] rounded-xl
                         text-sm font-medium flex items-center gap-2 shadow-sm
                         transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download All (CSV)
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* API error */}
          {apiError && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3
                            rounded-xl flex items-center gap-2 text-sm mb-4"
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              {apiError}
            </div>
          )}

          {detailActor ? (
            /* ═══════ DETAIL DRILLDOWN VIEW ═══════ */
            <div className="space-y-4">
              {/* Drilldown header card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeDrilldown}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500
                                 hover:text-[#05015A] transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {detailActor.actorName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {detailMeta.total || 0} actions · {dateFrom} to{" "}
                        {dateTo}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportDrilldown}
                    disabled={detailExporting}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700
                               rounded-xl text-sm font-medium flex items-center gap-2
                               shadow-sm transition-colors disabled:opacity-50"
                  >
                    {detailExporting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Download Activity
                  </button>
                </div>
              </div>

              {/* Drilldown table card */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {detailLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2
                      size={28}
                      className="animate-spin text-gray-400"
                    />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Medicine
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Variant / Master
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Shop
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.map((action) => (
                            <tr
                              key={action.id}
                              className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs font-medium text-gray-700">
                                  {new Date(
                                    action.timestamp,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {new Date(
                                    action.timestamp,
                                  ).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    action.action.includes("PROPAGAT")
                                      ? "bg-blue-100 text-blue-700"
                                      : action.action.includes("LINK") ||
                                          action.action.includes("MATCH") ||
                                          action.action.includes("ACCEPT")
                                        ? "bg-green-100 text-green-700"
                                        : action.action.includes("UNLINK") ||
                                            action.action.includes("REJECT")
                                          ? "bg-red-100 text-red-700"
                                          : action.action.includes("IGNORE")
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {action.actionLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-gray-800">
                                {action.medicineName || "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {action.variantName || ""}
                                {action.masterName
                                  ? ` → ${action.masterName}`
                                  : ""}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {action.shopName || "—"}
                              </td>
                              <td className="px-4 py-3 text-center text-xs font-bold text-gray-700">
                                {action.bulkCount || "—"}
                              </td>
                            </tr>
                          ))}
                          {detailData.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-16 text-center text-gray-400 text-sm"
                              >
                                No activity found for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {detailMeta.totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <span className="text-xs text-gray-500">
                          Page {detailPage} of {detailMeta.totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={detailPage <= 1}
                            onClick={() =>
                              handleDrilldown(detailActor, detailPage - 1)
                            }
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm
                                       font-medium disabled:opacity-40 hover:bg-white transition-colors"
                          >
                            ← Prev
                          </button>
                          <button
                            disabled={detailPage >= detailMeta.totalPages}
                            onClick={() =>
                              handleDrilldown(detailActor, detailPage + 1)
                            }
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm
                                       font-medium disabled:opacity-40 hover:bg-white transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ═══════ SUMMARY TABLE ═══════ */
            <div className="space-y-4">
              {/* Stats bar */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={14} className="text-gray-400" />
                <span>
                  <strong className="text-gray-700">
                    {meta.totalAdmins || 0}
                  </strong>{" "}
                  actor{meta.totalAdmins !== 1 ? "s" : ""} tracked
                </span>
                {dateFrom && dateTo && (
                  <span className="text-gray-300">·</span>
                )}
                {dateFrom && dateTo && (
                  <span className="text-gray-400">
                    {dateFrom} to {dateTo}
                  </span>
                )}
              </div>

              {/* Summary table card */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                  <div className="flex justify-center py-20">
                    <Loader2
                      size={28}
                      className="animate-spin text-gray-400"
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                            Admin
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="text-xs font-semibold text-green-700">
                              Linked
                            </div>
                            <div className="text-[10px] font-normal text-gray-400">
                              Manual
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="text-xs font-semibold text-emerald-600">
                              Linked
                            </div>
                            <div className="text-[10px] font-normal text-gray-400">
                              Auto
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                            Rejected
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-orange-600 uppercase tracking-wider">
                            Ignored
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="text-xs font-semibold text-red-700">
                              Unlinked
                            </div>
                            <div className="text-[10px] font-normal text-gray-400">
                              Manual
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center">
                            <div className="text-xs font-semibold text-amber-600">
                              Unlinked
                            </div>
                            <div className="text-[10px] font-normal text-gray-400">
                              Auto
                            </div>
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                            Unignored
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-purple-600 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Images
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-bold text-[#05015A] uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-2 py-3 w-[60px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map((actor, i) => (
                          <tr
                            key={`${actor.actorType}-${actor.actorId}-${i}`}
                            className="border-b border-gray-100 hover:bg-indigo-50/40 transition-colors group"
                          >
                            <td
                              className="px-4 py-3 cursor-pointer"
                              onClick={() => handleDrilldown(actor)}
                            >
                              <div className="font-semibold text-gray-900 flex items-center gap-1.5 group-hover:text-[#05015A] transition-colors">
                                {actor.actorName}
                                <ChevronRight
                                  size={14}
                                  className="text-gray-300 group-hover:text-[#05015A] transition-colors"
                                />
                              </div>
                              {actor.actorEmail && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {actor.actorEmail}
                                </div>
                              )}
                              <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                {actor.actorRole}
                                {!actor.isActive && (
                                  <span className="text-red-400 font-medium">
                                    (inactive)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="font-bold text-green-700">
                                {actor.linked || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={`font-bold ${actor.linkedPropagated > 0 ? "text-emerald-600" : "text-gray-300"}`}
                              >
                                {actor.linkedPropagated || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={
                                  actor.rejected
                                    ? "text-red-600 font-bold"
                                    : "text-gray-300"
                                }
                              >
                                {actor.rejected || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={
                                  actor.ignored
                                    ? "text-orange-600 font-bold"
                                    : "text-gray-300"
                                }
                              >
                                {actor.ignored || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={
                                  actor.unlinked
                                    ? "text-red-700 font-bold"
                                    : "text-gray-300"
                                }
                              >
                                {actor.unlinked || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={`font-bold ${actor.unlinkedPropagated > 0 ? "text-amber-600" : "text-gray-300"}`}
                              >
                                {actor.unlinkedPropagated || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={
                                  actor.unignored
                                    ? "text-blue-600 font-bold"
                                    : "text-gray-300"
                                }
                              >
                                {actor.unignored || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={
                                  actor.created
                                    ? "text-purple-600 font-bold"
                                    : "text-gray-300"
                                }
                              >
                                {actor.created || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span
                                className={
                                  actor.images
                                    ? "text-gray-600 font-bold"
                                    : "text-gray-300"
                                }
                              >
                                {actor.images || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="bg-[#05015A] text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                                {actor.totalActions}
                              </span>
                            </td>
                            <td className="px-2 py-3">
                              <button
                                onClick={(e) => handleExportUser(actor, e)}
                                disabled={detailExporting}
                                title={`Download ${actor.actorName}'s activity`}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400
                                           hover:text-emerald-600 transition-colors"
                              >
                                {detailExporting ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Download size={14} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {summary.length === 0 && (
                          <tr>
                            <td
                              colSpan={12}
                              className="px-4 py-20 text-center text-gray-400 text-sm"
                            >
                              No admin activity found for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-6 py-3 bg-white border-t border-gray-100
                        flex items-center justify-between"
        >
          <p className="text-xs text-gray-400">
            {detailActor
              ? `Viewing detailed log for ${detailActor.actorName}`
              : "Click any admin name to view their detailed activity log"}
          </p>
          <button
            onClick={() => !loading && !exporting && onClose()}
            disabled={loading || exporting}
            className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg
                       disabled:opacity-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityModal;