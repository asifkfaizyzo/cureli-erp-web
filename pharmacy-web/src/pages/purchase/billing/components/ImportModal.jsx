// pharmacy-web/src/pages/purchase/billing/components/ImportModal.jsx (do not remove this comment)
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  CloudUpload,
  CheckCircle2,
} from "lucide-react";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const ACCEPTED_MIME = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ImportModal = ({ open, onClose, onImportFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  const isValidFile = useCallback((file) => {
    if (!file) return false;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    return (
      ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_MIME.includes(file.type)
    );
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!isValidFile(file)) return;

      setSelectedFile(file);

      // Small delay so user sees the file selected, then auto-trigger
      setTimeout(() => {
        onImportFile(file);
        onClose();
        setSelectedFile(null);
      }, 400);
    },
    [isValidFile, onImportFile, onClose],
  );

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setIsDragging(false);
    dragCounterRef.current = 0;
    onClose();
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#05015A] to-[#0a0280] flex items-center justify-center shadow-sm">
              <Upload size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Import Purchase Data
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Upload a spreadsheet to populate the purchase table
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3
              border-2 border-dashed rounded-xl px-6 py-10
              cursor-pointer transition-all duration-200 select-none
              ${
                selectedFile
                  ? "border-green-400 bg-green-50"
                  : isDragging
                    ? "border-indigo-500 bg-indigo-50 scale-[1.01] shadow-inner"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
              }
            `}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Icon */}
            <div
              className={`
              w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
              ${
                selectedFile
                  ? "bg-green-100"
                  : isDragging
                    ? "bg-indigo-100 scale-110"
                    : "bg-white border border-slate-200 shadow-sm"
              }
            `}
            >
              {selectedFile ? (
                <CheckCircle2 size={28} className="text-green-500" />
              ) : isDragging ? (
                <CloudUpload size={28} className="text-indigo-600" />
              ) : (
                <FileSpreadsheet size={28} className="text-slate-400" />
              )}
            </div>

            {/* Text */}
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-green-700">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-green-600 mt-0.5">
                  Processing file...
                </p>
              </div>
            ) : isDragging ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-indigo-700">
                  Drop your file here
                </p>
                <p className="text-[10px] text-indigo-500 mt-0.5">
                  Release to upload
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Drag & drop your file here
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  or{" "}
                  <span className="text-indigo-600 font-medium underline underline-offset-2">
                    click to browse
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Accepted Formats */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Accepted Formats
            </p>
            <div className="flex items-center gap-2">
              {[
                {
                  ext: ".xlsx",
                  label: "Excel Workbook",
                  icon: FileSpreadsheet,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 border-emerald-200",
                },
                {
                  ext: ".xls",
                  label: "Excel 97-2003",
                  icon: FileSpreadsheet,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 border-emerald-200",
                },
                {
                  ext: ".csv",
                  label: "CSV File",
                  icon: FileText,
                  color: "text-blue-600",
                  bg: "bg-blue-50 border-blue-200",
                },
              ].map(({ ext, label, icon: Icon, color, bg }) => (
                <div
                  key={ext}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-medium ${bg}`}
                >
                  <Icon size={11} className={color} />
                  <span className={`${color} font-bold`}>{ext}</span>
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-amber-800">
              Before you import
            </p>
            <ul className="space-y-1">
              {[
                "Ensure the first row contains column headers",
                "Required columns: Item Name, Batch, Qty, Rate, MRP",
                "Expiry date format should be MM/YY or MM/YYYY",
                "Discount and GST columns are optional",
              ].map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[9px] text-amber-700"
                >
                  <span className="mt-0.5 shrink-0 w-3 h-3 rounded-full bg-amber-200 flex items-center justify-center text-[7px] font-bold text-amber-700">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ImportModal;