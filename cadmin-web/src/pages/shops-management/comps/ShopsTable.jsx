// cadmin-web/src/pages/shops-management/comps/ShopsTable.jsx (do not remove this comment)
// src/pages/shops-management/comps/ShopsTable.jsx

import { useEffect, useState, useCallback } from "react";
import {
  Pencil,
  ChevronUp,
  ChevronDown,
  Ban,
  CheckCircle,
  Store,
} from "lucide-react";
import {
  TABLE_CONFIG,
  getClickableRowClass,
  getVerificationStatusConfig,
} from "../../../config/tableConfig";
import TableSkeleton from "../../../components/common/TableSkeleton";
import TableEmptyState from "../../../components/common/TableEmptyState";
import Pagination from "../../../components/common/Pagination";
import ShopDetailsModal from "./ShopDetailsModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { toggleShopActive } from "../../../api/cadminShops";
import { useToast } from "../../../components/common/Toast";

// ============================================
// COLUMN CONFIGURATION
// ============================================
const COLUMNS = {
  slNo: { key: 'slNo', label: '#', width: 50, sortable: false, align: 'left' },
  businessName: { key: 'business_name', label: 'Business Name', width: 200, sortable: true, align: 'left' },
  ownerName: { key: 'owner', label: 'Owner', width: 160, sortable: true, align: 'left' },
  businessType: { key: 'business_type', label: 'Type', width: 130, sortable: true, align: 'left' },
  plan: { key: 'plan', label: 'Plan', width: 120, sortable: false, align: 'center' },
  verification: { key: 'verification', label: 'Verification', width: 130, sortable: false, align: 'center' },
  actions: { key: 'actions', label: 'Actions', width: 80, sortable: false, align: 'center' },
};

const ShopsTable = ({
  currentPage,
  setCurrentPage,
  rowsPerPage,
  shops = [],
  loading = false,
  totalItems = 0,
  sortConfig = { sortBy: null, order: null },
  onSortChange,
  onRefresh,
  onShopUpdate,
}) => {
  const toast = useToast();
  const { styles, heights } = TABLE_CONFIG;

  // Modal states
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");

  // Suspend confirm dialog
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [shopToSuspend, setShopToSuspend] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    Object.entries(COLUMNS).forEach(([key, col]) => {
      widths[key] = col.width;
    });
    return widths;
  });
  const [resizing, setResizing] = useState(null);

  // ============================================
  // COLUMN RESIZING HANDLERS
  // ============================================
  const handleMouseDown = (column, e) => {
    if (column === 'slNo') return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + diff);
    setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
  }, [resizing]);

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = shops && shops.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  // ============================================
  // ROW CLICK HANDLER (Opens View Modal)
  // ============================================
  const handleRowClick = (shop) => {
    setSelectedShop(shop);
    setModalMode("view");
    setIsModalOpen(true);
  };

  // ============================================
  // ACTION HANDLERS (Must stop propagation!)
  // ============================================
  const handleEditClick = (e, shop) => {
    e.stopPropagation();
    setSelectedShop(shop);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSuspendClick = (e, shop) => {
    e.stopPropagation();
    setShopToSuspend(shop);
    setShowSuspendConfirm(true);
  };

  const handleSuspendConfirm = async () => {
    if (!shopToSuspend) return;
    setSuspendLoading(true);
    try {
      const newIsActive = !shopToSuspend.is_active;
      await toggleShopActive(shopToSuspend.shop_id, newIsActive);
      onShopUpdate?.(shopToSuspend.shop_id, { is_active: newIsActive });
      setShowSuspendConfirm(false);
      
      if (newIsActive) {
        toast.success(
          "Shop Activated",
          `"${shopToSuspend.business_name}" has been activated successfully.`
        );
      } else {
        toast.success(
          "Shop Suspended",
          `"${shopToSuspend.business_name}" has been suspended.`
        );
      }
      
      setShopToSuspend(null);
    } catch (err) {
      console.error("Suspend/Activate failed:", err);
      const errorMessage = err.response?.data?.message || "Failed to update shop status";
      toast.error(
        "Action Failed",
        errorMessage
      );
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleModalClose = (shouldRefresh = false) => {
    setIsModalOpen(false);
    setSelectedShop(null);
    if (shouldRefresh) {
      onRefresh?.();
    }
  };

  // ============================================
  // BADGE COMPONENTS
  // ============================================
  const PlanBadge = ({ subscription }) => {
    if (!subscription || !subscription.name) {
      return (
        <span className={styles.badges.status.inactive}>
          None
        </span>
      );
    }

    const isExpired =
      !subscription.is_active ||
      subscription.status === "expired" ||
      (subscription.end_date && new Date(subscription.end_date) < new Date());

    return (
      <span className={isExpired ? styles.badges.status.inactive : styles.badges.status.active}>
        {subscription.name}
      </span>
    );
  };

  const VerificationBadge = ({ status }) => {
    const config = getVerificationStatusConfig(status);
    return (
      <span className={config.wrapper}>
        <span className={config.dot} />
        {config.label}
      </span>
    );
  };

  // ============================================
  // SORTABLE HEADER COMPONENT
  // ============================================
  const SortableHeader = ({ columnKey }) => {
    const column = COLUMNS[columnKey];
    const isActive = sortConfig?.sortBy === column.key;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th
        style={{ width: columnWidths[columnKey], minWidth: 50 }}
        className={`relative group ${column.align === 'center' ? 'text-center' : ''}`}
      >
        <div
          className={`flex items-center justify-between ${styles.header.cell} ${
            column.sortable ? "cursor-pointer select-none" : ""
          } ${column.align === 'center' ? 'justify-center' : ''}`}
          onClick={() => column.sortable && onSortChange?.(column.key)}
        >
          <span>{column.label}</span>
          {column.sortable && (
            <div className="flex flex-col gap-0.5 ml-1">
              <ChevronUp
                size={12}
                className={`transition-colors ${
                  isAsc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
              <ChevronDown
                size={12}
                className={`-mt-1 transition-colors ${
                  isDesc ? styles.header.sortIcon.active : styles.header.sortIcon.inactive
                }`}
              />
            </div>
          )}
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(columnKey, e)}
          className={styles.header.resizeHandle}
        />
      </th>
    );
  };

  // ============================================
  // NON-SORTABLE HEADER COMPONENT
  // ============================================
  const TableHeader = ({ columnKey }) => {
    const column = COLUMNS[columnKey];

    if (column.sortable) {
      return <SortableHeader columnKey={columnKey} />;
    }

    return (
      <th
        style={{ width: columnWidths[columnKey], minWidth: 50 }}
        className={`relative group ${column.align === 'center' ? 'text-center' : ''}`}
      >
        <div className={`${styles.header.cell} ${column.align === 'center' ? 'text-center' : ''}`}>
          {column.label}
        </div>
        {columnKey !== 'slNo' && (
          <div
            onMouseDown={(e) => handleMouseDown(columnKey, e)}
            className={styles.header.resizeHandle}
          />
        )}
      </th>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.container.wrapper}>
      {/* Table - Show when loading OR has data */}
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "850px" }}>
            {/* Table Header */}
            <thead className="sticky top-0 z-10">
              <tr className={styles.header.row}>
                <TableHeader columnKey="slNo" />
                <SortableHeader columnKey="businessName" />
                <SortableHeader columnKey="ownerName" />
                <SortableHeader columnKey="businessType" />
                <TableHeader columnKey="plan" />
                <TableHeader columnKey="verification" />
                <TableHeader columnKey="actions" />
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={Object.keys(COLUMNS).filter(k => k !== 'slNo' && k !== 'actions')}
                />
              ) : (
                shops.map((shop, index) => (
                  <tr
                    key={shop.shop_id}
                    onClick={() => handleRowClick(shop)}
                    className={getClickableRowClass(index, !shop.is_active)}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    {/* Serial Number */}
                    <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                      {startIndex + index + 1}
                    </td>

                    {/* Business Name */}
                    <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{shop.business_name}</span>
                        {!shop.is_active && (
                          <Ban size={14} className="text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Owner Name */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary} truncate`}>
                      {shop.owner?.name || shop.owner?.full_name || "N/A"}
                    </td>

                    {/* Business Type */}
                    <td className={`${styles.cell.base} ${styles.cell.secondary} truncate`}>
                      {shop.business_type || "N/A"}
                    </td>

                    {/* Plan */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <PlanBadge subscription={shop.subscription} />
                    </td>

                    {/* Verification */}
                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <VerificationBadge status={shop.verification_status} />
                    </td>

                    {/* Actions - NO EYE ICON (row click handles view) */}
                    <td className={styles.cell.base}>
                      <div className={styles.actions.container}>
                        {/* Edit Button */}
                        <button
                          onClick={(e) => handleEditClick(e, shop)}
                          className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                          title="Edit Shop"
                        >
                          <Pencil size={15} />
                        </button>

                        {/* Suspend/Activate Button */}
                        <button
                          onClick={(e) => handleSuspendClick(e, shop)}
                          className={`${styles.actions.button.base} ${
                            shop.is_active
                              ? styles.actions.button.suspend
                              : styles.actions.button.activate
                          }`}
                          title={shop.is_active ? "Suspend Shop" : "Activate Shop"}
                        >
                          {shop.is_active ? <Ban size={15} /> : <CheckCircle size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <TableEmptyState
          icon={Store}
          title="No shops found"
          subtitle="Try adjusting your search or filters"
        />
      )}

      {/* Pagination */}
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}

      {/* Shop Details Modal */}
      <ShopDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        shop={selectedShop}
        mode={modalMode}
      />

      {/* Suspend Confirm Dialog */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => {
          setShowSuspendConfirm(false);
          setShopToSuspend(null);
        }}
        onConfirm={handleSuspendConfirm}
        title={shopToSuspend?.is_active ? "Suspend Shop?" : "Activate Shop?"}
        message={
          shopToSuspend?.is_active
            ? `Are you sure you want to suspend "${shopToSuspend?.business_name}"? All users under this shop will lose access.`
            : `Are you sure you want to activate "${shopToSuspend?.business_name}"? Users will regain access.`
        }
        confirmText={shopToSuspend?.is_active ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={shopToSuspend?.is_active ? "warning" : "success"}
        loading={suspendLoading}
      />
    </div>
  );
};

export default ShopsTable;