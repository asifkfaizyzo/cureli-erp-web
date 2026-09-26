// pharmacy-web/src/hooks/useShopDetails.js (do not remove this comment)
// src/hooks/useShopDetails.js

import { useState, useEffect, useRef, useCallback } from "react";
import { getShopProfile } from "../api/shop";

const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const DEFAULT_DETAILS = {
  business_name: "",
  legal_name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  pincode: "",
  full_address: "",
  gst_number: "",
  drug_license_no: "",
  phone: "",
  email: "",
};

// Cache key when shop_id is not available — still fetch using JWT auth
const FALLBACK_CACHE_KEY = "__current_shop__";

/**
 * useShopDetails
 *
 * Fetches and caches real shop profile from the backend.
 * shop_id is used ONLY as a cache key — the backend resolves
 * the shop from the JWT token, so fetching works even when
 * shop_id is not present in the pharmacy-web user object.
 *
 * @param {string|null|undefined} shopId
 */
export function useShopDetails(shopId) {
  const [companyDetails, setCompanyDetails] = useState(DEFAULT_DETAILS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  // Use shopId as cache key if available, otherwise use fallback key
  // This allows fetching even when shopId is undefined
  const cacheKey = shopId || FALLBACK_CACHE_KEY;

  const fetchProfile = useCallback(
    async (force = false) => {
      // ── Cache hit ──
      if (!force) {
        const cached = CACHE.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          //console.log("[useShopDetails] Cache hit for key:", cacheKey);
          setCompanyDetails(cached.data);
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        //console.log("[useShopDetails] Fetching shop profile...");
        const response = await getShopProfile();
        //console.log("[useShopDetails] Raw API response:", response);

        if (!isMountedRef.current) return;

        // Handle both response shapes:
        // Shape 1: { success: true, data: { ... } }         ← your axios interceptor
        // Shape 2: { data: { success: true, data: { ... } } } ← raw axios
        const payload = response?.data ?? response;
        //console.log("[useShopDetails] Resolved payload:", payload);

        const shopData = payload?.data ?? payload;
        //console.log("[useShopDetails] Shop data:", shopData);

        if (
          shopData &&
          (shopData.shop_id || shopData.business_name !== undefined)
        ) {
          const formatted = {
            business_name: shopData.business_name || "",
            legal_name: shopData.legal_name || shopData.business_name || "",
            address_line_1: shopData.address_line_1 || "",
            address_line_2: shopData.address_line_2 || "",
            city: shopData.city || "",
            state: shopData.state || "",
            pincode: shopData.pincode || "",
            full_address: shopData.full_address || "",
            gst_number: shopData.gst_number || "",
            drug_license_no: shopData.drug_license_no || "",
            phone: shopData.phone || "",
            email: shopData.email || "",
          };

          //console.log("[useShopDetails] Formatted details:", formatted);

          // Store under both keys so future lookups hit cache
          // regardless of whether shopId was available
          CACHE.set(cacheKey, { data: formatted, timestamp: Date.now() });
          if (shopData.shop_id && cacheKey !== shopData.shop_id) {
            CACHE.set(shopData.shop_id, {
              data: formatted,
              timestamp: Date.now(),
            });
          }

          setCompanyDetails(formatted);
        } else {
          console.warn("[useShopDetails] Unexpected response shape:", response);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("[useShopDetails] Failed to fetch shop profile:", err);
        setError(err.message || "Failed to load shop details");
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    isMountedRef.current = true;
    // Always fetch — no longer blocked by missing shopId
    fetchProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchProfile]);

  const refetch = useCallback(() => fetchProfile(true), [fetchProfile]);

  return { companyDetails, isLoading, error, refetch };
}

export function invalidateShopDetailsCache(shopId) {
  if (shopId) {
    CACHE.delete(shopId);
  } else {
    CACHE.clear();
  }
}
