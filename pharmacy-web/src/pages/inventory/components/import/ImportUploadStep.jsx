// pharmacy-web/src/pages/inventory/components/import/ImportUploadStep.jsx (do not remove this comment)
import React, { useRef, useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";

const ACCEPTED_EXTENSIONS = [".xls", ".xlsx", ".csv"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ImportUploadStep = ({
  onUpload,
  loading,
  error,
  onClearError,
  duplicateFileWarning,
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);

  const validateAndUpload = useCallback(
    (file) => {
      if (!file) return;
      setFileError(null);
      onClearError?.();

      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setFileError(
          `Invalid file type "${ext}". Please upload .xls, .xlsx, or .csv files.`,
        );
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
            `Maximum size is ${MAX_SIZE_MB} MB.`,
        );
        return;
      }
      onUpload(file);
    },
    [onUpload, onClearError],
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload],
  );

  const displayError = fileError || error;

  return (
    <div className="p-6 space-y-4">
      {/* ── Duplicate file warning ── */}
      {duplicateFileWarning && (
        <div
          className="flex items-start gap-3 p-4 bg-amber-50 border
                        border-amber-200 rounded-xl"
        >
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">This file was imported recently</p>
            <p className="mt-0.5 text-amber-700">
              {duplicateFileWarning.message}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Previous import status:{" "}
              <span className="font-medium capitalize">
                {duplicateFileWarning.previousStatus
                  ?.toLowerCase()
                  .replace(/_/g, " ")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        className={`
          relative flex flex-col items-center justify-center gap-4
          border-2 border-dashed rounded-2xl p-10 cursor-pointer
          transition-all duration-200
          ${
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }
          ${loading ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            transition-colors
            ${dragOver ? "bg-indigo-100" : "bg-gray-100"}
          `}
        >
          <Upload
            size={28}
            className={dragOver ? "text-indigo-600" : "text-gray-400"}
          />
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-gray-800">
            {dragOver
              ? "Drop your Medisoft file here"
              : "Drag and drop your Medisoft export"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or{" "}
            <span className="text-indigo-600 font-medium underline underline-offset-2">
              browse to select
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ACCEPTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="px-2.5 py-1 text-xs font-medium bg-white
                         border border-gray-200 rounded-lg text-gray-600"
            >
              {ext}
            </span>
          ))}
          <span className="text-xs text-gray-400">up to {MAX_SIZE_MB} MB</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>

      {/* ── Error display ── */}
      {displayError && (
        <div
          className="flex items-start gap-3 p-4 bg-red-50 border
                        border-red-200 rounded-xl"
        >
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{displayError}</p>
          <button
            onClick={() => {
              setFileError(null);
              onClearError?.();
            }}
            className="text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Medisoft-only warning — most prominent ── */}
      <div
        className="flex items-start gap-3 p-4 bg-amber-50 border-2
                      border-amber-300 rounded-xl"
      >
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-amber-900">Medisoft exports only</p>
          <p className="mt-1 text-amber-800 leading-relaxed">
            This import is designed specifically for{" "}
            <span className="font-semibold">
              XLS files exported from Medisoft
            </span>
            . Files from other pharmacy software or manually created
            spreadsheets may not import correctly or could produce unexpected
            results.
          </p>
          <p className="mt-2 text-xs text-amber-700">
            In Medisoft: go to{" "}
            <span className="font-mono bg-amber-100 px-1 py-0.5 rounded">
              Reports → Inventory → Export to Excel
            </span>{" "}
            to get the correct file format.
          </p>
        </div>
      </div>

      {/* ── General info banner ── */}
      <div
        className="flex items-start gap-3 p-4 bg-blue-50 border
                      border-blue-200 rounded-xl"
      >
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">What happens during import?</p>
          <ul className="mt-1.5 text-blue-700 space-y-1 list-disc list-inside text-xs">
            <li>Medicines are auto-matched against the master catalog</li>
            <li>Duplicate batches are detected and flagged for review</li>
            <li>Unrecognized medicines are flagged — linkable later</li>
            <li>Max file size: {MAX_SIZE_MB} MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportUploadStep;
