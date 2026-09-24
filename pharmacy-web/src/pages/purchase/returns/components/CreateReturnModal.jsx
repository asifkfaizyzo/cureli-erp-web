// pharmacy-web/src/pages/purchase/returns/components/CreateReturnModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/returns/components/CreateReturnModal.jsx

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
  Plus,
  Trash2,
  IndianRupee,
  Settings,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Hash,
  Loader2,
} from "lucide-react";
import { useToast } from "../../../../components/common/Toast";
import purchaseAPI from "../../../../api/purchase";
import inventoryAPI from "../../../../api/inventory";
import StyledSelect from "../../../../components/common/StyledSelect";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

const BRAND_COLOR = "#000060";

const RETURN_REASONS = [
  {
    value: "DAMAGED_GOODS",
    label: "Damaged Goods",
    description: "Items received in damaged condition",
  },
  {
    value: "EXPIRED_GOODS",
    label: "Expired Goods",
    description: "Products expired or near expiry",
  },
  {
    value: "WRONG_ITEM_RECEIVED",
    label: "Wrong Item Received",
    description: "Incorrect product delivered",
  },
  {
    value: "QUALITY_ISSUE",
    label: "Quality Issue",
    description: "Product quality not acceptable",
  },
  {
    value: "EXCESS_STOCK",
    label: "Excess Stock",
    description: "Over-ordered items",
  },
  {
    value: "PRICE_DIFFERENCE",
    label: "Price Difference",
    description: "Billing discrepancy",
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
    description: "Immediate cash refund from supplier",
    icon: IndianRupee,
    color: "emerald",
  },
  {
    value: "CREDIT_NOTE",
    label: "Credit Note",
    description: "Generate credit note (valid for 1 year)",
    icon: FileText,
    color: "blue",
  },
  {
    value: "OFFSET_NEXT_PURCHASE",
    label: "Offset Next Purchase",
    description: "Adjust against future purchases",
    icon: CreditCard,
    color: "violet",
  },
];

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Select Items",
    subtitle: "Choose products to return",
    icon: Package,
  },
  {
    id: 2,
    title: "Return Configuration",
    subtitle: "Reason & adjustment details",
    icon: Settings,
  },
  {
    id: 3,
    title: "Review & Confirm",
    subtitle: "Verify and submit",
    icon: CheckCircle2,
  },
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
  const rate = parseFloat(item.purchase_rate) || 0;
  const cgst = parseFloat(item.cgst_percent) || 0;
  const sgst = parseFloat(item.sgst_percent) || 0;
  const subtotal = qty * rate;
  const taxAmount = subtotal * ((cgst + sgst) / 100);
  return subtotal + taxAmount;
};

const toISOString = (dateValue) => {
  if (!dateValue) return new Date().toISOString();
  if (typeof dateValue === "string") {
    return dateValue.includes("T")
      ? dateValue
      : new Date(dateValue).toISOString();
  }
  return dateValue instanceof Date
    ? dateValue.toISOString()
    : new Date().toISOString();
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
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// WORKFLOW STEPPER COMPONENT
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
              {/* Step */}
              <div className="flex items-center gap-3">
                <div
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center 
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
                    <Check size={18} strokeWidth={2.5} />
                  ) : (
                    <StepIcon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                </div>

                <div className="hidden lg:block">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-[#000060]"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400">{step.subtitle}</p>
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="w-8 lg:w-12 h-0.5 mx-1">
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
// INVOICE HEADER CARD
// ════════════════════════════════════════════════════════════════════════════

const InvoiceHeaderCard = ({ invoice }) => (
  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/80">
    <div className="w-12 h-12 rounded-xl bg-[#000060]/10 flex items-center justify-center">
      <FileText size={22} className="text-[#000060]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Source Invoice
        </span>
      </div>
      <p className="font-mono font-bold text-[#000060] text-lg">
        {invoice.invoice_number}
      </p>
    </div>
    <div className="hidden sm:flex items-center gap-6 text-sm">
      <div className="text-right">
        <p className="text-xs text-slate-500 mb-0.5">Supplier</p>
        <p className="font-semibold text-slate-700">{invoice.supplier?.name}</p>
      </div>
      <div className="w-px h-10 bg-slate-200" />
      <div className="text-right">
        <p className="text-xs text-slate-500 mb-0.5">Invoice Date</p>
        <p className="font-medium text-slate-700">
          {formatDate(invoice.invoice_date)}
        </p>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// STEP 1: ITEM SELECTION
// ════════════════════════════════════════════════════════════════════════════

const ItemSelectionStep = ({
  invoice,
  selectedItems,
  onItemsChange,
  inventoryBatches,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherBatches, setShowOtherBatches] = useState(false);

  const invoiceItems = useMemo(() => {
    return (invoice.lineItems || []).map((item) => ({
      ...item,
      medicine_id: item.medicine_id,
      name: item.medicine?.name || "Unknown Product",
      manufacturer: item.medicine?.manufacturer,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      purchase_rate: item.purchase_rate,
      mrp: item.mrp,
      cgst_percent: item.cgst_percent,
      sgst_percent: item.sgst_percent,
      max_quantity: parseFloat(item.quantity),
      current_stock: item.inventory?.current_stock || 0,
    }));
  }, [invoice]);

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
            medicine_id: item.medicine_id,
            name: item.name,
            manufacturer: item.manufacturer,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            purchase_rate: item.purchase_rate,
            mrp: item.mrp,
            cgst_percent: item.cgst_percent,
            sgst_percent: item.sgst_percent,
            quantity: 1,
            max_quantity: item.max_quantity,
            current_stock: item.current_stock,
          },
        ]);
      }
    },
    [selectedItems, onItemsChange],
  );

  const handleQuantityChange = useCallback(
    (item, value) => {
      const key = `${item.medicine_id}-${item.batch_number}`;

      if (value === "" || value === null || value === undefined) {
        onItemsChange(
          selectedItems.map((si) =>
            `${si.medicine_id}-${si.batch_number}` === key
              ? { ...si, quantity: "" }
              : si,
          ),
        );
        return;
      }

      const parsedValue = parseFloat(value);
      if (parsedValue <= 0) return;

      const qty = Math.min(parsedValue, item.max_quantity);
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

  const handleQuantityBlur = useCallback(
    (item) => {
      const key = `${item.medicine_id}-${item.batch_number}`;
      const selectedItem = selectedItems.find(
        (si) => `${si.medicine_id}-${si.batch_number}` === key,
      );

      if (
        selectedItem &&
        (selectedItem.quantity === "" || selectedItem.quantity <= 0)
      ) {
        onItemsChange(
          selectedItems.map((si) =>
            `${si.medicine_id}-${si.batch_number}` === key
              ? { ...si, quantity: 1 }
              : si,
          ),
        );
      }
    },
    [selectedItems, onItemsChange],
  );

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        onItemsChange(invoiceItems.map((item) => ({ ...item, quantity: 1 })));
      } else {
        onItemsChange([]);
      }
    },
    [invoiceItems, onItemsChange],
  );

  const handleAddOtherBatch = useCallback(
    (batch) => {
      const key = `${batch.medicine_id}-${batch.batch_number}`;
      if (
        selectedItems.some(
          (si) => `${si.medicine_id}-${si.batch_number}` === key,
        )
      )
        return;

      onItemsChange([
        ...selectedItems,
        {
          medicine_id: batch.medicine_id,
          name: batch.medicine?.name || "Unknown",
          manufacturer: batch.medicine?.manufacturer,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          purchase_rate: batch.last_purchase_rate || 0,
          mrp: batch.mrp,
          cgst_percent: 6,
          sgst_percent: 6,
          quantity: 1,
          max_quantity: parseFloat(batch.current_stock),
          current_stock: parseFloat(batch.current_stock),
          is_other_batch: true,
        },
      ]);
      setShowOtherBatches(false);
      setSearchQuery("");
    },
    [selectedItems, onItemsChange],
  );

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return (inventoryBatches || [])
      .filter(
        (batch) =>
          batch.medicine?.name?.toLowerCase().includes(query) ||
          batch.batch_number?.toLowerCase().includes(query),
      )
      .slice(0, 10);
  }, [searchQuery, inventoryBatches]);

  const allSelected =
    invoiceItems.length > 0 && selectedItems.length >= invoiceItems.length;

  return (
    <motion.div
      className="space-y-5"
      variants={ANIMATIONS.content}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Select Items for Return
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Choose one or more items from the original invoice to include in
            this return
          </p>
        </div>
        <button
          onClick={() => setShowOtherBatches(!showOtherBatches)}
          className={`
            flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all
            ${
              showOtherBatches
                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }
          `}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Other Batch</span>
        </button>
      </div>

      {/* Other Batch Search Panel */}
      <AnimatePresence>
        {showOtherBatches && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Add items not in this invoice
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Search by product name or batch number from your inventory
                  </p>
                </div>
              </div>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search products or batch numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  autoFocus
                />
              </div>

              {searchQuery && filteredInventory.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredInventory.map((batch) => (
                    <button
                      key={`${batch.medicine_id}-${batch.batch_number}`}
                      onClick={() => handleAddOtherBatch(batch)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {batch.medicine?.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Batch:{" "}
                          <span className="font-mono">
                            {batch.batch_number}
                          </span>
                          <span className="mx-1.5">•</span>
                          Stock: {batch.current_stock}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Plus size={16} className="text-blue-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && filteredInventory.length === 0 && (
                <p className="mt-3 text-sm text-slate-500 text-center py-4">
                  No matching items found
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    className="w-4 h-4 rounded border-slate-300 text-[#000060] focus:ring-[#000060] focus:ring-offset-0"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                  Batch / Expiry
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                  Purchased
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                  In Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                  Return Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceItems.map((item, index) => {
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
                        className="w-4 h-4 rounded border-slate-300 text-[#000060] focus:ring-[#000060] focus:ring-offset-0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 text-sm">
                        {item.name}
                      </p>
                      {item.manufacturer && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.manufacturer}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {item.batch_number}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          {formatDate(item.expiry_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-900 text-sm">
                        {item.max_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-600">
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelected ? (
                        <input
                          type="number"
                          min="1"
                          max={item.max_quantity}
                          value={selectedItem?.quantity ?? ""}
                          onChange={(e) =>
                            handleQuantityChange(selectedItem, e.target.value)
                          }
                          onBlur={() => handleQuantityBlur(selectedItem)}
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

              {/* Other Batches */}
              {selectedItems
                .filter((si) => si.is_other_batch)
                .map((item, index) => (
                  <tr
                    key={`other-${item.medicine_id}-${item.batch_number}-${index}`}
                    className="bg-violet-50/50"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          onItemsChange(
                            selectedItems.filter(
                              (si) =>
                                !(
                                  `${si.medicine_id}-${si.batch_number}` ===
                                  `${item.medicine_id}-${item.batch_number}`
                                ),
                            ),
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 text-sm">
                          {item.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-violet-200 text-violet-700 rounded font-medium">
                          ADDED
                        </span>
                      </div>
                      {item.manufacturer && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.manufacturer}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {item.batch_number}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          {formatDate(item.expiry_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-400">N/A</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-600">
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        max={item.max_quantity}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item, e.target.value)
                        }
                        onBlur={() => handleQuantityBlur(item)}
                        className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060] transition-all"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-sm text-[#000060]">
                        {formatCurrency(calculateLineTotal(item))}
                      </span>
                    </td>
                  </tr>
                ))}

              {invoiceItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package
                      size={40}
                      className="mx-auto text-slate-300 mb-3"
                    />
                    <p className="text-slate-500">
                      No items found in this invoice
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
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-800">No items selected</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Please select at least one item to proceed with the return
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 2: RETURN CONFIGURATION
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
      {/* Section Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Configure Return Details
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Specify the reason for return and how the refund should be processed
        </p>
      </div>

      {/* Configuration Cards */}
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
                  Why are you returning these items?
                </p>
              </div>
            </div>
            {isReasonValid && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Complete
              </span>
            )}
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
                  placeholder="Please provide details about the return reason..."
                  rows={3}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm resize-none transition-all
                    ${
                      !reasonNotes.trim()
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                        : "border-slate-300 focus:ring-[#000060]/20 focus:border-[#000060]"
                    }`}
                />
                {!reasonNotes.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Required when selecting "Other"
                  </p>
                )}
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
                <p className="font-semibold text-slate-900">
                  Payment Adjustment
                </p>
                <p className="text-xs text-slate-500">
                  How should the refund be processed?
                </p>
              </div>
            </div>
            {isAdjustmentValid && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Complete
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            <StyledSelect
              label="Adjustment Type"
              value={adjustmentType}
              onChange={onAdjustmentChange}
              options={ADJUSTMENT_TYPES}
              placeholder="Choose adjustment type..."
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

                    {adjustmentType === "CREDIT_NOTE" && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center gap-2">
                          <Info size={14} className="text-blue-600" />
                          <p className="text-xs text-blue-700">
                            Credit note will be valid for{" "}
                            <strong>1 year</strong> from issue date
                          </p>
                        </div>
                      </div>
                    )}
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

      {/* Summary Status */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isReasonValid ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            <span className="text-sm text-slate-600">Reason:</span>
            <span className="text-sm font-medium text-slate-900">
              {selectedReason?.label || "Not selected"}
            </span>
          </div>
          <div className="w-px h-5 bg-slate-300" />
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isAdjustmentValid ? "bg-emerald-500" : "bg-amber-400"}`}
            />
            <span className="text-sm text-slate-600">Adjustment:</span>
            <span className="text-sm font-medium text-slate-900">
              {selectedAdjustment?.label || "Not selected"}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {(!isReasonValid || !isAdjustmentValid) && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-800">
              Configuration incomplete
            </p>
            <p className="text-sm text-amber-600 mt-0.5">
              {!isReasonValid && !isAdjustmentValid
                ? "Please select both return reason and adjustment type"
                : !isReasonValid
                  ? "Please select a return reason"
                  : "Please select an adjustment type"}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 3: REVIEW & CONFIRM
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
      {/* Section Header */}
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
            <FileText size={16} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Invoice
            </span>
          </div>
          <p className="font-mono font-bold text-[#000060]">
            {invoice.invoice_number}
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Supplier
            </span>
          </div>
          <p className="font-semibold text-slate-900 truncate">
            {invoice.supplier?.name}
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
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
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
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
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {item.name}
                  </p>
                  {item.is_other_batch && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium">
                      ADDED
                    </span>
                  )}
                </div>
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
                Payment Adjustment
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
                    ? "Return will be approved immediately, stock will be deducted"
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
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Info size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-800">Approval Required</p>
            <p className="text-sm text-amber-600 mt-0.5">
              This return will be submitted for Super Admin approval. Stock will
              not be affected until approved.
            </p>
          </div>
        </div>
      )}

      {/* Final Confirmation */}
      <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm text-slate-600">
          By submitting, you confirm that all return details are accurate and
          complete.
        </p>
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const CreateReturnModal = ({
  open,
  onClose,
  invoice,
  onSuccess,
  isSuperAdmin = false,
}) => {
  const toast = useToast();

  // Workflow State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Items
  const [selectedItems, setSelectedItems] = useState([]);
  const [inventoryBatches, setInventoryBatches] = useState([]);

  // Step 2 - Configuration
  const [returnReason, setReturnReason] = useState("");
  const [reasonNotes, setReasonNotes] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("");
  const [refundNotes, setRefundNotes] = useState("");

  // Step 3 - Review
  const [autoApprove, setAutoApprove] = useState(isSuperAdmin);

  // Load inventory on open
  useEffect(() => {
    if (open && invoice) {
      loadInventoryBatches();
    }
  }, [open, invoice]);

  const loadInventoryBatches = async () => {
    try {
      const response = await inventoryAPI.getAll({ limit: 1000 });
      setInventoryBatches(response.data?.inventory || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
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
        return (
          selectedItems.length > 0 &&
          selectedItems.every((item) => item.quantity > 0)
        );
      case 2:
        return (
          returnReason &&
          adjustmentType &&
          (returnReason !== "OTHER" || reasonNotes.trim())
        );
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedItems, returnReason, reasonNotes, adjustmentType]);

  // Navigation
  const handleNext = useCallback(() => {
    if (canProceed && currentStep < 3) {
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
        parent_invoice_id: invoice.invoice_id,
        supplier_id: invoice.supplier_id,
        branch_id: invoice.branch_id || null,
        return_reason: returnReason,
        return_reason_notes: reasonNotes.trim() || null,
        adjustment_type: adjustmentType,
        refund_notes: refundNotes.trim() || null,
        invoice_date: new Date().toISOString(),
        remarks: null,
        lineItems: selectedItems.map((item) => ({
          medicine_id: item.medicine_id,
          batch_number: item.batch_number || "UNKNOWN",
          expiry_date: toISOString(item.expiry_date),
          quantity: parseFloat(item.quantity) || 1,
          purchase_rate: parseFloat(item.purchase_rate) || 0,
          mrp: parseFloat(item.mrp) || 0,
          cgst_percent: parseFloat(item.cgst_percent) || 0,
          sgst_percent: parseFloat(item.sgst_percent) || 0,
        })),
      };

      const response = await purchaseAPI.createReturn(payload);
      const returnInvoice = response.data;
      const wasAutoApproved =
        returnInvoice.return_approval_status === "APPROVED";

      toast.success(
        "Return Created Successfully",
        wasAutoApproved
          ? `Return ${returnInvoice.invoice_number} has been approved and stock has been deducted.`
          : `Return ${returnInvoice.invoice_number} has been submitted for approval.`,
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

  if (!open || !invoice) return null;

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
                      Create Purchase Return
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

            {/* Invoice Info */}
            <div className="shrink-0 px-6 pt-5">
              <InvoiceHeaderCard invoice={invoice} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <ItemSelectionStep
                    key="step-1"
                    invoice={invoice}
                    selectedItems={selectedItems}
                    onItemsChange={setSelectedItems}
                    inventoryBatches={inventoryBatches}
                  />
                )}
                {currentStep === 2 && (
                  <ReturnConfigurationStep
                    key="step-2"
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
                {currentStep === 3 && (
                  <ReviewConfirmStep
                    key="step-3"
                    invoice={invoice}
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
                  {currentStep < 3 ? (
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

export default CreateReturnModal;
