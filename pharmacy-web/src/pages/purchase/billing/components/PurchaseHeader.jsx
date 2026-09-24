// pharmacy-web/src/pages/purchase/billing/components/PurchaseHeader.jsx (do not remove this comment)
// src/pages/purchase/billing/components/PurchaseHeader.jsx
import {
  Save,
  Printer,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
  FilePlus,
  User,
} from "lucide-react";

// ── REMOVED: useRef import (no longer needed)
// ── ADD: ImportModal import below the lucide imports
import ImportModal from "./ImportModal";

const PurchaseHeader = ({
  onSave,
  onSavePrint,
  onImportFile,
  onExportExcel,
  onClearTable,
  onNewInvoice,
  invoiceNumber,
  invoiceStatus,
  isLoading = false,
  isSaving = false,
  hasUnsavedData = false,
  isEditingConfirmed = false,
  billedBy = "Staff",
  // ── ADD these three new props below billedBy
  importModalOpen = false,
  onOpenImportModal,
  onCloseImportModal,
}) => {
  // ── REMOVE: fileInputRef and handleFileSelect — delete those entirely

  const handleClearTable = () => {
    onClearTable?.();
  };

  const handleNewInvoice = () => {
    onNewInvoice?.();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "CONFIRMED":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-200",
          icon: CheckCircle,
        };
      case "DRAFT":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: Clock,
        };
      case "CANCELLED":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
          icon: AlertCircle,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: Clock,
        };
    }
  };

  const statusConfig = invoiceStatus ? getStatusConfig(invoiceStatus) : null;
  const StatusIcon = statusConfig?.icon;

  const Skeleton = ({ className }) => (
    <div className={`bg-slate-200 rounded animate-pulse ${className}`} />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-48 h-3" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="w-20 h-9 rounded-lg" />
          <Skeleton className="w-20 h-9 rounded-lg" />
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <Skeleton className="w-24 h-9 rounded-lg" />
          <Skeleton className="w-32 h-9 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
        {/* Left: Title & Invoice Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#05015A] to-[#0a0280] rounded-lg shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[#05015A] font-bold text-lg">
                Purchase Entry
              </h1>

              {invoiceNumber && (
                <>
                  <div className="h-4 w-px bg-slate-300" />
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <span className="text-[10px] text-indigo-600 font-medium">
                      Invoice:
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 font-mono">
                      {invoiceNumber}
                    </span>
                  </div>
                </>
              )}

              {invoiceStatus && statusConfig && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 ${statusConfig.bg} border ${statusConfig.border} rounded-lg`}
                >
                  <StatusIcon size={12} className={statusConfig.text} />
                  <span
                    className={`text-[10px] font-medium ${statusConfig.text} uppercase`}
                  >
                    {invoiceStatus}
                  </span>
                </div>
              )}

              {hasUnsavedData && !invoiceNumber && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-amber-700 font-medium">
                    Unsaved
                  </span>
                </div>
              )}

              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg">
                <User size={10} className="text-purple-600" />
                <span className="text-[10px] text-purple-600 font-medium">
                  By:
                </span>
                <span className="text-[10px] font-semibold text-purple-800">
                  {billedBy}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {invoiceNumber
                ? "Update invoice details"
                : "Create new purchase invoice"}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* ── REMOVE: the hidden <input> file element that was here ── */}

          <button
            onClick={handleNewInvoice}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-colors text-sm font-medium border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Start a new invoice"
          >
            <FilePlus size={14} />
            <span className="hidden lg:inline">New</span>
          </button>

          <button
            onClick={handleClearTable}
            disabled={isSaving || !hasUnsavedData}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors text-sm font-medium border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear all items"
          >
            <Trash2 size={14} />
            <span className="hidden lg:inline">Clear</span>
          </button>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          {/* ── CHANGE: was onClick={() => fileInputRef.current?.click()} ── */}
          <button
            onClick={onOpenImportModal}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            Import
          </button>

          <button
            onClick={onExportExcel}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-sm font-medium border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={14} />
            Export
          </button>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          <button
            onClick={onSave}
            disabled={invoiceStatus === "CONFIRMED" || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm
              ${
                invoiceStatus === "CONFIRMED" || isSaving
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#05015A] hover:bg-[#0a0280] text-white"
              }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isSaving ? "Saving..." : invoiceNumber ? "Update" : "Save Draft"}
          </button>

          <button
            onClick={onSavePrint}
            disabled={
              invoiceStatus === "CONFIRMED" || isSaving || isEditingConfirmed
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border
              ${
                invoiceStatus === "CONFIRMED" || isSaving || isEditingConfirmed
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-indigo-50 text-[#05015A] hover:bg-indigo-100 border-indigo-200"
              }`}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
            {invoiceStatus === "CONFIRMED"
              ? "Confirmed"
              : isSaving
                ? "Processing..."
                : "Confirm & Print"}
          </button>
        </div>
      </div>

      {/* ── ADD: ImportModal rendered here, outside the header div ── */}
      <ImportModal
        open={importModalOpen}
        onClose={onCloseImportModal}
        onImportFile={onImportFile}
      />
    </>
  );
};

export default PurchaseHeader;