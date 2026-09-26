// pharmacy-web/src/pages/purchase/billing/PurchasePage.jsx (do not remove this comment)
// src/pages/purchase/billing/PurchasePage.jsx

import { useRef, useCallback, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Building2,
  Plus,
  FileSpreadsheet,
  Loader2 as SpinnerIcon,
} from "lucide-react";

// Components
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";
import PurchaseInvoicePrint from "./components/PurchaseInvoicePrint";
import SupplierModal from "../../suppliers/components/SupplierModal";
import ProductMasterModal from "../../../components/common/ProductMasterModal";
import BatchProductModal from "../../../components/common/BatchProductModal";
import ImportResultModal from "../../../components/common/ImportResultModal";

// Hooks
import {
  usePurchaseCalculation,
  calculateRow,
} from "../../../hooks/purchase/usePurchaseCalculation";
import { useResponsiveRowCount } from "../../../hooks/purchase/useResponsiveRowCount";
import { usePurchaseRows } from "../../../hooks/purchase/usePurchaseRows";
import { usePurchaseImportExport } from "../../../hooks/purchase/usePurchaseImportExport";
import { usePurchaseSupplier } from "../../../hooks/purchase/usePurchaseSupplier";
import {
  usePurchaseAPI,
  parsePackSizeMultiplier,
} from "../../../hooks/purchase/usePurchaseAPI";
import { useToast } from "../../../components/common/Toast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useAuthStore, selectBranchContext } from "../../../store/useAuthStore";

// ── NEW: Real shop details hook ──
import { useShopDetails } from "../../../hooks/useShopDetails";

// Styles
import "../../../styles/print.css";

const PurchasePage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("mode");
  const isEditingConfirmed = editMode === "edit-confirmed";
  const isEditMode = !!invoiceId;

  const printRef = useRef(null);
  const shouldResetAfterPrint = useRef(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // ============================================
  // AUTH & BRANCH CONTEXT
  // ============================================
  const branchContext = useAuthStore(selectBranchContext);
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";

  const billedByName =
    user?.name ||
    user?.full_name ||
    user?.first_name ||
    user?.username ||
    "Staff";

  // ============================================
  // SHOP DETAILS (replaces COMPANY_DETAILS)
  // ============================================
  const {
    companyDetails,
    isLoading: shopDetailsLoading,
    error: shopError,
  } = useShopDetails(user?.shop_id);

  // ============================================
  // API INTEGRATION
  // ============================================
  const {
    isLoading: apiLoading,
    medicines,
    suppliers,
    currentInvoice,
    loadMedicines,
    loadSuppliers,
    searchMedicines,
    getExistingBatches,
    createMedicine,
    bulkCreateMedicines,
    createSupplier,
    savePurchaseInvoice,
    confirmPurchaseInvoice,
    loadInvoiceForEdit,
    resetInvoice,
  } = usePurchaseAPI();

  // ============================================
  // MODAL STATES
  // ============================================
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [batchProductModalOpen, setBatchProductModalOpen] = useState(false);
  const [pendingProductData, setPendingProductData] = useState(null);
  const [newProductsFromImport, setNewProductsFromImport] = useState([]);
  const [importResultModalOpen, setImportResultModalOpen] = useState(false);
  const [importCatalogResults, setImportCatalogResults] = useState(null);
  const [importNewProducts, setImportNewProducts] = useState([]);
  const [importProgress, setImportProgress] = useState(null);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  // ============================================
  // LOADING STATES
  // ============================================
  const [loadingStates, setLoadingStates] = useState({
    header: true,
    table: true,
    supplier: true,
    summary: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const [originalInvoiceData, setOriginalInvoiceData] = useState(null);

  const [invoiceData, setInvoiceData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    branch_id: branchContext.branch_id || null,
    due_date: null,
    received_date: null,
    transport_charges: null,
    other_charges: null,
    remarks: null,
  });

  const { visibleRows, rowHeight } = useResponsiveRowCount();

  // ============================================
  // CUSTOM HOOKS
  // ============================================
  const {
    rows,
    setRows,
    importRows,
    getFilledRows,
    getBillableRows,
    getFreeRows,
    importVersion,
    clearAllRows,
    hasUnsavedData,
    isInitialized: rowsInitialized,
    createFreeRow,
    removeFreeRow,
  } = usePurchaseRows(visibleRows);

  const { summary } = usePurchaseCalculation(rows);

  const {
    supplier,
    setSupplier,
    suppliersList,
    setSuppliersList,
    selectSupplier,
    validateSupplier,
    resetSupplier,
    clearStoredData: clearSupplierStorage,
    isInitialized: supplierInitialized,
  } = usePurchaseSupplier(summary.total);

  // ============================================
  // CATALOG CHECK HANDLER
  // ============================================
  const handleCatalogCheckComplete = useCallback(
    (newProducts, catalogResults) => {
      setImportNewProducts(newProducts);
      setImportCatalogResults(catalogResults);
      setImportResultModalOpen(true);
    },
    [],
  );
  const handleImportProgress = useCallback((progress) => {
    if (progress.phase === "done") {
      setTimeout(() => setImportProgress(null), 400);
    } else {
      setImportProgress(progress);
    }
  }, []);

  const { handleImportFile, handleExportExcel } = usePurchaseImportExport(
    (importedRows, newProducts = []) => {
      const hasAnyCatalogData = newProducts.some((p) => p.catalogMatch);

      if (!hasAnyCatalogData && newProducts.length > 0) {
        setNewProductsFromImport(newProducts);
        setBatchProductModalOpen(true);
      }

      importRows(importedRows);
    },
    supplier,
    toast,
    medicines,
    handleCatalogCheckComplete,
    handleImportProgress,
  );

  useEffect(() => {
    console.log("[PurchasePage] user object:", user);
    console.log("[PurchasePage] shop_id from user:", user?.shop_id);
    console.log("[PurchasePage] companyDetails:", companyDetails);
  }, [user, companyDetails]);

  // ============================================
  // SECURITY CHECK
  // ============================================
  useEffect(() => {
    if (isEditingConfirmed && !isSuperAdmin) {
      toast.error(
        "Access Denied",
        "Only Super Admin can edit confirmed invoices.",
      );
      navigate("/erp/purchase-invoices");
    }
  }, [isEditingConfirmed, isSuperAdmin, navigate, toast]);

  useEffect(() => {
    if (branchContext.branch_id) {
      setInvoiceData((prev) => ({
        ...prev,
        branch_id: branchContext.branch_id,
      }));
    }
  }, [branchContext.branch_id]);

  // ============================================
  // LOAD INITIAL DATA
  // ============================================
  useEffect(() => {
    const initData = async () => {
      setLoadingStates({
        header: true,
        table: true,
        supplier: true,
        summary: true,
      });

      try {
        setTimeout(() => {
          setLoadingStates((prev) => ({ ...prev, header: false }));
        }, 200);

        await loadMedicines();
        setLoadingStates((prev) => ({ ...prev, table: false, summary: false }));

        await loadSuppliers();
        setLoadingStates((prev) => ({ ...prev, supplier: false }));

        if (invoiceId) {
          setLoadingStates((prev) => ({
            ...prev,
            table: true,
            supplier: true,
            summary: true,
          }));
          const invoice = await loadInvoiceForEdit(invoiceId);

          if (isEditingConfirmed) {
            setOriginalInvoiceData(JSON.parse(JSON.stringify(invoice)));
          }

          populateInvoiceData(invoice);
          setLoadingStates((prev) => ({
            ...prev,
            table: false,
            supplier: false,
            summary: false,
          }));
        }
      } catch (error) {
        console.error("Init error:", error);
        setLoadingStates({
          header: false,
          table: false,
          supplier: false,
          summary: false,
        });

        if (isEditingConfirmed) {
          toast.error(
            "Load Failed",
            "Failed to load confirmed invoice for editing.",
          );
          navigate("/erp/purchase-invoices");
        }
      }
    };

    initData();
  }, [invoiceId, isEditingConfirmed]); // eslint-disable-line

  // ============================================
  // RELOAD SUPPLIERS WHEN BRANCH CHANGES
  // ============================================
  useEffect(() => {
    if (!supplierInitialized) return;
    if (loadingStates.supplier) return;

    const reloadSuppliers = async () => {
      setLoadingStates((prev) => ({ ...prev, supplier: true }));
      try {
        await loadSuppliers();
      } catch (error) {
        console.error("Failed to reload suppliers:", error);
      } finally {
        setLoadingStates((prev) => ({ ...prev, supplier: false }));
      }
    };

    reloadSuppliers();
  }, [branchContext.branch_id]); // eslint-disable-line

  useEffect(() => {
    if (suppliers.length > 0) {
      setSuppliersList(suppliers);
    } else {
      setSuppliersList([]);
    }
  }, [suppliers, setSuppliersList]);

  // ============================================
  // POPULATE INVOICE DATA (EDIT MODE)
  //  UPDATED: Reverses the pack-size conversion when loading from database
  //     Backend stores per-unit values (60 tablets @ ₹10.68 each)
  //     UI needs pack-level values (2 packs @ ₹320.53 each)
  //     So we DIVIDE quantities and MULTIPLY rates.
  // ============================================
  const populateInvoiceData = useCallback(
    (invoice) => {
      setSupplier({
        supplier_id: invoice.supplier.supplier_id,
        supplierName: invoice.supplier.name,
        supplierGST: invoice.supplier.gst_number || "",
        supplierPhone:
          invoice.supplier.office_phone ||
          invoice.supplier.personal_phone ||
          "",
        address: [
          invoice.supplier.address_line_1,
          invoice.supplier.address_line_2,
          invoice.supplier.city,
          invoice.supplier.state,
          invoice.supplier.pincode,
        ]
          .filter(Boolean)
          .join(", "),
        invoiceNo: invoice.supplier_invoice_no || "",
        purchaseId: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        receivedOn: invoice.received_date,
        creditDays: invoice.credit_days || "",
      });

      setInvoiceData({
        invoice_date: invoice.invoice_date,
        branch_id: invoice.branch_id,
        due_date: invoice.due_date,
        received_date: invoice.received_date,
        transport_charges: invoice.transport_charges,
        other_charges: invoice.other_charges,
        remarks: invoice.remarks,
      });

      const populatedRows = invoice.lineItems.map((item) => {
        let expiry = "";
        if (item.expiry_date) {
          const expDate = new Date(item.expiry_date);
          const month = String(expDate.getMonth() + 1).padStart(2, "0");
          const year = String(expDate.getFullYear()).slice(-2);
          expiry = `${month}/${year}`;
        }

        // ═══════════════════════════════════════════════════════════════
        //  REVERSE THE PACK SIZE CONVERSION
        //     DB has: quantity=60, purchase_rate=10.68 (per tablet)
        //     UI needs: qty=2, price=320.53 (per pack)
        //     Divide quantities, multiply rates.
        // ═══════════════════════════════════════════════════════════════
        const packMultiplier = parsePackSizeMultiplier(item.pack_size);

        const dbQty = parseFloat(item.quantity) || 0;
        const dbFreeQty = parseFloat(item.free_quantity) || 0;
        const dbPurchaseRate = parseFloat(item.purchase_rate) || 0;
        const dbMrp = parseFloat(item.mrp) || 0;
        const dbSellingRate = parseFloat(item.selling_rate) || 0;

        //  Convert back to pack-level values
        const uiQty = dbQty / packMultiplier;
        const uiFreeQty = dbFreeQty / packMultiplier;
        const uiPurchaseRate = dbPurchaseRate * packMultiplier;
        const uiMrp = dbMrp * packMultiplier;
        const uiSellingRate = dbSellingRate * packMultiplier;

        return {
          medicine_id: item.medicine_id,
          name: item.medicine.name,
          mfac: item.medicine.manufacturer,
          batch: item.batch_number,
          hsn: item.medicine.hsn_code,
          exp: expiry,
          pack: item.pack_size,

          //  Pack-level quantities for display
          pQty: uiFreeQty > 0 ? uiFreeQty.toString() : "",
          qty: uiQty > 0 ? uiQty.toString() : "",
          sch: uiFreeQty > 0 ? uiFreeQty.toString() : "",

          //  Pack-level rates for display
          price: uiPurchaseRate > 0 ? uiPurchaseRate.toFixed(2) : "",
          mrp: uiMrp > 0 ? uiMrp.toFixed(2) : "",
          sRate: uiSellingRate > 0 ? uiSellingRate.toFixed(2) : "",

          schemePercent: item.scheme_discount?.toString() || "",
          discountPercent: item.trade_discount?.toString() || "",
          cgstPercent: item.cgst_percent?.toString() || "",
          sgstPercent: item.sgst_percent?.toString() || "",
          rack: item.rack_no || "",

          //  Net rate: use pack-level qty for the divisor
          netRate:
            item.taxable_amount && uiQty > 0
              ? (parseFloat(item.taxable_amount) / uiQty).toFixed(2)
              : "",
          amount: item.line_total?.toString() || "",
          isFreeItem: item.is_free_item || false,
          parentRowIndex: null,
        };
      });

      setRows(populatedRows);
    },
    [setSupplier, setRows],
  );

  // ============================================
  // HANDLE SUPPLIER FIELD CHANGES
  // ============================================
  const handleSupplierFieldChange = useCallback(
    (field, value) => {
      setSupplier((prev) => ({ ...prev, [field]: value }));

      if (field === "invoiceDate") {
        setInvoiceData((prev) => ({ ...prev, invoice_date: value }));
      }
      if (field === "receivedOn") {
        setInvoiceData((prev) => ({ ...prev, received_date: value }));
      }
      if (field === "creditDays" && value) {
        const invoiceDate = new Date(invoiceData.invoice_date || new Date());
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + parseInt(value));
        setInvoiceData((prev) => ({
          ...prev,
          due_date: dueDate.toISOString().split("T")[0],
        }));
      }
    },
    [setSupplier, invoiceData.invoice_date],
  );

  // ============================================
  // PRINT HANDLER
  // ============================================
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase_Invoice_${
      currentInvoice?.invoice_number ||
      supplier.invoiceNo ||
      supplier.purchaseId
    }`,
    onAfterPrint: () => {
      toast.success("Print Complete", "Invoice printed successfully.");

      if (shouldResetAfterPrint.current) {
        shouldResetAfterPrint.current = false;
        clearAllRows();
        resetSupplier();
        clearSupplierStorage();
        resetInvoice();
        setOriginalInvoiceData(null);
        setInvoiceData({
          invoice_date: new Date().toISOString().split("T")[0],
          branch_id: branchContext.branch_id || null,
          due_date: null,
          received_date: null,
          transport_charges: null,
          other_charges: null,
          remarks: null,
        });
        if (invoiceId) {
          navigate("/erp/purchase-billing");
        }
        toast.success("New Invoice", "Ready to create a new purchase invoice.");
      }
    },
    onPrintError: () => toast.error("Print Failed", "Failed to print invoice."),
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  // ============================================
  // CLEAR TABLE HANDLER
  // ============================================
  const handleClearTable = useCallback(() => {
    const hasData = hasUnsavedData();

    if (hasData) {
      setConfirmDialog({
        isOpen: true,
        type: "danger",
        title: "Clear All Items?",
        message: (
          <div className="space-y-2">
            <p>Are you sure you want to clear all items from the table?</p>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </div>
        ),
        confirmText: "Clear All",
        onConfirm: () => {
          clearAllRows();
          closeConfirmDialog();
          toast.info("Table Cleared", "All items have been removed.");
        },
      });
    } else {
      clearAllRows();
      toast.info("Table Cleared", "All items have been removed.");
    }
  }, [clearAllRows, toast, hasUnsavedData, closeConfirmDialog]);

  // ============================================
  // NEW INVOICE HANDLER
  // ============================================
  const handleNewInvoice = useCallback(() => {
    const hasData = hasUnsavedData();

    if (hasData || currentInvoice?.invoice_number) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "Start New Invoice?",
        message: (
          <div className="space-y-2">
            <p>Are you sure you want to start a new invoice?</p>
            {hasData && (
              <p className="text-sm text-amber-600 font-medium">
                You have unsaved changes that will be lost.
              </p>
            )}
            {currentInvoice?.invoice_number && (
              <p className="text-sm text-gray-500">
                Current invoice:{" "}
                <span className="font-mono font-medium">
                  {currentInvoice.invoice_number}
                </span>
              </p>
            )}
          </div>
        ),
        confirmText: "Start New",
        onConfirm: () => {
          clearAllRows();
          resetSupplier();
          clearSupplierStorage();
          resetInvoice();
          setOriginalInvoiceData(null);

          setInvoiceData({
            invoice_date: new Date().toISOString().split("T")[0],
            branch_id: branchContext.branch_id || null,
            due_date: null,
            received_date: null,
            transport_charges: null,
            other_charges: null,
            remarks: null,
          });

          closeConfirmDialog();

          if (invoiceId) {
            navigate("/erp/purchase-billing");
          }

          toast.success(
            "New Invoice",
            "Ready to create a new purchase invoice.",
          );
        },
      });
    } else {
      clearAllRows();
      resetSupplier();
      clearSupplierStorage();
      resetInvoice();
      setOriginalInvoiceData(null);

      setInvoiceData({
        invoice_date: new Date().toISOString().split("T")[0],
        branch_id: branchContext.branch_id || null,
        due_date: null,
        received_date: null,
        transport_charges: null,
        other_charges: null,
        remarks: null,
      });

      if (invoiceId) {
        navigate("/erp/purchase-billing");
      }

      toast.success("New Invoice", "Ready to create a new purchase invoice.");
    }
  }, [
    hasUnsavedData,
    currentInvoice,
    clearAllRows,
    resetSupplier,
    clearSupplierStorage,
    resetInvoice,
    branchContext.branch_id,
    invoiceId,
    navigate,
    toast,
    closeConfirmDialog,
  ]);

  // ============================================
  // BACK TO INVOICE LIST HANDLER
  // ============================================
  const handleBackToList = useCallback(() => {
    if (hasUnsavedData()) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "Unsaved Changes",
        message: (
          <div className="space-y-2">
            <p>You have unsaved changes. Are you sure you want to leave?</p>
            <p className="text-sm text-amber-600 font-medium">
              All changes will be lost.
            </p>
          </div>
        ),
        confirmText: "Leave Anyway",
        onConfirm: () => {
          closeConfirmDialog();
          navigate("/erp/purchase-invoices");
        },
      });
    } else {
      navigate("/erp/purchase-invoices");
    }
  }, [hasUnsavedData, navigate, closeConfirmDialog]);

  // ============================================
  // SAVE HANDLER (DRAFT)
  // ============================================
  const handleSave = useCallback(async () => {
    if (suppliers.length === 0) {
      toast.warning(
        "No Suppliers",
        "Please add a supplier before creating an invoice.",
      );
      setSupplierModalOpen(true);
      return false;
    }

    const billableRows = getBillableRows();
    const freeRows = getFreeRows();
    const allFilledRows = getFilledRows();

    if (billableRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one billable item.");
      return false;
    }

    const { isValid, errors } = validateSupplier();
    if (!isValid) {
      toast.warning("Validation Error", errors[0]);
      return false;
    }

    if (!invoiceData.branch_id) {
      toast.warning(
        "Branch Required",
        "Please select a branch to create purchase invoice",
      );
      return false;
    }

    if (isEditingConfirmed) {
      return new Promise((resolve) => {
        setConfirmDialog({
          isOpen: true,
          type: "warning",
          title: "Save Changes to Confirmed Invoice",
          message: (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-amber-800">
                    Super Admin Action
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    You are saving changes to a confirmed invoice.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Stock Adjustment Warning
                </p>
                <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>
                    Current stock from this invoice will be{" "}
                    <strong>reversed</strong>
                  </li>
                  <li>
                    New stock based on updated quantities will be{" "}
                    <strong>added</strong>
                  </li>
                  <li>
                    This action is <strong>logged in audit trail</strong>
                  </li>
                  <li>
                    Inventory levels will be <strong>recalculated</strong>
                  </li>
                </ul>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                <p className="font-medium text-gray-900">
                  Invoice: {currentInvoice?.invoice_number}
                </p>
                <p>Billable Items: {billableRows.length}</p>
                <p>Free Items: {freeRows.length}</p>
              </div>
            </div>
          ),
          confirmText: "Save Changes",
          onConfirm: async () => {
            closeConfirmDialog();
            await performSave(allFilledRows);
            resolve(true);
          },
        });
      });
    }

    return await performSave(allFilledRows);
  }, [
    suppliers.length,
    getBillableRows,
    getFreeRows,
    getFilledRows,
    validateSupplier,
    invoiceData.branch_id,
    isEditingConfirmed,
    currentInvoice,
    toast,
    closeConfirmDialog,
  ]);

  const performSave = useCallback(
    async (dataRows) => {
      setIsSaving(true);
      try {
        const savedInvoice = await savePurchaseInvoice(
          invoiceData,
          dataRows,
          supplier,
        );
        if (savedInvoice) {
          setSupplier((prev) => ({
            ...prev,
            purchaseId: savedInvoice.invoice_number,
          }));

          if (isEditingConfirmed) {
            toast.success(
              "Invoice Updated",
              `Confirmed invoice ${savedInvoice.invoice_number} has been updated. Stock levels adjusted.`,
            );
            setTimeout(() => {
              navigate("/erp/purchase-invoices");
            }, 1500);
          }

          return true;
        }
        return false;
      } catch (error) {
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      savePurchaseInvoice,
      invoiceData,
      supplier,
      setSupplier,
      isEditingConfirmed,
      toast,
      navigate,
    ],
  );

  // ============================================
  // SAVE & PRINT HANDLER
  // ============================================
  const handleSavePrint = useCallback(async () => {
    if (isEditingConfirmed) {
      toast.warning(
        "Not Available",
        "Save & Print is not available when editing confirmed invoices. Use 'Save' to update.",
      );
      return;
    }

    if (suppliers.length === 0) {
      toast.warning(
        "No Suppliers",
        "Please add a supplier before creating an invoice.",
      );
      setSupplierModalOpen(true);
      return;
    }

    const billableRows = getBillableRows();
    if (billableRows.length === 0) {
      toast.warning("Please add at least one billable item to print");
      return;
    }

    if (!invoiceData.branch_id) {
      toast.warning(
        "Branch Required",
        "Please select a branch to create purchase invoice",
      );
      return;
    }

    setIsSaving(true);
    try {
      let invoiceToConfirm = currentInvoice;
      const allFilledRows = getFilledRows();

      if (!currentInvoice) {
        const savedInvoice = await savePurchaseInvoice(
          invoiceData,
          allFilledRows,
          supplier,
        );
        if (!savedInvoice) return;
        invoiceToConfirm = savedInvoice;
      }

      const confirmedInvoice = await confirmPurchaseInvoice(
        invoiceToConfirm.invoice_id,
      );

      if (confirmedInvoice) {
        setSupplier((prev) => ({
          ...prev,
          purchaseId: confirmedInvoice.invoice_number,
        }));

        shouldResetAfterPrint.current = true;

        setTimeout(() => {
          handlePrint();
        }, 100);
      }
    } catch (error) {
      console.error("Save & Print error:", error);
      shouldResetAfterPrint.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [
    isEditingConfirmed,
    suppliers.length,
    getBillableRows,
    getFilledRows,
    currentInvoice,
    savePurchaseInvoice,
    confirmPurchaseInvoice,
    invoiceData,
    supplier,
    toast,
    handlePrint,
    setSupplier,
    clearAllRows,
    resetSupplier,
    clearSupplierStorage,
    resetInvoice,
    branchContext.branch_id,
    invoiceId,
    navigate,
  ]);

  // ============================================
  // EXPORT HANDLER
  // ============================================
  const onExportExcel = useCallback(() => {
    handleExportExcel(rows);
  }, [handleExportExcel, rows]);

  // ============================================
  // SUPPLIER MODAL HANDLERS
  // ============================================
  const handleAddNewSupplier = useCallback(
    (supplierName = "") => {
      if (isEditingConfirmed) {
        toast.warning(
          "Not Allowed",
          "Cannot change supplier when editing a confirmed invoice.",
        );
        return;
      }
      setNewSupplierName(supplierName);
      setSupplierModalOpen(true);
    },
    [isEditingConfirmed, toast],
  );

  const handleSupplierSave = useCallback(
    async (newSupplierData) => {
      try {
        const createdSupplier = await createSupplier({
          name: newSupplierData.name,
          contactPerson:
            newSupplierData.contactPerson || newSupplierData.contact,
          officePhone: newSupplierData.officePhone,
          personalPhone: newSupplierData.personalPhone,
          email: newSupplierData.email,
          addressLine1: newSupplierData.address,
          gstNumber: newSupplierData.gst,
          drugLicenseNo: newSupplierData.drugLicense,
          panNumber: newSupplierData.panNumber,
          city: newSupplierData.city,
          state: newSupplierData.state,
          pincode: newSupplierData.pincode,
        });

        if (createdSupplier) {
          setSuppliersList((prev) => [
            ...prev,
            {
              ...createdSupplier,
              name: createdSupplier.name,
              gstNumber:
                createdSupplier.gst_number || createdSupplier.gstNumber,
              officePhone:
                createdSupplier.office_phone || createdSupplier.officePhone,
              address:
                createdSupplier.address_line_1 || createdSupplier.address,
            },
          ]);

          setSupplier((prev) => ({
            ...prev,
            supplier_id: createdSupplier.supplier_id,
            supplierName: createdSupplier.name,
            supplierGST:
              createdSupplier.gst_number || createdSupplier.gstNumber || "",
            supplierPhone:
              createdSupplier.office_phone ||
              createdSupplier.officePhone ||
              createdSupplier.personal_phone ||
              "",
            address:
              createdSupplier.address_line_1 || createdSupplier.address || "",
          }));

          setSupplierModalOpen(false);
          setNewSupplierName("");

          toast.success(
            "Supplier Created",
            `${createdSupplier.name} has been added and selected.`,
          );
        }
      } catch (error) {
        console.error("Supplier save error:", error);
      }
    },
    [createSupplier, setSupplier, setSuppliersList, toast],
  );

  // ============================================
  // PRODUCT MODAL HANDLERS
  // ============================================
  const handleAddNewProduct = useCallback((productData) => {
    setPendingProductData(productData);
    setProductModalOpen(true);
  }, []);

  const handleProductSave = useCallback(
    async (newProductData) => {
      try {
        const createdMedicine = await createMedicine({
          name: newProductData.name,
          manufacturer: newProductData.manufacturer,
          genericName: newProductData.genericName,
          category: newProductData.category,
          subCategory: newProductData.subCategory,
          schedule: newProductData.schedule,
          hsnCode: newProductData.hsnCode,
          packSize: newProductData.packSize,
          rackNo: newProductData.rackNo,
          gst: newProductData.gst,
          cgstPercent: newProductData.cgstPercent,
          sgstPercent: newProductData.sgstPercent,
          min_stock_level: newProductData.min_stock_level,
          max_stock_level: newProductData.max_stock_level,
          reorder_point: newProductData.reorder_point,
        });

        if (createdMedicine && pendingProductData) {
          const { rowIndex } = pendingProductData;

          setRows((prev) => {
            const newRows = [...prev];

            const updatedRow = {
              ...newRows[rowIndex],
              medicine_id: createdMedicine.medicine_id || createdMedicine.id,
              name: createdMedicine.name,
              mfac: createdMedicine.manufacturer || createdMedicine.mfac,
              hsn:
                createdMedicine.hsn ||
                createdMedicine.hsnCode ||
                createdMedicine.hsn_code ||
                newProductData.hsnCode ||
                "",
              rack:
                createdMedicine.rack ||
                createdMedicine.rackNo ||
                createdMedicine.rack_no ||
                newProductData.rackNo ||
                "",
              pack:
                createdMedicine.pack ||
                createdMedicine.packSize ||
                createdMedicine.pack_size ||
                newProductData.packSize ||
                "",
              cgstPercent:
                createdMedicine.cgstPercent?.toString() ||
                createdMedicine.cgst_percentage?.toString() ||
                newProductData.cgstPercent?.toString() ||
                "6",
              sgstPercent:
                createdMedicine.sgstPercent?.toString() ||
                createdMedicine.sgst_percentage?.toString() ||
                newProductData.sgstPercent?.toString() ||
                "6",
            };

            newRows[rowIndex] = calculateRow(updatedRow);
            return newRows;
          });
        }

        setProductModalOpen(false);
        setPendingProductData(null);
      } catch (error) {
        console.error("Product save error:", error);
      }
    },
    [pendingProductData, setRows, createMedicine],
  );

  // ============================================
  // BATCH PRODUCT IMPORT HANDLERS
  // ============================================
  const handleBatchProductSave = useCallback(
    async (productsToSave) => {
      setIsBatchSaving(true);
      try {
        if (productsToSave.length > 0) {
          const productsWithLinking = productsToSave.map((product) => {
            const lookupName = product._originalImportName || product.name;

            const originalProduct = newProductsFromImport.find((imp) => {
              return (
                (imp.name || "").toLowerCase().trim() ===
                (lookupName || "").toLowerCase().trim()
              );
            });

            if (
              originalProduct?.catalogMatch &&
              originalProduct.catalogMatch.status !== "NO_MATCH" &&
              originalProduct.catalogMatch.status !== "SKIP"
            ) {
              return {
                ...product,
                _linkingData: {
                  status: originalProduct.catalogMatch.status,
                  confidence: originalProduct.catalogMatch.confidence,
                  master_medicine_id:
                    originalProduct.catalogMatch.master_medicine_id || null,
                  suggested_master_id:
                    originalProduct.catalogMatch.suggested_master_id || null,
                  reason: originalProduct.catalogMatch.reason || "",
                },
              };
            }
            return product;
          });

          const result = await bulkCreateMedicines(productsWithLinking);

          if (result?.created?.length > 0) {
            setRows((prev) => {
              const newRows = [...prev];

              result.created.forEach((createdMed) => {
                let matchingRowIndex = newRows.findIndex(
                  (row) =>
                    row.name &&
                    !row.medicine_id &&
                    !row.isFreeItem &&
                    row.name.toLowerCase().trim() ===
                      createdMed.name.toLowerCase().trim(),
                );

                if (matchingRowIndex === -1) {
                  const saved = productsToSave.find(
                    (p) =>
                      p.name.toLowerCase().trim() ===
                      createdMed.name.toLowerCase().trim(),
                  );
                  const originalName = saved?._originalImportName;
                  if (originalName) {
                    matchingRowIndex = newRows.findIndex(
                      (row) =>
                        row.name &&
                        !row.medicine_id &&
                        !row.isFreeItem &&
                        row.name.toLowerCase().trim() ===
                          originalName.toLowerCase().trim(),
                    );
                  }
                }

                if (matchingRowIndex === -1) {
                  matchingRowIndex = newRows.findIndex(
                    (row) =>
                      row.name &&
                      !row.medicine_id &&
                      !row.isFreeItem &&
                      (row.name
                        .toLowerCase()
                        .includes(createdMed.name.toLowerCase()) ||
                        createdMed.name
                          .toLowerCase()
                          .includes(row.name.toLowerCase())),
                  );
                }

                if (matchingRowIndex !== -1) {
                  newRows[matchingRowIndex] = {
                    ...newRows[matchingRowIndex],
                    medicine_id: createdMed.medicine_id,
                    name: createdMed.name,
                    mfac:
                      createdMed.manufacturer || newRows[matchingRowIndex].mfac,
                    hsn: createdMed.hsn_code || newRows[matchingRowIndex].hsn,
                    rack: createdMed.rack_no || newRows[matchingRowIndex].rack,
                    pack:
                      createdMed.pack_size || newRows[matchingRowIndex].pack,
                    cgstPercent:
                      createdMed.cgst_percentage?.toString() ||
                      newRows[matchingRowIndex].cgstPercent,
                    sgstPercent:
                      createdMed.sgst_percentage?.toString() ||
                      newRows[matchingRowIndex].sgstPercent,
                  };
                  newRows[matchingRowIndex] = calculateRow(
                    newRows[matchingRowIndex],
                  );
                } else {
                  console.warn(
                    "[BatchProductSave] Could not find matching row for:",
                    createdMed.name,
                  );
                }
              });

              return newRows;
            });
          }
        }

        setBatchProductModalOpen(false);
        setNewProductsFromImport([]);
      } catch (error) {
        console.error("Batch product save error:", error);
      } finally {
        setIsBatchSaving(false);
      }
    },
    [bulkCreateMedicines, setRows, newProductsFromImport, calculateRow],
  );

  const handleBatchProductSkip = useCallback(() => {
    setBatchProductModalOpen(false);
    setNewProductsFromImport([]);
    toast.info(
      "Import Completed",
      "Import completed. New products were skipped.",
    );
  }, [toast]);

  // ============================================
  // IMPORT RESULT MODAL HANDLERS
  // ============================================
  const handleImportResultProceed = useCallback((productsToCreate) => {
    setImportResultModalOpen(false);
    setImportCatalogResults(null);

    if (productsToCreate.length > 0) {
      setNewProductsFromImport(productsToCreate);
      setBatchProductModalOpen(true);
    }
  }, []);

  const handleImportResultSkip = useCallback(() => {
    setImportResultModalOpen(false);
    setImportNewProducts([]);
    setImportCatalogResults(null);
    toast.info(
      "Import Complete",
      "Unmatched products were skipped. They can be added later.",
    );
  }, [toast]);

  const handleImportResultClose = useCallback(() => {
    setImportResultModalOpen(false);
    setImportNewProducts([]);
    setImportCatalogResults(null);
  }, []);

  // ============================================
  // AUTO-FILL FROM EXISTING INVENTORY
  //  UPDATED: Reverses pack multiplier when suggesting last-used MRP/rate
  // ============================================
  const handleProductSelect = useCallback(
    async (rowIndex, product) => {
      const existingBatches = await getExistingBatches(product.medicine_id);

      setRows((prev) => {
        const newRows = [...prev];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          medicine_id: product.medicine_id,
          name: product.name,
          mfac: product.manufacturer || product.mfac,
          hsn: product.hsn_code || product.hsnCode || product.hsn,
          rack: product.rack_no || product.rackNo || product.rack,
          cgstPercent:
            product.cgst_percentage?.toString() ||
            product.cgstPercent ||
            (product.gst_percentage
              ? (parseFloat(product.gst_percentage) / 2).toString()
              : "6"),
          sgstPercent:
            product.sgst_percentage?.toString() ||
            product.sgstPercent ||
            (product.gst_percentage
              ? (parseFloat(product.gst_percentage) / 2).toString()
              : "6"),
          pack: product.pack_size || product.packSize || product.pack,
        };

        if (existingBatches.length > 0) {
          const recentBatch = existingBatches[0];

          //  Reverse the pack multiplier for auto-filled MRP
          const packMultiplier = parsePackSizeMultiplier(
            newRows[rowIndex].pack,
          );

          if (!newRows[rowIndex].batch)
            newRows[rowIndex].batch = recentBatch.batch_number;

          //  Convert per-unit MRP back to per-pack MRP for the UI
          if (!newRows[rowIndex].mrp && recentBatch.mrp) {
            const perUnitMrp = parseFloat(recentBatch.mrp) || 0;
            const perPackMrp = perUnitMrp * packMultiplier;
            newRows[rowIndex].mrp = perPackMrp.toFixed(2);
          }

          if (!newRows[rowIndex].rack)
            newRows[rowIndex].rack = recentBatch.rack_no || "";

          if (!newRows[rowIndex].exp && recentBatch.expiry_date) {
            const expDate = new Date(recentBatch.expiry_date);
            const month = String(expDate.getMonth() + 1).padStart(2, "0");
            const year = String(expDate.getFullYear()).slice(-2);
            newRows[rowIndex].exp = `${month}/${year}`;
          }
        }

        newRows[rowIndex] = calculateRow(newRows[rowIndex]);
        return newRows;
      });
    },
    [getExistingBatches, setRows],
  );

  // ============================================
  // HANDLE SUPPLIER SELECTION
  // ============================================
  const handleSupplierSelect = useCallback(
    (selectedSupplier) => {
      if (isEditingConfirmed) {
        toast.warning(
          "Not Allowed",
          "Cannot change supplier when editing a confirmed invoice.",
        );
        return;
      }
      selectSupplier(selectedSupplier);
    },
    [isEditingConfirmed, selectSupplier, toast],
  );

  const newSupplierData = {
    supplierId: "NEW",
    name: newSupplierName,
    contact: "",
    email: "",
    gst: "",
    address: "",
    officePhone: "",
    personalPhone: "",
  };

  const hasData = hasUnsavedData();

  const showNoSuppliersWarning =
    !isEditingConfirmed && suppliers.length === 0 && !loadingStates.supplier;

  // ── Build print-ready company details from real shop data ──
  const printCompanyDetails = {
    name:
      companyDetails.business_name ||
      companyDetails.legal_name ||
      "YOUR PHARMACY NAME",
    address:
      companyDetails.full_address ||
      [
        companyDetails.address_line_1,
        companyDetails.address_line_2,
        companyDetails.city,
        companyDetails.state,
        companyDetails.pincode,
      ]
        .filter(Boolean)
        .join(", ") ||
      "",
    phone: companyDetails.phone || "",
    email: companyDetails.email || "",
    gstin: companyDetails.gst_number || "",
    drugLicense: companyDetails.drug_license_no || "",
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1.5 gap-1.5 font-sans">
      {/* SUPER ADMIN EDITING CONFIRMED WARNING BANNER */}
      {isEditingConfirmed && (
        <div className="shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900">
                  Super Admin: Editing Confirmed Invoice
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase">
                  Confirmed
                </span>
              </div>
              <p className="text-sm text-amber-800 mt-1">
                Invoice{" "}
                <span className="font-mono font-semibold">
                  {currentInvoice?.invoice_number}
                </span>{" "}
                • Changes will automatically adjust inventory stock levels.
              </p>

              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <RefreshCw size={12} />
                  Stock will be reversed
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <AlertTriangle size={12} />
                  Audit logged
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <Shield size={12} />
                  Super Admin only
                </span>
              </div>
            </div>

            <button
              onClick={handleBackToList}
              className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Cancel Edit
            </button>
          </div>
        </div>
      )}

      {/* NO SUPPLIERS WARNING BANNER */}
      {showNoSuppliersWarning && (
        <div className="shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <Building2 size={20} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900">No Suppliers Found</h3>
              <p className="text-sm text-amber-800 mt-1">
                You need to add at least one supplier before creating a purchase
                invoice.
                {branchContext.branch_name && (
                  <span className="ml-1 text-amber-600">
                    (Branch:{" "}
                    <span className="font-medium">
                      {branchContext.branch_name}
                    </span>
                    )
                  </span>
                )}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Suppliers are filtered by the selected branch. Make sure to add
                suppliers for this branch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div
        className={`
        shrink-0 transition-all duration-300 ease-out
        ${!loadingStates.header ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
      >
        <PurchaseHeader
          onSave={handleSave}
          onSavePrint={handleSavePrint}
          onImportFile={handleImportFile}
          onExportExcel={onExportExcel}
          onClearTable={handleClearTable}
          onNewInvoice={handleNewInvoice}
          invoiceNumber={currentInvoice?.invoice_number}
          invoiceStatus={currentInvoice?.status}
          isLoading={loadingStates.header}
          isSaving={isSaving}
          hasUnsavedData={hasData}
          isEditingConfirmed={isEditingConfirmed}
          billedBy={billedByName}
          importModalOpen={importModalOpen}
          onOpenImportModal={() => setImportModalOpen(true)}
          onCloseImportModal={() => setImportModalOpen(false)}
        />
      </div>

      {/* TABLE */}
      <div
        className={`
        flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm
        transition-all duration-300 ease-out delay-75
        ${!loadingStates.table ? "opacity-100 translate-y-0" : "opacity-100"}
        ${isEditingConfirmed ? "border-amber-300" : ""}
      `}
      >
        <PurchaseTable
          rows={rows}
          setRows={setRows}
          productMaster={medicines}
          calculateRow={calculateRow}
          importVersion={importVersion}
          visibleRows={visibleRows}
          rowHeight={rowHeight}
          onAddNewProduct={handleAddNewProduct}
          onProductSelect={handleProductSelect}
          isLoading={loadingStates.table}
          onCreateFreeRow={createFreeRow}
          onRemoveFreeRow={removeFreeRow}
        />
      </div>

      {/* FOOTER */}
      <div className="shrink-0 flex gap-2 h-[200px] 2xl:h-[220px]">
        <div
          className={`
          flex-1 transition-all duration-300 ease-out delay-150
          ${!loadingStates.supplier ? "opacity-100 translate-y-0" : "opacity-100"}
        `}
        >
          <SupplierDetailsCard
            supplier={supplier}
            setSupplier={setSupplier}
            suppliersList={suppliersList}
            onSupplierSelect={handleSupplierSelect}
            onAddNewSupplier={handleAddNewSupplier}
            onFieldChange={handleSupplierFieldChange}
            isLoading={loadingStates.supplier}
            isLocked={isEditingConfirmed}
          />
        </div>

        <div
          className={`
          w-80 2xl:w-72 transition-all duration-300 ease-out delay-100
          ${!loadingStates.summary ? "opacity-100 translate-y-0" : "opacity-100"}
        `}
        >
          <PurchaseSummaryCard
            summary={summary}
            isLoading={loadingStates.summary}
            isEditingConfirmed={isEditingConfirmed}
          />
        </div>
      </div>

      {/* PRINT COMPONENT — hidden from screen, rendered only when printing */}
      <div className="hidden">
        <div ref={printRef}>
          <PurchaseInvoicePrint
            rows={rows}
            supplier={supplier}
            summary={summary}
            companyDetails={printCompanyDetails}
            invoiceNumber={currentInvoice?.invoice_number}
            invoiceDate={currentInvoice?.invoice_date}
            billedBy={billedByName}
          />
        </div>
      </div>

      {/* IMPORT PROGRESS OVERLAY */}
      {importProgress && importProgress.phase === "analyzing" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <FileSpreadsheet size={32} className="text-indigo-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">
                Checking Master Catalog
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Matching your products against the global medicine database
              </p>
            </div>

            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>
                  {importProgress.checked < importProgress.total
                    ? `Checking ${importProgress.checked} of ${importProgress.total}...`
                    : "Finalizing results..."}
                </span>
                <span className="font-semibold text-indigo-600">
                  {importProgress.total > 0
                    ? Math.round(
                        (importProgress.checked / importProgress.total) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width:
                      importProgress.total > 0
                        ? `${(importProgress.checked / importProgress.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <SpinnerIcon size={13} className="animate-spin text-indigo-500" />
              <span>
                {importProgress.checked} / {importProgress.total} products
                checked
              </span>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              Please wait — do not close this window
            </p>
          </div>
        </div>
      )}

      {/* MODALS */}
      <SupplierModal
        open={supplierModalOpen}
        mode="edit"
        supplier={newSupplierData}
        onClose={() => {
          setSupplierModalOpen(false);
          setNewSupplierName("");
        }}
        onSave={handleSupplierSave}
        existingSuppliers={suppliers}
      />

      <ProductMasterModal
        open={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setPendingProductData(null);
        }}
        onSave={handleProductSave}
        initialData={
          pendingProductData
            ? {
                name:
                  pendingProductData.productName ||
                  pendingProductData.name ||
                  "",
                manufacturer:
                  pendingProductData.manufacturer ||
                  pendingProductData.mfac ||
                  "",
                hsnCode:
                  pendingProductData.hsn || pendingProductData.hsnCode || "",
                rackNo:
                  pendingProductData.rack || pendingProductData.rackNo || "",
                packSize:
                  pendingProductData.pack || pendingProductData.packSize || "",
                cgstPercent: pendingProductData.cgstPercent || "6",
                sgstPercent: pendingProductData.sgstPercent || "6",
              }
            : {}
        }
        mode="create"
      />

      <BatchProductModal
        open={batchProductModalOpen}
        onClose={() => setBatchProductModalOpen(false)}
        newProducts={newProductsFromImport}
        onSaveAll={handleBatchProductSave}
        onSkipAll={handleBatchProductSkip}
        isSaving={isBatchSaving}
      />

      <ImportResultModal
        open={importResultModalOpen}
        onClose={handleImportResultClose}
        newProducts={importNewProducts}
        catalogResults={importCatalogResults}
        onProceedWithUnmatched={handleImportResultProceed}
        onSkipUnmatched={handleImportResultSkip}
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

export default PurchasePage;