// cadmin-web/src/pages/shops-management/comps/ShopsTable.jsx (do not remove this comment)

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Pencil,
  ChevronUp,
  ChevronDown,
  Ban,
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

  // Strict Filter: Only show active shops in table
  const activeShops = useMemo(() => {
    return shops.filter((shop) => shop.is_active === true || shop.is_active === "true" || shop.is_active === undefined);
  }, [shops]);

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

  // Column Resizing Handlers
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

  // Computed Values
  const startIndex = (currentPage - 1) * rowsPerPage;
  const hasData = activeShops && activeShops.length > 0;
  const showTable = loading || hasData;
  const showEmptyState = !loading && !hasData;
  const showPagination = !loading && hasData;

  const handleRowClick = (shop) => {
    setSelectedShop(shop);
    setModalMode("view");
    setIsModalOpen(true);
  };

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
      await toggleShopActive(shopToSuspend.shop_id, false);
      onShopUpdate?.(shopToSuspend.shop_id, { is_active: false });
      setShowSuspendConfirm(false);
      setShopToSuspend(null);
    } catch (err) {
      console.error("Suspend failed:", err);
      const errorMessage = err.response?.data?.message || "Failed to suspend shop";
      toast.error("Action Failed", errorMessage);
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

  const PlanBadge = ({ subscription }) => {
    if (!subscription || !subscription.name) {
      return <span className={styles.badges.status.inactive}>None</span>;
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

  return (
    <div className={styles.container.wrapper}>
      {showTable && (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-sm" style={{ minWidth: "850px" }}>
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

            <tbody>
              {loading ? (
                <TableSkeleton
                  rows={rowsPerPage}
                  columns={Object.keys(COLUMNS).filter(k => k !== 'slNo' && k !== 'actions')}
                />
              ) : (
                activeShops.map((shop, index) => (
                  <tr
                    key={shop.shop_id}
                    onClick={() => handleRowClick(shop)}
                    className={getClickableRowClass(index, false)}
                    style={{ height: `${heights.bodyRow}px` }}
                  >
                    <td className={`${styles.cell.base} ${styles.cell.muted} font-medium`}>
                      {startIndex + index + 1}
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.primary}`}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{shop.business_name}</span>
                      </div>
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.secondary} truncate`}>
                      {shop.owner?.name || shop.owner?.full_name || "N/A"}
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.secondary} truncate`}>
                      {shop.business_type || "N/A"}
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <PlanBadge subscription={shop.subscription} />
                    </td>

                    <td className={`${styles.cell.base} ${styles.cell.center}`}>
                      <VerificationBadge status={shop.verification_status} />
                    </td>

                    <td className={styles.cell.base}>
                      <div className={styles.actions.container}>
                        <button
                          onClick={(e) => handleEditClick(e, shop)}
                          className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                          title="Edit Shop"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={(e) => handleSuspendClick(e, shop)}
                          className={`${styles.actions.button.base} ${styles.actions.button.suspend}`}
                          title="Suspend Shop"
                        >
                          <Ban size={15} />
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

      {showEmptyState && (
        <TableEmptyState
          icon={Store}
          title="No active shops found"
          subtitle="Try adjusting your search or filters"
        />
      )}

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}

      <ShopDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        shop={selectedShop}
        mode={modalMode}
      />

      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => {
          setShowSuspendConfirm(false);
          setShopToSuspend(null);
        }}
        onConfirm={handleSuspendConfirm}
        title="Suspend Shop?"
        message={`Are you sure you want to suspend "${shopToSuspend?.business_name}"? All users under this shop will lose access and it will be removed from the active list.`}
        confirmText="Suspend"
        cancelText="Cancel"
        type="warning"
        loading={suspendLoading}
      />
    </div>
  );
};

export default ShopsTable;