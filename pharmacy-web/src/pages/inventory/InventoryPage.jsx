// pharmacy-web/src/pages/inventory/InventoryPage.jsx (do not remove this comment)
// src/pages/inventory/InventoryPage.jsx

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useToast }          from "../../components/common/Toast";
import { useInventoryData }  from "../../hooks/inventory/useInventoryData";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../../store/useAuthStore";
import ImportHistoryDrawer   from "./components/import/ImportHistoryDrawer";
import ImportLogsPanel       from "./components/import/ImportLogsPanel";
import InventoryImportModal  from "./components/InventoryImportModal";
import InventoryFilters      from "./components/InventoryFilters";
import InventoryTable        from "./components/InventoryTable";
import ViewInventoryModal    from "./components/ViewInventoryModal";
import StockAdjustmentModal  from "./components/StockAdjustmentModal";
import ConfirmDialog         from "../../components/common/ConfirmDialog";
import AddInventoryModal     from "./components/AddInventoryModal";
import ResubmitForReviewModal from "./components/ResubmitForReviewModal";
import inventoryAPI          from "../../api/inventory";
import suppliersAPI          from "../../api/suppliers";
import useDynamicRowCount    from "../../hooks/useDynamicRowCount";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  Info,
  X,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const safeString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.branch_name   ||
      value.name          ||
      value.supplier_name ||
      value.medicine_name ||
      ""
    );
  }
  return String(value);
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SkeletonSummaryCard = ({ delay = 0 }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
    <div
      className="p-2 rounded-lg bg-slate-200 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-[18px] h-[18px]" />
    </div>
    <div className="flex-1">
      <div
        className="w-16 h-2.5 bg-slate-200 rounded animate-pulse mb-1.5"
        style={{ animationDelay: `${delay + 50}ms` }}
      />
      <div
        className="w-12 h-5 bg-slate-200 rounded animate-pulse"
        style={{ animationDelay: `${delay + 100}ms` }}
      />
    </div>
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, color, suffix }) => {
  const colorClasses = {
    blue:   "bg-blue-50   border-blue-200   text-blue-700",
    green:  "bg-green-50  border-green-200  text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red:    "bg-red-50    border-red-200    text-red-700",
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="p-2 rounded-lg bg-white/60">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
          {label}
        </p>
        <p className="text-lg font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix && <span className="text-xs font-normal ml-1">{suffix}</span>}
        </p>
      </div>
    </div>
  );
};

const BranchContextBanner = ({ isGlobalMode, branchName, itemCount }) => {
  if (isGlobalMode) {
    return (
      <div className="shrink-0 px-4 py-2.5 flex items-center justify-between
                      bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Layers size={16} className="text-blue-500" />
          <span>
            Viewing inventory from <strong>All Branches</strong>
          </span>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            Combined View
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Info size={12} />
          <span>Stock adjustments require selecting a specific branch</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-4 py-2.5 flex items-center justify-between
                    bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
      <div className="flex items-center gap-2 text-sm text-green-700">
        <Building2 size={16} className="text-green-500" />
        <span>
          Viewing inventory for{" "}
          <strong>{branchName || "Selected Branch"}</strong>
        </span>
        {itemCount > 0 && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5
                           rounded-full font-medium">
            {itemCount} items
          </span>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const InventoryPage = () => {
  const toast         = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin  = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode  = branchContext.mode === "GLOBAL";
  const canAdjustStock =
    branchContext.mode === "BRANCH" && !!branchContext.branch_id;

  const visibleRows = useDynamicRowCount();

  const {
    medicines,
    total,
    loading,
    fetchInventory,
    fetchStats,
    deleteMedicine,
    catalogLinkStatus,
    catalogStatusLoading,
    refreshCatalogStatus,
    stats,
    statsLoading,
    resubmitEligibleCount, 
    fetchResubmitCount, 
  } = useInventoryData();
  
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasLoadedOnce = useRef(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    search:         "",
    status:         "",
    expiry:         "",
    supplier:       "",
    category:       "",
    branchId:       "",
    catalogStatus:  "", 
    includeExpired: false,
    lowStock:       false,
    expiredOnly:    false,
  });

  // Dynamic filter lists
  const [suppliers, setSuppliers]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches]     = useState([]);

  const [sortConfig, setSortConfig] = useState({ sortBy: null, order: null });

  const [openModal,             setOpenModal]             = useState(false);
  const [selectedItem,          setSelectedItem]          = useState(null);
  const [modalMode,             setModalMode]             = useState("view");
  const [confirmDelete,         setConfirmDelete]         = useState(null);
  const [adjustmentModal,       setAdjustmentModal]       = useState(false);
  const [adjustmentItem,        setAdjustmentItem]        = useState(null);
  const [refreshing,            setRefreshing]            = useState(false);
  const [deleting,              setDeleting]              = useState(false);
  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  const [importModalOpen,       setImportModalOpen]       = useState(false);
  const [historyDrawerOpen,     setHistoryDrawerOpen]     = useState(false);
  const [logsPanelOpen,         setLogsPanelOpen]         = useState(false);

  // Export / Reset states
  const [resetModalOpen,   setResetModalOpen]   = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting,      setIsResetting]      = useState(false);
  const [isExporting,      setIsExporting]      = useState(false);

  // ── Load Facets Metadata ──────────────────────────────────────────────────

  const loadFacets = useCallback(async () => {
    try {
      const res = await inventoryAPI.getFacets();
      if (res?.success && res.data) {
        setCategories(res.data.categories || []);
        setBranches(res.data.branches || []);
      }
    } catch (error) {
      console.error("Failed to load metadata facets:", error);
    }
  }, []);

  const loadSuppliersList = useCallback(async () => {
    try {
      const res = await suppliersAPI.getAll({ limit: 1000 });
      let supplierList = [];
      if (res?.success && Array.isArray(res.data)) {
        supplierList = res.data;
      } else if (Array.isArray(res)) {
        supplierList = res;
      }
      setSuppliers(supplierList.map((s) => s.name).filter(Boolean));
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    }
  }, []);

  useEffect(() => {
    loadFacets();
    loadSuppliersList();
    fetchResubmitCount();
  }, [loadFacets, loadSuppliersList, branchContext.branch_id, branchContext.mode]);

  // ── Build API filters ─────────────────────────────────────────────────────

  const buildApiFilters = useCallback((page = 1) => {
    const apiFilters = {
      limit:  visibleRows,
      offset: (page - 1) * visibleRows,
    };

    if (filters.search)         apiFilters.search         = filters.search;
    if (filters.includeExpired) apiFilters.includeExpired = true;
    if (filters.lowStock)       apiFilters.lowStock       = true;
    if (filters.expiredOnly)    apiFilters.expiredOnly    = true;

    if (filters.status)         apiFilters.status         = filters.status;
    if (filters.expiry)         apiFilters.expiry         = filters.expiry;
    if (filters.supplier)       apiFilters.supplier       = filters.supplier;
    if (filters.category)       apiFilters.category       = filters.category;
    if (filters.catalogStatus)  apiFilters.catalogStatus  = filters.catalogStatus;

    if (!isGlobalMode && branchContext.branch_id) {
      apiFilters.branchId = branchContext.branch_id;
    }
    if (filters.branchId) {
      apiFilters.branchId = filters.branchId;
    }
    if (sortConfig.sortBy) {
      apiFilters.sortBy    = sortConfig.sortBy;
      apiFilters.sortOrder = sortConfig.order;
    }

    return apiFilters;
  }, [
    filters.search,
    filters.status,
    filters.expiry,
    filters.supplier,
    filters.category,
    filters.catalogStatus,
    filters.includeExpired,
    filters.lowStock,
    filters.expiredOnly,
    filters.branchId,
    sortConfig.sortBy,
    sortConfig.order,
    isGlobalMode,
    branchContext.branch_id,
    visibleRows,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddMedicine = useCallback(() => {
    if (isGlobalMode) {
      toast.warning("Branch Required", "Please select a specific branch to add medicines");
      return;
    }
    setAddInventoryModalOpen(true);
  }, [isGlobalMode, toast]);

  const handleAddInventorySave = useCallback(
    async (data) => {
      try {
        await inventoryAPI.createWithMedicine(data);
        toast.success("Medicine Added", `${data.name} has been added to inventory successfully.`);
        setAddInventoryModalOpen(false);
        setCurrentPage(1);
        await fetchInventory(buildApiFilters(1));
        await fetchStats();
        await loadFacets();
      } catch (error) {
        console.error("Add inventory error:", error);
        throw error;
      }
    },
    [toast, fetchInventory, fetchStats, loadFacets, buildApiFilters]
  );

  const handleImportSuccess = useCallback(async () => {
    setCurrentPage(1);
    await fetchInventory(buildApiFilters(1));
    await fetchStats();
    await refreshCatalogStatus();
    await loadFacets();
    toast.success("Import Complete", "Inventory has been updated.");
  }, [fetchInventory, fetchStats, refreshCatalogStatus, loadFacets, buildApiFilters, toast]);

  const handleExportInventory = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await inventoryAPI.exportInventory();
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `Inventory_Backup_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Export Complete", "Inventory backup downloaded successfully.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export Failed", error.message || "Failed to export inventory.");
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const handleResetInventory = useCallback(async () => {
    if (resetConfirmText !== "RESET") return;

    setIsResetting(true);
    try {
      await handleExportInventory();
      const response = await inventoryAPI.resetInventory();

      if (response?.success) {
        toast.success(
          "Inventory Cleared",
          `${response.data?.deactivatedCount || 0} items deactivated. Backup downloaded.`,
        );
        setResetModalOpen(false);
        setResetConfirmText("");

        setCurrentPage(1);
        await Promise.all([
          fetchInventory(buildApiFilters(1)),
          fetchStats(),
          loadFacets(),
        ]);
      }
    } catch (error) {
      console.error("Reset error:", error);
      toast.error(
        "Reset Failed",
        error.response?.data?.message || error.message || "Failed to reset inventory.",
      );
    } finally {
      setIsResetting(false);
    }
  }, [
    resetConfirmText,
    handleExportInventory,
    toast,
    fetchInventory,
    fetchStats,
    loadFacets,
    buildApiFilters,
  ]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((column) => {
    setSortConfig((prev) => {
      if (prev.sortBy !== column) return { sortBy: column, order: "asc" };
      if (prev.order === "asc")   return { sortBy: column, order: "desc" };
      return { sortBy: null, order: null };
    });
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setCurrentPage(1);
      await Promise.all([
        fetchInventory(buildApiFilters(1)),
        fetchStats(),
        refreshCatalogStatus(),
        loadFacets(),
        loadSuppliersList(),
        fetchResubmitCount(),
      ]);
      toast.success("Refreshed", "Inventory data updated");
    } catch (error) {
      toast.error("Refresh Failed", error.message || "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleResubmitTrigger = useCallback(() => {
    if (isGlobalMode) {
      toast.warning("Branch Required", "Please select a specific branch to resubmit items");
      return;
    }
    setResubmitModalOpen(true);
  }, [isGlobalMode, toast]);

  const handleView = (row) => {
    setSelectedItem(row);
    setModalMode("view");
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    if (!canAdjustStock) {
      toast.warning("Branch Required", "Please select a specific branch to edit items");
      return;
    }
    setSelectedItem(row);
    setModalMode("edit");
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    if (!canAdjustStock) {
      toast.warning("Branch Required", "Please select a specific branch to delete items");
      return;
    }
    setConfirmDelete(row);
  };

  const handleStockAdjustment = (row) => {
    if (!canAdjustStock) {
      toast.warning("Branch Required", "Please select a specific branch to make stock adjustments");
      return;
    }
    setAdjustmentItem(row);
    setOpenModal(false);
    setAdjustmentModal(true);
  };

  const handleEditSave = async (editedItem) => {
    try {
      await inventoryAPI.update(editedItem.inventory_id, editedItem);
      toast.success("Item Updated", "All changes have been saved successfully.");
      setOpenModal(false);
      setSelectedItem(null);
      await fetchInventory(buildApiFilters(currentPage));
      await loadFacets();
    } catch (error) {
      console.error("Failed to save inventory item:", error);
      toast.error(
        "Save Failed",
        error.response?.data?.message || error.message || "Failed to update inventory item"
      );
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteMedicine(confirmDelete.inventory_id);
      toast.success(
        "Item Deleted",
        `${confirmDelete.name || confirmDelete.medicine_name} has been removed from inventory.`
      );
      setConfirmDelete(null);
      const newTotal = total - 1;
      const maxPage  = Math.max(1, Math.ceil(newTotal / visibleRows));
      const safePage = Math.min(currentPage, maxPage);
      setCurrentPage(safePage);
      await fetchInventory(buildApiFilters(safePage));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete Failed", error.message || "An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const handleAdjustmentSubmit = async (adjustmentData) => {
    try {
      await inventoryAPI.createAdjustment({
        inventoryId:  adjustmentItem.inventory_id,
        medicineId:   adjustmentItem.medicine_id,
        shopId:       adjustmentItem.shop_id,
        branchId:
          adjustmentItem.branch_id ||
          (typeof adjustmentItem.branch === "object"
            ? adjustmentItem.branch?.branch_id
            : null),
        batchNumber:  adjustmentItem.batch_number || adjustmentItem.batch || null,
        newQuantity:  adjustmentData.newQuantity,
        reason:       adjustmentData.reason,
        reasonNotes:  adjustmentData.reasonNotes,
      });

      toast.success("Stock Adjusted", "Stock adjustment created successfully.");
      setAdjustmentModal(false);
      setAdjustmentItem(null);
      setSelectedItem(null);
      await Promise.all([
        fetchInventory(buildApiFilters(currentPage)),
        fetchStats(),
      ]);
    } catch (error) {
      console.error("Adjustment error:", error);
      toast.error(
        "Adjustment Failed",
        error.response?.data?.message || error.message || "Failed to adjust stock"
      );
      throw error;
    }
  };

  // ── Fetch effect ──────────────────────────────────────────────────────────

  useEffect(() => {
    const delay   = filters.search ? 300 : 0;
    const timeout = setTimeout(() => {
      fetchInventory(buildApiFilters(currentPage))
        .then(() => {
          if (!hasLoadedOnce.current) {
            hasLoadedOnce.current = true;
            setIsInitialLoad(false);
          }
        })
        .catch(() => {
          if (!hasLoadedOnce.current) {
            hasLoadedOnce.current = true;
            setIsInitialLoad(false);
          }
        });
    }, delay);

    return () => clearTimeout(timeout);
  }, [
    filters.search,
    filters.status,
    filters.expiry,
    filters.supplier,
    filters.category,
    filters.catalogStatus,
    filters.branchId,
    filters.includeExpired,
    filters.lowStock,
    filters.expiredOnly,
    sortConfig.sortBy,
    sortConfig.order,
    currentPage,
    visibleRows,
    buildApiFilters,
    fetchInventory,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, branchContext.branch_id, branchContext.mode]);

  useEffect(() => {
    if (Array.isArray(medicines) && medicines.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
      hasLoadedOnce.current = true;
    }
  }, [medicines, isInitialLoad]);

  const isSummaryLoading = statsLoading && isInitialLoad;
  const isTableLoading   = loading && !isInitialLoad;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50">

      {isSuperAdmin && (
        <BranchContextBanner
          isGlobalMode={isGlobalMode}
          branchName={branchContext.branch_name}
          itemCount={total}
        />
      )}

      {/* Summary cards */}
      <div className="shrink-0 p-4 pb-3">
        <div className="grid grid-cols-5 gap-3">
          {isSummaryLoading ? (
            <>
              <SkeletonSummaryCard delay={0}   />
              <SkeletonSummaryCard delay={50}  />
              <SkeletonSummaryCard delay={100} />
              <SkeletonSummaryCard delay={150} />
              <SkeletonSummaryCard delay={200} />
            </>
          ) : (
            <>
              <SummaryCard icon={Package}       label="Total Items"   value={stats.totalItems}   color="blue"   />
              <SummaryCard icon={Package}       label="Total Stock"   value={stats.totalStock}   color="green"  suffix="units" />
              <SummaryCard icon={TrendingDown}  label="Low Stock"     value={stats.lowStock}     color="yellow" />
              <SummaryCard icon={Clock}         label="Expiring Soon" value={stats.expiringSoon} color="orange" />
              <SummaryCard icon={AlertTriangle} label="Expired"       value={stats.expired}      color="red"    />
            </>
          )}
        </div>
      </div>

      {/* Filters (Wrapper styled with high stacking order) */}
      <div className="shrink-0 px-4 pb-3 relative z-30">
        <InventoryFilters
          filters={filters}
          onChange={handleFilterChange}
          suppliers={suppliers}
          categories={categories}
          branches={branches}
          showBranchFilter={isGlobalMode}
          onAddMedicine={handleAddMedicine}
          onRefresh={handleRefresh}
          isRefreshing={refreshing || loading}
          totalItems={total}
          onImport={() => setImportModalOpen(true)}
          onImportHistory={() => setHistoryDrawerOpen(true)}
          onImportLogs={() => setLogsPanelOpen(true)}
          onExport={handleExportInventory}
          onReset={() => setResetModalOpen(true)}
          onResubmit={handleResubmitTrigger} 
          resubmitEligibleCount={resubmitEligibleCount} 
          isExporting={isExporting}
          canReset={canAdjustStock}
          canExport={canAdjustStock}
        />
      </div>
            {/* Resubmit Catalog Review Modal */}
      <ResubmitForReviewModal
        open={resubmitModalOpen}
        onClose={() => setResubmitModalOpen(false)}
        branchId={branchContext.branch_id}
        onComplete={async () => {
          await Promise.all([
            fetchInventory(buildApiFilters(currentPage)),
            fetchResubmitCount()
          ]);
        }}
      />

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4">
        <InventoryTable
          items={medicines}
          totalItems={total}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          rowsPerPage={visibleRows}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={handleStockAdjustment}
          isLoading={isInitialLoad && loading}
          isSearching={isTableLoading}
          showBranchColumn={isGlobalMode}
          canAdjustStock={canAdjustStock}
          catalogLinkStatus={catalogLinkStatus}
          catalogStatusLoading={catalogStatusLoading}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
        />
      </div>

      {/* View/Edit Modal */}
      <ViewInventoryModal
        open={openModal}
        item={selectedItem}
        mode={modalMode}
        onClose={() => { setOpenModal(false); setSelectedItem(null); }}
        onSave={handleEditSave}
        onDelete={handleDelete}
        onAdjust={async (item, adjustmentData) => {
          if (adjustmentData) {
            try {
              await inventoryAPI.createAdjustment({
                inventoryId:  item.inventory_id,
                medicineId:   item.medicine_id,
                shopId:       item.shop_id,
                branchId:
                  item.branch_id ||
                  (typeof item.branch === "object" ? item.branch?.branch_id : null),
                batchNumber:  item.batch_number || item.batch || null,
                newQuantity:  adjustmentData.newQuantity,
                reason:       adjustmentData.reason,
                reasonNotes:  adjustmentData.reasonNotes,
              });
              toast.success("Stock Adjusted", "Stock adjustment saved successfully.");
              setOpenModal(false);
              setSelectedItem(null);
              await Promise.all([
                fetchInventory(buildApiFilters(currentPage)),
                fetchStats(),
              ]);
            } catch (error) {
              console.error("Inline adjustment error:", error);
              throw error;
            }
          } else {
            handleStockAdjustment(item);
          }
        }}
        canAdjustStock={canAdjustStock}
      />

      {/* Stock Adjustment Modal */}
      {adjustmentModal && adjustmentItem && (
        <StockAdjustmentModal
          open={adjustmentModal}
          item={adjustmentItem}
          onClose={() => {
            setAdjustmentModal(false);
            setAdjustmentItem(null);
            setSelectedItem(null);
          }}
          onSubmit={handleAdjustmentSubmit}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        message={
          confirmDelete ? (
            <div className="space-y-2">
              <p>Are you sure you want to delete this inventory item?</p>
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <p><strong>Item:</strong> {confirmDelete.name || confirmDelete.medicine_name}</p>
                <p><strong>Batch:</strong> {confirmDelete.batch || confirmDelete.batch_number || "-"}</p>
                <p><strong>Current Stock:</strong> {confirmDelete.qty || confirmDelete.current_stock || 0} units</p>
              </div>
              {Number(confirmDelete.qty || confirmDelete.current_stock || 0) > 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border
                                border-amber-200 rounded-lg text-amber-700 text-xs">
                  <AlertTriangle size={14} />
                  <span>Items with stock cannot be deleted. Reduce stock to zero first.</span>
                </div>
              )}
            </div>
          ) : (
            "Are you sure you want to delete this item?"
          )
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        confirmDisabled={
          deleting ||
          Number(confirmDelete?.qty || confirmDelete?.current_stock || 0) > 0
        }
        type="danger"
      />

      {/* Add Inventory Modal */}
      <AddInventoryModal
        open={addInventoryModalOpen}
        onClose={() => setAddInventoryModalOpen(false)}
        onSave={handleAddInventorySave}
      />

      {/* Import Modal */}
      <InventoryImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* History Drawer */}
      <ImportHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
      />

      {/* Import Logs Panel */}
      <ImportLogsPanel
        open={logsPanelOpen}
        onClose={() => setLogsPanelOpen(false)}
      />

      {/* Reset Inventory Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isResetting) {
                setResetModalOpen(false);
                setResetConfirmText("");
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <button
              onClick={() => { setResetModalOpen(false); setResetConfirmText(""); }}
              disabled={isResetting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Reset All Inventory?
            </h3>

            <div className="space-y-3 mb-5">
              <p className="text-sm text-slate-600">
                This will <strong>deactivate all {total} inventory items</strong> for{" "}
                <strong>{branchContext.branch_name || "this branch"}</strong>.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                <strong>✓ Auto-Backup:</strong> A backup Excel file will be downloaded
                automatically before the reset.
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>⚠ Not a permanent delete:</strong> Historical records and stock
                ledger entries are preserved. This can be reversed by your admin.
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 font-medium mb-2">
                  Type <code className="bg-red-100 px-1.5 py-0.5 rounded font-bold">RESET</code> to confirm:
                </p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Type RESET here"
                  disabled={isResetting}
                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
                             placeholder:text-red-300 disabled:opacity-50"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setResetModalOpen(false); setResetConfirmText(""); }}
                disabled={isResetting}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                           border border-slate-300 text-slate-700 hover:bg-slate-50
                           transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetInventory}
                disabled={resetConfirmText !== "RESET" || isResetting}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                           bg-red-600 text-white hover:bg-red-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? "Resetting..." : "Backup & Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryPage;