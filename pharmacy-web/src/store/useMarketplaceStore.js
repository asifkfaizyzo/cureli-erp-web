// pharmacy-web/src/store/useMarketplaceStore.js (do not remove this comment)
// pharmacy-web/src/store/useMarketplaceStore.js

import { create } from "zustand";
import {
  getMarketplaceStatus,
  saveDraft as apiSaveDraft,
  saveStorefront as apiSaveStorefront,
  saveBranchSelections as apiSaveBranchSelections,
  saveBranchConfig as apiSaveBranchConfig,
  saveBanking as apiSaveBanking, // <-- Imported
  goLive as apiGoLive,
} from "../api/marketplace";

const INTERNAL_FLAGS = ["_persisted", "_dirty"];

function stripInternalFlags(config) {
  const clean = { ...config };
  for (const flag of INTERNAL_FLAGS) {
    delete clean[flag];
  }
  return clean;
}

function cleanBranchConfigsForDraft(branchConfigs) {
  const result = {};
  for (const [branch_id, config] of Object.entries(branchConfigs)) {
    result[branch_id] = stripInternalFlags(config);
  }
  return result;
}

let draftTimer = null;

function scheduleDraftSave(getState) {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(async () => {
    const state = getState();
    if (state.marketplaceStatus === "LIVE") return;

    try {
      await apiSaveDraft({
        currentStep: state.currentStep,
        storefront: state.storefront,
        selectedBranchIds: state.selectedBranchIds,
        branchConfigs: cleanBranchConfigsForDraft(state.branchConfigs),
        banking: state.banking, // <-- Added to draft save
      });
      getState().setLastSavedAt(new Date());
    } catch (err) {
      console.warn("[marketplace] Draft autosave failed:", err.message);
    } finally {
      getState().setDraftSaving(false);
    }
  }, 1500);
}

export const useMarketplaceStore = create((set, get) => ({
  // Status
  marketplaceStatus: null,
  onboardingCompleted: false,
  isLive: false,
  isStatusLoaded: false,
  isStatusLoading: false,

  // Onboarding wizard
  currentStep: 1,

  storefront: {
    storefront_name: "",
    storefront_description: "",
    support_phone: "",
    logo_url: null,
    banner_url: null,
  },

  // ── ADDED BANKING DEFAULT STATE ──────────────────────────
  banking: {
    bank_account_holder: "",
    bank_name: "",
    bank_branch_name: "",
    bank_ifsc: "",
    bank_account_number: "",
    bank_mmid: "",
    bank_vpa: "",
  },
  // ──────────────────────────────────────────────────────────

  selectedBranchIds: [],
  branchConfigs: {},
  allBranches: [],
  savedBranchSettings: [],

  // Draft
  isDraftSaving: false,
  lastSavedAt: null,

  // Go-live
  goLiveErrors: [],
  isGoingLive: false,

  // Submission
  isSubmitting: false,
  submitError: null,

  setLastSavedAt: (time) => set({ lastSavedAt: time }),
  setDraftSaving: (val) => set({ isDraftSaving: val }),

  // LOAD STATUS
  loadStatus: async () => {
    if (get().isStatusLoading) return;

    set({ isStatusLoading: true });

    try {
      const res = await getMarketplaceStatus();
      const data = res.data?.data;
      if (!data) throw new Error("Invalid status response");

      const draft = data.onboarding_draft;

      const nextState = {
        marketplaceStatus: data.marketplace_status,
        onboardingCompleted: data.onboarding_completed,
        isLive: data.is_live,
        isStatusLoaded: true,
        isStatusLoading: false,
        allBranches: data.all_branches || [],
        savedBranchSettings: data.branch_settings || [],
      };

      if (draft && typeof draft === "object") {
        if (draft.currentStep) nextState.currentStep = draft.currentStep;
        if (draft.storefront) {
          nextState.storefront = { ...get().storefront, ...draft.storefront };
        }
        if (draft.selectedBranchIds) {
          nextState.selectedBranchIds = draft.selectedBranchIds;
        }
        if (draft.branchConfigs) {
          nextState.branchConfigs = draft.branchConfigs;
        }
        // Restore banking draft
        if (draft.banking) {
          nextState.banking = { ...get().banking, ...draft.banking };
        }
      }

      const savedBranchIds = new Set(
        (data.branch_settings || []).map((bs) => bs.branch_id)
      );

      const savedConfigs = {};
      for (const bs of data.branch_settings || []) {
        savedConfigs[bs.branch_id] = {
          marketplace_enabled: bs.marketplace_enabled,
          shop_image_url:      bs.shop_image_url || null,
          latitude:            bs.latitude ? Number(bs.latitude) : null,
          longitude:           bs.longitude ? Number(bs.longitude) : null,
          google_place_id:     bs.google_place_id || null,
          formatted_address:   bs.formatted_address || null,
          opening_time:        bs.opening_time || null,
          closing_time:        bs.closing_time || null,
          is_24_hours:         bs.is_24_hours || false,
          open_days:           bs.open_days || ['MON','TUE','WED','THU','FRI','SAT','SUN'],
          pickup_enabled:      bs.pickup_enabled || false,
          delivery_enabled:    bs.delivery_enabled || false,
          delivery_mode:       bs.delivery_mode || "CURELI", // <-- Map branch delivery mode
          contact_override:    bs.contact_override || null,
          _persisted:          true,
          _dirty:              false,
        };
      }

      const mergedConfigs = {
        ...savedConfigs,
        ...nextState.branchConfigs,
      };

      for (const branch_id of savedBranchIds) {
        if (mergedConfigs[branch_id]) {
          mergedConfigs[branch_id] = {
            ...mergedConfigs[branch_id],
            _persisted: true,
          };
        }
      }

      nextState.branchConfigs = mergedConfigs;

      if (!draft?.selectedBranchIds && data.branch_settings?.length > 0) {
        nextState.selectedBranchIds = data.branch_settings.map(
          (b) => b.branch_id
        );
      }

      if (!draft?.storefront) {
        nextState.storefront = {
          storefront_name: data.storefront_name || "",
          storefront_description: data.storefront_description || "",
          support_phone: data.support_phone || "",
          logo_url: data.logo_url || null,
          banner_url: data.banner_url || null,
        };
      }

      // Populate banking if not drafted
      if (!draft?.banking) {
        nextState.banking = {
          bank_account_holder: data.bank_account_holder || "",
          bank_name: data.bank_name || "",
          bank_branch_name: data.bank_branch_name || "",
          bank_ifsc: data.bank_ifsc || "",
          bank_account_number: data.bank_account_number || "",
          bank_mmid: data.bank_mmid || "",
          bank_vpa: data.bank_vpa || "",
        };
      }

      set(nextState);
    } catch (err) {
      console.error("[marketplace] loadStatus error:", err);
      set({ isStatusLoaded: true, isStatusLoading: false });
    }
  },

  setStep: (step) => {
    set({ currentStep: step, isDraftSaving: true });
    scheduleDraftSave(get);
  },

  updateStorefront: (patch) => {
    set((state) => ({
      storefront: { ...state.storefront, ...patch },
      isDraftSaving: true,
    }));
    scheduleDraftSave(get);
  },

  // ── ADDED UPDATE BANKING STATE ───────────────────────────
  updateBanking: (patch) => {
    set((state) => ({
      banking: { ...state.banking, ...patch },
      isDraftSaving: true,
    }));
    scheduleDraftSave(get);
  },
  // ──────────────────────────────────────────────────────────

  setSelectedBranches: (ids) => {
    set({ selectedBranchIds: ids, isDraftSaving: true });
    scheduleDraftSave(get);
  },

  toggleBranchSelection: (branch_id) => {
    const current = get().selectedBranchIds;
    const next = current.includes(branch_id)
      ? current.filter((id) => id !== branch_id)
      : [...current, branch_id];
    set({ selectedBranchIds: next, isDraftSaving: true });
    scheduleDraftSave(get);
  },

  updateBranchConfig: (branch_id, patch) => {
    set((state) => ({
      branchConfigs: {
        ...state.branchConfigs,
        [branch_id]: {
          ...(state.branchConfigs[branch_id] || {}),
          ...patch,
        },
      },
      isDraftSaving: true,
    }));
    scheduleDraftSave(get);
  },

  initBranchConfig: (branch_id) => {
    const existing = get().branchConfigs[branch_id];
    if (existing) return;

    set((state) => ({
      branchConfigs: {
        ...state.branchConfigs,
        [branch_id]: {
          marketplace_enabled: false,
          shop_image_url:      null,
          latitude:            null,
          longitude:           null,
          google_place_id:     null,
          formatted_address:   null,
          opening_time:        null,
          closing_time:        null,
          is_24_hours:         false,
          open_days:           ['MON','TUE','WED','THU','FRI','SAT','SUN'],
          pickup_enabled:      false,
          delivery_enabled:    false,
          delivery_mode:       "CURELI", // <-- Default added here
          contact_override:    null,
          _persisted:          false,
          _dirty:              false,
        },
      },
    }));
  },

  submitStorefront: async () => {
    set({ isSubmitting: true, submitError: null });
    try {
      await apiSaveStorefront(get().storefront);
      set({ isSubmitting: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to save storefront";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },

  submitBranchSelections: async () => {
    set({ isSubmitting: true, submitError: null });
    try {
      await apiSaveBranchSelections(get().selectedBranchIds);
      set({ isSubmitting: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to save branch selections";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },

  submitBranchConfig: async (branch_id) => {
    const config = get().branchConfigs[branch_id];
    if (!config) return { success: false, error: "Branch config not found" };

    set({ isSubmitting: true, submitError: null });

    try {
      await apiSaveBranchConfig(branch_id, stripInternalFlags(config));

      set((state) => ({
        isSubmitting: false,
        branchConfigs: {
          ...state.branchConfigs,
          [branch_id]: {
            ...state.branchConfigs[branch_id],
            _persisted: true,
            _dirty: false,
          },
        },
      }));

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to save branch config";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },

  // ── ADDED SUBMIT BANKING METHOD ─────────────────────────
  submitBanking: async () => {
    set({ isSubmitting: true, submitError: null });
    try {
      await apiSaveBanking(get().banking);
      set({ isSubmitting: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to save banking details";
      set({ isSubmitting: false, submitError: message });
      return { success: false, error: message };
    }
  },
  // ──────────────────────────────────────────────────────────

  submitGoLive: async () => {
    set({ isGoingLive: true, goLiveErrors: [] });
    try {
      await apiGoLive();
      set({ isGoingLive: false });
      return { success: true };
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const message = err.response?.data?.message || err.message || "Go-live failed";
      set({ isGoingLive: false, goLiveErrors: errors });
      return { success: false, error: message, errors };
    }
  },

  confirmGoLive: () => {
    set({
      marketplaceStatus: "LIVE",
      isLive: true,
      onboardingCompleted: true,
    });
  },

  invalidateStatus: () => {
    set({ isStatusLoaded: false });
  },

  reset: () => {
    if (draftTimer) clearTimeout(draftTimer);
    set({
      marketplaceStatus: null,
      onboardingCompleted: false,
      isLive: false,
      isStatusLoaded: false,
      isStatusLoading: false,
      currentStep: 1,
      storefront: {
        storefront_name: "",
        storefront_description: "",
        support_phone: "",
        logo_url: null,
        banner_url: null,
      },
      banking: { // <-- Added to reset
        bank_account_holder: "",
        bank_name: "",
        bank_branch_name: "",
        bank_ifsc: "",
        bank_account_number: "",
        bank_mmid: "",
        bank_vpa: "",
      },
      selectedBranchIds: [],
      branchConfigs: {},
      allBranches: [],
      savedBranchSettings: [],
      isDraftSaving: false,
      lastSavedAt: null,
      goLiveErrors: [],
      isGoingLive: false,
      isSubmitting: false,
      submitError: null,
    });
  },
}));

// Added Selectors
export const selectBanking = (s) => s.banking;
export const selectMarketplaceStatus = (s) => s.marketplaceStatus;
export const selectIsLive = (s) => s.isLive;
export const selectOnboardingCompleted = (s) => s.onboardingCompleted;
export const selectIsStatusLoaded = (s) => s.isStatusLoaded;
export const selectCurrentStep = (s) => s.currentStep;
export const selectStorefront = (s) => s.storefront;
export const selectSelectedBranchIds = (s) => s.selectedBranchIds;
export const selectBranchConfigs = (s) => s.branchConfigs;
export const selectAllBranches = (s) => s.allBranches;
export const selectIsDraftSaving = (s) => s.isDraftSaving;
export const selectLastSavedAt = (s) => s.lastSavedAt;
export const selectGoLiveErrors = (s) => s.goLiveErrors;
export const selectIsGoingLive = (s) => s.isGoingLive;