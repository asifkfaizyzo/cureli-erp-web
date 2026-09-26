// pharmacy-web/src/hooks/useShopInfo.js (do not remove this comment)
// pharmacy-web/src/hooks/useShopInfo.js
// Hook to fetch and cache shop/branch information for print and other uses

import { useState, useEffect, useCallback } from "react";
import { fetchCurrentBranch } from "../api/branches";

/**
 * Hook to get shop and branch information
 * Caches the data to avoid repeated API calls
 */
export const useShopInfo = () => {
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShopInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchCurrentBranch();

      if (response.success && response.data) {
        const { branch, shop } = response.data;

        // Format the shop info for use in components
        const formattedInfo = {
          // Shop details
          shopId: shop?.shop_id,
          businessName: shop?.business_name || "Your Business Name",
          legalName: shop?.legal_name,

          // Use shop address as primary, fallback to branch
          address: formatAddress(shop) || formatAddress(branch) || "",

          // Branch details
          branchId: branch?.branch_id,
          branchName: branch?.branch_name || "Main Branch",
          branchType: branch?.branch_type,

          // Contact - use branch contact, fallback to owner contact if available
          phone: branch?.contact_number || shop?.contact_number || "",
          alternatePhone: branch?.alternate_number || "",

          // Email from shop owner if available
          email: shop?.email || "",

          // GST and licenses (keeping for reference but won't display)
          gstin: shop?.gst_number,

          // Full objects for advanced use
          shop,
          branch,
        };

        setShopInfo(formattedInfo);
      }
    } catch (err) {
      console.error("Failed to fetch shop info:", err);
      setError(err.message || "Failed to load shop information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopInfo();
  }, [fetchShopInfo]);

  const refresh = useCallback(() => {
    fetchShopInfo();
  }, [fetchShopInfo]);

  return {
    shopInfo,
    loading,
    error,
    refresh,
  };
};

/**
 * Format address from shop or branch object
 */
const formatAddress = (entity) => {
  if (!entity) return "";

  const parts = [
    entity.address_line_1,
    entity.address_line_2,
    entity.city,
    entity.state,
    entity.pincode,
  ].filter(Boolean);

  return parts.join(", ");
};

/**
 * Get formatted company info for printing
 * Can be used standalone without the hook
 */
export const getCompanyInfoForPrint = async () => {
  try {
    const response = await fetchCurrentBranch();

    if (response.success && response.data) {
      const { branch, shop } = response.data;

      return {
        name: shop?.business_name || "Your Business Name",
        address:
          formatAddress(shop) ||
          formatAddress(branch) ||
          "Address not configured",
        phone: branch?.contact_number || "",
        email: shop?.email || "",
        branchName: branch?.branch_name,
        // Not including GSTIN and Drug License as per requirement
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch company info:", error);
    return null;
  }
};

export default useShopInfo;
