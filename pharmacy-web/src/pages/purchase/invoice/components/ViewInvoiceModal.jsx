// pharmacy-web/src/pages/purchase/invoice/components/ViewInvoiceModal.jsx
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
  Clock,
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
  Building2,
  MapPin,
  Wallet,
  AlertCircle,
  IndianRupee,
  Info,
  FileText,
  Package,
  Plus,
} from "lucide-react";

import { useToast } from "../../../../components/common/Toast";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import purchaseAPI from "../../../../api/purchase";
import medicinesAPI from "../../../../api/medicines";

import CreateReturnModal from "../../returns/components/CreateReturnModal";
import ViewModeContent from "./ViewModeContent";
import EditModeContent from "./EditModeContent";
import ViewReturnModal from "../../returns/components/ViewReturnModal";
import PrintInvoiceModal from "./PrintInvoiceModal";
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
  calculatePaymentStatus,
  calculatePaymentDetails,
  getEffectivePaymentDisplay,
} from "./invoiceModalHelpers";

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
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

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
                          : "bg-red-100 text-red-700"
                    }
                  `}
                  >
                    {currentStatus === "CONFIRMED" ? (
                      <CheckCircle2 size={12} />
                    ) : currentStatus === "DRAFT" ? (
                      <Clock size={12} />
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
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

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
                      className={`font-bold ${paymentDisplay.showBalance ? "text-red-600" : "text-gray-400"}`}
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

                {paymentDisplay.effectiveStatus !== currentStatus && (
                  <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
                    <span>DB Status:</span>
                    <span className="font-medium">{currentStatus}</span>
                    <span>→</span>
                    <span className="font-medium text-emerald-600">
                      {paymentDisplay.effectiveStatus}
                    </span>
                    <span>(threshold adjusted)</span>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="py-2">
                {options.map((option, index) => {
                  const isCurrentStatus =
                    option.value === paymentDisplay.effectiveStatus;
                  const optConfig = PAYMENT_STATUS_CONFIG[option.value] || {};

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
                    <p className="text-[10px] text-blue-600 leading-relaxed mt-1">
                      Status changes are logged in audit trail.
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

const ViewInvoiceModal = ({
  open,
  onClose,
  invoice,
  onPrint,
  onEdit,
  onDelete,
  onRefresh,
  isSuperAdmin = false,
  initialMode = "view",
  companyInfo,
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
  const [medicinesLoading, setMedicinesLoading] = useState(false);

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [showPaymentStatusMenu, setShowPaymentStatusMenu] = useState(false);
  const [isChangingPaymentStatus, setIsChangingPaymentStatus] = useState(false);
  const [createReturnModal, setCreateReturnModal] = useState(false);

  const [showPrintModal, setShowPrintModal] = useState(false);

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [linkedReturns, setLinkedReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

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
  // COMPUTED - Check if invoice has linked returns (blocks save)
  // ═══════════════════════════════════════════════════════════════════════════

  const hasLinkedReturns = useMemo(() => {
    return linkedReturns && linkedReturns.length > 0;
  }, [linkedReturns]);

  const linkedReturnCount = useMemo(() => {
    return linkedReturns?.length || 0;
  }, [linkedReturns]);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED: Effective Payment Display (with threshold logic)
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
        const response = await purchaseAPI.getAllReturns({
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
  }, [open, invoice?.invoice_id, invoice?.invoice_number]);

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
        mfac: med.manufacturer,
        hsnCode: med.hsn_code,
        hsn: med.hsn_code,
        packSize: med.pack_size,
        pack: med.pack_size,
        rackNo: med.rack_no,
        rack: med.rack_no,
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINT HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  const handlePrint = useCallback(() => {
    setShowPrintModal(true);
  }, []);

  const handleClosePrintModal = useCallback(() => {
    setShowPrintModal(false);
  }, []);

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

      if (newStatus === "CONFIRMED" && currentStatus === "DRAFT") {
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
                <li>Add stock to inventory</li>
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

            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <p className="text-gray-600">
                Amount: ₹
                {parseFloat(invoice.net_amount || 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                Warning: Stock Reversal
              </p>
              <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>
                  All stock added by this invoice will be{" "}
                  <strong>reversed</strong>
                </li>
                <li>
                  This may cause negative stock if items were already sold
                </li>
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
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <p className="text-gray-600">
                Amount: ₹
                {parseFloat(invoice.net_amount || 0).toLocaleString("en-IN")}
              </p>
            </div>
            {currentStatus === "CONFIRMED" && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Stock Reversal Warning
                </p>
                <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>
                    All stock from this invoice will be{" "}
                    <strong>reversed</strong>
                  </li>
                  <li>
                    This action <strong>cannot be undone</strong>
                  </li>
                </ul>
              </div>
            )}
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Cancelled invoices cannot be edited or restored.
            </p>
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
          await purchaseAPI.confirm(invoice.invoice_id);
        } else if (newStatus === "CANCELLED") {
          await purchaseAPI.cancel(
            invoice.invoice_id,
            "Cancelled by Super Admin",
          );
        } else if (newStatus === "DRAFT") {
          // FIXED: Strictly invokes transaction-safe POST /purchase/:invoiceId/revert
          await purchaseAPI.revertToDraft(invoice.invoice_id);
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

      const invoiceNumber = invoice.invoice_number;
      const netAmount = parseFloat(invoice.net_amount) || 0;
      const currentPaid = parseFloat(invoice.paid_amount) || 0;
      const rawBalance = netAmount - currentPaid;

      setShowPaymentStatusMenu(false);

      let confirmMessage = null;
      let confirmTitle = "";
      let confirmType = "warning";
      let confirmButtonText = "";

      if (newStatus === "PAID") {
        confirmTitle = "Mark as Paid";
        confirmButtonText = "Mark as Paid";
        confirmMessage = (
          <div className="space-y-3">
            <p>
              You are marking this invoice as <strong>fully paid</strong>.
            </p>
            <div className="bg-emerald-50 p-3 rounded border border-emerald-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(netAmount)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Previously Paid:</span>
                <span>{formatCurrency(currentPaid)}</span>
              </div>
              <div className="flex justify-between mt-1 pt-1 border-t border-emerald-200">
                <span className="text-gray-600">To be Marked:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(netAmount - currentPaid)}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                This will set paid amount to the full invoice amount and balance
                to zero.
              </p>
            </div>
          </div>
        );
      } else if (newStatus === "UNPAID") {
        confirmTitle = "Mark as Unpaid";
        confirmButtonText = "Mark as Unpaid";
        confirmType = "danger";
        confirmMessage = (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <Shield className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-800">
                  Revert Payment Status
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This will mark the invoice as unpaid and reset paid amount to
                  zero.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Current Paid Amount:</span>
                <span className="text-red-600 line-through">
                  {formatCurrency(currentPaid)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">New Paid Amount:</span>
                <span className="font-bold">₹0.00</span>
              </div>
            </div>

            <p className="text-sm text-amber-600 font-medium">
              ⚠️ This action should only be used for corrections.
            </p>
          </div>
        );
      } else if (newStatus === "PARTIALLY_PAID") {
        if (rawBalance <= PAYMENT_BALANCE_THRESHOLD && currentPaid > 0) {
          confirmTitle = "Cannot Set Partially Paid";
          confirmButtonText = "Understood";
          confirmType = "warning";
          confirmMessage = (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-amber-800">
                    Balance Below Threshold
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Current balance (₹{rawBalance.toFixed(2)}) is ≤ ₹
                    {PAYMENT_BALANCE_THRESHOLD} threshold.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
                <p className="text-blue-800">
                  The system automatically treats small balances (≤₹
                  {PAYMENT_BALANCE_THRESHOLD}) as fully paid to handle rounding
                  differences.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                To set as partially paid, the balance must be greater than ₹
                {PAYMENT_BALANCE_THRESHOLD}.
              </p>
            </div>
          );

          setConfirmDialog({
            isOpen: true,
            type: confirmType,
            title: confirmTitle,
            message: confirmMessage,
            confirmText: confirmButtonText,
            onConfirm: () => {
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            },
          });
          return;
        }

        confirmTitle = "Mark as Partially Paid";
        confirmButtonText = "Update Status";
        confirmMessage = (
          <div className="space-y-3">
            <p>
              You are marking this invoice as <strong>partially paid</strong>.
            </p>
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
              <p className="font-semibold text-gray-900">
                Invoice: {invoiceNumber}
              </p>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Total Amount:</span>
                <span>{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-amber-700">
                  {formatCurrency(rawBalance)}
                </span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Note: If balance falls to ≤₹{PAYMENT_BALANCE_THRESHOLD},
                  status will auto-upgrade to PAID.
                </p>
              </div>
            </div>
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
            await performPaymentStatusChange(newStatus);
          },
        });
      }
    },
    [invoice, isSuperAdmin, mode],
  );

  const performPaymentStatusChange = useCallback(
    async (newStatus) => {
      setIsChangingPaymentStatus(true);

      try {
        const netAmount = parseFloat(invoice.net_amount) || 0;
        const currentPaid = parseFloat(invoice.paid_amount) || 0;

        const payload = {
          payment_status: newStatus,
          payment_mode: "CASH",
        };

        if (newStatus === "PAID") {
          payload.paid_amount = netAmount;
        } else if (newStatus === "UNPAID") {
          payload.paid_amount = 0;
        }

        await purchaseAPI.updatePaymentStatus(invoice.invoice_id, payload);

        const newBalance =
          newStatus === "PAID"
            ? 0
            : newStatus === "UNPAID"
              ? netAmount
              : netAmount - currentPaid;

        const effectiveStatus =
          newBalance <= PAYMENT_BALANCE_THRESHOLD && currentPaid > 0
            ? "PAID"
            : newStatus;

        const statusLabels = {
          PAID: "marked as paid",
          UNPAID: "marked as unpaid",
          PARTIALLY_PAID: "marked as partially paid",
        };

        let toastMessage = `Invoice ${invoice.invoice_number} has been ${statusLabels[effectiveStatus]}.`;

        if (newStatus === "PARTIALLY_PAID" && effectiveStatus === "PAID") {
          toastMessage += ` (Balance was ≤₹${PAYMENT_BALANCE_THRESHOLD}, auto-upgraded to PAID)`;
        }

        toast.success("Payment Status Updated", toastMessage);

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
          const response = await purchaseAPI.getReturnById(
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
  // APPROVED RETURNS ERROR HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  const handleApprovedReturnsError = useCallback(
    (errorData) => {
      const errorMessage = errorData.message || "";

      let returnNumbers = [];
      let returnReasons = [];

      if (linkedReturns.length > 0) {
        returnNumbers = linkedReturns.map((ret) => ret.invoice_number);
        returnReasons = linkedReturns.map(
          (ret) => ret.return_reason || "APPROVED",
        );
      } else {
        const returnNumberMatch = errorMessage.match(
          /return\(s\):\s*([A-Z0-9-,\s]+)\./,
        );
        returnNumbers = returnNumberMatch
          ? returnNumberMatch[1].split(",").map((s) => s.trim())
          : [];

        const reasonMatch = errorMessage.match(/Reason\(s\):\s*([A-Z_,\s]+)\./);
        returnReasons = reasonMatch
          ? reasonMatch[1].split(",").map((s) => s.trim().replace(/_/g, " "))
          : [];
      }

      setConfirmDialog({
        isOpen: true,
        type: "danger",
        title: "Cannot Edit Invoice with Approved Returns",
        message: (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 text-base">
                  Editing Blocked
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  This invoice cannot be edited because it has approved
                  return(s) linked to it.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Invoice Details
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {invoice.invoice_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span className="font-medium text-gray-900">
                    {invoice.supplier?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(invoice.net_amount)}
                  </span>
                </div>
              </div>
            </div>

            {returnNumbers.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={16} className="text-amber-600" />
                  <span className="font-semibold text-amber-900">
                    Linked Returns ({returnNumbers.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {returnNumbers.map((returnNumber, index) => (
                    <div
                      key={returnNumber}
                      className="flex items-center justify-between p-2 bg-white rounded border border-amber-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {returnNumber}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
                        {returnReasons[index] || "APPROVED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-1">
                    Why can't I edit this invoice?
                  </p>
                  <p className="opacity-90">
                    Approved returns have already deducted stock from inventory.
                    Editing the original invoice would create stock
                    inconsistencies and accounting errors.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2
                  size={16}
                  className="text-green-600 shrink-0 mt-0.5"
                />
                <h5 className="font-semibold text-green-900">Solutions:</h5>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-green-800 ml-4">
                <li>
                  <strong>Cancel the return(s) first</strong>
                  <p className="text-xs opacity-90 ml-5 mt-1">
                    Go to Purchase Returns → Find {returnNumbers.join(", ")} →
                    Cancel Return → Then edit this invoice
                  </p>
                </li>
                <li>
                  <strong>Create a new purchase invoice</strong>
                  <p className="text-xs opacity-90 ml-5 mt-1">
                    Instead of editing, create a fresh invoice with the correct
                    quantities
                  </p>
                </li>
                <li>
                  <strong>Contact support</strong>
                  <p className="text-xs opacity-90 ml-5 mt-1">
                    If you need assistance with complex adjustments
                  </p>
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  window.location.href = "/purchase-returns";
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg"
              >
                <Package size={18} />
                View Returns
              </button>
              <button
                onClick={() => {
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  window.location.href = "/purchase-billing";
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-lg"
              >
                <Plus size={18} />
                New Invoice
              </button>
            </div>
          </div>
        ),
        confirmText: "Close",
        cancelText: "",
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    },
    [invoice, formatCurrency, setConfirmDialog, linkedReturns],
  );

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
        mfac: product.manufacturer || product.mfac || "",
        hsn: product.hsnCode || product.hsn || "",
        pack: product.packSize || product.pack || "",
        rack: product.rackNo || product.rack || "",
        cgstPercent: product.cgstPercent || "6",
        sgstPercent: product.sgstPercent || "6",
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
  // SAVE HANDLER - Block if returns exist
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSave = useCallback(async () => {
    if (hasLinkedReturns) {
      toast.error(
        "Cannot Save",
        `This invoice has ${linkedReturnCount} linked return(s). Cancel them first to enable editing.`,
      );
      return;
    }

    const filledRows = editRows.filter(
      (r) => r.name && r.qty && parseFloat(r.qty) > 0,
    );

    if (filledRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return;
    }

    const missingMedicines = filledRows.filter((r) => !r.medicine_id);
    if (missingMedicines.length > 0) {
      toast.warning(
        "Invalid Products",
        `${missingMedicines.length} product(s) not found. Please select from dropdown.`,
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
                  Current stock will be <strong>reversed</strong>
                </li>
                <li>
                  New stock based on updated quantities will be{" "}
                  <strong>added</strong>
                </li>
                <li>
                  Action is <strong>logged in audit trail</strong>
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
              <p className="font-medium text-gray-900">
                Invoice: {invoice.invoice_number}
              </p>
              <p>Original Items: {invoice.lineItems?.length || 0}</p>
              <p>Updated Items: {filledRows.length}</p>
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
  }, [editRows, invoice, toast, hasLinkedReturns, linkedReturnCount]);

  const performSave = useCallback(
    async (filledRows) => {
      setIsSaving(true);

      try {
        const parseExpiryDate = (expString) => {
          if (!expString || !/^\d{2}\/\d{2}$/.test(expString)) {
            const defaultDate = new Date();
            defaultDate.setFullYear(defaultDate.getFullYear() + 1);
            return defaultDate.toISOString();
          }
          const [month, year] = expString.split("/");
          const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
          const date = new Date(`${fullYear}-${month}-01`);
          date.setMonth(date.getMonth() + 1);
          date.setDate(0);
          return date.toISOString();
        };

        const toISODateTime = (dateStr) => {
          if (!dateStr) return null;
          if (typeof dateStr === "string" && dateStr.includes("T"))
            return dateStr;
          if (dateStr instanceof Date) return dateStr.toISOString();
          if (
            typeof dateStr === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
          )
            return `${dateStr}T00:00:00.000Z`;
          try {
            return new Date(dateStr).toISOString();
          } catch {
            return null;
          }
        };

        const lineItems = filledRows.map((row) => ({
          medicine_id: row.medicine_id,
          batch_number: row.batch || `BATCH-${Date.now()}`,
          expiry_date: parseExpiryDate(row.exp),
          manufacturing_date: null,
          quantity: parseFloat(row.qty) || 1,
          free_quantity: parseFloat(row.sch || row.pQty) || 0,
          pack_size: row.pack || null,
          unit_of_measure: "UNIT",
          purchase_rate: parseFloat(row.price) || 0.01,
          mrp: parseFloat(row.mrp) || 0.01,
          scheme_discount: parseFloat(row.schemePercent) || 0,
          trade_discount: parseFloat(row.discountPercent) || 0,
          cgst_percent: parseFloat(row.cgstPercent) || 0,
          sgst_percent: parseFloat(row.sgstPercent) || 0,
          igst_percent: 0,
          selling_rate: parseFloat(row.sRate) || null,
          margin_percent: null,
          rack_no: row.rack || null,
        }));

        const payload = {
          supplier_invoice_no: invoice.supplier_invoice_no || null,
          invoice_date: toISODateTime(invoice.invoice_date),
          due_date: toISODateTime(invoice.due_date),
          received_date: toISODateTime(invoice.received_date),
          payment_mode: invoice.payment_mode || null,
          paid_amount: parseFloat(invoice.paid_amount) || null,
          transport_charges: parseFloat(invoice.transport_charges) || null,
          other_charges: parseFloat(invoice.other_charges) || null,
          remarks: invoice.remarks || null,
          lineItems,
        };

        await purchaseAPI.update(invoice.invoice_id, payload);

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
          handleApprovedReturnsError(error.response.data);
          return;
        }

        let errorMessage = "Failed to update invoice";
        if (error.response?.data?.message)
          errorMessage = error.response.data.message;
        toast.error("Update Failed", errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [invoice, toast, onRefresh, onClose, handleApprovedReturnsError],
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
    const totalFree = editRows.reduce(
      (s, r) => s + (Number(r.sch || r.pQty) || 0),
      0,
    );

    return {
      subTotal: +taxable.toFixed(2),
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      total: +(taxable + cgst + sgst).toFixed(2),
      totalItems,
      totalQty,
      totalFree,
    };
  }, [editRows]);

  const getStatusMenuOptions = useCallback(() => {
    const currentStatusValue = invoice?.status?.toUpperCase();
    const options = [];

    if (currentStatusValue === "DRAFT") {
      options.push({
        value: "CONFIRMED",
        label: "Confirm Invoice",
        icon: CheckCircle2,
        description: "Add stock to inventory",
      });
      options.push({
        value: "CANCELLED",
        label: "Cancel Invoice",
        icon: Ban,
        description: "Cancel without adding stock",
      });
    } else if (currentStatusValue === "CONFIRMED") {
      options.push({
        value: "DRAFT",
        label: "Revert to Draft",
        icon: RotateCcw,
        description: "Reverse stock and unlock for editing",
      });
      options.push({
        value: "CANCELLED",
        label: "Cancel Invoice",
        icon: Ban,
        description: "Reverse stock and cancel",
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
  const effectivePaymentStatus = effectivePaymentDisplay.effectiveStatus;

  const StatusIcon = currentStatus.icon;
  const PaymentIcon = currentPayment.icon;

  const totalQty =
    invoice.lineItems?.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    ) || 0;
  const totalFree =
    invoice.lineItems?.reduce(
      (sum, item) => sum + (parseFloat(item.free_quantity) || 0),
      0,
    ) || 0;
  const itemCount = invoice.lineItems?.length || 0;

  const isSaveDisabled = isSaving || hasLinkedReturns;

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

            {/* HEADER */}
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
                            <span>Purchase Invoice</span>
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
                    <button
                      ref={statusButtonRef}
                      onClick={() =>
                        canChangeStatus && setShowStatusMenu(!showStatusMenu)
                      }
                      disabled={!canChangeStatus}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                        ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}
                        ${canChangeStatus ? `cursor-pointer ${currentStatus.hoverBg} hover:shadow-md active:scale-95` : "cursor-default"}
                      `}
                    >
                      <StatusIcon size={12} />
                      {currentStatus.label}
                      {canChangeStatus && (
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${showStatusMenu ? "rotate-180" : ""}`}
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

                    <button
                      ref={paymentStatusButtonRef}
                      onClick={() =>
                        canChangePaymentStatus &&
                        setShowPaymentStatusMenu(!showPaymentStatusMenu)
                      }
                      disabled={!canChangePaymentStatus}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                        ${currentPayment.bg} ${currentPayment.text} ${currentPayment.border || "border-current/30"}
                        ${canChangePaymentStatus ? `cursor-pointer ${currentPayment.hoverBg} hover:shadow-md active:scale-95` : "cursor-default"}
                      `}
                    >
                      <PaymentIcon size={12} />
                      {currentPayment.label}
                      {effectivePaymentDisplay.showBalance && (
                        <span className="text-[10px] opacity-75 ml-0.5">
                          ({formatCurrency(effectivePaymentDisplay.balance)})
                        </span>
                      )}
                      {effectivePaymentDisplay.thresholdApplied && (
                        <span
                          className="text-[10px] opacity-60 ml-0.5"
                          title={`Balance ₹${effectivePaymentDisplay.rawBalance.toFixed(2)} ≤ ₹${PAYMENT_BALANCE_THRESHOLD} threshold`}
                        >
                          ≈
                        </span>
                      )}
                      {canChangePaymentStatus && (
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${showPaymentStatusMenu ? "rotate-180" : ""}`}
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

                    {loadingReturns && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Loader2 size={10} className="animate-spin" />
                        Loading returns...
                      </span>
                    )}

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
                          onClick={handlePrint}
                          className="p-2.5 rounded-xl bg-[#000060]/5 hover:bg-[#000060]/10 text-[#000060] transition-all border border-[#000060]/10"
                          title="Print Invoice"
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

                        {hasLinkedReturns && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-xl border border-red-300 animate-pulse">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span className="text-xs font-semibold">
                              {linkedReturnCount} return
                              {linkedReturnCount > 1 ? "s" : ""} must be
                              cancelled
                            </span>
                          </div>
                        )}

                        <button
                          onClick={handleSave}
                          disabled={isSaveDisabled}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-lg ${
                            hasLinkedReturns
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                              : isConfirmed
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-[#000060] hover:bg-[#000060]/90 text-white"
                          }`}
                          title={
                            hasLinkedReturns
                              ? `Cannot save: ${linkedReturnCount} return(s) must be cancelled first`
                              : "Save changes"
                          }
                        >
                          {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : hasLinkedReturns ? (
                            <Ban size={16} />
                          ) : (
                            <Save size={16} />
                          )}
                          <span className="text-sm font-medium">
                            {isSaving
                              ? "Saving..."
                              : hasLinkedReturns
                                ? "Save Blocked"
                                : "Save Changes"}
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
                {invoice.supplier_invoice_no && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-[#000060]/40" />
                      <span className="font-mono">
                        {invoice.supplier_invoice_no}
                      </span>
                    </div>
                  </>
                )}
                {invoice.supplier && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-[#000060]/40" />
                      <span>{invoice.supplier.name}</span>
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
                {mode === "edit" && isConfirmed && !hasLinkedReturns && (
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
                {mode === "edit" && hasLinkedReturns && (
                  <>
                    <span className="text-[#000060]/20">•</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-red-700">
                      <Ban size={12} />
                      <span className="text-xs font-medium">
                        Save blocked: Cancel returns first
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
                totalFree={totalFree}
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
                medicinesLoading={medicinesLoading}
                isConfirmed={isConfirmed}
                formatCurrency={formatCurrency}
                onRowChange={handleRowChange}
                onProductSelect={handleProductSelect}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                tableBodyRef={tableBodyRef}
                onCreateReturn={() => setCreateReturnModal(true)}
                showCreateReturnButton={showCreateReturnButton}
                onViewReturn={handleViewReturn}
                hasLinkedReturns={hasLinkedReturns}
                linkedReturnCount={linkedReturnCount}
              />
            )}
          </motion.div>

          {/* Print Invoice Modal */}
          <PrintInvoiceModal
            open={showPrintModal}
            onClose={handleClosePrintModal}
            invoice={invoice}
            companyInfo={companyInfo}
          />

          {/* View Return Modal */}
          {showReturnModal && selectedReturn && (
            <ViewReturnModal
              open={showReturnModal}
              onClose={handleCloseReturnModal}
              returnInvoice={selectedReturn}
              onApprove={() => {
                handleCloseReturnModal();
                onRefresh?.();
                toast.success(
                  "Return Approved",
                  "Stock has been deducted and credit note generated.",
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

          <CreateReturnModal
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
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewInvoiceModal;