// pharmacy-web/src/pages/sales/invoice/components/ViewSalesInvoiceModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/ViewSalesInvoiceModal.jsx
// Main Modal Container - Orchestrates View and Edit modes for Sales Invoices

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Printer,
  Pencil,
  Trash2,
  Calendar,
  Hash,
  CheckCircle2,
  Download,
  Sparkles,
  Receipt,
  Shield,
  AlertTriangle,
  Save,
  ArrowLeft,
  Loader2,
  XCircle,
  RotateCcw,
  Ban,
  ChevronDown,
  User,
  MapPin,
  Wallet,
  AlertCircle,
  IndianRupee,
  Info,
  FileText,
  Package,
  Plus,
  Clock,
  PauseCircle,
} from "lucide-react";

import { useToast } from "../../../../components/common/Toast";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import salesAPI from "../../../../api/sales";
import medicinesAPI from "../../../../api/medicines";

import CreateSalesReturnModal from "./CreateSalesReturnModal";
import ViewSalesReturnModal from "./ViewSalesReturnModal";
import ViewModeContent from "./ViewModeContent";
import EditModeContent from "./EditModeContent";
import PrintSalesInvoiceModal from "./PrintSalesInvoiceModal";
import {
  calculateEditRow,
  makeEmptyRow,
  transformInvoiceToRows,
  formatCurrency,
  formatDate,
  ANIMATION_VARIANTS,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  NAVY,
  PAYMENT_BALANCE_THRESHOLD,
  getEffectivePaymentDisplay,
} from "./salesInvoiceModalHelpers";

// ════════════════════════════════════════════════════════════════════════════
// STATUS DROPDOWN PORTAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const StatusDropdownPortal = ({
  isOpen,
  anchorRef,
  options,
  onSelect,
  onClose,
  currentStatus,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;

      setPosition({
        top: showAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        showAbove,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />

          <motion.div
            ref={dropdownRef}
            className="fixed z-[9999] w-72"
            style={{
              top: position.showAbove ? "auto" : position.top,
              bottom: position.showAbove
                ? `${window.innerHeight - position.top + 8}px`
                : "auto",
              left: position.left,
            }}
            variants={ANIMATION_VARIANTS.dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{
                boxShadow:
                  "0 20px 60px -15px rgba(0, 0, 96, 0.25), 0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 96, 0.1)",
              }}
            >
              <div className="px-4 py-3 bg-gradient-to-r from-[#000060] to-[#000080] border-b border-[#000060]/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Shield size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Change Status
                    </p>
                    <p className="text-[10px] text-white/60">
                      Super Admin Action
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                  Current Status
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      currentStatus === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : currentStatus === "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : currentStatus === "PARKED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                    }
                  `}
                  >
                    {currentStatus === "CONFIRMED" ? (
                      <CheckCircle2 size={12} />
                    ) : currentStatus === "DRAFT" ? (
                      <Clock size={12} />
                    ) : currentStatus === "PARKED" ? (
                      <PauseCircle size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {currentStatus}
                  </span>
                </div>
              </div>

              <div className="py-2">
                {options.length > 0 ? (
                  options.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      className={`
                        w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-150
                        hover:bg-gray-50 active:bg-gray-100
                        ${index !== options.length - 1 ? "border-b border-gray-100" : ""}
                      `}
                    >
                      <div
                        className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${
                          option.value === "CONFIRMED"
                            ? "bg-green-100"
                            : option.value === "DRAFT"
                              ? "bg-amber-100"
                              : "bg-red-100"
                        }
                      `}
                      >
                        <option.icon
                          size={16}
                          className={
                            option.value === "CONFIRMED"
                              ? "text-green-600"
                              : option.value === "DRAFT"
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                          text-sm font-semibold
                          ${
                            option.value === "CONFIRMED"
                              ? "text-green-700"
                              : option.value === "DRAFT"
                                ? "text-amber-700"
                                : "text-red-700"
                          }
                        `}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      <ChevronDown
                        size={14}
                        className="text-gray-400 rotate-[-90deg] mt-2"
                      />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <Ban size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No status changes available</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Status changes may affect inventory levels and are logged in
                    the audit trail.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT STATUS DROPDOWN PORTAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const PaymentStatusDropdownPortal = ({
  isOpen,
  anchorRef,
  options,
  onSelect,
  onClose,
  currentStatus,
  invoice,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownHeight = 400;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;

      setPosition({
        top: showAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        showAbove,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const paymentDisplay = getEffectivePaymentDisplay(invoice);
  const netAmount = parseFloat(invoice?.net_amount) || 0;
  const paidAmount = parseFloat(invoice?.paid_amount) || 0;
  const rawBalance = netAmount - paidAmount;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={onClose} />

          <motion.div
            ref={dropdownRef}
            className="fixed z-[9999] w-80"
            style={{
              top: position.showAbove ? "auto" : position.top,
              bottom: position.showAbove
                ? `${window.innerHeight - position.top + 8}px`
                : "auto",
              left: position.left,
            }}
            variants={ANIMATION_VARIANTS.dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{
                boxShadow:
                  "0 20px 60px -15px rgba(0, 0, 96, 0.25), 0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 96, 0.1)",
              }}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <IndianRupee size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Payment Status
                    </p>
                    <p className="text-[10px] text-white/60">
                      Super Admin Action
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Status & Balance */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Effective Status
                  </p>
                  <span
                    className={`
                    inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold
                    ${paymentDisplay.config.bg} ${paymentDisplay.config.text}
                  `}
                  >
                    {paymentDisplay.effectiveStatus === "PAID" && (
                      <CheckCircle2 size={12} />
                    )}
                    {paymentDisplay.effectiveStatus === "PARTIALLY_PAID" && (
                      <Wallet size={12} />
                    )}
                    {paymentDisplay.effectiveStatus === "UNPAID" && (
                      <AlertCircle size={12} />
                    )}
                    {paymentDisplay.config.label ||
                      paymentDisplay.effectiveStatus}
                  </span>
                </div>

                {paymentDisplay.thresholdApplied && (
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-50 rounded border border-blue-200">
                    <Info size={12} className="text-blue-600" />
                    <span className="text-[10px] text-blue-700">
                      Balance ₹{rawBalance.toFixed(2)} ≤ ₹
                      {PAYMENT_BALANCE_THRESHOLD} threshold (treated as paid)
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border">
                    <p className="text-gray-500">Paid</p>
                    <p className="font-bold text-emerald-600">
                      {formatCurrency(paidAmount)}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p className="text-gray-500">Balance</p>
                    <p
                      className={`font-bold ${
                        paymentDisplay.showBalance
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {paymentDisplay.showBalance ? (
                        formatCurrency(rawBalance)
                      ) : paymentDisplay.thresholdApplied ? (
                        <span className="line-through">
                          {formatCurrency(rawBalance)}
                        </span>
                      ) : (
                        formatCurrency(0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="py-2">
                {options.map((option, index) => {
                  const isCurrentStatus =
                    option.value === paymentDisplay.effectiveStatus;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (!isCurrentStatus) {
                          onSelect(option.value);
                          onClose();
                        }
                      }}
                      disabled={isCurrentStatus}
                      className={`
                        w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-150
                        ${
                          isCurrentStatus
                            ? "bg-gray-50 opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50 active:bg-gray-100"
                        }
                        ${index !== options.length - 1 ? "border-b border-gray-100" : ""}
                      `}
                    >
                      <div
                        className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${
                          option.value === "PAID"
                            ? "bg-emerald-100"
                            : option.value === "PARTIALLY_PAID"
                              ? "bg-amber-100"
                              : "bg-red-100"
                        }
                      `}
                      >
                        <option.icon
                          size={16}
                          className={
                            option.value === "PAID"
                              ? "text-emerald-600"
                              : option.value === "PARTIALLY_PAID"
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                          text-sm font-semibold
                          ${
                            option.value === "PAID"
                              ? "text-emerald-700"
                              : option.value === "PARTIALLY_PAID"
                                ? "text-amber-700"
                                : "text-red-700"
                          }
                        `}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      {isCurrentStatus && (
                        <span className="text-xs text-gray-400 mt-1">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      Balance ≤ ₹{PAYMENT_BALANCE_THRESHOLD} is treated as fully
                      paid (handles rounding).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ViewSalesInvoiceModal = ({
  open,
  onClose,
  invoice,
  onPrint,
  onEdit,
  onDelete,
  onRefresh,
  isSuperAdmin = false,
  initialMode = "view",
}) => {
  const toast = useToast();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const [mode, setMode] = useState("view");
  const [editRows, setEditRows] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState({});
  const [medicinesLoading, setMedicinesLoading] = useState(false);

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [showPaymentStatusMenu, setShowPaymentStatusMenu] = useState(false);
  const [isChangingPaymentStatus, setIsChangingPaymentStatus] = useState(false);
  const [createReturnModal, setCreateReturnModal] = useState(false);

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [linkedReturns, setLinkedReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  //  Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const tableBodyRef = useRef(null);
  const statusButtonRef = useRef(null);
  const paymentStatusButtonRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const effectivePaymentDisplay = useMemo(() => {
    return getEffectivePaymentDisplay(invoice);
  }, [invoice]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (open && invoice) {
      setShowStatusMenu(false);
      setShowPaymentStatusMenu(false);
      setShowPrintModal(false);

      if (initialMode === "edit") {
        const rows = transformInvoiceToRows(invoice);
        while (rows.length < 5) rows.push(makeEmptyRow());
        setEditRows(rows);
        setOriginalData(JSON.parse(JSON.stringify(invoice)));
        setMode("edit");

        if (medicines.length === 0) loadMedicines();
      } else {
        setMode("view");
        setEditRows([]);
        setOriginalData(null);
      }
    }
  }, [open, invoice?.invoice_id, initialMode]);

  // Fetch linked returns
  useEffect(() => {
    const fetchLinkedReturns = async () => {
      if (!invoice || !invoice.invoice_id) {
        setLinkedReturns([]);
        return;
      }

      if (invoice.is_return) {
        setLinkedReturns([]);
        return;
      }

      try {
        setLoadingReturns(true);
        const response = await salesAPI.getAllReturns({
          parent_invoice_id: invoice.invoice_id,
          limit: 100,
        });

        if (response.success && response.data?.returns) {
          const filteredReturns = response.data.returns.filter(
            (ret) => ret.parent_invoice_id === invoice.invoice_id,
          );
          const approvedReturns = filteredReturns.filter(
            (ret) =>
              ret.status === "CONFIRMED" ||
              ret.return_approval_status === "APPROVED",
          );
          setLinkedReturns(approvedReturns);
        } else {
          setLinkedReturns([]);
        }
      } catch (error) {
        console.error("Error fetching linked returns:", error);
        setLinkedReturns([]);
      } finally {
        setLoadingReturns(false);
      }
    };

    if (open && invoice) {
      fetchLinkedReturns();
    } else {
      setLinkedReturns([]);
    }
  }, [open, invoice?.invoice_id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && open) {
        if (showPrintModal) {
          setShowPrintModal(false);
        } else if (showStatusMenu) {
          setShowStatusMenu(false);
        } else if (showPaymentStatusMenu) {
          setShowPaymentStatusMenu(false);
        } else if (mode === "edit") {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [
    open,
    onClose,
    mode,
    showStatusMenu,
    showPaymentStatusMenu,
    showPrintModal,
  ]);

  useEffect(() => {
    if (mode === "edit" && medicines.length === 0) loadMedicines();
  }, [mode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadMedicines = async () => {
    try {
      setMedicinesLoading(true);
      const response = await medicinesAPI.getAll({
        isActive: true,
        limit: 1000,
      });

      const formattedMedicines = response.data.medicines.map((med) => ({
        id: med.medicine_id,
        medicine_id: med.medicine_id,
        name: med.name,
        genericName: med.generic_name,
        manufacturer: med.manufacturer,
        hsnCode: med.hsn_code,
        hsn: med.hsn_code,
        packSize: med.pack_size,
        pack: med.pack_size,
        cgstPercent: med.cgst_percentage?.toString() || "6",
        sgstPercent: med.sgst_percentage?.toString() || "6",
      }));

      setMedicines(formattedMedicines);
    } catch (error) {
      console.error("Load medicines error:", error);
      toast.error("Failed to load medicines");
    } finally {
      setMedicinesLoading(false);
    }
  };

  const loadBatches = async (medicineId) => {
    if (batches[medicineId]) return;

    try {
      const response = await salesAPI.getAvailableBatches(medicineId);
      if (response.success && response.data?.batches) {
        setBatches((prev) => ({
          ...prev,
          [medicineId]: response.data.batches,
        }));
      }
    } catch (error) {
      console.error("Load batches error:", error);
      toast.error("Failed to load batch information");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS CHANGE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (!invoice || !isSuperAdmin || mode !== "edit") return;

      const currentStatus = invoice.status?.toUpperCase();
      const invoiceNumber = invoice.invoice_number;

      setShowStatusMenu(false);

      let confirmMessage = null;
      let confirmTitle = "";
      let confirmType = "warning";
      let confirmButtonText = "";

      if (
        newStatus === "CONFIRMED" &&
        (currentStatus === "DRAFT" || currentStatus === "PARKED")
      ) {
        confirmTitle = "Confirm Invoice";
        confirmButtonText = "Confirm Invoice";
        confirmMessage = (
          <div className="space-y-3">
            <p>
              You are about to <strong>confirm</strong> this invoice.
            </p>
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <p className="text-gray-600">
                Amount: ₹
                {parseFloat(invoice.net_amount || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} />
                This will:
              </p>
              <ul className="text-xs text-green-700 mt-2 list-disc list-inside space-y-1">
                <li>Deduct stock from inventory</li>
                <li>Lock the invoice for regular editing</li>
                <li>Record confirmation in audit trail</li>
              </ul>
            </div>
          </div>
        );
      } else if (newStatus === "DRAFT" && currentStatus === "CONFIRMED") {
        confirmTitle = "Revert to Draft";
        confirmButtonText = "Revert to Draft";
        confirmType = "danger";
        confirmMessage = (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <Shield className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-800">Super Admin Action</p>
                <p className="text-sm text-red-700 mt-1">
                  You are reverting a confirmed invoice to draft.
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                Warning: Stock Restoration
              </p>
              <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>
                  All stock deducted by this invoice will be{" "}
                  <strong>restored</strong>
                </li>
                <li>This may cause stock inconsistencies</li>
                <li>Action is logged in audit trail</li>
              </ul>
            </div>
          </div>
        );
      } else if (newStatus === "CANCELLED") {
        confirmTitle = "Cancel Invoice";
        confirmButtonText = "Cancel Invoice";
        confirmType = "danger";
        confirmMessage = (
          <div className="space-y-3">
            <p>
              You are about to <strong>cancel</strong> this invoice.
            </p>
            {currentStatus === "CONFIRMED" && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Stock Restoration Warning
                </p>
                <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>
                    All stock from this invoice will be{" "}
                    <strong>restored</strong>
                  </li>
                  <li>
                    This action <strong>cannot be undone</strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
        );
      }

      if (confirmMessage) {
        setConfirmDialog({
          isOpen: true,
          type: confirmType,
          title: confirmTitle,
          message: confirmMessage,
          confirmText: confirmButtonText,
          onConfirm: async () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            await performStatusChange(newStatus);
          },
        });
      }
    },
    [invoice, isSuperAdmin, mode],
  );

  const performStatusChange = useCallback(
    async (newStatus) => {
      setIsChangingStatus(true);

      try {
        if (newStatus === "CONFIRMED") {
          await salesAPI.confirm(invoice.invoice_id);
        } else if (newStatus === "CANCELLED") {
          await salesAPI.cancel(invoice.invoice_id, "Cancelled by Super Admin");
        } else if (newStatus === "DRAFT") {
          await salesAPI.update(invoice.invoice_id, { status: "DRAFT" });
        }

        const statusLabels = {
          CONFIRMED: "confirmed",
          DRAFT: "reverted to draft",
          CANCELLED: "cancelled",
        };
        toast.success(
          "Status Updated",
          `Invoice ${invoice.invoice_number} has been ${statusLabels[newStatus]}.`,
        );

        onRefresh?.();
        onClose();
      } catch (error) {
        console.error("Status change error:", error);
        toast.error(
          "Status Change Failed",
          error.response?.data?.message || error.message,
        );
      } finally {
        setIsChangingStatus(false);
      }
    },
    [invoice, toast, onRefresh, onClose],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT STATUS CHANGE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const getPaymentStatusMenuOptions = useCallback(() => {
    return [
      {
        value: "PAID",
        label: "Mark as Paid",
        icon: CheckCircle2,
        description: "Set full amount as paid",
      },
      {
        value: "PARTIALLY_PAID",
        label: "Partially Paid",
        icon: Wallet,
        description: `Balance must be > ₹${PAYMENT_BALANCE_THRESHOLD}`,
      },
      {
        value: "UNPAID",
        label: "Mark as Unpaid",
        icon: AlertCircle,
        description: "Reset payment to zero",
      },
    ];
  }, []);

  const handlePaymentStatusChange = useCallback(
    async (newStatus) => {
      if (!invoice || !isSuperAdmin || mode !== "edit") return;

      const netAmount = parseFloat(invoice.net_amount) || 0;

      setShowPaymentStatusMenu(false);

      setConfirmDialog({
        isOpen: true,
        type: newStatus === "UNPAID" ? "danger" : "warning",
        title: `Mark as ${newStatus.replace("_", " ")}`,
        message: (
          <div className="space-y-3">
            <p>
              You are marking this invoice as{" "}
              <strong>{newStatus.replace("_", " ").toLowerCase()}</strong>.
            </p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoice.invoice_number}
              </p>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">{formatCurrency(netAmount)}</span>
              </div>
            </div>
          </div>
        ),
        confirmText: `Mark as ${newStatus.replace("_", " ")}`,
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await performPaymentStatusChange(newStatus);
        },
      });
    },
    [invoice, isSuperAdmin, mode],
  );

  const performPaymentStatusChange = useCallback(
    async (newStatus) => {
      setIsChangingPaymentStatus(true);

      try {
        const netAmount = parseFloat(invoice.net_amount) || 0;

        const payload = {
          payment_status: newStatus,
          payment_mode: "CASH",
        };

        if (newStatus === "PAID") {
          payload.paid_amount = netAmount;
        } else if (newStatus === "UNPAID") {
          payload.paid_amount = 0;
        }

        await salesAPI.updatePaymentStatus(invoice.invoice_id, payload);

        toast.success(
          "Payment Status Updated",
          `Invoice has been marked as ${newStatus.replace("_", " ").toLowerCase()}.`,
        );

        onRefresh?.();
        onClose();
      } catch (error) {
        console.error("Payment status change error:", error);
        toast.error(
          "Update Failed",
          error.response?.data?.message || error.message,
        );
      } finally {
        setIsChangingPaymentStatus(false);
      }
    },
    [invoice, toast, onRefresh, onClose],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN VIEW HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleViewReturn = useCallback(
    async (returnInvoice) => {
      try {
        if (!returnInvoice.lineItems) {
          setIsLoadingDetails(true);
          const response = await salesAPI.getReturnById(
            returnInvoice.invoice_id,
          );
          if (response.success && response.data) {
            setSelectedReturn(response.data);
          } else {
            setSelectedReturn(returnInvoice);
          }
        } else {
          setSelectedReturn(returnInvoice);
        }
        setShowReturnModal(true);
      } catch (error) {
        console.error("Failed to fetch return details:", error);
        toast.error("Failed to load return details");
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [toast],
  );

  const handleCloseReturnModal = useCallback(() => {
    setShowReturnModal(false);
    setSelectedReturn(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleEnterEditMode = useCallback(() => {
    const rows = transformInvoiceToRows(invoice);
    while (rows.length < 5) rows.push(makeEmptyRow());

    setEditRows(rows);
    setOriginalData(JSON.parse(JSON.stringify(invoice)));
    setMode("edit");
  }, [invoice]);

  const handleCancelEdit = useCallback(() => {
    const hasChanges =
      JSON.stringify(editRows) !==
      JSON.stringify(transformInvoiceToRows(originalData));

    if (hasChanges) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "Discard Changes?",
        message: (
          <div className="space-y-2">
            <p>
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <p className="text-sm text-amber-600 font-medium">
              All changes will be lost.
            </p>
          </div>
        ),
        confirmText: "Discard",
        onConfirm: () => {
          setMode("view");
          setEditRows([]);
          setOriginalData(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setMode("view");
      setEditRows([]);
      setOriginalData(null);
    }
  }, [editRows, originalData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ROW OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleRowChange = useCallback((index, key, value) => {
    setEditRows((prev) => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [key]: value };
      newRows[index] = calculateEditRow(newRows[index]);
      return newRows;
    });
  }, []);

  const handleProductSelect = useCallback((index, product) => {
    setEditRows((prev) => {
      const newRows = [...prev];
      newRows[index] = {
        ...newRows[index],
        medicine_id: product.medicine_id || product.id,
        name: product.name,
        batch: "",
        batch_id: null,
        exp: "",
        mrp: "",
        price: "",
        availableQty: 0,
        cgstPercent: product.cgstPercent || "6",
        sgstPercent: product.sgstPercent || "6",
      };
      newRows[index] = calculateEditRow(newRows[index]);
      return newRows;
    });
  }, []);

  const handleBatchSelect = useCallback((index, batch) => {
    setEditRows((prev) => {
      const newRows = [...prev];

      let expStr = "";
      if (batch.expiry_date) {
        const d = new Date(batch.expiry_date);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yy = String(d.getFullYear()).slice(-2);
          expStr = `${mm}/${yy}`;
        }
      }

      newRows[index] = {
        ...newRows[index],
        batch_id: batch.inventory_id,
        batch: batch.batch_number,
        exp: expStr,
        mrp: String(batch.mrp || 0),
        price: String(batch.selling_rate || batch.mrp || 0),
        availableQty: batch.available_stock || 0,
      };
      newRows[index] = calculateEditRow(newRows[index]);
      return newRows;
    });
  }, []);

  const handleAddRow = useCallback(() => {
    setEditRows((prev) => [...prev, makeEmptyRow()]);
  }, []);

  const handleRemoveRow = useCallback(
    (index) => {
      if (editRows.length <= 1) return;
      setEditRows((prev) => prev.filter((_, i) => i !== index));
    },
    [editRows.length],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSave = useCallback(async () => {
    const filledRows = editRows.filter(
      (r) => r.name && r.qty && parseFloat(r.qty) > 0,
    );

    if (filledRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return;
    }

    const missingBatches = filledRows.filter((r) => !r.batch_id);
    if (missingBatches.length > 0) {
      toast.warning(
        "Missing Batches",
        `${missingBatches.length} item(s) need batch selection.`,
      );
      return;
    }

    const overStock = filledRows.filter(
      (r) => r.availableQty > 0 && parseFloat(r.qty) > r.availableQty,
    );
    if (overStock.length > 0) {
      toast.warning(
        "Insufficient Stock",
        `${overStock.length} item(s) exceed available stock.`,
      );
      return;
    }

    const isConfirmed = invoice.status === "CONFIRMED";

    if (isConfirmed) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "Update Confirmed Invoice",
        message: (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-amber-800">
                  Super Admin Action
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You are updating a confirmed invoice.
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
                  Current deducted stock will be <strong>restored</strong>
                </li>
                <li>
                  New stock based on updated quantities will be{" "}
                  <strong>deducted</strong>
                </li>
                <li>
                  Action is <strong>logged in audit trail</strong>
                </li>
              </ul>
            </div>
          </div>
        ),
        confirmText: "Update Invoice",
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          performSave(filledRows);
        },
      });
    } else {
      await performSave(filledRows);
    }
  }, [editRows, invoice, toast]);

  const performSave = useCallback(
    async (filledRows) => {
      setIsSaving(true);

      try {
        const payload = {
          payment_mode: invoice.payment_mode || null,
          paid_amount: parseFloat(invoice.paid_amount) || null,
          remarks: invoice.remarks || null,
          lineItems: filledRows.map((row) => ({
            medicine_id: row.medicine_id,
            inventory_id: row.batch_id,
            quantity: parseFloat(row.qty) || 1,
            unit_of_measure: row.unit_of_measure || "UNIT",
            selling_rate: parseFloat(row.price) || 0,
            mrp: parseFloat(row.mrp) || 0,
            discount_percent: parseFloat(row.discountPercent) || 0,
            cgst_percent: parseFloat(row.cgstPercent) || 0,
            sgst_percent: parseFloat(row.sgstPercent) || 0,
          })),
        };

        await salesAPI.update(invoice.invoice_id, payload);

        toast.success(
          "Invoice Updated",
          invoice.status === "CONFIRMED"
            ? `Confirmed invoice ${invoice.invoice_number} updated. Stock levels adjusted.`
            : `Invoice ${invoice.invoice_number} updated successfully.`,
        );

        setMode("view");
        setEditRows([]);
        setOriginalData(null);
        onRefresh?.();
        onClose();
      } catch (error) {
        console.error("Save error:", error);

        if (error.response?.data?.code === "APPROVED_RETURNS_EXIST") {
          toast.error(
            "Cannot Edit",
            "This invoice has approved returns. Cancel the returns first.",
          );
          return;
        }

        toast.error(
          "Update Failed",
          error.response?.data?.message || "Failed to update invoice",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [invoice, toast, onRefresh, onClose],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  const editSummary = useMemo(() => {
    const taxable = editRows.reduce(
      (s, r) => s + (Number(r.taxableValue) || 0),
      0,
    );
    const cgst = editRows.reduce((s, r) => s + (Number(r.cgstAmount) || 0), 0);
    const sgst = editRows.reduce((s, r) => s + (Number(r.sgstAmount) || 0), 0);
    const totalItems = editRows.filter((r) => r.name).length;
    const totalQty = editRows.reduce((s, r) => s + (Number(r.qty) || 0), 0);

    return {
      subTotal: +taxable.toFixed(2),
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      total: +(taxable + cgst + sgst).toFixed(2),
      totalItems,
      totalQty,
    };
  }, [editRows]);

  const getStatusMenuOptions = useCallback(() => {
    const currentStatusValue = invoice?.status?.toUpperCase();
    const options = [];

    if (currentStatusValue === "DRAFT" || currentStatusValue === "PARKED") {
      options.push({
        value: "CONFIRMED",
        label: "Confirm Invoice",
        icon: CheckCircle2,
        description: "Deduct stock from inventory",
      });
      options.push({
        value: "CANCELLED",
        label: "Cancel Invoice",
        icon: Ban,
        description: "Cancel without stock changes",
      });
    } else if (currentStatusValue === "CONFIRMED") {
      options.push({
        value: "DRAFT",
        label: "Revert to Draft",
        icon: RotateCcw,
        description: "Restore stock and unlock for editing",
      });
      options.push({
        value: "CANCELLED",
        label: "Cancel Invoice",
        icon: Ban,
        description: "Restore stock and cancel",
      });
    }

    return options;
  }, [invoice?.status]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDS & COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  if (!open || !invoice) return null;

  const isConfirmed = invoice.status === "CONFIRMED";
  const isCancelled = invoice.status === "CANCELLED";
  const canEdit = isSuperAdmin && !isCancelled;
  const canDelete = !isConfirmed && !isCancelled;

  const canChangeStatus = isSuperAdmin && !isCancelled && mode === "edit";
  const canChangePaymentStatus =
    isSuperAdmin && !isCancelled && mode === "edit";

  const showCreateReturnButton = isConfirmed && linkedReturns.length === 0;

  const currentStatus = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.DRAFT;
  const currentPayment = effectivePaymentDisplay.config;

  const StatusIcon = currentStatus.icon;
  const PaymentIcon = currentPayment.icon;

  const totalQty =
    invoice.lineItems?.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    ) || 0;
  const itemCount = invoice.lineItems?.length || 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#000060]/40 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={ANIMATION_VARIANTS.backdrop}
            onClick={
              mode === "view" &&
              !showStatusMenu &&
              !showPaymentStatusMenu &&
              !showPrintModal
                ? onClose
                : undefined
            }
          />

          {/* Main Panel */}
          <motion.div
            className={`relative w-full max-w-[95vw] h-[95vh] rounded-2xl overflow-hidden flex flex-col bg-white ${
              mode === "edit" && isConfirmed ? "ring-2 ring-amber-400" : ""
            }`}
            style={{
              boxShadow:
                "0 25px 80px rgba(0, 0, 96, 0.25), 0 0 0 1px rgba(0, 0, 96, 0.1)",
            }}
            variants={ANIMATION_VARIANTS.panel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Decorative element */}
            <div
              className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-[0.03]"
              style={{
                background: `radial-gradient(circle, ${NAVY} 0%, transparent 70%)`,
              }}
            />

            {/* Status Loading Overlay */}
            {(isChangingStatus || isChangingPaymentStatus) && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                  <Loader2 size={32} className="text-[#000060] animate-spin" />
                  <p className="text-sm font-medium text-gray-700">
                    {isChangingPaymentStatus
                      ? "Updating payment status..."
                      : "Updating status..."}
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <div
              className={`shrink-0 px-6 py-4 border-b relative z-10 bg-white ${
                mode === "edit" ? "border-amber-300" : "border-[#000060]/10"
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        mode === "edit" ? "bg-amber-500" : ""
                      }`}
                      style={
                        mode === "view"
                          ? {
                              background: NAVY,
                              boxShadow: "0 8px 24px rgba(0, 0, 96, 0.3)",
                            }
                          : {}
                      }
                    >
                      {mode === "edit" ? (
                        <Pencil size={24} className="text-white" />
                      ) : (
                        <Receipt size={24} className="text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[#000060]/50 text-xs uppercase tracking-widest mb-1">
                        {mode === "edit" ? (
                          <>
                            <Shield size={12} className="text-amber-600" />
                            <span className="text-amber-600">
                              Editing Invoice
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>Sales Invoice</span>
                          </>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-[#000060] tracking-tight">
                        {invoice.invoice_number}
                      </h1>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {/* Invoice Status Badge */}
                    <button
                      ref={statusButtonRef}
                      onClick={() =>
                        canChangeStatus && setShowStatusMenu(!showStatusMenu)
                      }
                      disabled={!canChangeStatus}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                        ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}
                        ${
                          canChangeStatus
                            ? `cursor-pointer ${currentStatus.hoverBg} hover:shadow-md active:scale-95`
                            : "cursor-default"
                        }
                      `}
                    >
                      <StatusIcon size={12} />
                      {currentStatus.label}
                      {canChangeStatus && (
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${
                            showStatusMenu ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    <StatusDropdownPortal
                      isOpen={showStatusMenu}
                      anchorRef={statusButtonRef}
                      options={getStatusMenuOptions()}
                      onSelect={handleStatusChange}
                      onClose={() => setShowStatusMenu(false)}
                      currentStatus={invoice.status}
                    />

                    {/* Payment Status Badge */}
                    <button
                      ref={paymentStatusButtonRef}
                      onClick={() =>
                        canChangePaymentStatus &&
                        setShowPaymentStatusMenu(!showPaymentStatusMenu)
                      }
                      disabled={!canChangePaymentStatus}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                        ${currentPayment.bg} ${currentPayment.text} ${
                          currentPayment.border || "border-current/30"
                        }
                        ${
                          canChangePaymentStatus
                            ? `cursor-pointer ${currentPayment.hoverBg} hover:shadow-md active:scale-95`
                            : "cursor-default"
                        }
                      `}
                    >
                      <PaymentIcon size={12} />
                      {currentPayment.label}
                      {effectivePaymentDisplay.showBalance && (
                        <span className="text-[10px] opacity-75 ml-0.5">
                          ({formatCurrency(effectivePaymentDisplay.balance)})
                        </span>
                      )}
                      {canChangePaymentStatus && (
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${
                            showPaymentStatusMenu ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    <PaymentStatusDropdownPortal
                      isOpen={showPaymentStatusMenu}
                      anchorRef={paymentStatusButtonRef}
                      options={getPaymentStatusMenuOptions()}
                      onSelect={handlePaymentStatusChange}
                      onClose={() => setShowPaymentStatusMenu(false)}
                      currentStatus={invoice.payment_status}
                      invoice={invoice}
                    />

                    {/* Loading Returns Badge */}
                    {loadingReturns && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Loader2 size={10} className="animate-spin" />
                        Loading returns...
                      </span>
                    )}

                    {/* Linked Returns Badge */}
                    {!loadingReturns && linkedReturns.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        <Package size={10} />
                        {linkedReturns.length} Return
                        {linkedReturns.length > 1 ? "s" : ""} Linked
                      </span>
                    )}

                    {mode === "edit" && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                        <Shield size={10} />
                        Editing Mode
                      </span>
                    )}

                    {isSuperAdmin && mode === "view" && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        <Shield size={10} />
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side - Stats & Actions */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#000060]">
                        {mode === "edit" ? editSummary.totalItems : itemCount}
                      </div>
                      <div className="text-[10px] text-[#000060]/50 uppercase">
                        Items
                      </div>
                    </div>
                    <div className="w-px h-8 bg-[#000060]/10" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#000060]">
                        {mode === "edit"
                          ? formatCurrency(editSummary.total)
                          : formatCurrency(invoice.net_amount)}
                      </div>
                      <div className="text-[10px] text-[#000060]/50 uppercase">
                        Total
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mode === "view" ? (
                      <>
                        <button
                          onClick={() => setShowPrintModal(true)}
                          className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10"
                          title="Print"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={handleEnterEditMode}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all border ${
                              isConfirmed
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300"
                                : "bg-[#000060]/10 hover:bg-[#000060]/20 text-[#000060] border-[#000060]/20"
                            }`}
                          >
                            {isConfirmed ? (
                              <Shield size={16} />
                            ) : (
                              <Pencil size={16} />
                            )}
                            <span className="text-sm font-medium">
                              {isConfirmed ? "Admin Edit" : "Edit"}
                            </span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => onDelete?.(invoice)}
                            className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-red-50 text-[#000060]/60 hover:text-red-600 transition-all border border-[#000060]/10"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={onClose}
                          className="p-2.5 rounded-xl bg-[#000060] text-white hover:bg-[#000060]/90 transition-all ml-2"
                          title="Close"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-300"
                        >
                          <ArrowLeft size={16} />
                          <span className="text-sm font-medium">Cancel</span>
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-lg ${
                            isConfirmed
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-[#000060] hover:bg-[#000060]/90 text-white"
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          <span className="text-sm font-medium">
                            {isSaving ? "Saving..." : "Save Changes"}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-6 mt-4 text-sm text-[#000060]/60">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#000060]/40" />
                  <span>{formatDate(invoice.invoice_date)}</span>
                </div>
                {invoice.customer && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#000060]/40" />
                      <span>
                        {invoice.customer.name ||
                          invoice.customer_name ||
                          "Walk-in"}
                      </span>
                    </div>
                  </>
                )}
                {invoice.branch && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#000060]/40" />
                      <span>{invoice.branch.branch_name}</span>
                    </div>
                  </>
                )}
                {mode === "edit" && isConfirmed && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                      <AlertTriangle size={12} />
                      <span className="text-xs font-medium">
                        Stock will be recalculated on save
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* CONTENT */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {mode === "view" ? (
              <ViewModeContent
                invoice={{
                  ...invoice,
                  returnInvoices: linkedReturns,
                }}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                totalQty={totalQty}
                itemCount={itemCount}
                canEdit={canEdit}
                isConfirmed={isConfirmed}
                onEnterEditMode={handleEnterEditMode}
                onCreateReturn={() => setCreateReturnModal(true)}
                showCreateReturnButton={showCreateReturnButton}
                onViewReturn={handleViewReturn}
              />
            ) : (
              <EditModeContent
                invoice={{
                  ...invoice,
                  returnInvoices: linkedReturns,
                }}
                editRows={editRows}
                editSummary={editSummary}
                medicines={medicines}
                batches={batches}
                medicinesLoading={medicinesLoading}
                isConfirmed={isConfirmed}
                formatCurrency={formatCurrency}
                onRowChange={handleRowChange}
                onProductSelect={handleProductSelect}
                onBatchSelect={handleBatchSelect}
                onBatchesLoad={loadBatches}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                tableBodyRef={tableBodyRef}
                onCreateReturn={() => setCreateReturnModal(true)}
                showCreateReturnButton={showCreateReturnButton}
                onViewReturn={handleViewReturn}
              />
            )}
          </motion.div>

          {/* View Return Modal */}
          {showReturnModal && selectedReturn && (
            <ViewSalesReturnModal
              open={showReturnModal}
              onClose={handleCloseReturnModal}
              returnInvoice={selectedReturn}
              onApprove={() => {
                handleCloseReturnModal();
                onRefresh?.();
                toast.success(
                  "Return Approved",
                  "Stock has been restored and credit note generated.",
                );
              }}
              onReject={() => {
                handleCloseReturnModal();
                onRefresh?.();
                toast.info("Return Rejected", "The return has been rejected.");
              }}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* Loading overlay for return details */}
          {isLoadingDetails && (
            <div className="fixed inset-0 bg-white/70 z-[60] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="text-[#000060] animate-spin" />
                <span className="text-sm text-gray-600">
                  Loading return details...
                </span>
              </div>
            </div>
          )}

          <CreateSalesReturnModal
            open={createReturnModal}
            onClose={() => setCreateReturnModal(false)}
            invoice={invoice}
            onSuccess={() => {
              setCreateReturnModal(false);
              onRefresh?.();
            }}
            isSuperAdmin={isSuperAdmin}
          />

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() =>
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={confirmDialog.onConfirm}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText || "Cancel"}
            type={confirmDialog.type}
          />

          {/*  Print Modal */}
          <PrintSalesInvoiceModal
            open={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            invoice={invoice}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewSalesInvoiceModal;
