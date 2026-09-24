// pharmacy-web/src/pages/inventory/components/InventoryImportModal.jsx (do not remove this comment)
import React, { useCallback, useState, useEffect } from "react";
import { X, Database, Package, ArrowDownToLine } from "lucide-react";
import { useInventoryImport, STEPS } from "../../../hooks/inventory/useInventoryImport";
import ImportUploadStep     from "./import/ImportUploadStep";
import ImportProcessingStep from "./import/ImportProcessingStep";
import ImportConflictStep   from "./import/ImportConflictStep";
import ImportConfirmStep    from "./import/ImportConfirmStep";
import ImportResultStep     from "./import/ImportResultStep";

const STEP_TITLES = {
  [STEPS.UPLOAD]:     "Import Inventory",
  [STEPS.PROCESSING]: "Processing File",
  [STEPS.CONFLICTS]:  "Resolve Batch Conflicts",
  [STEPS.CONFIRM]:    "Confirm Import",
  [STEPS.WRITING]:    "Importing...",
  [STEPS.RESULT]:     "Import Complete",
};

/* ─────────────────────────────────────────────────────
   ImportWritingStep — replaces the old boring spinner
───────────────────────────────────────────────────── */
const WRITING_MESSAGES = [
  "Creating medicine entries...",
  "Writing inventory batches...",
  "Updating stock quantities...",
  "Linking to master catalog...",
  "Finalizing records...",
];

const ImportWritingStep = ({ totalRows, fileName }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots]     = useState("");

  // Cycle through status messages every 2.5 s
  useEffect(() => {
    const t = setInterval(
      () => setMsgIdx((p) => (p + 1) % WRITING_MESSAGES.length),
      2500
    );
    return () => clearInterval(t);
  }, []);

  // Animate trailing dots
  useEffect(() => {
    const t = setInterval(
      () => setDots((p) => (p.length >= 3 ? "" : p + ".")),
      500
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">

      {/* ── Animated icon cluster ── */}
      <div className="relative w-28 h-28 mb-8">
        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full bg-indigo-200
                        animate-ping opacity-20" />
        <div
          className="absolute inset-3 rounded-full bg-indigo-200
                     animate-ping opacity-25"
          style={{ animationDelay: "0.4s" }}
        />

        {/* Core circle */}
        <div className="relative w-full h-full rounded-full
                        bg-gradient-to-br from-[#000060] to-indigo-600
                        flex items-center justify-center
                        shadow-xl shadow-indigo-900/30">
          <Database size={38} className="text-white" />
        </div>

        {/* Floating badge — top right */}
        <div
          className="absolute -top-2 -right-2 w-10 h-10 rounded-xl
                     bg-emerald-100 border-2 border-white shadow-md
                     flex items-center justify-center animate-bounce"
          style={{ animationDuration: "2s" }}
        >
          <Package size={18} className="text-emerald-600" />
        </div>

        {/* Floating badge — bottom left */}
        <div
          className="absolute -bottom-1 -left-3 w-9 h-9 rounded-xl
                     bg-blue-100 border-2 border-white shadow-md
                     flex items-center justify-center animate-bounce"
          style={{ animationDuration: "2.6s", animationDelay: "0.3s" }}
        >
          <ArrowDownToLine size={15} className="text-blue-600" />
        </div>
      </div>

      {/* ── Heading ── */}
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        Importing your inventory{dots}
      </h3>

      {/* ── Cycling status message ── */}
      <p className="text-sm text-indigo-600 font-medium h-5">
        {WRITING_MESSAGES[msgIdx]}
      </p>

      {/* ── File context pill ── */}
      <div className="mt-8 flex items-center gap-3 px-5 py-3 bg-gray-50
                      border border-gray-200 rounded-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse
                         shrink-0" />
        <p className="text-sm text-gray-600">
          {fileName && (
            <span className="font-semibold text-gray-800">{fileName} </span>
          )}
          {totalRows > 0 && (
            <span>— {totalRows.toLocaleString()} rows</span>
          )}
        </p>
      </div>

      {/* ── Indeterminate progress bar ── */}
      <div className="w-full max-w-xs mt-6 overflow-hidden">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-indigo-400
                          to-indigo-600 rounded-full animate-indeterminate" />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Please don't close this window. Almost there!
      </p>

      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(500%);  }
        }
        .animate-indeterminate {
          animation: indeterminate 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   Main modal — unchanged except uses new WritingStep
───────────────────────────────────────────────────── */
const InventoryImportModal = ({ open, onClose, onSuccess }) => {
  const hook = useInventoryImport();

  const handleClose = useCallback(() => {
    if (hook.step === STEPS.WRITING) return;
    if (
      hook.importJobId &&
      !["COMPLETED", "PARTIAL", "FAILED", "CANCELLED"].includes(hook.jobStatus)
    ) {
      hook.cancelImport();
    } else {
      hook.reset();
    }
    onClose();
  }, [hook, onClose]);

  const handleSuccess = useCallback(() => {
    onClose();
    if (onSuccess) onSuccess();
    hook.reset();
  }, [hook, onClose, onSuccess]);

  if (!open) return null;

  const isWriting = hook.step === STEPS.WRITING;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={isWriting ? undefined : handleClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl
                   shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4
                        bg-gradient-to-r from-[#000060] to-indigo-800">
          <h2 className="text-white text-lg font-semibold">
            {STEP_TITLES[hook.step] || "Import Inventory"}
          </h2>
          {!isWriting && (
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/20 text-white
                         hover:bg-red-500/30 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">

          {hook.step === STEPS.UPLOAD && (
            <ImportUploadStep
              onUpload={hook.uploadFile}
              loading={hook.loading}
              error={hook.error}
              onClearError={hook.clearError}
              duplicateFileWarning={hook.duplicateFileWarning}
            />
          )}

          {hook.step === STEPS.PROCESSING && (
            <ImportProcessingStep
              fileName={hook.selectedFile?.name}
              totalRows={hook.totalRows}
              processingPhase={hook.processingPhase}
              processingProgress={hook.processingProgress}
              phaseLabel={hook.phaseLabel}
              detectedSoftware={hook.detectedSoftware}
              error={hook.error}
              onCancel={handleClose}
            />
          )}

          {hook.step === STEPS.CONFLICTS && (
            <ImportConflictStep
              conflictReport={hook.conflictReport}
              userConflictDecisions={hook.userConflictDecisions}
              onSetDecision={hook.setConflictDecision}
              onSetAll={hook.setAllConflictDecisions}
              resolvedCount={hook.resolvedConflictCount}
              totalCount={hook.totalConflictCount}
              allDone={hook.allConflictsDone}
              onProceed={hook.proceedFromConflicts}
              loading={hook.loading}
              error={hook.error}
              onClearError={hook.clearError}
            />
          )}

          {hook.step === STEPS.CONFIRM && (
            <ImportConfirmStep
              summary={hook.preWriteSummary}
              autoSummary={hook.autoSummary}
              medicinePlans={hook.medicinePlans}
              fileName={hook.selectedFile?.name}
              detectedSoftware={hook.detectedSoftware}
              validRows={hook.validRows}
              errorRows={hook.errorRows}
              onConfirm={hook.confirmImport}
              loading={hook.loading}
              error={hook.error}
              onClearError={hook.clearError}
            />
          )}

          {hook.step === STEPS.WRITING && (
            <ImportWritingStep
              fileName={hook.selectedFile?.name}
              totalRows={hook.totalRows}
            />
          )}

          {hook.step === STEPS.RESULT && (
            <ImportResultStep
              result={hook.importResult}
              autoSummary={hook.autoSummary}
              medicinePlans={hook.medicinePlans}
              fileName={hook.selectedFile?.name}
              importJobId={hook.importJobId}
              onDone={handleSuccess}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default InventoryImportModal;