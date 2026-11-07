import { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  getAdminActivitySummary,
  getAdminActivityDetail,
  downloadAdminActivityCSV,
  downloadAdminActivityDetailCSV,
} from "../../../api/cadminMasterMedicines";

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
    label: from.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
  };
};

const MONTH_PRESETS = [
  { label: "This Month", ...getMonthRange(0) },
  { label: "Last Month", ...getMonthRange(1) },
  { label: "2 Months Ago", ...getMonthRange(2) },
  { label: "3 Months Ago", ...getMonthRange(3) },
  { label: "Last 30 Days", from: getMonthRange(0).from, to: getMonthRange(0).to },
];

// Fix "Last 30 Days" to actually be rolling 30 days
MONTH_PRESETS[4] = {
  label: "Last 30 Days",
  from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
  to: new Date().toISOString().split("T")[0],
};

const AdminActivityModal = ({ isOpen, onClose, zIndex = 50 }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState([]);
  const [meta, setMeta] = useState({});

  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
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

  // ── Data fetching ──────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminActivitySummary({ dateFrom, dateTo });
      const data = res.data?.data;
      if (data) {
        setSummary(data.summary || []);
        setMeta(data.meta || {});
      }
    } catch (err) {
      console.error("Failed to load admin activity:", err);
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

  const handleDateChange = (field, value) => {
    if (field === "from") setDateFrom(value);
    else setDateTo(value);
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#000060] flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin Activity</h2>
              <p className="text-xs text-gray-500">
                Per-admin medicine mapping activity breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── FILTERS ── */}
        <div className="px-6 py-3 border-b bg-white space-y-2">
          {/* Month presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MONTH_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activePreset === preset.label
                    ? "bg-[#000060] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date range + actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateChange("from", e.target.value)}
                className="px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateChange("to", e.target.value)}
                className="px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]"
              />
            </div>
            <button
              onClick={loadSummary}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
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
              className="px-3 py-1.5 bg-[#000060] text-white hover:bg-[#000080] rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
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

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-auto p-6">
          {detailActor ? (
            /* ═══════ DETAIL DRILLDOWN VIEW ═══════ */
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={closeDrilldown}
                  className="text-sm text-[#000060] hover:underline font-medium flex items-center gap-1"
                >
                  ← Back to summary
                </button>
                <button
                  onClick={handleExportDrilldown}
                  disabled={detailExporting}
                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {detailExporting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  Download {detailActor.actorName}'s Activity
                </button>
              </div>

              <h3 className="text-md font-bold mb-1">
                Activity log for {detailActor.actorName}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {detailMeta.total || 0} actions · {dateFrom} to {dateTo}
              </p>

              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 pr-4">Date & Time</th>
                        <th className="pb-2 pr-4">Action</th>
                        <th className="pb-2 pr-4">Medicine</th>
                        <th className="pb-2 pr-4">Variant / Master</th>
                        <th className="pb-2 pr-4">Shop</th>
                        <th className="pb-2">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((action) => (
                        <tr
                          key={action.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 pr-4 text-gray-500 whitespace-nowrap text-xs">
                            {new Date(action.timestamp).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            <br />
                            <span className="text-gray-400">
                              {new Date(action.timestamp).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                action.action.includes("LINK") ||
                                action.action.includes("MATCH") ||
                                action.action.includes("ACCEPT")
                                  ? "bg-green-100 text-green-700"
                                  : action.action.includes("UNLINK") ||
                                      action.action.includes("REJECT")
                                    ? "bg-red-100 text-red-700"
                                    : action.action.includes("IGNORE")
                                      ? "bg-orange-100 text-orange-700"
                                      : action.action.includes("PROPAGAT")
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {action.actionLabel}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-medium text-xs">
                            {action.medicineName || "—"}
                          </td>
                          <td className="py-2 pr-4 text-xs text-gray-500">
                            {action.variantName || ""}
                            {action.masterName
                              ? ` → ${action.masterName}`
                              : ""}
                          </td>
                          <td className="py-2 pr-4 text-xs text-gray-500">
                            {action.shopName || "—"}
                          </td>
                          <td className="py-2 text-xs font-bold text-gray-700">
                            {action.bulkCount || "—"}
                          </td>
                        </tr>
                      ))}
                      {detailData.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-gray-400"
                          >
                            No activity found for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {detailMeta.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        disabled={detailPage <= 1}
                        onClick={() =>
                          handleDrilldown(detailActor, detailPage - 1)
                        }
                        className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
                      >
                        ← Prev
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-500">
                        Page {detailPage} of {detailMeta.totalPages}
                      </span>
                      <button
                        disabled={detailPage >= detailMeta.totalPages}
                        onClick={() =>
                          handleDrilldown(detailActor, detailPage + 1)
                        }
                        className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ═══════ SUMMARY TABLE ═══════ */
            <>
              <p className="text-sm text-gray-500 mb-4">
                {meta.totalAdmins || 0} actor
                {meta.totalAdmins !== 1 ? "s" : ""} tracked
                {dateFrom && dateTo && ` · ${dateFrom} to ${dateTo}`}
              </p>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-left">
                        <th className="pb-3 pr-4 text-gray-600 font-semibold min-w-[180px]">
                          Admin
                        </th>
                        <th className="pb-3 px-2 text-center text-green-700 font-semibold">
                          <div>Linked</div>
                          <div className="text-[10px] font-normal text-gray-400">
                            Manual
                          </div>
                        </th>
                        <th className="pb-3 px-2 text-center text-emerald-600 font-semibold">
                          <div>Linked</div>
                          <div className="text-[10px] font-normal text-gray-400">
                            Auto
                          </div>
                        </th>
                        <th className="pb-3 px-2 text-center text-red-600 font-semibold">
                          Rejected
                        </th>
                        <th className="pb-3 px-2 text-center text-orange-600 font-semibold">
                          Ignored
                        </th>
                        <th className="pb-3 px-2 text-center text-red-700 font-semibold">
                          <div>Unlinked</div>
                          <div className="text-[10px] font-normal text-gray-400">
                            Manual
                          </div>
                        </th>
                        <th className="pb-3 px-2 text-center text-amber-600 font-semibold">
                          <div>Unlinked</div>
                          <div className="text-[10px] font-normal text-gray-400">
                            Auto
                          </div>
                        </th>
                        <th className="pb-3 px-2 text-center text-blue-600 font-semibold">
                          Unignored
                        </th>
                        <th className="pb-3 px-2 text-center text-purple-600 font-semibold">
                          Created
                        </th>
                        <th className="pb-3 px-2 text-center text-gray-600 font-semibold">
                          Images
                        </th>
                        <th className="pb-3 px-2 text-center text-[#000060] font-bold">
                          Total
                        </th>
                        <th className="pb-3 pl-2 w-[80px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((actor, i) => (
                        <tr
                          key={`${actor.actorType}-${actor.actorId}-${i}`}
                          className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group"
                        >
                          <td
                            className="py-3 pr-4 cursor-pointer"
                            onClick={() => handleDrilldown(actor)}
                          >
                            <div className="font-semibold text-gray-900 flex items-center gap-1">
                              {actor.actorName}
                              <ChevronRight
                                size={14}
                                className="text-gray-300 group-hover:text-[#000060] transition-colors"
                              />
                            </div>
                            {actor.actorEmail && (
                              <div className="text-xs text-gray-400">
                                {actor.actorEmail}
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {actor.actorRole}
                              {!actor.isActive && (
                                <span className="ml-1 text-red-400">
                                  (inactive)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="font-bold text-green-700">
                              {actor.linked || "—"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`font-bold ${actor.linkedPropagated > 0 ? "text-emerald-600" : "text-gray-300"}`}
                            >
                              {actor.linkedPropagated || "—"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
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
                          <td className="py-3 px-2 text-center">
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
                          <td className="py-3 px-2 text-center">
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
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`font-bold ${actor.unlinkedPropagated > 0 ? "text-amber-600" : "text-gray-300"}`}
                            >
                              {actor.unlinkedPropagated || "—"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
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
                          <td className="py-3 px-2 text-center">
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
                          <td className="py-3 px-2 text-center">
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
                          <td className="py-3 px-2 text-center">
                            <span className="bg-[#000060] text-white px-2.5 py-1 rounded-full text-xs font-bold">
                              {actor.totalActions}
                            </span>
                          </td>
                          {/* Per-user download button */}
                          <td className="py-3 pl-2">
                            <button
                              onClick={(e) => handleExportUser(actor, e)}
                              disabled={detailExporting}
                              title={`Download ${actor.actorName}'s activity`}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                            >
                              {detailExporting ? (
                                <Loader2 size={14} className="animate-spin" />
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
                            className="py-12 text-center text-gray-400"
                          >
                            No admin activity found for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivityModal;