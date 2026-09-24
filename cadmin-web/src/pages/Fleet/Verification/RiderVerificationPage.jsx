// cadmin-web/src/pages/Fleet/Verification/RiderVerificationPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Verification/RiderVerificationPage.jsx

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Calendar,
} from "lucide-react";
import RiderVerificationModal from "./comps/RiderVerificationModal";
import { getPendingReviews } from "../../../api/cadminRiders";
import { useToast } from "../../../components/common/Toast";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import Pagination from "../../../components/common/Pagination";
import TableSkeleton from "../../../components/common/TableSkeleton";
import TableEmptyState from "../../../components/common/TableEmptyState";
import { TABLE_CONFIG, getClickableRowClass } from "../../../config/tableConfig";

const RiderVerificationPage = () => {
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();
  const { styles, heights } = TABLE_CONFIG;

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [riders, setRiders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getPendingReviews({
        page: currentPage,
        limit: rowsPerPage,
        search: search || undefined,
      });
      const payload = resp.data?.data || {};
      setRiders(payload.riders || []);
      setTotalItems(payload.meta?.total || 0);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load reviews.";
      setError(msg);
      toast.error("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, search, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getDocStats = (docs = []) => {
    const pending = docs.filter((d) => d.status === "PENDING").length;
    const approved = docs.filter((d) => d.status === "APPROVED").length;
    const rejected = docs.filter((d) => d.status === "REJECTED").length;
    return { pending, approved, rejected, total: docs.length };
  };

  const startIndex = (currentPage - 1) * rowsPerPage;

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rider Verification Queue</h1>
              <p className="text-sm text-gray-500">
                {totalItems} application{totalItems !== 1 ? "s" : ""} awaiting document verification
              </p>
            </div>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-10 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className={styles.container.wrapper}>
          {(loading || riders.length > 0) && (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full border-collapse text-sm" style={{ minWidth: "980px" }}>
                <thead className="sticky top-0 z-10">
                  <tr className={styles.header.row}>
                    <th style={{ width: 50 }} className={styles.header.cell}>#</th>
                    <th style={{ width: 220 }} className={styles.header.cell}>Rider Info</th>
                    <th style={{ width: 130 }} className={styles.header.cell}>Phone</th>
                    <th style={{ width: 120 }} className={styles.header.cell}>Location</th>
                    <th style={{ width: 140 }} className={styles.header.cell}>Vehicle</th>
                    <th style={{ width: 120 }} className={`${styles.header.cell} text-center`}>Type</th>
                    <th style={{ width: 160 }} className={`${styles.header.cell} text-center`}>
                      Documents Status
                    </th>
                    <th style={{ width: 120 }} className={styles.header.cell}>Submitted</th>
                    <th style={{ width: 100 }} className={`${styles.header.cell} text-center`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton
                      rows={rowsPerPage}
                      columns={["rider", "phone", "location", "vehicle", "type", "docs", "date"]}
                    />
                  ) : (
                    riders.map((rider, index) => {
                      const stats = getDocStats(rider.documents);
                      const isResubmission = rider.is_resubmission || rider.status === "REJECTED";

                      return (
                        <tr
                          key={rider.rider_id}
                          onClick={() => setSelectedRider(rider)}
                          className={getClickableRowClass(index)}
                          style={{ height: `${heights.bodyRow}px` }}
                        >
                          <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                            {startIndex + index + 1}
                          </td>

                          {/* Rider info */}
                          <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#05015A] to-[#0a0280] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {rider.full_name
                                  ? rider.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                  : "?"}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-gray-900 block truncate">
                                  {rider.full_name || "New Applicant"}
                                </span>
                                <span className="text-xs text-gray-400 block truncate">
                                  {rider.email || "No email"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                            +91 {rider.phone}
                          </td>

                          {/* City */}
                          <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                            {rider.current_city || "—"}
                          </td>

                          {/* Vehicle */}
                          <td className={`${styles.cell.base} ${styles.cell.secondary}`}>
                            <div>
                              <span className="font-medium text-gray-900 block">
                                {rider.vehicle_type || "—"}
                              </span>
                              {rider.vehicle_number && (
                                <span className="text-xs text-gray-400 font-mono">
                                  {rider.vehicle_number}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Resubmission / Submission Type Badge */}
                          <td className={`${styles.cell.base} ${styles.cell.center}`}>
                            {isResubmission ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                <RotateCcw size={11} /> Resubmission
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                First Review
                              </span>
                            )}
                          </td>

                          {/* Document Status */}
                          <td className={`${styles.cell.base} ${styles.cell.center}`}>
                            <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium">
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold" title="Approved">
                                <CheckCircle2 size={12} /> {stats.approved}
                              </span>
                              <span className="text-gray-300">/</span>
                              <span className="flex items-center gap-1 text-amber-600 font-semibold" title="Pending">
                                <Clock size={12} /> {stats.pending}
                              </span>
                              {stats.rejected > 0 && (
                                <>
                                  <span className="text-gray-300">/</span>
                                  <span className="flex items-center gap-1 text-red-600 font-semibold" title="Rejected">
                                    <XCircle size={12} /> {stats.rejected}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Submitted Date */}
                          <td className={`${styles.cell.base} ${styles.cell.muted}`}>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-gray-400" />
                              <span>
                                {new Date(rider.updated_at || rider.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </td>

                          {/* Action button */}
                          <td className={`${styles.cell.base} ${styles.cell.center}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRider(rider);
                              }}
                              className="px-3 py-1.5 bg-[#05015A] text-white text-xs font-semibold rounded-lg hover:bg-[#0a0280] transition-colors flex items-center justify-center gap-1 mx-auto shadow-sm"
                            >
                              <Eye size={12} />
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && riders.length === 0 && (
            <TableEmptyState
              icon={ShieldCheck}
              title="Verification queue is clear"
              subtitle="All rider applications and re-uploaded documents have been reviewed."
            />
          )}

          {!loading && riders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedRider && (
        <RiderVerificationModal
          rider={selectedRider}
          onClose={(shouldRefresh) => {
            setSelectedRider(null);
            if (shouldRefresh) fetchReviews();
          }}
        />
      )}
    </div>
  );
};

export default RiderVerificationPage;