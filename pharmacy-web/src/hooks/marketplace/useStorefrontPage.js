// pharmacy-web/src/hooks/marketplace/useStorefrontPage.js (do not remove this comment)
// pharmacy-web/src/hooks/marketplace/useStorefrontPage.js

import { useState, useCallback, useRef, useEffect } from "react";
import {
  getMarketplaceStatus,
  updateStorefront,
  updateBranchSettings,
  suspendMarketplace,
  resumeMarketplace,
  uploadMarketplaceAsset,
} from "../../api/marketplace";

// ─────────────────────────────────────────────────────────────────
// IMAGE URL RESOLVER
// ─────────────────────────────────────────────────────────────────
export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

// ─────────────────────────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────────────────────────

function normalizeStorefront(raw) {
  return {
    marketplace_profile_id: raw.marketplace_profile_id ?? null,
    storefront_name:        raw.storefront_name        ?? "",
    storefront_description: raw.storefront_description ?? "",
    support_phone:          raw.support_phone          ?? "",
    logo_url:               resolveImageUrl(raw.logo_url),
    banner_url:             resolveImageUrl(raw.banner_url),
    marketplace_status:     raw.marketplace_status     ?? "LIVE",
    is_live:                raw.is_live                ?? false,
    onboarding_completed:   raw.onboarding_completed   ?? false,

    // ── BANKING DETAILS ───────────────────────────────────────
    bank_account_holder:   raw.bank_account_holder    ?? null,
    bank_name:             raw.bank_name              ?? null,
    bank_branch_name:      raw.bank_branch_name       ?? null,
    bank_ifsc:             raw.bank_ifsc              ?? null,
    bank_account_number:   raw.bank_account_number    ?? null,
    bank_mmid:             raw.bank_mmid              ?? null,
    bank_vpa:              raw.bank_vpa               ?? null,
    // ──────────────────────────────────────────────────────────
  };
}

function normalizeConfiguredBranch(bs) {
  return {
    branch_id:             bs.branch_id,
    branch_name:           bs.branch?.branch_name    ?? "Unknown Branch",
    branch_type:           bs.branch?.branch_type    ?? "branch",
    city:                  bs.branch?.city           ?? null,
    state:                 bs.branch?.state          ?? null,
    contact_number:        bs.branch?.contact_number ?? null,

    branch_marketplace_id: bs.branch_marketplace_id  ?? null,
    is_configured:         true,
    marketplace_enabled:   bs.marketplace_enabled    ?? false,

    shop_image_url:        bs.shop_image_url         ?? null,

    latitude:              bs.latitude  != null ? Number(bs.latitude)  : null,
    longitude:             bs.longitude != null ? Number(bs.longitude) : null,
    google_place_id:       bs.google_place_id    ?? null,
    formatted_address:     bs.formatted_address  ?? null,

    opening_time:          bs.opening_time ?? null,
    closing_time:          bs.closing_time ?? null,
    is_24_hours:           bs.is_24_hours  ?? false,
    open_days:             bs.open_days    ?? ['MON','TUE','WED','THU','FRI','SAT','SUN'],

    pickup_enabled:        bs.pickup_enabled   ?? false,
    delivery_enabled:      bs.delivery_enabled ?? false,
    delivery_mode:         bs.delivery_mode    ?? "CURELI",

    contact_override:      bs.contact_override ?? null,
  };
}

function normalizeUnconfiguredBranch(b) {
  return {
    branch_id:             b.branch_id,
    branch_name:           b.branch_name,
    branch_type:           b.branch_type    ?? "branch",
    city:                  b.city           ?? null,
    state:                 b.state          ?? null,
    contact_number:        b.contact_number ?? null,

    branch_marketplace_id: null,
    is_configured:         false,
    marketplace_enabled:   false,

    shop_image_url:        null,

    latitude:              null,
    longitude:             null,
    google_place_id:       null,
    formatted_address:     null,

    opening_time:          null,
    closing_time:          null,
    is_24_hours:           false,
    open_days:             ['MON','TUE','WED','THU','FRI','SAT','SUN'],

    pickup_enabled:        false,
    delivery_enabled:      false,
    delivery_mode:         "CURELI",

    contact_override:      null,
  };
}

// ─────────────────────────────────────────────────────────────────
// MERGE
// ─────────────────────────────────────────────────────────────────
function mergeBranches(allBranches, branchSettings, isSuperAdmin, callerBranchId) {
  const settingsMap = new Map(branchSettings.map((bs) => [bs.branch_id, bs]));

  const branchesToShow = isSuperAdmin
    ? allBranches
    : allBranches.filter((b) => b.branch_id === callerBranchId);

  return branchesToShow.map((b) => {
    const settings = settingsMap.get(b.branch_id);
    return settings
      ? normalizeConfiguredBranch(settings)
      : normalizeUnconfiguredBranch(b);
  });
}

// ─────────────────────────────────────────────────────────────────
// PAYLOAD BUILDER
// ─────────────────────────────────────────────────────────────────
function buildBranchPayload(branch, overrides = {}) {
  const merged = { ...branch, ...overrides };
  return {
    marketplace_enabled:  merged.marketplace_enabled,
    shop_image_url:       merged.shop_image_url    ?? null,
    latitude:             merged.latitude          ?? null,
    longitude:            merged.longitude         ?? null,
    google_place_id:      merged.google_place_id   ?? null,
    formatted_address:    merged.formatted_address ?? null,
    opening_time:         merged.opening_time      ?? null,
    closing_time:         merged.closing_time      ?? null,
    is_24_hours:          merged.is_24_hours       ?? false,
    open_days:            merged.open_days         ?? ['MON','TUE','WED','THU','FRI','SAT','SUN'],
    pickup_enabled:       merged.pickup_enabled    ?? false,
    delivery_enabled:     merged.delivery_enabled  ?? false,
    delivery_mode:        merged.delivery_mode     ?? "CURELI",
    contact_override:     merged.contact_override  ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────
export function useStorefrontPage() {
  // ── Data ──────────────────────────────────
  const [storefront, setStorefront]           = useState(null);
  const [branches,   setBranches]             = useState([]);

  // ── Loading ───────────────────────────────
  // ★ FIX: Initialize as `true` because the hook fetches on mount.
  // This prevents the first render from evaluating `!storefront`
  // and flashing an ErrorState during page transitions, which
  // was breaking Framer Motion's <AnimatePresence mode="wait">
  // entry layout projection.
  const [isLoading,       setIsLoading]       = useState(true);
  const [storefrontError, setStorefrontError] = useState(null);
  const [branchesError,   setBranchesError]   = useState(null);

  // ── Action states ─────────────────────────
  const [isSuspending,        setIsSuspending]        = useState(false);
  const [isResuming,          setIsResuming]           = useState(false);
  const [isUpdatingStorefront,setIsUpdatingStorefront] = useState(false);
  const [togglingBranchId,    setTogglingBranchId]    = useState(null);
  const [savingBranchId,      setSavingBranchId]      = useState(null);
  const [isUploading,         setIsUploading]          = useState({});
  const [uploadProgress,      setUploadProgress]       = useState({});

  // ── Internal refs ─────────────────────────
  const callerRef = useRef({ isSuperAdmin: false, branchId: null });
  const loadIdRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────
  const load = useCallback(
    async ({ isSuperAdmin = false, branchId = null } = {}) => {
      const myId = ++loadIdRef.current;

      callerRef.current = { isSuperAdmin, branchId };

      setIsLoading(true);
      setStorefrontError(null);
      setBranchesError(null);

      try {
        const res  = await getMarketplaceStatus();
        const data = res.data?.data;

        if (!data) throw new Error("Invalid response from server");

        if (myId !== loadIdRef.current) return;
        if (!isMounted.current) return;

        setStorefront(normalizeStorefront(data));
        setBranches(
          mergeBranches(
            data.all_branches    ?? [],
            data.branch_settings ?? [],
            isSuperAdmin,
            branchId,
          ),
        );
      } catch (err) {
        if (myId !== loadIdRef.current || !isMounted.current) return;
        const message =
          err.response?.data?.message ?? err.message ?? "Failed to load";
        setStorefrontError(message);
        setBranchesError(message);
      } finally {
        if (myId === loadIdRef.current && isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // ─────────────────────────────────────────
  // REFRESH
  // ─────────────────────────────────────────
  const refresh = useCallback(async () => {
    const { isSuperAdmin, branchId } = callerRef.current;
    const myId = ++loadIdRef.current;

    if (isMounted.current) {
      setStorefrontError(null);
      setBranchesError(null);
    }

    try {
      const res  = await getMarketplaceStatus();
      const data = res.data?.data;

      if (!data) throw new Error("Invalid response from server");

      if (myId !== loadIdRef.current || !isMounted.current) return;

      setStorefront(normalizeStorefront(data));
      setBranches(
        mergeBranches(
          data.all_branches    ?? [],
          data.branch_settings ?? [],
          isSuperAdmin,
          branchId,
        ),
      );
    } catch (err) {
      if (myId !== loadIdRef.current || !isMounted.current) return;
      const message =
        err.response?.data?.message ?? err.message ?? "Failed to refresh";
      setStorefrontError(message);
      setBranchesError(message);
    }
  }, []);

  // ─────────────────────────────────────────
  // TOGGLE BRANCH
  // ─────────────────────────────────────────
  const toggleBranch = useCallback(
    async (branch_id, newValue) => {
      if (togglingBranchId) return;

      const currentBranch = branches.find((b) => b.branch_id === branch_id);
      if (!currentBranch) return;

      setBranches((prev) =>
        prev.map((b) =>
          b.branch_id === branch_id
            ? { ...b, marketplace_enabled: newValue, is_configured: true }
            : b,
        ),
      );

      setTogglingBranchId(branch_id);

      try {
        const payload = buildBranchPayload(currentBranch, {
          marketplace_enabled: newValue,
        });
        await updateBranchSettings(branch_id, payload);
        await refresh();
      } catch (err) {
        setBranches((prev) =>
          prev.map((b) =>
            b.branch_id === branch_id
              ? { ...b, marketplace_enabled: !newValue }
              : b,
          ),
        );
        throw err;
      } finally {
        setTogglingBranchId(null);
      }
    },
    [branches, togglingBranchId, refresh],
  );

  // ─────────────────────────────────────────
  // SAVE BRANCH CONFIG
  // ─────────────────────────────────────────
  const saveBranchConfig = useCallback(
    async (branch_id, formData) => {
      setSavingBranchId(branch_id);
      try {
        await updateBranchSettings(branch_id, formData);
        await refresh();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message ?? err.message ?? "Failed to save",
        };
      } finally {
        setSavingBranchId(null);
      }
    },
    [refresh],
  );

  // ─────────────────────────────────────────
  // SAVE STOREFRONT
  // ─────────────────────────────────────────
  const saveStorefrontData = useCallback(
    async (formData) => {
      setIsUpdatingStorefront(true);
      try {
        await updateStorefront(formData);
        await refresh();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err.response?.data?.message ??
            err.message ??
            "Failed to update storefront",
        };
      } finally {
        setIsUpdatingStorefront(false);
      }
    },
    [refresh],
  );

  // ─────────────────────────────────────────
  // UPLOAD ASSET
  // ─────────────────────────────────────────
  const uploadAsset = useCallback(async (type, file) => {
    setIsUploading((prev)     => ({ ...prev, [type]: true  }));
    setUploadProgress((prev)  => ({ ...prev, [type]: 0     }));
    try {
      const res  = await uploadMarketplaceAsset(type, file, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [type]: pct }));
      });
      const data = res.data?.data;
      if (!data?.url) throw new Error("Upload response missing URL");
      return { success: true, url: resolveImageUrl(data.url) };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? err.message ?? "Upload failed",
      };
    } finally {
      setIsUploading((prev)    => ({ ...prev, [type]: false }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0     }));
    }
  }, []);

  // ─────────────────────────────────────────
  // SUSPEND
  // ─────────────────────────────────────────
  const suspend = useCallback(async () => {
    setIsSuspending(true);
    try {
      await suspendMarketplace();
      await refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? err.message ?? "Failed to suspend",
      };
    } finally {
      setIsSuspending(false);
    }
  }, [refresh]);

  // ─────────────────────────────────────────
  // RESUME
  // ─────────────────────────────────────────
  const resume = useCallback(async () => {
    setIsResuming(true);
    try {
      await resumeMarketplace();
      await refresh();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? err.message ?? "Failed to resume",
      };
    } finally {
      setIsResuming(false);
    }
  }, [refresh]);

  // ─────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────
  const enabledBranchCount   = branches.filter((b) => b.marketplace_enabled).length;
  const deliveryEnabledCount = branches.filter((b) => b.marketplace_enabled && b.delivery_enabled).length;
  const pickupEnabledCount   = branches.filter((b) => b.marketplace_enabled && b.pickup_enabled).length;
  const isSuspended          = storefront?.marketplace_status === "SUSPENDED";
  const isLive               = storefront?.marketplace_status === "LIVE";

  return {
    storefront,
    branches,

    isLoading,
    storefrontError,
    branchesError,

    isSuspending,
    isResuming,
    isUpdatingStorefront,
    togglingBranchId,
    savingBranchId,
    uploadProgress,
    isUploading,

    enabledBranchCount,
    deliveryEnabledCount,
    pickupEnabledCount,
    isSuspended,
    isLive,
    totalBranchCount: branches.length,

    load,
    refresh,
    toggleBranch,
    saveBranchConfig,
    saveStorefrontData,
    uploadAsset,
    suspend,
    resume,
  };
}