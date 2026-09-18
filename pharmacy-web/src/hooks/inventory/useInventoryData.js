// src/hooks/inventory/useInventoryData.js

import { useState, useCallback, useRef } from "react";
import medicinesAPI from "../../api/medicines";
import inventoryAPI from "../../api/inventory";

export const useInventoryData = () => {
  const [medicines, setMedicines]               = useState([]);
  const [total, setTotal]                       = useState(0);
  const [loading, setLoading]                   = useState(false);
  const [catalogLinkStatus, setCatalogLinkStatus]       = useState({});
  const [catalogStatusLoading, setCatalogStatusLoading] = useState(false);
  const [resubmitEligibleCount, setResubmitEligibleCount] = useState(0);

  // Stats come from the summary endpoint — correct totals across ALL records
  const [stats, setStats] = useState({
    totalItems:   0,
    totalStock:   0,
    lowStock:     0,
    outOfStock:   0,
    expired:      0,
    expiringSoon: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const abortControllerRef = useRef(null);
  const requestIdRef       = useRef(0);

  // ── Fetch one page of inventory ───────────────────────────────────────────

  const fetchInventory = useCallback(async (filters = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const thisRequestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const response = await inventoryAPI.getInventory(filters, {
        signal: controller.signal,
      });

      if (thisRequestId !== requestIdRef.current) return;

      let items = [];
      let totalCount = 0;

      if (response?.success && response?.data) {
        items      = response.data.inventories || response.data || [];
        totalCount = response.data.total       || items.length;
      } else if (Array.isArray(response?.data)) {
        items      = response.data;
        totalCount = items.length;
      } else if (Array.isArray(response)) {
        items      = response;
        totalCount = items.length;
      }

      const normalized = Array.isArray(items) ? items : [];
      setMedicines(normalized);
      setTotal(totalCount);

      if (normalized.length > 0) {
        fetchCatalogStatusForItems(normalized);
      } else {
        setCatalogLinkStatus({});
        setCatalogStatusLoading(false);
      }
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") return;

      if (thisRequestId === requestIdRef.current) {
        console.error("Error fetching inventory:", error);
        setMedicines([]);
        setTotal(0);
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ── Fetch summary stats (full dataset counts, not page counts) ────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await inventoryAPI.getSummary();
      if (response?.success && response?.data) {
        const d = response.data;
        setStats({
          totalItems:   d.totalItems          || 0,
          totalStock:   d.totalStockQuantity  || 0,
          lowStock:     d.lowStockCount       || 0,
          outOfStock:   d.outOfStockCount     || 0,
          expired:      d.expiredCount        || 0,
          expiringSoon: d.expiringSoonCount   || 0,
        });
      }
    } catch (error) {
      console.warn("Stats fetch failed:", error.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Catalog status ────────────────────────────────────────────────────────

  const fetchCatalogStatusForItems = async (items) => {
    if (!items || items.length === 0) return;

    setCatalogStatusLoading(true);
    try {
      const medicineIds = items
        .map((m) => m.medicine_id || m.id)
        .filter(Boolean);

      if (medicineIds.length === 0) return;

      const response = await medicinesAPI.getCatalogLinkStatus(medicineIds);

      if (response?.success && Array.isArray(response.data)) {
        const statusMap = {};
        response.data.forEach((item) => {
          if (item.medicine_id) {
            statusMap[item.medicine_id] = {
              status:            item.status            || "NOT_LINKED",
              master_medicine_id: item.master_medicine_id,
              confidence:        item.confidence        || 0,
              pending_link_id:   item.pending_link_id,
            };
          }
        });
        setCatalogLinkStatus(statusMap);
      }
    } catch (error) {
      console.warn("Catalog link status not available:", error.message);
      setCatalogLinkStatus({});
    } finally {
      setCatalogStatusLoading(false);
    }
  };

  const refreshCatalogStatus = useCallback(async () => {
    setMedicines((current) => {
      fetchCatalogStatusForItems(current);
      return current;
    });
  }, []);

  const deleteMedicine = useCallback(async (inventoryId) => {
    try {
      await inventoryAPI.delete(inventoryId);
      setMedicines((prev) =>
        prev.filter(
          (m) => m.inventory_id !== inventoryId && m.id !== inventoryId,
        ),
      );
      // Refresh stats after deletion
      fetchStats();
    } catch (error) {
      console.error("Error deleting medicine:", error);
      throw error;
    }
  }, [fetchStats]);

  const fetchResubmitCount = useCallback(async () => {
    try {
      const response = await medicinesAPI.getResubmitCount();
      if (response?.success && typeof response.data?.count === "number") {
        setResubmitEligibleCount(response.data.count);
      }
    } catch (error) {
      console.warn("Failed to fetch resubmission counts:", error.message);
    }
  }, []);


  return {
    medicines,
    total,
    loading,
    fetchInventory,
    fetchStats,
    deleteMedicine,
    catalogLinkStatus,
    catalogStatusLoading,
    refreshCatalogStatus,
    stats,
    statsLoading,
    resubmitEligibleCount,
    fetchResubmitCount, 
  };
};