// pharmacy-web/src/store/useAppModeStore.js (do not remove this comment)
// src/store/useAppModeStore.js

import { create } from "zustand";
import { useLocation } from "react-router-dom";

/**
 * ============================================
 * APP MODE STORE
 * ============================================
 *
 * Minimal Zustand store. Only used by TopHeader to trigger
 * navigation on mode switch. Not the source of truth for mode.
 *
 * Source of truth: URL pathname (see useAppMode hook below).
 */
export const useAppModeStore = create((set) => ({
  appMode: "ERP", // "ERP" | "MARKETPLACE"
  setAppMode: (mode) => set({ appMode: mode }),
}));

/**
 * ============================================
 * useAppMode — URL-derived mode hook
 * ============================================
 *
 * ALWAYS use this hook to read current app mode.
 * Derives mode from URL so page refresh is safe.
 *
 * Returns:
 *   appMode:       "ERP" | "MARKETPLACE"
 *   isERP:         boolean
 *   isMarketplace: boolean
 *
 * Usage:
 *   const { appMode, isERP, isMarketplace } = useAppMode();
 */
export function useAppMode() {
  const location = useLocation();
  const isMarketplace = location.pathname.startsWith("/marketplace");

  return {
    appMode: isMarketplace ? "MARKETPLACE" : "ERP",
    isERP: !isMarketplace,
    isMarketplace,
  };
}