// pharmacy-web/src/pages/sales/invoice/SalesInvoicePage.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/SalesInvoicePage.jsx

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import SalesTable from "./components/SalesTable";
import SalesInvoicePagination from "../../../components/common/Pagination";
import SalesInvoiceFilters from "./components/SalesInvoiceFilters";
import ViewSalesInvoiceModal from "./components/ViewSalesInvoiceModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/Toast";

import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import salesAPI from "../../../api/sales";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../../../store/useAuthStore";

import {
  FileText,
  Package,
  RefreshCw,
  Layers,
  Building2,
  Info,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// BRANCH CONTEXT BANNER
// ════════════════════════════════════════════════════════════════════════════

const BranchContextBanner = ({ isGlobalMode, branchName, itemCount }) => {
  if (isGlobalMode) {
    return (
      <div className="px-4 py-2 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Layers size={16} className="text-blue-500" />
          <span>
            Viewing invoices from <strong>All Branches</strong>
          </span>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
            Combined View
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <Info size={12} />
          <span>
            Creating new invoices requires selecting a specific branch
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-green-700">
        <Building2 size={16} className="text-green-500" />
        <span>
          Viewing invoices for{" "}
          <strong>{branchName || "Selected Branch"}</strong>
        </span>
        {itemCount > 0 && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
            {itemCount} invoices
          </span>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const SalesInvoicePage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);

  const isGlobalMode = branchContext.mode === "GLOBAL";
  const currentBranchName = branchContext.branch_name;

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasLoadedOnce = useRef(false);

  const prevBranchRef = useRef({
    mode: branchContext.mode,
    branch_id: branchContext.branch_id,
  });

  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    customerName: "",
    invoiceNumber: "",
    phone: "",
    fromDate: "",
    toDate: "",
    status: "",
    paymentStatus: "",
    paymentMode: "",
    branch: "",
    branchId: "",
  });

  /* ---------------- DATA STATE ---------------- */
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [isBranchSwitching, setIsBranchSwitching] = useState(false);

  /* ---------------- MODAL STATE ---------------- */
  const [openModal, setOpenModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState("view");

  /* ---------------- CONFIRMATION STATE ---------------- */
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  /* ---------------- DYNAMIC ROW COUNT ---------------- */
  const rowsPerPage = useDynamicRowCount();

  /* ---------------- LOAD INVOICES ---------------- */
  const loadInvoices = useCallback(
    async (showBranchSwitchingState = false) => {
      try {
        if (showBranchSwitchingState) {
          setIsBranchSwitching(true);
        } else {
          setIsLoading(true);
        }

        const params = {
          limit: rowsPerPage,
          offset: (currentPage - 1) * rowsPerPage,
          ...(filters.customerName && { customerName: filters.customerName }),
          ...(filters.invoiceNumber && {
            invoiceNumber: filters.invoiceNumber,
          }),
          ...(filters.status && { status: filters.status }),
          ...(filters.paymentStatus && {
            paymentStatus: filters.paymentStatus,
          }),
          ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
          ...(filters.fromDate && { startDate: filters.fromDate }),
          ...(filters.toDate && { endDate: filters.toDate }),
          ...(filters.branchId && { branchId: filters.branchId }),
        };

        const [invoicesResponse, statsResponse] = await Promise.all([
          salesAPI.getAll(params),
          salesAPI.getStats({
            startDate: filters.fromDate,
            endDate: filters.toDate,
          }),
        ]);

        setInvoices(invoicesResponse.data?.invoices || []);
        setTotalItems(invoicesResponse.data?.total || 0);
        setStats(statsResponse.data || null);

        if (!hasLoadedOnce.current) {
          hasLoadedOnce.current = true;
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error("Load invoices error:", error);
        toast.error(
          "Failed to load invoices",
          error.response?.data?.message || error.message,
        );
      } finally {
        setIsLoading(false);
        setIsBranchSwitching(false);
      }
    },
    [
      currentPage,
      rowsPerPage,
      filters,
      toast,
      branchContext.mode,
      branchContext.branch_id,
    ],
  );

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    const prevBranch = prevBranchRef.current;
    const branchChanged =
      prevBranch.mode !== branchContext.mode ||
      prevBranch.branch_id !== branchContext.branch_id;

    if (branchChanged) {
      prevBranchRef.current = {
        mode: branchContext.mode,
        branch_id: branchContext.branch_id,
      };

      if (currentPage !== 1) {
        setCurrentPage(1);
      }

      setInvoices([]);
      setStats(null);

      if (branchContext.mode === "GLOBAL") {
        toast.info(
          "Switched to All Branches",
          "Loading combined invoice data...",
        );
      } else if (branchContext.branch_name) {
        toast.info(
          "Branch Changed",
          `Loading invoices for ${branchContext.branch_name}...`,
        );
      }
    }
  }, [
    branchContext.mode,
    branchContext.branch_id,
    branchContext.branch_name,
    currentPage,
    toast,
  ]);

  /* ---------------- FILTER HANDLERS ---------------- */
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      customerName: "",
      invoiceNumber: "",
      phone: "",
      fromDate: "",
      toDate: "",
      status: "",
      paymentStatus: "",
      paymentMode: "",
      branch: "",
      branchId: "",
    });
    setCurrentPage(1);
  }, []);

  /* ---------------- REFRESH HANDLER ---------------- */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
    toast.success("Refreshed", "Invoice data updated");
  }, [loadInvoices, toast]);

  // ════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ════════════════════════════════════════════════════════════════════════

  const uniqueBranches = useMemo(() => {
    const branches = invoices
      .map((inv) => inv.branch?.branch_name)
      .filter(Boolean)
      .filter((b) => b !== "-" && b.trim() !== "");
    return [...new Set(branches)].sort();
  }, [invoices]);

  // ════════════════════════════════════════════════════════════════════════
  // MODAL HANDLERS
  // ════════════════════════════════════════════════════════════════════════

  const fetchInvoiceDetails = useCallback(
    async (invoiceId) => {
      try {
        setIsLoadingDetails(true);
        const response = await salesAPI.getById(invoiceId);
        if (response.success && response.data) return response.data;
        throw new Error(response.message || "Failed to fetch invoice details");
      } catch (error) {
        console.error("Failed to fetch invoice details:", error);
        toast.error(
          "Failed to load invoice details",
          error.response?.data?.message || error.message,
        );
        return null;
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [toast],
  );

  const handleRowClick = useCallback(
    async (invoice) => {
      const fullInvoice = await fetchInvoiceDetails(invoice.invoice_id);
      if (fullInvoice) {
        setSelectedInvoice(fullInvoice);
        setModalInitialMode("view");
        setOpenModal(true);
      }
    },
    [fetchInvoiceDetails],
  );

  const handleView = useCallback(
    async (invoice, event) => {
      event?.stopPropagation();
      const fullInvoice = await fetchInvoiceDetails(invoice.invoice_id);
      if (fullInvoice) {
        setSelectedInvoice(fullInvoice);
        setModalInitialMode("view");
        setOpenModal(true);
      }
    },
    [fetchInvoiceDetails],
  );

  const handleEdit = useCallback(
    async (invoice, event) => {
      if (event?.stopPropagation) event.stopPropagation();

      const invoiceId = invoice?.invoice_id || invoice?.id;
      const invoiceStatus = invoice?.status?.toUpperCase();
      const invoiceNumber = invoice?.invoice_number;

      if (!invoiceId) {
        toast.error("Error", "Invalid invoice data");
        return;
      }

      if (invoiceStatus === "CANCELLED") {
        toast.warning("Cannot Edit", "Cancelled invoices cannot be edited.");
        return;
      }

      if (invoiceStatus === "DRAFT" || invoiceStatus === "PARKED") {
        const fullInvoice = await fetchInvoiceDetails(invoiceId);
        if (fullInvoice) {
          setSelectedInvoice(fullInvoice);
          setModalInitialMode("edit");
          setOpenModal(true);
        }
        return;
      }

      if (invoiceStatus === "CONFIRMED") {
        if (!isSuperAdmin) {
          toast.warning(
            "Permission Denied",
            "Only Super Admin can edit confirmed invoices.",
          );
          return;
        }

        setConfirmDialog({
          isOpen: true,
          type: "warning",
          title: "Edit Confirmed Invoice",
          message: (
            <div className="space-y-3">
              <p className="font-medium text-amber-800">
                You are about to edit a <strong>CONFIRMED</strong> invoice as
                Super Admin.
              </p>
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
                <p className="font-semibold text-gray-900">
                  Invoice: {invoiceNumber}
                </p>
                <p className="text-gray-600">
                  Customer: {invoice.customer?.name || "Walk-in"}
                </p>
                <p className="text-gray-600">
                  Amount: ₹
                  {parseFloat(invoice.net_amount || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Important Warning:
                </p>
                <ul className="text-xs text-red-700 mt-1 list-disc list-inside space-y-1">
                  <li>
                    Current stock will be <strong>restored</strong>{" "}
                    automatically
                  </li>
                  <li>New stock will be deducted after saving changes</li>
                  <li>All changes are logged in audit trail</li>
                </ul>
              </div>
            </div>
          ),
          confirmText: "Proceed to Edit",
          onConfirm: async () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

            const fullInvoice = await fetchInvoiceDetails(invoiceId);
            if (fullInvoice) {
              setSelectedInvoice(fullInvoice);
              setModalInitialMode("edit");
              setOpenModal(true);
            }
          },
        });
        return;
      }

      toast.warning(
        "Cannot Edit",
        `Invoice ${invoiceNumber} has status "${invoiceStatus}" and cannot be edited.`,
      );
    },
    [toast, isSuperAdmin, fetchInvoiceDetails],
  );

  const handleDelete = useCallback(
    (invoice, event) => {
      if (event?.stopPropagation) event.stopPropagation();

      const invoiceId = invoice?.invoice_id || invoice?.id;
      const invoiceStatus = invoice?.status?.toUpperCase();
      const invoiceNumber = invoice?.invoice_number;

      if (!invoiceId) {
        toast.error("Error", "Invalid invoice data");
        return;
      }

      if (invoiceStatus === "CONFIRMED") {
        toast.warning("Cannot Delete", "Confirmed invoices cannot be deleted.");
        return;
      }

      setOpenModal(false);
      setSelectedInvoice(null);

      setConfirmDialog({
        isOpen: true,
        type: "danger",
        title: "Delete Sales Invoice",
        message: (
          <div className="space-y-2">
            <p>Are you sure you want to delete this invoice?</p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <p className="text-gray-600">
                Customer: {invoice.customer?.name || "Walk-in"}
              </p>
              <p className="text-gray-600">
                Amount: ₹
                {parseFloat(invoice.net_amount || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </div>
        ),
        confirmText: "Delete Invoice",
        onConfirm: async () => {
          try {
            await salesAPI.cancel(invoiceId, "Deleted by user");
            toast.success(
              "Invoice Deleted",
              `Invoice ${invoiceNumber} has been deleted.`,
            );
            loadInvoices();
          } catch (error) {
            toast.error(
              "Delete Failed",
              error.response?.data?.message || error.message,
            );
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    },
    [toast, loadInvoices],
  );

  const handlePrint = useCallback(
    async (invoice) => {
      window.print();
      toast.info("Print Dialog", "Print dialog opened.");
    },
    [toast],
  );

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedInvoice(null);
    setModalInitialMode("view");
  }, []);

  const isTableLoading = (isInitialLoad && isLoading) || isBranchSwitching;

  /* ════════════════════════════════════════════════════════════════════════ */
  /* UI                                                                        */
  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-sans bg-gray-50 p-2">
      {/* FIXED HEADER SECTION */}
      <div className="shrink-0 flex flex-col gap-2">
        {/* BRANCH CONTEXT BANNER */}
        {isSuperAdmin && (
          <BranchContextBanner
            isGlobalMode={isGlobalMode}
            branchName={currentBranchName}
            itemCount={totalItems}
          />
        )}

        {/* PAGE HEADER */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Sales Invoices
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                View and manage all sales invoices
                {isSuperAdmin && (
                  <span className="ml-2 text-amber-600 font-medium">
                    • Super Admin Mode
                  </span>
                )}
                {isGlobalMode && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • Viewing All Branches
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing || isLoading || isBranchSwitching}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing || isLoading || isBranchSwitching
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/erp/sales-billing")}
                disabled={isGlobalMode}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                  isGlobalMode
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#000060] text-white hover:bg-[#000060]/90"
                }`}
                title={
                  isGlobalMode
                    ? "Select a specific branch to create new sale"
                    : "Create new sale"
                }
              >
                + New Sale
              </button>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <SalesInvoiceFilters
          filters={filters}
          onChange={handleFilterChange}
          onSearch={loadInvoices}
          onReset={handleResetFilters}
          branches={uniqueBranches}
          showBranchFilter={isGlobalMode}
          disabled={isBranchSwitching}
        />
      </div>

      {/* SCROLLABLE TABLE SECTION */}
      <div className="flex-1 min-h-0 mt-2 relative">
        {/* Loading overlay for detail fetch */}
        {isLoadingDetails && (
          <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">
                Loading invoice details...
              </span>
            </div>
          </div>
        )}

        {/* Branch switching overlay */}
        {isBranchSwitching && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="w-10 h-10 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Switching Branch
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Loading invoices for{" "}
                  {isGlobalMode ? "all branches" : currentBranchName}...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TABLE */}
        <SalesTable
          invoices={invoices}
          onRowClick={handleRowClick}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          isLoading={isTableLoading}
          isSearching={isLoading && !isInitialLoad && !isBranchSwitching}
          isSuperAdmin={isSuperAdmin}
          showBranchColumn={isGlobalMode}
        >
          <SalesInvoicePagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </SalesTable>
      </div>

      {/* MODAL */}
      <ViewSalesInvoiceModal
        open={openModal}
        invoice={selectedInvoice}
        onClose={handleCloseModal}
        onPrint={handlePrint}
        onDelete={handleDelete}
        onRefresh={loadInvoices}
        isSuperAdmin={isSuperAdmin}
        initialMode={modalInitialMode}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type={confirmDialog.type}
      />
    </div>
  );
};

export default SalesInvoicePage;
