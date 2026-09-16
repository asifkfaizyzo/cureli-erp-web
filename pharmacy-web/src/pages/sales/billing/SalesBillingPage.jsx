// pharmacy-web/src/pages/sales/billing/SalesBillingPage.jsx

import { useRef, useCallback, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Loader2,
} from "lucide-react";

import SalesHeader from "./components/SalesHeader";
import SalesTable from "./components/SalesTable";
import CustomerDetailsCard from "./components/CustomerDetailsCard";
import SalesSummaryCard from "./components/SalesSummaryCard";
import SalesInvoicePrint from "./components/SalesInvoicePrint";
import CustomerSearchModal from "./components/CustomerSearchModal";

import {
  useSalesCalculation,
  calculateSalesRow,
} from "../../../hooks/sales/useSalesCalculation";
import { useResponsiveRowCount } from "../../../hooks/purchase/useResponsiveRowCount";
import {
  useSalesRows,
  useSalesCustomer,
} from "../../../hooks/sales/useSalesRows";
import { useSalesAPI } from "../../../hooks/sales/useSalesAPI";
import { useToast } from "../../../components/common/Toast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useAuthStore, selectBranchContext } from "../../../store/useAuthStore";
import { useShopDetails } from "../../../hooks/useShopDetails";

import "../../../styles/print.css";

const SalesBillingPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();

  const editMode = searchParams.get("mode");
  const isEditingConfirmed = editMode === "edit-confirmed";
  const isEditMode = !!invoiceId;

  // ── MARKETPLACE MODE ────────────────────────────────────────────────────────
  const marketplaceOrderId = searchParams.get("marketplace_order") || null;
  const isMarketplaceMode = !!marketplaceOrderId;

  const printRef = useRef(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const branchContext = useAuthStore(selectBranchContext);
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";
  const billedByName =
    user?.name ||
    user?.full_name ||
    user?.first_name ||
    user?.username ||
    "Staff";

  const { companyDetails } = useShopDetails(user?.shop_id);

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

  const {
    isLoading: apiLoading,
    medicines,
    customers,
    currentInvoice,
    loadMedicines,
    loadCustomers,
    searchMedicines,
    getAvailableBatches,
    searchCustomers,
    createCustomer,
    saveSalesInvoice,
    confirmSalesInvoice,
    loadInvoiceForEdit,
    loadMarketplaceBillingData,
    resetInvoice,
    recordPayment,
  } = useSalesAPI();

  const [loadingStates, setLoadingStates] = useState({
    header: true,
    table: true,
    customer: true,
    summary: true,
    marketplace: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState(null);
  const [marketplaceOrderData, setMarketplaceOrderData] = useState(null);

  const [invoiceData, setInvoiceData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    branch_id: branchContext.branch_id || null,
    prescription_number: "",
    remarks: "",
  });

  const { visibleRows, rowHeight } = useResponsiveRowCount();

  const {
    rows,
    setRows,
    getFilledRows,
    clearAllRows,
    hasUnsavedData,
    isInitialized: rowsInitialized,
    importRows,
    forceSave,
  } = useSalesRows(visibleRows);

  const { customer, setCustomer, clearCustomer } = useSalesCustomer();

  const { summary } = useSalesCalculation(rows, customer.discountPercent);

  // ── Security check ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditingConfirmed && !isSuperAdmin) {
      toast.error(
        "Access Denied",
        "Only Super Admin can edit confirmed invoices.",
      );
      navigate("/erp/sales-invoice");
    }
  }, [isEditingConfirmed, isSuperAdmin, navigate, toast]);

  // ── Preview invoice number ───────────────────────────────────────────────────
  useEffect(() => {
    if (
      !currentInvoice &&
      branchContext.branch_id &&
      branchContext.branch_name
    ) {
      const branchCode =
        branchContext.branch_name
          .substring(0, 3)
          .toUpperCase()
          .replace(/\s/g, "") || "BR1";
      const timestamp = Date.now().toString().slice(-6);
      setPreviewInvoiceNumber(`SALE-${branchCode}-DRAFT-${timestamp}`);
    }
  }, [currentInvoice, branchContext]);

  // ── Sync branch_id ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (branchContext.branch_id) {
      setInvoiceData((prev) => ({
        ...prev,
        branch_id: branchContext.branch_id,
      }));
    }
  }, [branchContext.branch_id]);

  // ── Unload guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedData()) {
        forceSave();
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedData, forceSave]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F5") {
        e.preventDefault();
        if (!isSaving && currentInvoice?.status !== "CONFIRMED")
          handleConfirmAndPrint();
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleNewBill();
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (!isSaving && currentInvoice?.status !== "CONFIRMED") handleSave();
      }
      if (e.ctrlKey && e.key === "p") {
        if (currentInvoice?.status === "CONFIRMED") {
          e.preventDefault();
          handlePrint();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, currentInvoice]); // eslint-disable-line

  // ── Load initial data ────────────────────────────────────────────────────────
  useEffect(() => {
    const initData = async () => {
      setLoadingStates({
        header: true,
        table: true,
        customer: true,
        summary: true,
        marketplace: false,
      });

      try {
        setTimeout(
          () => setLoadingStates((prev) => ({ ...prev, header: false })),
          200,
        );

        await loadMedicines();
        setLoadingStates((prev) => ({ ...prev, table: false, summary: false }));

        await loadCustomers();
        setLoadingStates((prev) => ({ ...prev, customer: false }));

        if (invoiceId) {
          setLoadingStates((prev) => ({
            ...prev,
            table: true,
            customer: true,
            summary: true,
          }));
          const invoice = await loadInvoiceForEdit(invoiceId);
          if (invoice) populateInvoiceData(invoice);
          setLoadingStates((prev) => ({
            ...prev,
            table: false,
            customer: false,
            summary: false,
          }));
        }
      } catch (error) {
        console.error("Init error:", error);
        setLoadingStates({
          header: false,
          table: false,
          customer: false,
          summary: false,
          marketplace: false,
        });
        if (isEditingConfirmed) {
          toast.error(
            "Load Failed",
            "Failed to load confirmed invoice for editing.",
          );
          navigate("/erp/sales-invoice");
        }
      }
    };

    initData();
  }, [invoiceId, isEditingConfirmed]); // eslint-disable-line

  // ── Auto-populate from marketplace order ────────────────────────────────────
  useEffect(() => {
    if (!marketplaceOrderId) return;
    if (!rowsInitialized) return;

    const populateFromMarketplace = async () => {
      setLoadingStates((prev) => ({ ...prev, marketplace: true, table: true }));

      try {
        const data = await loadMarketplaceBillingData(marketplaceOrderId);
        if (!data) return;

        setMarketplaceOrderData(data);

        setCustomer((prev) => ({
          ...prev,
          customer_id: null,
          name: data.customer_name || "",
          phone: data.customer_phone || "",
          patientName: data.patient?.name || data.customer_name || "",
          address: [
            data.delivery_address?.address_line_1,
            data.delivery_address?.city,
            data.delivery_address?.state,
          ]
            .filter(Boolean)
            .join(", "),
          paymentType: "CASH",
          cashReceived: Number(data.total_amount || 0).toFixed(2),
          sameAsCustomer: !data.patient?.name,
        }));

        const newRows = data.items.map((item) => {
          const firstBatch = item.available_batches?.[0] || null;

          let expiryDisplay = "";
          if (firstBatch?.expiry_date) {
            const d = new Date(firstBatch.expiry_date);
            expiryDisplay = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
          }

          const row = {
            medicine_id: item.medicine_id,
            inventory_id: firstBatch?.inventory_id || null,
            name: item.medicine?.name || item.medicine_name || "",
            manufacturer: item.medicine?.manufacturer || "",
            batch: firstBatch?.batch_number || "",
            exp: expiryDisplay,
            qty: String(item.ordered_quantity),
            mrp: String(firstBatch?.mrp || item.marketplace_price || ""),
            rate: String(
              firstBatch?.selling_rate ||
                firstBatch?.mrp ||
                item.marketplace_price ||
                "",
            ),
            rack: firstBatch?.rack_no || item.medicine?.rack_no || "",
            stock: String(firstBatch?.available_stock || ""),
            discountPercent: "0",
            cgstPercent: String(item.medicine?.cgst_percentage || 0),
            sgstPercent: String(item.medicine?.sgst_percentage || 0),
            amount: "",
            availableBatches: item.available_batches || [],
            _marketplace_locked: true,
            _ordered_quantity: item.ordered_quantity,
          };

          return calculateSalesRow(row);
        });

        importRows(newRows);

        if (data.branch_id) {
          setInvoiceData((prev) => ({ ...prev, branch_id: data.branch_id }));
        }

        toast.success(
          "Order Loaded",
          `${data.items.length} items loaded from order ${data.order_number}`,
        );
      } catch (err) {
        console.error("[SalesBillingPage] Marketplace populate error:", err);
        toast.error("Load Failed", "Could not load marketplace order data.");
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          marketplace: false,
          table: false,
        }));
      }
    };

    populateFromMarketplace();
  }, [marketplaceOrderId, rowsInitialized]); // eslint-disable-line

  // ── Populate invoice data (edit mode) ───────────────────────────────────────
  const populateInvoiceData = useCallback(
    (invoice) => {
      if (!invoice) return;

      if (invoice.customer) {
        setCustomer({
          customer_id: invoice.customer.customer_id,
          name: invoice.customer.name,
          phone: invoice.customer.phone || "",
          address: [
            invoice.customer.address_line_1,
            invoice.customer.city,
            invoice.customer.state,
          ]
            .filter(Boolean)
            .join(", "),
          doctorName: invoice.doctor_name || "",
          patientName: invoice.walkin_name || invoice.customer.name || "",
          paymentType: invoice.is_credit_sale ? "CREDIT" : "CASH",
          cashReceived: invoice.paid_amount?.toString() || "",
          gstNumber: invoice.customer.gst_number || "",
          discountPercent: invoice.customer_discount_percent || 0,
          eWayBillNo: "",
          sameAsCustomer: invoice.walkin_name === invoice.customer.name,
        });
      } else {
        const walkinName = invoice.walkin_name || "";
        setCustomer((prev) => ({
          ...prev,
          customer_id: null,
          name: walkinName,
          patientName: walkinName,
          phone: invoice.walkin_phone || "",
          doctorName: invoice.doctor_name || "",
          paymentType: "CASH",
          cashReceived: invoice.paid_amount?.toString() || "",
          eWayBillNo: "",
          sameAsCustomer: false,
        }));
      }

      setInvoiceData({
        invoice_date: invoice.invoice_date,
        branch_id: invoice.branch_id,
        prescription_number: invoice.prescription_number || "",
        remarks: invoice.remarks || "",
      });

      const populatedRows = invoice.lineItems.map((item) => {
        let expiry = "";
        if (item.expiry_date) {
          const expDate = new Date(item.expiry_date);
          expiry = `${String(expDate.getMonth() + 1).padStart(2, "0")}/${String(expDate.getFullYear()).slice(-2)}`;
        }
        return {
          medicine_id: item.medicine_id,
          inventory_id: item.inventory_id,
          name: item.medicine?.name || "",
          manufacturer: item.medicine?.manufacturer || "",
          batch: item.batch_number,
          exp: expiry,
          qty: item.quantity?.toString() || "",
          mrp: item.mrp?.toString() || "",
          rate: item.selling_rate?.toString() || item.mrp?.toString() || "",
          rack: item.inventory?.rack_no || "",
          discountPercent: item.discount_percent?.toString() || "0",
          cgstPercent: item.cgst_percent?.toString() || "0",
          sgstPercent: item.sgst_percent?.toString() || "0",
          stock: item.inventory?.available_stock?.toString() || "",
          amount: item.line_total?.toString() || "",
          availableBatches: [],
        };
      });

      setRows(populatedRows);
    },
    [setRows, setCustomer],
  );

  // ── Customer selection ───────────────────────────────────────────────────────
  const handleCustomerSelect = useCallback(
    (selectedCustomer) => {
      if (selectedCustomer) {
        setCustomer((prev) => ({
          ...prev,
          customer_id: selectedCustomer.customer_id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone || "",
          address: selectedCustomer.address_line_1 || "",
          gstNumber: selectedCustomer.gst_number || "",
          discountPercent: selectedCustomer.discount_percent || 0,
          patientName: prev.sameAsCustomer
            ? selectedCustomer.name
            : prev.patientName,
        }));
        toast.success("Customer Selected", `${selectedCustomer.name} selected`);
      }
      setCustomerSearchOpen(false);
    },
    [toast, setCustomer],
  );

  // ── Product selection ────────────────────────────────────────────────────────
  const handleProductSelect = useCallback(
    async (rowIndex, product, batch = null) => {
      if (isMarketplaceMode) {
        toast.warning("Locked", "Cannot add new items to a marketplace order.");
        return;
      }
      try {
        const batches = await getAvailableBatches(product.medicine_id);
        const selectedBatch = batch || (batches.length > 0 ? batches[0] : null);

        setRows((prev) => {
          const newRows = [...prev];
          let expiry = "";
          if (selectedBatch?.expiry_date) {
            const expDate = new Date(selectedBatch.expiry_date);
            expiry = `${String(expDate.getMonth() + 1).padStart(2, "0")}/${String(expDate.getFullYear()).slice(-2)}`;
          }

          // Extract CGST & SGST directly from selectedBatch medicine master, fallback to product, then to 0
          const cgst = selectedBatch?.medicine?.cgst_percentage 
            ?? product.cgst_percentage 
            ?? product.cgstPercent 
            ?? 0;

          const sgst = selectedBatch?.medicine?.sgst_percentage 
            ?? product.sgst_percentage 
            ?? product.sgstPercent 
            ?? 0;

          newRows[rowIndex] = {
            ...newRows[rowIndex],
            medicine_id: product.medicine_id,
            inventory_id: selectedBatch?.inventory_id || null,
            name: product.name,
            manufacturer: product.manufacturer || "",
            batch: selectedBatch?.batch_number || "",
            exp: expiry,
            mrp: selectedBatch?.mrp?.toString() || "",
            rate: selectedBatch?.selling_rate?.toString() || selectedBatch?.mrp?.toString() || "",
            rack: selectedBatch?.rack_no || product.rack_no || "",
            stock: selectedBatch?.available_stock?.toString() || "",
            cgstPercent: cgst.toString(),
            sgstPercent: sgst.toString(),
            availableBatches: batches,
          };
          newRows[rowIndex] = calculateSalesRow(newRows[rowIndex]);
          return newRows;
        });
      } catch (error) {
        console.error("Error selecting product:", error);
        toast.error("Error", "Failed to load product batches");
      }
    },
    [getAvailableBatches, setRows, toast, isMarketplaceMode],
  );

  // ── Batch selection ──────────────────────────────────────────────────────────
  const handleBatchSelect = useCallback(
    (rowIndex, batch) => {
      setRows((prev) => {
        const newRows = [...prev];
        let expiry = "";
        if (batch.expiry_date) {
          const expDate = new Date(batch.expiry_date);
          expiry = `${String(expDate.getMonth() + 1).padStart(2, "0")}/${String(expDate.getFullYear()).slice(-2)}`;
        }

        // Extract precise GST rates directly from selected batch medicine reference
        const cgst = batch.medicine?.cgst_percentage ?? 0;
        const sgst = batch.medicine?.sgst_percentage ?? 0;

        newRows[rowIndex] = {
          ...newRows[rowIndex],
          inventory_id: batch.inventory_id,
          batch: batch.batch_number,
          exp: expiry,
          mrp: batch.mrp?.toString() || "",
          rate: batch.selling_rate?.toString() || batch.mrp?.toString() || "",
          rack: batch.rack_no || "",
          stock: batch.available_stock?.toString() || "",
          cgstPercent: cgst.toString(),
          sgstPercent: sgst.toString(),
        };
        newRows[rowIndex] = calculateSalesRow(newRows[rowIndex]);
        return newRows;
      });
    },
    [setRows],
  );

  // ── Print ────────────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Sales_Invoice_${currentInvoice?.invoice_number || previewInvoiceNumber || "NEW"}`,
    onAfterPrint: () =>
      toast.success("Print Complete", "Invoice printed successfully."),
    onPrintError: () => toast.error("Print Failed", "Failed to print invoice."),
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  // ── Clear table ──────────────────────────────────────────────────────────────
  const handleClearTable = useCallback(() => {
    if (isMarketplaceMode) {
      toast.warning("Locked", "Cannot clear items in marketplace mode.");
      return;
    }
    const hasData = hasUnsavedData();
    if (hasData) {
      setConfirmDialog({
        isOpen: true,
        type: "danger",
        title: "Clear All Items?",
        message: (
          <div className="space-y-2">
            <p>Are you sure you want to clear all items?</p>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </div>
        ),
        confirmText: "Clear All",
        onConfirm: () => {
          clearAllRows();
          closeConfirmDialog();
          toast.info("Table Cleared", "All items removed.");
        },
      });
    } else {
      clearAllRows();
    }
  }, [
    clearAllRows,
    hasUnsavedData,
    closeConfirmDialog,
    toast,
    isMarketplaceMode,
  ]);

  // ── New bill ─────────────────────────────────────────────────────────────────
  const handleNewBill = useCallback(() => {
    if (isMarketplaceMode) {
      navigate("/erp/marketplace-orders");
      return;
    }
    const hasData = hasUnsavedData();
    if (hasData || currentInvoice?.invoice_number) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "Start New Bill?",
        message: (
          <div className="space-y-2">
            <p>You have unsaved changes that will be lost.</p>
          </div>
        ),
        confirmText: "Start New",
        onConfirm: () => {
          clearAllRows();
          clearCustomer();
          resetInvoice();
          setPreviewInvoiceNumber(null);
          setInvoiceData({
            invoice_date: new Date().toISOString().split("T")[0],
            branch_id: branchContext.branch_id || null,
            prescription_number: "",
            remarks: "",
          });
          closeConfirmDialog();
          if (invoiceId) navigate("/erp/sales-billing");
          toast.success("New Bill", "Ready to create a new sales bill.");
        },
      });
    } else {
      clearAllRows();
      clearCustomer();
      resetInvoice();
      setPreviewInvoiceNumber(null);
      setInvoiceData({
        invoice_date: new Date().toISOString().split("T")[0],
        branch_id: branchContext.branch_id || null,
        prescription_number: "",
        remarks: "",
      });
      if (invoiceId) navigate("/erp/sales-billing");
    }
  }, [
    hasUnsavedData,
    currentInvoice,
    clearAllRows,
    clearCustomer,
    resetInvoice,
    branchContext.branch_id,
    invoiceId,
    navigate,
    toast,
    closeConfirmDialog,
    isMarketplaceMode,
  ]);

  // ── Validation helpers ───────────────────────────────────────────────────────
  const validateCustomerData = useCallback(() => {
  const errors = [];
  if (!customer.customer_id && customer.phone) {
    const phoneDigits = customer.phone.replace(/\D/g, "");
    // Accepts: 10 digits, 11 digits (starting with 0), or 12 digits (starting with 91)
    if (phoneDigits && !/^(?:91|0)?\d{10}$/.test(phoneDigits)) {
      errors.push("Invalid phone number (must be a valid 10-digit number)");
    }
  }
  if (
    customer.gstNumber &&
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
      customer.gstNumber,
    )
  ) {
    errors.push("Invalid GSTIN format");
  }
  if (customer.paymentType === "CREDIT" && !customer.customer_id) {
    errors.push("Credit sales require a registered customer");
  }
  return errors;
}, [customer]);

  const validateNoDuplicateBatches = useCallback(() => {
    const inventoryUsage = new Map();
    const dataRows = getFilledRows();
    for (const row of dataRows) {
      const key = `${row.medicine_id}_${row.inventory_id}`;
      const current = inventoryUsage.get(key) || {
        qty: 0,
        name: row.name,
        batch: row.batch,
        stock: row.stock,
      };
      current.qty += parseFloat(row.qty) || 0;
      inventoryUsage.set(key, current);
    }
    for (const [, data] of inventoryUsage) {
      if (data.qty > parseFloat(data.stock) || 0) {
        return {
          isValid: false,
          error: `${data.name} (Batch: ${data.batch}): Total ${data.qty} units used, only ${data.stock} available`,
        };
      }
    }
    return { isValid: true };
  }, [getFilledRows]);

  // ── Save (draft) ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (isMarketplaceMode) {
      toast.info(
        "Info",
        "Please use Confirm & Dispatch to complete the marketplace order.",
      );
      return false;
    }

    const dataRows = getFilledRows();
    if (dataRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return false;
    }
    if (!invoiceData.branch_id) {
      toast.warning("Branch Required", "Please select a branch.");
      return false;
    }

    const customerErrors = validateCustomerData();
    if (customerErrors.length > 0) {
      toast.error("Validation Failed", customerErrors.join(", "));
      return false;
    }

    const duplicateCheck = validateNoDuplicateBatches();
    if (!duplicateCheck.isValid) {
      toast.error("Duplicate Batch", duplicateCheck.error);
      return false;
    }

    for (const row of dataRows) {
      if (parseFloat(row.qty) > parseFloat(row.stock)) {
        toast.error(
          "Insufficient Stock",
          `${row.name} (Batch: ${row.batch}) - Available: ${row.stock}, Requested: ${row.qty}`,
        );
        return false;
      }
    }

    setIsSaving(true);
    try {
      const savedInvoice = await saveSalesInvoice(
        invoiceData,
        dataRows,
        customer,
      );
      if (savedInvoice) {
        toast.success(
          "Saved",
          `Bill ${savedInvoice.invoice_number} saved as draft`,
        );
        return true;
      }
      return false;
    } catch (error) {
      toast.error("Save Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    getFilledRows,
    invoiceData,
    customer,
    saveSalesInvoice,
    toast,
    validateCustomerData,
    validateNoDuplicateBatches,
    isMarketplaceMode,
  ]);

  // ── Confirm & print ──────────────────────────────────────────────────────────
  const handleConfirmAndPrint = useCallback(async () => {
    const dataRows = getFilledRows();
    if (dataRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return;
    }
    if (!invoiceData.branch_id) {
      toast.warning("Branch Required", "Please select a branch.");
      return;
    }

    if (isMarketplaceMode) {
      const missingBatch = dataRows.find((r) => !r.inventory_id);
      if (missingBatch) {
        toast.error(
          "Batch Required",
          `Please select a batch for: ${missingBatch.name}`,
        );
        return;
      }
    }

    const customerErrors = validateCustomerData();
    if (customerErrors.length > 0) {
      toast.error("Validation Failed", customerErrors.join(", "));
      return;
    }

    const duplicateCheck = validateNoDuplicateBatches();
    if (!duplicateCheck.isValid) {
      toast.error("Duplicate Batch", duplicateCheck.error);
      return;
    }

    for (const row of dataRows) {
      if (parseFloat(row.qty) > parseFloat(row.stock || 0)) {
        toast.error(
          "Insufficient Stock",
          `${row.name} (Batch: ${row.batch}) - Available: ${row.stock}, Requested: ${row.qty}`,
        );
        return;
      }
    }

    if (!isMarketplaceMode && customer.paymentType !== "CREDIT") {
      const cashReceived = parseFloat(customer.cashReceived) || 0;
      if (cashReceived < summary.netAmount) {
        toast.warning(
          "Insufficient Payment",
          `Net Amount: ₹${summary.netAmount.toFixed(2)}, Received: ₹${cashReceived.toFixed(2)}`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      let invoiceToConfirm = currentInvoice;

      if (!currentInvoice) {
        const savedInvoice = await saveSalesInvoice(
          invoiceData,
          dataRows,
          customer,
        );
        if (!savedInvoice) {
          setIsSaving(false);
          return;
        }
        invoiceToConfirm = savedInvoice;
      }

      const payments = [];

      if (!isMarketplaceMode) {
        if (customer.paymentType !== "CREDIT") {
          const paymentAmount =
            customer.paymentType === "CASH"
              ? Math.min(
                  parseFloat(customer.cashReceived) || 0,
                  summary.netAmount,
                )
              : summary.netAmount;
          if (paymentAmount > 0) {
            payments.push({
              amount: paymentAmount,
              payment_mode: customer.paymentType,
              reference_number: null,
            });
          }
        }
        if (customer.paymentType === "CREDIT" && customer.customer_id) {
          payments.push({ amount: summary.netAmount, payment_mode: "CREDIT" });
        }
      } else {
        payments.push({
          amount: summary.netAmount,
          payment_mode: "ONLINE",
          reference_number: marketplaceOrderId,
        });
      }

      const confirmedInvoice = await confirmSalesInvoice(
        invoiceToConfirm.invoice_id,
        {
          payments,
          marketplace_order_id: marketplaceOrderId || undefined,
        },
      );

      if (confirmedInvoice) {
        if (isMarketplaceMode) {
          toast.success(
            "Order Billed",
            `Invoice ${confirmedInvoice.invoice_number} created. Customer will be notified.`,
          );
          setTimeout(() => {
            handlePrint();
            setTimeout(() => {
              clearAllRows();
              clearCustomer();
              resetInvoice();
              navigate("/marketplace/orders?tab=active");
            }, 800);
          }, 100);
        } else {
          toast.success(
            "Confirmed",
            `Bill ${confirmedInvoice.invoice_number} confirmed. Stock deducted.`,
          );
          setTimeout(() => {
            handlePrint();
            setTimeout(() => {
              clearAllRows();
              clearCustomer();
              resetInvoice();
              setPreviewInvoiceNumber(null);
            }, 500);
          }, 100);
        }
      }
    } catch (error) {
      toast.error("Confirmation Failed", error.message);
    } finally {
      setIsSaving(false);
    }
  }, [
    getFilledRows,
    invoiceData,
    customer,
    summary,
    currentInvoice,
    saveSalesInvoice,
    confirmSalesInvoice,
    handlePrint,
    toast,
    clearAllRows,
    clearCustomer,
    resetInvoice,
    validateCustomerData,
    validateNoDuplicateBatches,
    isMarketplaceMode,
    marketplaceOrderId,
    navigate,
  ]);

  // ── Print only ───────────────────────────────────────────────────────────────
  const handlePrintOnly = useCallback(() => {
    if (currentInvoice?.status === "CONFIRMED") {
      handlePrint();
    } else {
      toast.warning("Not Confirmed", "Please confirm the bill before printing");
    }
  }, [currentInvoice, handlePrint, toast]);

  const hasData = hasUnsavedData();
  const isConfirmed = currentInvoice?.status === "CONFIRMED";

  // ── Marketplace loading overlay ──────────────────────────────────────────────
  if (isMarketplaceMode && loadingStates.marketplace) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-gray-50 gap-4">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500 font-medium">
          Loading marketplace order...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1.5 gap-1.5 font-sans">
      {/* ── MARKETPLACE MODE BANNER ─────────────────────────────────────────── */}
      {isMarketplaceMode && marketplaceOrderData && (
        <div className="shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-indigo-900">
                  Marketplace Order Billing
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase">
                  {marketplaceOrderData.order_number}
                </span>
              </div>
              <p className="text-sm text-indigo-800 mt-1">
                Customer: <strong>{marketplaceOrderData.customer_name}</strong>
                {" · "}Payment already collected via app.
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                  Quantities locked to ordered amounts
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                  Select correct batches then click Confirm & Dispatch
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/erp/marketplace-orders")}
              className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>
          </div>
        </div>
      )}

      {/* ── EDITING CONFIRMED BANNER ────────────────────────────────────────── */}
      {isEditingConfirmed && (
        <div className="shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900">
                  Super Admin: Editing Confirmed Bill
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase">
                  Confirmed
                </span>
              </div>
              <p className="text-sm text-amber-800 mt-1">
                Bill{" "}
                <span className="font-mono font-semibold">
                  {currentInvoice?.invoice_number}
                </span>{" "}
                · Changes will affect inventory and customer balance.
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <RefreshCw size={12} /> Stock will be adjusted
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <AlertTriangle size={12} /> Audit logged
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/erp/sales-invoice")}
              className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Cancel Edit
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div
        className={`shrink-0 transition-all duration-300 ease-out ${!loadingStates.header ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
      >
        <SalesHeader
          onSave={handleSave}
          onConfirmPrint={handleConfirmAndPrint}
          onPrint={handlePrintOnly}
          onClearTable={handleClearTable}
          onNewBill={handleNewBill}
          invoiceNumber={currentInvoice?.invoice_number || previewInvoiceNumber}
          invoiceStatus={currentInvoice?.status || null}
          isLoading={loadingStates.header}
          isSaving={isSaving}
          hasUnsavedData={hasData}
          billedBy={billedByName}
          confirmLabel={isMarketplaceMode ? "Confirm & Dispatch" : undefined}
        />
      </div>

      {/* TABLE */}
      <div
        className={`flex-1 flex flex-col overflow-hidden bg-white rounded-lg border shadow-sm transition-all duration-300 ease-out delay-75 ${isEditingConfirmed ? "border-amber-300" : isMarketplaceMode ? "border-indigo-300" : "border-gray-200"}`}
      >
        <SalesTable
          rows={rows}
          setRows={setRows}
          productMaster={medicines}
          calculateRow={calculateSalesRow}
          visibleRows={visibleRows}
          rowHeight={rowHeight}
          onProductSelect={handleProductSelect}
          onBatchSelect={handleBatchSelect}
          isLoading={loadingStates.table}
          getAvailableBatches={getAvailableBatches}
          marketplaceLocked={isMarketplaceMode}
        />
      </div>

      {/* FOOTER */}
      <div className="shrink-0 flex gap-2 h-[220px] 2xl:h-[240px]">
        <div
          className={`flex-1 transition-all duration-300 ease-out delay-100 ${!loadingStates.customer ? "opacity-100" : "opacity-100"}`}
        >
          <CustomerDetailsCard
            customer={customer}
            setCustomer={setCustomer}
            onSearchCustomer={() =>
              !isMarketplaceMode && setCustomerSearchOpen(true)
            }
            netAmount={summary.netAmount}
            isLoading={loadingStates.customer}
            billNo={
              currentInvoice?.invoice_number || previewInvoiceNumber || "DRAFT"
            }
            readOnly={isMarketplaceMode}
          />
        </div>
        <div
          className={`w-72 2xl:w-80 transition-all duration-300 ease-out delay-150 ${!loadingStates.summary ? "opacity-100" : "opacity-100"}`}
        >
          <SalesSummaryCard
            summary={summary}
            customer={customer}
            isLoading={loadingStates.summary}
          />
        </div>
      </div>

      {/* PRINT */}
      <div className="hidden">
        <div ref={printRef}>
          <SalesInvoicePrint
            rows={rows}
            customer={customer}
            summary={summary}
            companyDetails={printCompanyDetails}
            invoiceNumber={
              currentInvoice?.invoice_number || previewInvoiceNumber
            }
            invoiceDate={
              currentInvoice?.invoice_date || invoiceData.invoice_date
            }
            billedBy={billedByName}
            showDiscount={customer.showDiscountOnPrint !== false} // ← Dynamically toggle printing of the discount column
          />
        </div>
      </div>

      {/* CUSTOMER SEARCH MODAL — disabled in marketplace mode */}
      {!isMarketplaceMode && (
        <CustomerSearchModal
          isOpen={customerSearchOpen}
          onClose={() => setCustomerSearchOpen(false)}
          onSelect={handleCustomerSelect}
          searchCustomers={searchCustomers}
          createCustomer={createCustomer}
        />
      )}

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

export default SalesBillingPage;