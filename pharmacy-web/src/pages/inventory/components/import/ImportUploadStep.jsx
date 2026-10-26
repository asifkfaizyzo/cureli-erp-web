// pharmacy-web/src/pages/inventory/components/import/ImportUploadStep.jsx (do not remove this comment)
import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  Upload,
  AlertCircle,
  AlertTriangle,
  X,
  Info,
  Building2,
  Layers,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { fetchBranchesDropdown, switchBranch } from "../../../../api/branches";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
  BRANCH_MODE,
} from "../../../../store/useAuthStore";

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

  // ── Branch context from global store ────────────────────────────────────
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const setBranch = useAuthStore((state) => state.setBranch);

  const hasBranchSelected =
    branchContext.mode === BRANCH_MODE.BRANCH && !!branchContext.branch_id;

  // Super admin without a selected branch → must pick one first
  const needsBranchSelection = isSuperAdmin && !hasBranchSelected;

  // ── Branch picker state ─────────────────────────────────────────────────
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(null);
  const [switchingBranchId, setSwitchingBranchId] = useState(null);
  const [showChangeBranch, setShowChangeBranch] = useState(false);

  const shouldShowBranchPicker = needsBranchSelection || showChangeBranch;

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    setBranchesError(null);
    try {
      const response = await fetchBranchesDropdown();
      const list = response?.data?.branches || [];
      setBranches(list);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranchesError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load branches. Please try again."
      );
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  // Fetch branches lazily — only when the picker is actually needed
  useEffect(() => {
    if (shouldShowBranchPicker && isSuperAdmin && branches.length === 0 && !branchesLoading) {
      loadBranches();
    }
  }, [shouldShowBranchPicker, isSuperAdmin, branches.length, branchesLoading, loadBranches]);

  const sortedBranches = useMemo(() => {
    if (!branches.length) return [];
    return [...branches].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.branch_name.localeCompare(b.branch_name);
    });
  }, [branches]);

  const handleSelectBranch = useCallback(
    async (branch) => {
      if (switchingBranchId) return;
      setSwitchingBranchId(branch.branch_id);
      setBranchesError(null);
      try {
        const response = await switchBranch(branch.branch_id);
        if (response?.success) {
          setBranch(
            branch.branch_id,
            response.data?.branch_name || branch.branch_name
          );
          setShowChangeBranch(false);
          onClearError?.();
          setFileError(null);
        } else {
          throw new Error(response?.message || "Failed to switch branch");
        }
      } catch (err) {
        console.error("Branch switch error:", err);
        setBranchesError(
          err.response?.data?.message ||
            err.message ||
            "Failed to switch branch. Please try again."
        );
      } finally {
        setSwitchingBranchId(null);
      }
    },
    [switchingBranchId, setBranch, onClearError]
  );

  // ── File validation & upload ────────────────────────────────────────────
  const validateAndUpload = useCallback(
    (file) => {
      if (!file) return;
      setFileError(null);
      onClearError?.();

      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setFileError(
          `Invalid file type "${ext}". Please upload .xls, .xlsx, or .csv files.`
        );
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
            `Maximum size is ${MAX_SIZE_MB} MB.`
        );
        return;
      }
      onUpload(file);
    },
    [onUpload, onClearError]
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
    [validateAndUpload]
  );

  const displayError = fileError || error;

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────

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

      {/* ══════════════════════════════════════════════════════════════════
          BRANCH PICKER (shown when SA has no branch OR clicked "Change")
      ══════════════════════════════════════════════════════════════════ */}
      {shouldShowBranchPicker && (
        <div className="border-2 border-indigo-200 bg-gradient-to-br
                        from-indigo-50 to-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#000060]
                          to-indigo-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm
                            flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base">
                {needsBranchSelection
                  ? "Select a branch to import into"
                  : "Change destination branch"}
              </p>
              <p className="text-indigo-100 text-xs mt-0.5">
                {needsBranchSelection
                  ? "You're in Global view. Imports must target a specific branch."
                  : "Pick a different branch for this import."}
              </p>
            </div>
            {showChangeBranch && hasBranchSelected && (
              <button
                onClick={() => {
                  setShowChangeBranch(false);
                  setBranchesError(null);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white
                           hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Branches list */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {/* Error */}
            {branchesError && (
              <div className="flex items-start gap-2 p-3 mb-2 bg-red-50
                              border border-red-200 rounded-lg">
                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-red-700">
                  {branchesError}
                </div>
                <button
                  onClick={loadBranches}
                  className="text-xs font-semibold text-red-600 hover:text-red-800
                             underline shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {branchesLoading && branches.length === 0 && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl
                               animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-2 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!branchesLoading && !branchesError && sortedBranches.length === 0 && (
              <div className="text-center py-8">
                <Layers size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  No branches found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Create a branch first in Settings → Branches.
                </p>
              </div>
            )}

            {/* Branch cards */}
            {!branchesLoading && sortedBranches.length > 0 && (
              <div className="space-y-2">
                {sortedBranches.map((branch) => {
                  const isSwitching = switchingBranchId === branch.branch_id;
                  const isCurrent = branchContext.branch_id === branch.branch_id;
                  const isDisabled = !!switchingBranchId;

                  return (
                    <button
                      key={branch.branch_id}
                      onClick={() => handleSelectBranch(branch)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl border-2
                        transition-all duration-150 text-left group
                        ${
                          isCurrent
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                        }
                        ${isDisabled && !isSwitching ? "opacity-50 cursor-not-allowed" : ""}
                        ${isSwitching ? "cursor-wait" : "cursor-pointer"}
                      `}
                    >
                      {/* Icon */}
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          shrink-0 relative
                          ${
                            isCurrent
                              ? "bg-indigo-100"
                              : "bg-gray-100 group-hover:bg-indigo-100"
                          }
                        `}
                      >
                        <Building2
                          size={18}
                          className={
                            isCurrent
                              ? "text-indigo-700"
                              : "text-gray-500 group-hover:text-indigo-600"
                          }
                        />
                        {branch.is_main && (
                          <div className="absolute -top-1 -right-1 w-3 h-3
                                          rounded-full bg-[#000060] border-2
                                          border-white" />
                        )}
                      </div>

                      {/* Branch info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {branch.branch_name}
                          </span>
                          {branch.is_main && (
                            <span className="shrink-0 text-[9px] font-bold
                                             px-1.5 py-0.5 rounded bg-[#000060]/10
                                             text-[#000060]">
                              MAIN
                            </span>
                          )}
                          {isCurrent && (
                            <span className="shrink-0 text-[9px] font-bold
                                             px-1.5 py-0.5 rounded
                                             bg-indigo-100 text-indigo-700">
                              CURRENT
                            </span>
                          )}
                        </div>
                        {(branch.city || branch.pincode) && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {[branch.city, branch.pincode]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0">
                        {isSwitching ? (
                          <Loader2
                            size={18}
                            className="text-indigo-600 animate-spin"
                          />
                        ) : isCurrent ? (
                          <Check size={18} className="text-indigo-600" />
                        ) : (
                          <ChevronRight
                            size={18}
                            className="text-gray-300 group-hover:text-indigo-500
                                       transition-colors"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 bg-indigo-50/50 border-t border-indigo-100">
            <p className="text-xs text-indigo-700 flex items-center gap-1.5">
              <Info size={12} />
              Switching here will update the branch across the entire app.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DROP ZONE AREA — only shown when a branch is selected
                           AND the "change branch" picker is not open
      ══════════════════════════════════════════════════════════════════ */}
      {!needsBranchSelection && !showChangeBranch && (
        <>
          {/* ── Active branch pill (shown to SA with branch selected) ── */}
          {isSuperAdmin && hasBranchSelected && (
            <div className="flex items-center justify-between gap-3 px-4 py-3
                            bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border
                                border-indigo-200 flex items-center
                                justify-center shrink-0">
                  <Building2 size={15} className="text-[#000060]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase
                                tracking-wider text-indigo-500">
                    Importing to
                  </p>
                  <p className="text-sm font-bold text-[#000060] truncate">
                    {branchContext.branch_name || "Selected Branch"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChangeBranch(true)}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold
                           text-indigo-700 bg-white border border-indigo-300
                           rounded-lg hover:bg-indigo-100
                           hover:border-indigo-400 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change
              </button>
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
              <span className="text-xs text-gray-400">
                up to {MAX_SIZE_MB} MB
              </span>
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
                spreadsheets may not import correctly or could produce
                unexpected results.
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
        </>
      )}
    </div>
  );
};

export default ImportUploadStep;