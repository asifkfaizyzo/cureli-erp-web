// pharmacy-web/src/pages/sales/returns/components/CreateSalesReturnModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/returns/components/CreateSalesReturnModal.jsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Package,
  AlertTriangle,
  FileText,
  CreditCard,
  Shield,
  Info,
  Search,
  Trash2,
  IndianRupee,
  Settings,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Hash,
  Loader2,
  Receipt,
} from "lucide-react";
import { useToast } from "../../../../components/common/Toast";
import salesAPI from "../../../../api/sales";
import StyledSelect from "../../../../components/common/StyledSelect";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const BRAND_COLOR = "#000060";

const RETURN_REASONS = [
  {
    value: "CUSTOMER_CHANGED_MIND",
    label: "Customer Changed Mind",
    description: "Customer no longer wants the product",
  },
  {
    value: "DAMAGED_PRODUCT",
    label: "Damaged Product",
    description: "Product was damaged",
  },
  {
    value: "WRONG_ITEM_SOLD",
    label: "Wrong Item Sold",
    description: "Incorrect product was sold",
  },
  {
    value: "EXPIRED_PRODUCT",
    label: "Expired Product",
    description: "Product expired or near expiry",
  },
  {
    value: "QUALITY_ISSUE",
    label: "Quality Issue",
    description: "Product quality not acceptable",
  },
  {
    value: "ALLERGIC_REACTION",
    label: "Allergic Reaction",
    description: "Customer had allergic reaction",
  },
  {
    value: "DOCTOR_ADVISED",
    label: "Doctor Advised Return",
    description: "Doctor advised to stop medication",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other reason (specify in notes)",
  },
];

const ADJUSTMENT_TYPES = [
  {
    value: "CASH_REFUND",
    label: "Cash Refund",
    description: "Immediate cash refund to customer",
    icon: IndianRupee,
    color: "emerald",
  },
  {
    value: "CREDIT_NOTE",
    label: "Customer Credit",
    description: "Generate credit note for future use",
    icon: FileText,
    color: "blue",
  },
  {
    value: "EXCHANGE",
    label: "Exchange",
    description: "Exchange for another product",
    icon: CreditCard,
    color: "violet",
  },
];

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Select Invoice",
    subtitle: "Choose sale to return",
    icon: Receipt,
  },
  {
    id: 2,
    title: "Select Items",
    subtitle: "Choose products to return",
    icon: Package,
  },
  {
    id: 3,
    title: "Return Config",
    subtitle: "Reason & adjustment",
    icon: Settings,
  },
  { id: 4, title: "Review", subtitle: "Verify and submit", icon: CheckCircle2 },
];

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateLineTotal = (item) => {
  const qty = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.sale_rate) || parseFloat(item.unit_price) || 0;
  return qty * rate;
};

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const ANIMATIONS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  },
  modal: {
    hidden: { opacity: 0, scale: 0.96, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: 10,
      transition: { duration: 0.15 },
    },
  },
  content: {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -16, transition: { duration: 0.15 } },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// WORKFLOW STEPPER
// ════════════════════════════════════════════════════════════════════════════

const WorkflowStepper = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div
                  className={`
                    relative w-9 h-9 rounded-full flex items-center justify-center 
                    transition-all duration-300 ease-out
                    ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : isActive
                          ? "bg-[#000060] text-white shadow-lg shadow-[#000060]/25 ring-4 ring-[#000060]/10"
                          : "bg-slate-100 text-slate-400"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    <StepIcon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                </div>

                <div className="hidden md:block">
                  <p
                    className={`text-xs font-semibold transition-colors ${
                      isActive
                        ? "text-[#000060]"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="w-6 md:w-8 h-0.5 mx-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      step.id < currentStep ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 1: INVOICE SELECTION
// ════════════════════════════════════════════════════════════════════════════

const InvoiceSelectionStep = ({ selectedInvoice, onInvoiceSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchInvoices = useCallback(async (query) => {
    if (!query.trim()) {
      setInvoices([]);
      return;
    }

    setLoading(true);
    try {
      const response = await salesAPI.getAll({
        search: query,
        status: "CONFIRMED",
        limit: 20,
      });
      setInvoices(response.data?.invoices || []);
    } catch (error) {
      console.error("Search invoices error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchInvoices(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchInvoices]);

  return (
    <motion.div
      className="space-y-5"
      variants={ANIMATIONS.content}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Select Sales Invoice
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Search and select the original sale invoice for this return
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by invoice number, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
          autoFocus
        />
      </div>

      {/* Selected Invoice */}
      {selectedInvoice && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <p className="font-mono font-bold text-emerald-700">
                  {selectedInvoice.invoice_number}
                </p>
                <p className="text-sm text-emerald-600">
                  {selectedInvoice.customer?.name || "Walk-in Customer"} •{" "}
                  {formatDate(selectedInvoice.invoice_date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-600">Total</p>
              <p className="font-bold text-emerald-700">
                {formatCurrency(selectedInvoice.net_amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2
            size={32}
            className="mx-auto text-slate-400 animate-spin mb-3"
          />
          <p className="text-sm text-slate-500">Searching invoices...</p>
        </div>
      ) : invoices.length > 0 ? (
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
          {invoices.map((invoice) => {
            const isSelected =
              selectedInvoice?.invoice_id === invoice.invoice_id;
            return (
              <div
                key={invoice.invoice_id}
                onClick={() => onInvoiceSelect(invoice)}
                className={`p-4 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono font-semibold text-[#000060]">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {invoice.customer?.name || "Walk-in Customer"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(invoice.net_amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(invoice.invoice_date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : searchQuery ? (
        <div className="py-12 text-center">
          <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            No invoices found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Search size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            Enter invoice number or customer details to search
          </p>
        </div>
      )}

      {!selectedInvoice && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Please select an invoice to continue
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 2: ITEM SELECTION
// ════════════════════════════════════════════════════════════════════════════

const ItemSelectionStep = ({
  invoice,
  selectedItems,
  onItemsChange,
  returnableItems,
}) => {
  const totalAmount = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + calculateLineTotal(item),
      0,
    );
  }, [selectedItems]);

  const totalQuantity = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    );
  }, [selectedItems]);

  const handleToggleItem = useCallback(
    (item) => {
      const key = `${item.medicine_id}-${item.batch_number}`;
      const isSelected = selectedItems.some(
        (si) => `${si.medicine_id}-${si.batch_number}` === key,
      );

      if (isSelected) {
        onItemsChange(
          selectedItems.filter(
            (si) => `${si.medicine_id}-${si.batch_number}` !== key,
          ),
        );
      } else {
        onItemsChange([
          ...selectedItems,
          {
            ...item,
            quantity: 1,
          },
        ]);
      }
    },
    [selectedItems, onItemsChange],
  );

  const handleQuantityChange = useCallback(
    (item, value) => {
      const key = `${item.medicine_id}-${item.batch_number}`;
      const qty = Math.min(
        Math.max(1, parseInt(value) || 1),
        item.returnable_quantity,
      );

      onItemsChange(
        selectedItems.map((si) =>
          `${si.medicine_id}-${si.batch_number}` === key
            ? { ...si, quantity: qty }
            : si,
        ),
      );
    },
    [selectedItems, onItemsChange],
  );

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        onItemsChange(
          returnableItems.map((item) => ({ ...item, quantity: 1 })),
        );
      } else {
        onItemsChange([]);
      }
    },
    [returnableItems, onItemsChange],
  );

  const allSelected =
    returnableItems.length > 0 &&
    selectedItems.length >= returnableItems.length;

  return (
    <motion.div
      className="space-y-5"
      variants={ANIMATIONS.content}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Select Items for Return
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Choose products from invoice{" "}
          <span className="font-mono font-semibold">
            {invoice?.invoice_number}
          </span>
        </p>
      </div>

      {/* Items Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#000060] focus:ring-[#000060]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-24">
                  Batch
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase w-20">
                  Sold
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase w-24">
                  Returnable
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-28">
                  Return Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnableItems.map((item, index) => {
                const key = `${item.medicine_id}-${item.batch_number}`;
                const isSelected = selectedItems.some(
                  (si) => `${si.medicine_id}-${si.batch_number}` === key,
                );
                const selectedItem = selectedItems.find(
                  (si) => `${si.medicine_id}-${si.batch_number}` === key,
                );

                return (
                  <tr
                    key={`${key}-${index}`}
                    className={`transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(item)}
                        className="w-4 h-4 rounded border-slate-300 text-[#000060] focus:ring-[#000060]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 text-sm">
                        {item.medicine?.name || item.name}
                      </p>
                      {item.medicine?.manufacturer && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.medicine.manufacturer}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded">
                        {item.batch_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-900 text-sm">
                        {item.sold_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-emerald-600 font-medium">
                        {item.returnable_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelected ? (
                        <input
                          type="number"
                          min="1"
                          max={item.returnable_quantity}
                          value={selectedItem?.quantity || 1}
                          onChange={(e) =>
                            handleQuantityChange(selectedItem, e.target.value)
                          }
                          className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
                        />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold text-sm ${isSelected ? "text-[#000060]" : "text-slate-400"}`}
                      >
                        {isSelected
                          ? formatCurrency(calculateLineTotal(selectedItem))
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {returnableItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package
                      size={40}
                      className="mx-auto text-slate-300 mb-3"
                    />
                    <p className="text-slate-500">No returnable items found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      All items may have already been returned
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {selectedItems.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Selected Items</p>
                  <p className="font-semibold text-slate-900">
                    {selectedItems.length}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Hash size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Quantity</p>
                  <p className="font-semibold text-slate-900">
                    {totalQuantity}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5">
                Total Return Value
              </p>
              <p className="text-xl font-bold text-[#000060]">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Validation Warning */}
      {selectedItems.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">No items selected</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Please select at least one item to proceed
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 3: RETURN CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const ReturnConfigurationStep = ({
  returnReason,
  onReasonChange,
  reasonNotes,
  onNotesChange,
  adjustmentType,
  onAdjustmentChange,
  refundNotes,
  onRefundNotesChange,
}) => {
  const selectedReason = RETURN_REASONS.find((r) => r.value === returnReason);
  const selectedAdjustment = ADJUSTMENT_TYPES.find(
    (a) => a.value === adjustmentType,
  );

  const isReasonValid =
    returnReason && (returnReason !== "OTHER" || reasonNotes.trim());
  const isAdjustmentValid = !!adjustmentType;

  return (
    <motion.div
      className="space-y-6"
      variants={ANIMATIONS.content}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Configure Return Details
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Specify the reason for return and how the refund should be processed
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Return Reason Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isReasonValid ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                {isReasonValid ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={18} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Return Reason</p>
                <p className="text-xs text-slate-500">
                  Why is the customer returning?
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <StyledSelect
              label="Select Reason"
              value={returnReason}
              onChange={onReasonChange}
              options={RETURN_REASONS}
              placeholder="Choose return reason..."
              error={!returnReason ? "Required" : ""}
            />

            {selectedReason && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  {selectedReason.description}
                </p>
              </div>
            )}

            {returnReason === "OTHER" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Specify Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Please provide details..."
                  rows={3}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm resize-none transition-all
                    ${
                      !reasonNotes.trim()
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-300 focus:ring-[#000060]/20 focus:border-[#000060]"
                    }`}
                />
              </div>
            )}

            {returnReason && returnReason !== "OTHER" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Additional Notes{" "}
                  <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Payment Adjustment Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isAdjustmentValid ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                {isAdjustmentValid ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <CreditCard size={18} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Refund Method</p>
                <p className="text-xs text-slate-500">
                  How should we process the refund?
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <StyledSelect
              label="Adjustment Type"
              value={adjustmentType}
              onChange={onAdjustmentChange}
              options={ADJUSTMENT_TYPES}
              placeholder="Choose refund method..."
              error={!adjustmentType ? "Required" : ""}
            />

            {selectedAdjustment && (
              <div
                className={`p-4 rounded-lg border ${
                  selectedAdjustment.color === "emerald"
                    ? "bg-emerald-50 border-emerald-200"
                    : selectedAdjustment.color === "blue"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-violet-50 border-violet-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {React.createElement(selectedAdjustment.icon, {
                    size: 20,
                    className:
                      selectedAdjustment.color === "emerald"
                        ? "text-emerald-600"
                        : selectedAdjustment.color === "blue"
                          ? "text-blue-600"
                          : "text-violet-600",
                  })}
                  <div>
                    <p
                      className={`font-medium ${
                        selectedAdjustment.color === "emerald"
                          ? "text-emerald-800"
                          : selectedAdjustment.color === "blue"
                            ? "text-blue-800"
                            : "text-violet-800"
                      }`}
                    >
                      {selectedAdjustment.label}
                    </p>
                    <p
                      className={`text-sm mt-0.5 ${
                        selectedAdjustment.color === "emerald"
                          ? "text-emerald-700"
                          : selectedAdjustment.color === "blue"
                            ? "text-blue-700"
                            : "text-violet-700"
                      }`}
                    >
                      {selectedAdjustment.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {adjustmentType === "CASH_REFUND" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Refund Details{" "}
                  <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => onRefundNotesChange(e.target.value)}
                  placeholder="Payment method, reference number, etc..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {(!isReasonValid || !isAdjustmentValid) && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">
              Configuration incomplete
            </p>
            <p className="text-sm text-amber-600 mt-0.5">
              {!isReasonValid && !isAdjustmentValid
                ? "Please select both return reason and refund method"
                : !isReasonValid
                  ? "Please select a return reason"
                  : "Please select a refund method"}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 4: REVIEW & CONFIRM
// ════════════════════════════════════════════════════════════════════════════

const ReviewConfirmStep = ({
  invoice,
  selectedItems,
  returnReason,
  reasonNotes,
  adjustmentType,
  refundNotes,
  isSuperAdmin,
  autoApprove,
  onAutoApproveChange,
}) => {
  const totalAmount = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + calculateLineTotal(item),
      0,
    );
  }, [selectedItems]);

  const totalQuantity = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    );
  }, [selectedItems]);

  const selectedReasonLabel = RETURN_REASONS.find(
    (r) => r.value === returnReason,
  )?.label;
  const selectedAdjustment = ADJUSTMENT_TYPES.find(
    (a) => a.value === adjustmentType,
  );

  return (
    <motion.div
      className="space-y-5"
      variants={ANIMATIONS.content}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Review & Confirm Return
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Please verify all details before submitting
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={16} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">
              Invoice
            </span>
          </div>
          <p className="font-mono font-bold text-[#000060]">
            {invoice?.invoice_number}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">
              Customer
            </span>
          </div>
          <p className="font-semibold text-slate-900 truncate">
            {invoice?.customer?.name || "Walk-in Customer"}
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-blue-600 uppercase">
              Items
            </span>
          </div>
          <p className="font-bold text-blue-700">
            {selectedItems.length} items{" "}
            <span className="font-normal text-blue-600">
              ({totalQuantity} qty)
            </span>
          </p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 uppercase">
              Amount
            </span>
          </div>
          <p className="font-bold text-emerald-700">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <p className="font-semibold text-slate-900 text-sm">
            Items Being Returned
          </p>
        </div>
        <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
          {selectedItems.map((item, index) => (
            <div
              key={`review-${item.medicine_id}-${item.batch_number}-${index}`}
              className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {item.medicine?.name || item.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Batch: <span className="font-mono">{item.batch_number}</span>
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Qty</p>
                  <p className="font-semibold text-slate-900">
                    {item.quantity}
                  </p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-[#000060]">
                    {formatCurrency(calculateLineTotal(item))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                Return Reason
              </p>
              <p className="font-semibold text-slate-900">
                {selectedReasonLabel}
              </p>
              {reasonNotes && (
                <p className="text-sm text-slate-600 mt-1 truncate">
                  "{reasonNotes}"
                </p>
              )}
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            selectedAdjustment?.color === "emerald"
              ? "bg-emerald-50 border-emerald-200"
              : selectedAdjustment?.color === "blue"
                ? "bg-blue-50 border-blue-200"
                : "bg-violet-50 border-violet-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                selectedAdjustment?.color === "emerald"
                  ? "bg-emerald-100"
                  : selectedAdjustment?.color === "blue"
                    ? "bg-blue-100"
                    : "bg-violet-100"
              }`}
            >
              {selectedAdjustment &&
                React.createElement(selectedAdjustment.icon, {
                  size: 18,
                  className:
                    selectedAdjustment.color === "emerald"
                      ? "text-emerald-600"
                      : selectedAdjustment.color === "blue"
                        ? "text-blue-600"
                        : "text-violet-600",
                })}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                  selectedAdjustment?.color === "emerald"
                    ? "text-emerald-600"
                    : selectedAdjustment?.color === "blue"
                      ? "text-blue-600"
                      : "text-violet-600"
                }`}
              >
                Refund Method
              </p>
              <p className="font-semibold text-slate-900">
                {selectedAdjustment?.label}
              </p>
              {refundNotes && (
                <p className="text-sm text-slate-600 mt-1 truncate">
                  "{refundNotes}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Super Admin Toggle */}
      {isSuperAdmin && (
        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-violet-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Shield size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-violet-900">
                  Auto-Approve Return
                </p>
                <p className="text-sm text-violet-700 mt-0.5">
                  {autoApprove
                    ? "Return will be approved immediately, stock will be restored"
                    : "Return will require separate approval"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => onAutoApproveChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 shadow-inner"></div>
            </label>
          </div>
        </div>
      )}

      {/* Non-Super Admin Info */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Approval Required</p>
            <p className="text-sm text-amber-600 mt-0.5">
              This return will be submitted for approval. Stock will not be
              affected until approved.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const CreateSalesReturnModal = ({
  open,
  onClose,
  onSuccess,
  isSuperAdmin = false,
}) => {
  const toast = useToast();

  // Workflow State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Invoice Selection
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnableItems, setReturnableItems] = useState([]);

  // Step 2 - Items
  const [selectedItems, setSelectedItems] = useState([]);

  // Step 3 - Configuration
  const [returnReason, setReturnReason] = useState("");
  const [reasonNotes, setReasonNotes] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("");
  const [refundNotes, setRefundNotes] = useState("");

  // Step 4 - Review
  const [autoApprove, setAutoApprove] = useState(isSuperAdmin);

  // Load returnable items when invoice is selected
  const loadReturnableItems = useCallback(
    async (invoice) => {
      try {
        const response = await salesAPI.getReturnableItems(invoice.invoice_id);
        setReturnableItems(response.data?.items || []);
      } catch (error) {
        console.error("Failed to load returnable items:", error);
        toast.error(
          "Failed to load returnable items",
          error.response?.data?.message || error.message,
        );
      }
    },
    [toast],
  );

  const handleInvoiceSelect = useCallback(
    async (invoice) => {
      setSelectedInvoice(invoice);
      setSelectedItems([]);
      await loadReturnableItems(invoice);
    },
    [loadReturnableItems],
  );

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSelectedInvoice(null);
      setReturnableItems([]);
      setSelectedItems([]);
      setReturnReason("");
      setReasonNotes("");
      setAdjustmentType("");
      setRefundNotes("");
      setAutoApprove(isSuperAdmin);
    }
  }, [open, isSuperAdmin]);

  // Step Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selectedInvoice !== null;
      case 2:
        return (
          selectedItems.length > 0 &&
          selectedItems.every((item) => item.quantity > 0)
        );
      case 3:
        return (
          returnReason &&
          adjustmentType &&
          (returnReason !== "OTHER" || reasonNotes.trim())
        );
      case 4:
        return true;
      default:
        return false;
    }
  }, [
    currentStep,
    selectedInvoice,
    selectedItems,
    returnReason,
    reasonNotes,
    adjustmentType,
  ]);

  // Navigation
  const handleNext = useCallback(() => {
    if (canProceed && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Submit Handler
  const handleSubmit = async () => {
    if (!canProceed || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        original_invoice_id: selectedInvoice.invoice_id,
        customer_id: selectedInvoice.customer_id || null,
        return_reason: returnReason,
        return_reason_notes: reasonNotes.trim() || null,
        adjustment_type: adjustmentType,
        refund_notes: refundNotes.trim() || null,
        return_date: new Date().toISOString(),
        remarks: null,
        auto_approve: autoApprove && isSuperAdmin,
        lineItems: selectedItems.map((item) => ({
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          quantity: parseFloat(item.quantity) || 1,
          sale_rate:
            parseFloat(item.sale_rate) || parseFloat(item.unit_price) || 0,
          mrp: parseFloat(item.mrp) || 0,
          cgst_percent: parseFloat(item.cgst_percent) || 0,
          sgst_percent: parseFloat(item.sgst_percent) || 0,
        })),
      };

      const response = await salesAPI.createReturn(payload);
      const returnData = response.data;
      const wasAutoApproved = returnData.return_approval_status === "APPROVED";

      toast.success(
        "Return Created Successfully",
        wasAutoApproved
          ? `Return ${returnData.return_number} has been approved and stock has been restored.`
          : `Return ${returnData.return_number} has been submitted for approval.`,
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Create return error:", error);

      let errorMessage = error.response?.data?.message || error.message;
      if (error.response?.data?.data?.issues) {
        const issues = error.response.data.data.issues;
        errorMessage = issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
      }

      toast.error("Failed to Create Return", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close handler
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            variants={ANIMATIONS.backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              maxHeight: "min(90vh, 850px)",
              minHeight: "min(600px, 90vh)",
            }}
            variants={ANIMATIONS.modal}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-[#000060] to-[#000080] border-b border-[#000060]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <Package size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Create Sales Return
                    </h2>
                    <p className="text-sm text-white/70 mt-0.5">
                      Step {currentStep} of {WORKFLOW_STEPS.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Workflow Stepper */}
            <div className="shrink-0 px-6 py-4 bg-slate-50 border-b border-slate-200">
              <WorkflowStepper
                currentStep={currentStep}
                steps={WORKFLOW_STEPS}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <InvoiceSelectionStep
                    key="step-1"
                    selectedInvoice={selectedInvoice}
                    onInvoiceSelect={handleInvoiceSelect}
                  />
                )}
                {currentStep === 2 && (
                  <ItemSelectionStep
                    key="step-2"
                    invoice={selectedInvoice}
                    selectedItems={selectedItems}
                    onItemsChange={setSelectedItems}
                    returnableItems={returnableItems}
                  />
                )}
                {currentStep === 3 && (
                  <ReturnConfigurationStep
                    key="step-3"
                    returnReason={returnReason}
                    onReasonChange={setReturnReason}
                    reasonNotes={reasonNotes}
                    onNotesChange={setReasonNotes}
                    adjustmentType={adjustmentType}
                    onAdjustmentChange={setAdjustmentType}
                    refundNotes={refundNotes}
                    onRefundNotesChange={setRefundNotes}
                  />
                )}
                {currentStep === 4 && (
                  <ReviewConfirmStep
                    key="step-4"
                    invoice={selectedInvoice}
                    selectedItems={selectedItems}
                    returnReason={returnReason}
                    reasonNotes={reasonNotes}
                    adjustmentType={adjustmentType}
                    refundNotes={refundNotes}
                    isSuperAdmin={isSuperAdmin}
                    autoApprove={autoApprove}
                    onAutoApproveChange={setAutoApprove}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <div className="flex items-center gap-3">
                  {/* Cancel Button */}
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 shadow-sm"
                  >
                    Cancel
                  </button>

                  {/* Next / Submit Button */}
                  {currentStep < 4 ? (
                    <button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#000060] text-white font-medium text-sm hover:bg-[#000080] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#000060]/25"
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canProceed || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating Return...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Submit Return
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default CreateSalesReturnModal;
