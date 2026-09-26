// cadmin-web/src/pages/Fleet/Riders/comps/RidersTable.jsx (do not remove this comment)
import { useState } from "react";
import { ChevronUp, ChevronDown, Users, Ban, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import Pagination from "../../../../components/common/Pagination";
import TableSkeleton from "../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../components/common/TableEmptyState";
import RiderDetailModal from "./RiderDetailModal";
import { TABLE_CONFIG, getClickableRowClass } from "../../../../config/tableConfig";

const COLUMNS = {
  slNo: { key: "slNo", label: "#", width: 50, sortable: false },
  name: { key: "name", label: "Name", width: 180, sortable: true },
  phone: { key: "phone", label: "Phone", width: 130, sortable: false },
  type: { key: "type", label: "Type", width: 110, sortable: false },
  status: { key: "status", label: "Status", width: 120, sortable: false },
  rating: { key: "rating", label: "Rating", width: 80, sortable: true },
  deliveries: { key: "deliveries", label: "Deliveries", width: 90, sortable: true },
  joined: { key: "joined", label: "Joined", width: 110, sortable: true },
  actions: { key: "actions", label: "", width: 60, sortable: false },
};

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  BLOCKED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

const RidersTable = ({
  currentPage, setCurrentPage, rowsPerPage, riders, loading, totalItems, sortConfig, onSortChange, onRefresh,
}) => {
  const { styles, heights } = TABLE_CONFIG;
  const [selectedRider, setSelectedRider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startIndex = (currentPage - 1) * rowsPerPage;

  const handleRowClick = (rider) => {
    setSelectedRider(rider);
    setIsModalOpen(true);
  };

  const SortableHeader = ({ column }) => {
    const config = COLUMNS[column];
    const isActive = sortConfig?.sortBy === column;
    return (
      <th style={{ width: config.width, minWidth: 50 }} className="relative group">
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${config.sortable ? "cursor-pointer select-none" : ""}`}
          onClick={() => config.sortable && onSortChange?.(column)}
        >
          <span>{config.label}</span>
          {config.sortable && (
            <div className="flex flex-col gap-0.5">
              <ChevronUp size={12} className={isActive && sortConfig.order === "asc" ? styles.header.sortIcon.active : styles.header.sortIcon.inactive} />
              <ChevronDown size={12} className={`-mt-1 ${isActive && sortConfig.order === "desc" ? styles.header.sortIcon.active : styles.header.sortIcon.inactive}`} />
            </div>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className={styles.container.wrapper}>
      {(loading || riders.length > 0) && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "800px" }}>
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                {Object.keys(COLUMNS).map((col) => (
                  <SortableHeader key={col} column={col} />
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={rowsPerPage} columns={Object.keys(COLUMNS).filter((k) => k !== "slNo" && k !== "actions")} />
              ) : (
                riders.map((rider, index) => (
                  <tr
                    key={rider.rider_id}
                    onClick={() => handleRowClick(rider)}
                    className={getClickableRowClass(index, rider.status === "BLOCKED")}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>{startIndex + index + 1}</td>
                    <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#05015A] to-[#0a0280] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {rider.full_name ? rider.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 truncate block">{rider.full_name || "Unnamed"}</span>
                          {rider.vehicle_number && <span className="text-xs text-gray-400">{rider.vehicle_number}</span>}
                        </div>
                      </div>
                    </td>
                    <td className={`${styles.cell.base} ${styles.cell.secondary}`}>{rider.phone}</td>
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rider.rider_type === "TEAM" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {rider.rider_type === "TEAM" ? "Team" : "Independent"}
                      </span>
                    </td>
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[rider.status] || "bg-gray-100 text-gray-600"}`}>
                        {rider.status === "ACTIVE" && <CheckCircle size={12} />}
                        {rider.status === "SUSPENDED" && <Ban size={12} />}
                        {rider.status === "BLOCKED" && <AlertTriangle size={12} />}
                        {rider.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className={`${styles.cell.base} ${styles.cell.center} text-gray-600`}>
                      {rider.rating > 0 ? `⭐ ${rider.rating.toFixed(1)}` : "—"}
                    </td>
                    <td className={`${styles.cell.base} ${styles.cell.center} text-gray-600`}>{rider.total_deliveries || 0}</td>
                    <td className={`${styles.cell.base} ${styles.cell.muted}`}>
                      {new Date(rider.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className={styles.cell.base}>
                      <button onClick={(e) => { e.stopPropagation(); handleRowClick(rider); }} className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && riders.length === 0 && (
        <TableEmptyState icon={Users} title="No riders found" subtitle="Try adjusting your search or filters" />
      )}

      {!loading && riders.length > 0 && (
        <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalItems={totalItems} rowsPerPage={rowsPerPage} />
      )}

      <RiderDetailModal
        isOpen={isModalOpen}
        onClose={(shouldRefresh) => {
          setIsModalOpen(false);
          setSelectedRider(null);
          if (shouldRefresh) onRefresh?.();
        }}
        rider={selectedRider}
      />
    </div>
  );
};

export default RidersTable;