// pharmacy-web/src/hooks/inventory/useInventoryImport.js (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\hooks\inventory\useInventoryImport.js
import { useState, useCallback, useEffect, useRef } from "react";
import inventoryImportAPI from "../../api/inventoryImport";

const POLL_INTERVAL_MS = 2000;

const PHASE_LABELS = {
  PARSING:       "Reading file...",
  DEDUPLICATING: "Finding unique medicines...",
  CATALOG_CHECK: "Checking master catalog...",
  VALIDATING:    "Validating rows...",
  READY:         "Ready",
  WRITING:       "Writing to inventory...",
};

export const STEPS = {
  UPLOAD:     "upload",
  PROCESSING: "processing",
  CONFLICTS:  "conflicts",
  CONFIRM:    "confirm",
  WRITING:    "writing",   // new — shown while background write runs
  RESULT:     "result",
};

function getInitialState() {
  return {
    step:               STEPS.UPLOAD,

    // Job tracking
    importJobId:        null,
    jobStatus:          null,
    processingPhase:    null,
    processingProgress: 0,

    // Upload step
    selectedFile:          null,
    totalRows:             0,
    detectedSoftware:      null,
    duplicateFileWarning:  null,

    // After processing completes
    medicinePlans:      {},
    autoSummary:        null,
    conflictReport:     {},
    hasConflicts:       false,
    validRows:          0,
    errorRows:          0,
    errorLog:           [],

    // Conflict step
    userConflictDecisions: {},

    // Confirm step
    preWriteSummary:    null,

    // Result step
    importResult:       null,

    // UI
    loading: false,
    error:   null,
  };
}

export function useInventoryImport() {
  const [state, setState]   = useState(getInitialState);
  const pollIntervalRef     = useRef(null);

  const setLoading = useCallback((loading) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setState(getInitialState());
  }, [stopPolling]);

  useEffect(() => { return () => stopPolling(); }, [stopPolling]);

  // ── UPLOAD ────────────────────────────────────────────────────────────────

  const uploadFile = useCallback(async (file) => {
    clearError();
    setLoading(true);

    try {
      const response = await inventoryImportAPI.upload(file);
      if (!response.success) throw new Error(response.message || "Upload failed.");

      const data = response.data;

      setState((prev) => ({
        ...prev,
        importJobId:          data.importJobId,
        jobStatus:            data.status,
        processingPhase:      data.processingPhase,
        processingProgress:   data.processingProgress,
        totalRows:            data.totalRows,
        detectedSoftware:     data.detectedSoftware,
        duplicateFileWarning: data.duplicateFileWarning,
        selectedFile:         file,
        step:                 STEPS.PROCESSING,
        loading:              false,
        error:                null,
      }));

      startPolling(data.importJobId);
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Failed to upload file.");
    }
  }, [clearError, setLoading, setError]); // eslint-disable-line

  // ── PARSE-PHASE POLLING ───────────────────────────────────────────────────
  // Polls during PARSING / CATALOG_CHECK / VALIDATING.
  // Stops when job reaches AWAITING_REVIEW or FAILED.

  const startPolling = useCallback((importJobId) => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await inventoryImportAPI.getStatus(importJobId);
        if (!response.success) return;

        const data = response.data;

        setState((prev) => ({
          ...prev,
          jobStatus:          data.status,
          processingPhase:    data.processingPhase,
          processingProgress: data.processingProgress,
        }));

        if (data.status === "AWAITING_REVIEW") {
          stopPolling();
          await loadFullJob(importJobId);
          return;
        }

        if (data.status === "FAILED") {
          stopPolling();
          setState((prev) => ({
            ...prev,
            step:  STEPS.UPLOAD,
            error: "Processing failed. Please check your file and try again.",
          }));
        }
      } catch (err) {
        console.warn("[useInventoryImport] Parse poll error:", err.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]); // eslint-disable-line

  // ── WRITE-PHASE POLLING ───────────────────────────────────────────────────
  // Polls after confirmImport queues the background write.
  // Stops when job reaches COMPLETED / PARTIAL / FAILED.

  const startWritePolling = useCallback((importJobId) => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await inventoryImportAPI.getStatus(importJobId);
        if (!response.success) return;

        const data = response.data;

        if (data.status === "COMPLETED" || data.status === "PARTIAL") {
          stopPolling();

          if (!data.writeResult) {
            // writeResult not yet flushed — wait one more poll cycle
            return;
          }

          setState((prev) => ({
            ...prev,
            importResult: data.writeResult,
            jobStatus:    data.status,
            step:         STEPS.RESULT,
            loading:      false,
            error:        null,
          }));
          return;
        }

        if (data.status === "FAILED") {
          stopPolling();
          setState((prev) => ({
            ...prev,
            jobStatus: data.status,
            loading:   false,
            error:     "Import failed during writing. Some records may not have been saved.",
          }));
          return;
        }

        // Still CONFIRMING / WRITING — keep polling
      } catch (err) {
        console.warn("[useInventoryImport] Write poll error:", err.message);
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const loadFullJob = useCallback(async (importJobId) => {
    try {
      const response = await inventoryImportAPI.getJob(importJobId);
      if (!response.success) throw new Error(response.message || "Failed to load job.");

      const data = response.data;

      const nextStep = data.hasConflicts ? STEPS.CONFLICTS : STEPS.CONFIRM;

      let preWriteSummary = null;
      if (!data.hasConflicts) {
        preWriteSummary = {
          willImport:     data.validRows || 0,
          willMerge:      0,
          willReplace:    0,
          willSkip:       0,
          blockedByError: data.errorRows || 0,
          totalConflicts: 0,
        };
      }

      setState((prev) => ({
        ...prev,
        jobStatus:           "AWAITING_REVIEW",
        medicinePlans:       data.medicinePlans    || {},
        autoSummary:         data.autoSummary      || null,
        conflictReport:      data.conflictDecisions || {},
        hasConflicts:        data.hasConflicts      || false,
        validRows:           data.validRows         || 0,
        errorRows:           data.errorRows         || 0,
        errorLog:            data.errorLog          || [],
        preWriteSummary,
        step:                nextStep,
        loading:             false,
        error:               null,
      }));
    } catch (err) {
      setError(err.message || "Failed to load processing results.");
    }
  }, [setError]);

  // ── CONFLICTS ─────────────────────────────────────────────────────────────

  const setConflictDecision = useCallback((conflictKey, decision) => {
    setState((prev) => ({
      ...prev,
      userConflictDecisions: {
        ...prev.userConflictDecisions,
        [conflictKey]: decision,
      },
    }));
  }, []);

  const setAllConflictDecisions = useCallback((decision) => {
    setState((prev) => {
      const decisions = {};
      Object.keys(prev.conflictReport).forEach((k) => { decisions[k] = decision; });
      return { ...prev, userConflictDecisions: decisions };
    });
  }, []);

  const proceedFromConflicts = useCallback(async () => {
    const { importJobId, conflictReport, userConflictDecisions } = state;

    const allResolved = Object.keys(conflictReport).every(
      (k) => !!userConflictDecisions[k]
    );

    if (!allResolved) {
      setError("Please make a decision for all batch conflicts before proceeding.");
      return;
    }

    setLoading(true);
    clearError();

    try {
      const response = await inventoryImportAPI.resolve(
        importJobId,
        userConflictDecisions
      );

      if (!response.success) throw new Error(response.message || "Failed to save decisions.");

      setState((prev) => ({
        ...prev,
        preWriteSummary: response.data.summary,
        step:            STEPS.CONFIRM,
        loading:         false,
        error:           null,
      }));
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Failed to save decisions.");
    }
  }, [state, setLoading, clearError, setError]);

  // ── CONFIRM → triggers background write ───────────────────────────────────

  const confirmImport = useCallback(async () => {
    const { importJobId } = state;

    setLoading(true);
    clearError();

    try {
      const response = await inventoryImportAPI.confirm(importJobId);

      // Backend returns 202 with { queued: true }
      // success() wrapper means response.success === true
      if (!response.success) throw new Error(response.message || "Import failed.");

      // Transition to the writing step — keep loading true so button stays disabled
      setState((prev) => ({
        ...prev,
        step:    STEPS.WRITING,
        loading: true,
        error:   null,
      }));

      // Start polling for write completion
      startWritePolling(importJobId);
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Import failed."
      );
    }
  }, [state, setLoading, clearError, setError, startWritePolling]);

  // ── CANCEL ────────────────────────────────────────────────────────────────

  const cancelImport = useCallback(async () => {
    stopPolling();
    if (state.importJobId) {
      try { await inventoryImportAPI.cancel(state.importJobId); } catch { /* ignore */ }
    }
    reset();
  }, [state.importJobId, stopPolling, reset]);

  // ── DERIVED STATE ─────────────────────────────────────────────────────────

  const phaseLabel = PHASE_LABELS[state.processingPhase] || "Processing...";

  const resolvedConflictCount = Object.keys(state.userConflictDecisions).length;
  const totalConflictCount    = Object.keys(state.conflictReport).length;
  const allConflictsDone      = totalConflictCount === 0 ||
                                resolvedConflictCount >= totalConflictCount;

  return {
    ...state,
    phaseLabel,
    resolvedConflictCount,
    totalConflictCount,
    allConflictsDone,
    STEPS,
    uploadFile,
    setConflictDecision,
    setAllConflictDecisions,
    proceedFromConflicts,
    confirmImport,
    cancelImport,
    reset,
    clearError,
  };
}