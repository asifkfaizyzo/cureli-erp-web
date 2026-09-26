// pharmacy-web/src/pages/purchase/returns/components/ViewReturnModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/returns/components/ViewReturnModal.jsx

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Package,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  User,
  Printer,
  Download,
  Info,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Hash,
  History,
  RotateCcw,
  Ban,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import CancelReturnDialog from "./CancelReturnDialog";
import RevertToPendingDialog from "./RevertToPendingDialog";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const NAVY = "#000060";

const RETURN_REASON_LABELS = {
  DAMAGED_GOODS: "Damaged Goods",
  EXPIRED_GOODS: "Expired Goods",
  WRONG_ITEM_RECEIVED: "Wrong Item Received",
  QUALITY_ISSUE: "Quality Issue",
  EXCESS_STOCK: "Excess Stock",
  PRICE_DIFFERENCE: "Price Difference",
  OTHER: "Other",
};

const ADJUSTMENT_TYPE_LABELS = {
  CASH_REFUND: "Cash Refund",
  CREDIT_NOTE: "Credit Note",
  OFFSET_NEXT_PURCHASE: "Offset Next Purchase",
};

const APPROVAL_STATUS_CONFIG = {
  PENDING_APPROVAL: {
    label: "Pending Approval",
    icon: Clock,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
};

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "items", label: "Line Items", icon: Package },
  { id: "parent", label: "Parent Invoice", icon: FileText },
  { id: "supplier", label: "Supplier", icon: Building2 },
  { id: "financial", label: "Financial", icon: IndianRupee },
  { id: "history", label: "History", icon: History },
];

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// TAB CONTENT COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

const OverviewTab = ({ returnInvoice }) => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-2 gap-6">
      {/* Return Details */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <AlertTriangle size={16} />
          Return Information
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Return Reason</p>
            <p className="font-medium text-gray-900">
              {RETURN_REASON_LABELS[returnInvoice.return_reason] ||
                returnInvoice.return_reason}
            </p>
          </div>
          {returnInvoice.return_reason_notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700 italic">
                "{returnInvoice.return_reason_notes}"
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Return Date</p>
            <p className="font-medium text-gray-900">
              {formatDate(returnInvoice.invoice_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Adjustment Details */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <CreditCard size={16} />
          Payment Adjustment
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Adjustment Type</p>
            <p className="font-medium text-gray-900">
              {ADJUSTMENT_TYPE_LABELS[returnInvoice.adjustment_type] ||
                returnInvoice.adjustment_type}
            </p>
          </div>
          {returnInvoice.credit_note_number && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Credit Note Number</p>
              <p className="font-mono font-semibold text-emerald-600">
                {returnInvoice.credit_note_number}
              </p>
            </div>
          )}
          {returnInvoice.refund_amount && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Refund Amount</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(returnInvoice.refund_amount)}
              </p>
            </div>
          )}
          {returnInvoice.refund_notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Refund Notes</p>
              <p className="text-sm text-gray-700">
                {returnInvoice.refund_notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Remarks */}
    {returnInvoice.remarks && (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
          Remarks
        </p>
        <p className="text-sm text-blue-900">{returnInvoice.remarks}</p>
      </div>
    )}
  </div>
);

const LineItemsTab = ({ returnInvoice }) => {
  const totalQty =
    returnInvoice.lineItems?.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    ) || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
            <tr className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <th className="px-4 py-3 text-center w-12">#</th>
              <th className="px-4 py-3 text-left min-w-[200px]">Product</th>
              <th className="px-4 py-3 text-center w-32">Batch</th>
              <th className="px-4 py-3 text-center w-24">Expiry</th>
              <th className="px-4 py-3 text-right w-20">Qty</th>
              <th className="px-4 py-3 text-right w-24">Rate</th>
              <th className="px-4 py-3 text-right w-24">MRP</th>
              <th className="px-4 py-3 text-center w-16">GST%</th>
              <th className="px-4 py-3 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {returnInvoice.lineItems && returnInvoice.lineItems.length > 0 ? (
              returnInvoice.lineItems.map((item, index) => {
                const gstPercent =
                  (parseFloat(item.cgst_percent) || 0) +
                  (parseFloat(item.sgst_percent) || 0);
                const qty = parseFloat(item.quantity) || 0;
                const rate = parseFloat(item.purchase_rate) || 0;
                const subtotal = qty * rate;
                const taxAmount = subtotal * (gstPercent / 100);
                const lineTotal = item.line_total || subtotal + taxAmount;

                return (
                  <tr
                    key={item.item_id || `item-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-mono text-gray-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {item.medicine?.name || "Unknown"}
                      </p>
                      {item.medicine?.manufacturer && (
                        <p className="text-xs text-gray-500">
                          {item.medicine.manufacturer}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs px-2 py-1 bg-gray-100 rounded border border-gray-200">
                        {item.batch_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {formatDate(item.expiry_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {qty}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatCurrency(rate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(item.mrp || 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">
                      {gstPercent.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#000060]">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-20 text-center">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No items found</p>
                </td>
              </tr>
            )}
          </tbody>
          {returnInvoice.lineItems && returnInvoice.lineItems.length > 0 && (
            <tfoot className="sticky bottom-0 border-t-2 border-gray-300 bg-white">
              <tr className="text-sm font-semibold">
                <td colSpan={4} className="px-4 py-4 text-right text-gray-600">
                  Grand Totals
                </td>
                <td className="px-4 py-4 text-right text-[#000060] font-bold">
                  {totalQty.toFixed(0)}
                </td>
                <td colSpan={3}></td>
                <td className="px-4 py-4 text-right">
                  <span className="text-xl font-bold text-[#000060]">
                    {formatCurrency(Math.abs(returnInvoice.net_amount || 0))}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const ParentInvoiceTab = ({ returnInvoice }) => (
  <div className="p-6 space-y-4">
    {returnInvoice.parentInvoice ? (
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Invoice Number</p>
          <p className="text-lg font-mono font-bold text-[#000060]">
            {returnInvoice.parentInvoice.invoice_number}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Invoice Date</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(returnInvoice.parentInvoice.invoice_date)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Total Amount</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(returnInvoice.parentInvoice.net_amount)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Status</p>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
            {returnInvoice.parentInvoice.status}
          </span>
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No parent invoice information available</p>
      </div>
    )}
  </div>
);

const SupplierTab = ({ returnInvoice }) => (
  <div className="p-6 space-y-6">
    {returnInvoice.supplier ? (
      <>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Building2 size={16} />
              Business Details
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">
                  {returnInvoice.supplier.name}
                </p>
              </div>
              {returnInvoice.supplier.supplier_code && (
                <div>
                  <p className="text-xs text-gray-500">Supplier Code</p>
                  <p className="font-mono text-sm text-gray-700">
                    {returnInvoice.supplier.supplier_code}
                  </p>
                </div>
              )}
              {returnInvoice.supplier.gst_number && (
                <div>
                  <p className="text-xs text-gray-500">GST Number</p>
                  <p className="font-mono text-sm text-gray-700">
                    {returnInvoice.supplier.gst_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Phone size={16} />
              Contact Information
            </div>
            <div className="space-y-2">
              {returnInvoice.supplier.contact_person && (
                <div>
                  <p className="text-xs text-gray-500">Contact Person</p>
                  <p className="font-medium text-gray-900">
                    {returnInvoice.supplier.contact_person}
                  </p>
                </div>
              )}
              {returnInvoice.supplier.office_phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <p className="text-sm text-gray-700">
                    {returnInvoice.supplier.office_phone}
                  </p>
                </div>
              )}
              {returnInvoice.supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <p className="text-sm text-gray-700">
                    {returnInvoice.supplier.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {returnInvoice.supplier.address_line_1 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <MapPin size={16} />
              Address
            </div>
            <p className="text-sm text-gray-700">
              {returnInvoice.supplier.address_line_1}
              {returnInvoice.supplier.address_line_2 &&
                `, ${returnInvoice.supplier.address_line_2}`}
              {returnInvoice.supplier.city && <br />}
              {returnInvoice.supplier.city &&
                `${returnInvoice.supplier.city}, `}
              {returnInvoice.supplier.state} - {returnInvoice.supplier.pincode}
            </p>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No supplier information available</p>
      </div>
    )}
  </div>
);

const FinancialTab = ({ returnInvoice }) => (
  <div className="p-6 space-y-6">
    {/* Amount Breakdown */}
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Amount Breakdown
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">
            {formatCurrency(returnInvoice.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Discount</span>
          <span className="font-medium text-red-600">
            -{formatCurrency(returnInvoice.discount_amount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Taxable Amount</span>
          <span className="font-medium">
            {formatCurrency(returnInvoice.taxable_amount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">CGST</span>
          <span className="font-medium">
            {formatCurrency(returnInvoice.cgst_amount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">SGST</span>
          <span className="font-medium">
            {formatCurrency(returnInvoice.sgst_amount)}
          </span>
        </div>
        {returnInvoice.igst_amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IGST</span>
            <span className="font-medium">
              {formatCurrency(returnInvoice.igst_amount)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Tax</span>
          <span className="font-medium">
            {formatCurrency(returnInvoice.total_tax)}
          </span>
        </div>
        {returnInvoice.round_off !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Round Off</span>
            <span className="font-medium">
              {formatCurrency(returnInvoice.round_off)}
            </span>
          </div>
        )}
        <div className="border-t-2 border-gray-300 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Net Amount</span>
            <span className="text-2xl font-bold text-[#000060]">
              {formatCurrency(Math.abs(returnInvoice.net_amount))}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Credit Notes */}
    {returnInvoice.supplierCredits &&
      returnInvoice.supplierCredits.length > 0 && (
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <h3 className="text-sm font-semibold text-emerald-700 mb-4">
            Credit Notes
          </h3>
          <div className="space-y-3">
            {returnInvoice.supplierCredits.map((credit) => (
              <div
                key={credit.credit_id}
                className="p-3 bg-white rounded border border-emerald-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-semibold text-emerald-700">
                    {credit.credit_note_number}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      credit.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : credit.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {credit.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Credit Amount</p>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(credit.credit_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Utilized</p>
                    <p className="font-medium text-gray-700">
                      {formatCurrency(credit.utilized_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(credit.balance_amount)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Expires: {formatDate(credit.expiry_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
  </div>
);

const HistoryTab = ({ returnInvoice }) => {
  const events = [];

  // Created
  if (returnInvoice.created_at) {
    events.push({
      type: "created",
      user: returnInvoice.creator?.full_name,
      timestamp: returnInvoice.created_at,
      icon: FileText,
      color: "blue",
    });
  }

  // Approved
  if (returnInvoice.approved_at) {
    events.push({
      type: "approved",
      user: returnInvoice.approver?.full_name,
      timestamp: returnInvoice.approved_at,
      icon: CheckCircle2,
      color: "green",
    });
  }

  // Rejected
  if (returnInvoice.rejected_at) {
    events.push({
      type: "rejected",
      user: returnInvoice.rejecter?.full_name,
      timestamp: returnInvoice.rejected_at,
      note: returnInvoice.rejection_reason,
      icon: XCircle,
      color: "red",
    });
  }

  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="p-6">
      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  event.color === "blue"
                    ? "bg-blue-50 border-blue-500"
                    : event.color === "green"
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    size={20}
                    className={
                      event.color === "blue"
                        ? "text-blue-600"
                        : event.color === "green"
                          ? "text-green-600"
                          : "text-red-600"
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {event.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                    {event.user && (
                      <p className="text-sm text-gray-700">by {event.user}</p>
                    )}
                    {event.note && (
                      <p className="mt-2 text-sm text-gray-600 italic bg-white p-2 rounded border border-gray-200">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <History size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No history available</p>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ViewReturnModal = ({
  open,
  onClose,
  returnInvoice,
  onApprove,
  onReject,
  onCancel,
  onRevert,
  isSuperAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const printRef = useRef(null);

  React.useEffect(() => {
    if (open) {
      setActiveTab("overview");
    }
  }, [open]);

  if (!open || !returnInvoice) return null;

  const approvalStatus = returnInvoice.return_approval_status;
  const statusConfig =
    APPROVAL_STATUS_CONFIG[approvalStatus] ||
    APPROVAL_STATUS_CONFIG.PENDING_APPROVAL;
  const StatusIcon = statusConfig.icon;

  const canApprove = isSuperAdmin && approvalStatus === "PENDING_APPROVAL";
  const canCancel = isSuperAdmin && approvalStatus === "APPROVED";
  const canRevert = isSuperAdmin && approvalStatus === "APPROVED";

  const handlePrint = () => {
    window.print();
  };

  // const handleDownload = async () => {
  //   const element = printRef.current;
  //   const opt = {
  //     margin: 10,
  //     filename: `Return_${returnInvoice.invoice_number}.pdf`,
  //     image: { type: "jpeg", quality: 0.98 },
  //     html2canvas: { scale: 2 },
  //     jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  //   };
  //   html2pdf().set(opt).from(element).save();
  // };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab returnInvoice={returnInvoice} />;
      case "items":
        return <LineItemsTab returnInvoice={returnInvoice} />;
      case "parent":
        return <ParentInvoiceTab returnInvoice={returnInvoice} />;
      case "supplier":
        return <SupplierTab returnInvoice={returnInvoice} />;
      case "financial":
        return <FinancialTab returnInvoice={returnInvoice} />;
      case "history":
        return <HistoryTab returnInvoice={returnInvoice} />;
      default:
        return null;
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-[#000060]/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-6xl h-[85vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#000060] to-[#000080]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Package size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Purchase Return
                      </h2>
                      <p className="text-sm text-white/70 font-mono">
                        {returnInvoice.invoice_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      <StatusIcon size={16} />
                      {statusConfig.label}
                    </span>

                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 bg-white/10 rounded-lg p-1">
                  {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? "bg-white text-[#000060] shadow-lg"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <TabIcon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"></div>

                  <div className="flex items-center gap-3">
                    {canApprove && (
                      <>
                        <button
                          onClick={() => onReject?.(returnInvoice)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors font-medium"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                        <button
                          onClick={() => onApprove?.(returnInvoice)}
                          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shadow-lg"
                        >
                          <CheckCircle2 size={18} />
                          Approve Return
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors font-medium"
                      >
                        <Ban size={18} />
                        Cancel Return
                      </button>
                    )}

                    {canRevert && (
                      <button
                        onClick={() => setShowRevertDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors font-medium"
                      >
                        <RotateCcw size={18} />
                        Revert to Pending
                      </button>
                    )}

                    {!canApprove && !canCancel && (
                      <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-[#000060] text-white hover:bg-[#000060]/90 transition-colors font-medium"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              {canApprove && (
                <div className="shrink-0 px-6 py-3 bg-amber-50 border-t border-amber-200">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-amber-600" />
                    <p className="text-sm text-amber-700">
                      <strong>Approving</strong> will deduct stock and process
                      payment adjustment. <strong>Rejecting</strong> will cancel
                      this return without affecting inventory.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Hidden print content */}
          <div className="hidden print:block" ref={printRef}>
            <PrintContent returnInvoice={returnInvoice} />
          </div>

          {/* Dialogs */}
          <CancelReturnDialog
            open={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            returnInvoice={returnInvoice}
            onConfirm={(data) => {
              setShowCancelDialog(false);
              onCancel?.(returnInvoice, data);
            }}
          />

          <RevertToPendingDialog
            open={showRevertDialog}
            onClose={() => setShowRevertDialog(false)}
            returnInvoice={returnInvoice}
            onConfirm={(reason) => {
              setShowRevertDialog(false);
              onRevert?.(returnInvoice, reason);
            }}
          />
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ════════════════════════════════════════════════════════════════════════════
// PRINT COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const PrintContent = ({ returnInvoice }) => (
  <div className="p-8 bg-white">
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold text-[#000060]">PURCHASE RETURN</h1>
      <p className="text-lg font-mono mt-2">{returnInvoice.invoice_number}</p>
    </div>

    <div className="grid grid-cols-2 gap-6 mb-6">
      <div>
        <h3 className="font-bold mb-2">Return Details:</h3>
        <p>Date: {formatDate(returnInvoice.invoice_date)}</p>
        <p>Reason: {RETURN_REASON_LABELS[returnInvoice.return_reason]}</p>
        <p>Status: {returnInvoice.return_approval_status}</p>
      </div>
      <div>
        <h3 className="font-bold mb-2">Supplier:</h3>
        <p>{returnInvoice.supplier?.name}</p>
        <p>{returnInvoice.supplier?.gst_number}</p>
      </div>
    </div>

    <table className="w-full border-collapse border border-gray-300 mb-6">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2">#</th>
          <th className="border border-gray-300 p-2">Product</th>
          <th className="border border-gray-300 p-2">Batch</th>
          <th className="border border-gray-300 p-2">Qty</th>
          <th className="border border-gray-300 p-2">Rate</th>
          <th className="border border-gray-300 p-2">Amount</th>
        </tr>
      </thead>
      <tbody>
        {returnInvoice.lineItems?.map((item, index) => (
          <tr key={item.item_id}>
            <td className="border border-gray-300 p-2 text-center">
              {index + 1}
            </td>
            <td className="border border-gray-300 p-2">
              {item.medicine?.name}
            </td>
            <td className="border border-gray-300 p-2 text-center">
              {item.batch_number}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              {item.quantity}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              {formatCurrency(item.purchase_rate)}
            </td>
            <td className="border border-gray-300 p-2 text-right">
              {formatCurrency(item.line_total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="text-right">
      <p className="text-2xl font-bold">
        Total: {formatCurrency(Math.abs(returnInvoice.net_amount))}
      </p>
    </div>
  </div>
);

export default ViewReturnModal;
