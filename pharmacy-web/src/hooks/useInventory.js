// pharmacy-web/src/hooks/useInventory.js (do not remove this comment)
// src/hooks/useInventory.js

import { useState, useEffect, useCallback } from "react";
import inventoryAPI from "../api/inventory";
import { useAuthStore, selectBranchContext } from "../store/useAuthStore";

export const useInventory = (initialFilters = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
  });

  const branchContext = useAuthStore(selectBranchContext);
  const branchMode = branchContext.mode;
  const branchId = branchContext.branch_id;
  const branchName = branchContext.branch_name;

  // =====================
  // FETCH INVENTORY
  // =====================
  const fetchInventory = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await inventoryAPI.getAll(filters);

      if (response.success) {
        const rawData = response.data.inventories || response.data || [];
       

        const mappedItems = mapInventoryData(rawData);
       ;

        setItems(mappedItems);
        setPagination({
          total: response.data.total || mappedItems.length,
          limit: filters.limit || 100,
          offset: filters.offset || 0,
        });
      } else {
        throw new Error(response.message || "Failed to fetch inventory");
      }
    } catch (err) {
      console.error("Fetch inventory error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch inventory",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================
  // FETCH SUMMARY
  // =====================
  const fetchSummary = useCallback(async (branchIdParam = null) => {
    try {
      const response = await inventoryAPI.getSummary(branchIdParam);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error("Fetch summary error:", err);
    }
  }, []);

  // =====================
  // FETCH BY MEDICINE
  // =====================
  const fetchByMedicine = useCallback(async (medicineId, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await inventoryAPI.getByMedicine(medicineId, filters);
      if (response.success) {
        const mappedItems = mapInventoryData(response.data);
        setItems(mappedItems);
      } else {
        throw new Error(response.message || "Failed to fetch inventory");
      }
    } catch (err) {
      console.error("Fetch by medicine error:", err);
      setError(err.response?.data?.message || err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================
  // CREATE ADJUSTMENT
  // =====================
  const createAdjustment = useCallback(
    async (adjustmentData) => {
      try {
        const response = await inventoryAPI.createAdjustment(adjustmentData);
        if (response.success) {
          await fetchInventory();
          await fetchSummary();
          return { success: true, data: response.data };
        } else {
          throw new Error(response.message || "Failed to create adjustment");
        }
      } catch (err) {
        console.error("Create adjustment error:", err);
        return {
          success: false,
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to create adjustment",
        };
      }
    },
    [fetchInventory, fetchSummary],
  );

  // =====================
  //  NEW: UPDATE INVENTORY
  // =====================
  const updateInventory = useCallback(
    async (inventoryId, updateData) => {
      try {
       

        const response = await inventoryAPI.update(inventoryId, updateData);

        if (response.success) {
          

          // Refresh inventory list and summary
          await fetchInventory();
          await fetchSummary();

          return { success: true, data: response.data };
        } else {
          throw new Error(response.message || "Failed to update inventory");
        }
      } catch (err) {
        console.error("Update inventory error:", err);
        return {
          success: false,
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to update inventory",
        };
      }
    },
    [fetchInventory, fetchSummary],
  );

  // =====================
  //  NEW: DELETE INVENTORY
  // =====================
  const deleteInventory = useCallback(
    async (inventoryId) => {
      try {
       

        const response = await inventoryAPI.delete(inventoryId);

        if (response.success) {
         

          // Refresh inventory list and summary
          await fetchInventory();
          await fetchSummary();

          return { success: true, data: response.data };
        } else {
          throw new Error(response.message || "Failed to delete inventory");
        }
      } catch (err) {
        console.error("Delete inventory error:", err);
        return {
          success: false,
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to delete inventory",
        };
      }
    },
    [fetchInventory, fetchSummary],
  );

  // =====================
  // REFRESH
  // =====================
  const refresh = useCallback(
    (filters = {}) => {
      fetchInventory(filters);
      fetchSummary(filters.branchId);
    },
    [fetchInventory, fetchSummary],
  );

  // =====================
  // AUTO-FETCH ON BRANCH CHANGE
  // =====================
  useEffect(() => {
    

    fetchInventory(initialFilters);
    fetchSummary();
  }, [branchMode, branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // =====================
  // RETURN
  // =====================
  return {
    // State
    items,
    loading,
    error,
    summary,
    pagination,

    // Fetch methods
    fetchInventory,
    fetchByMedicine,
    fetchSummary,

    // CRUD methods
    createAdjustment,
    updateInventory, //  NEW
    deleteInventory, //  NEW

    // Utilities
    refresh,
    setItems,

    // Branch context
    currentBranchMode: branchMode,
    currentBranchId: branchId,
    currentBranchName: branchName,
  };
};

// =====================
// HELPER: MAP INVENTORY DATA
// =====================
export const mapInventoryData = (inventories) => {
  if (!Array.isArray(inventories)) {
    console.warn("mapInventoryData received non-array:", inventories);
    return [];
  }

  return inventories.map((inv, index) => {
    // Debug first item
    if (index === 0) {
    
    }

    // Get medicine data - handle both nested and flat structures
    const medicine = inv.medicine || {};
    const medicineName =
      medicine.name || inv.name || inv.medicine_name || "Unknown";
    const manufacturer =
      medicine.manufacturer || inv.manufacturer || inv.mfac || "-";
    const category = medicine.category || inv.category || "-";
    const hsnCode = medicine.hsn_code || inv.hsn_code || inv.hsn || "-";
    const packSize = medicine.pack_size || inv.pack_size || inv.pack || "-";

    // Branch data
    const branch = inv.branch || {};
    const branchName = branch.branch_name || inv.branch_name || "-";

    // Format expiry date
    const formattedExpiry = formatExpiryDate(inv.expiry_date);

    // Calculate status
    const status =
      inv.status ||
      calculateStatus({
        current_stock: inv.current_stock,
        minimum_stock: inv.minimum_stock,
        medicine_min_stock: medicine.min_stock_level || inv.medicine_min_stock,
        medicine_reorder_point:
          medicine.reorder_point || inv.medicine_reorder_point,
        is_expired: inv.is_expired,
        expiry_date: inv.expiry_date,
      });

    const mapped = {
      // IDs
      id: inv.inventory_id,
      inventory_id: inv.inventory_id,
      medicine_id: inv.medicine_id,
      shop_id: inv.shop_id,
      branch_id: inv.branch_id,

      // Product display fields
      name: medicineName,
      category: category,
      manufacturer: manufacturer,
      mfac: manufacturer,
      hsn: hsnCode,
      pack: packSize,

      // Batch & Expiry
      batch: inv.batch_number || "-",
      batch_number: inv.batch_number,
      expiry: formattedExpiry,
      expiry_date: inv.expiry_date,

      // Stock info
      qty: Number(inv.current_stock ?? 0),
      current_stock: Number(inv.current_stock ?? 0),
      available_stock: Number(inv.available_stock ?? inv.current_stock ?? 0),
      reserved_stock: Number(inv.reserved_stock ?? 0),
      minStock: inv.minimum_stock ?? medicine.min_stock_level ?? null,
      minimum_stock: inv.minimum_stock,

      // Medicine-level thresholds
      medicine_min_stock: medicine.min_stock_level,
      medicine_max_stock: medicine.max_stock_level,
      medicine_reorder_point: medicine.reorder_point,

      // Pricing
      mrp: Number(inv.mrp ?? 0),
      slr: inv.selling_rate ?? null,
      selling_rate: inv.selling_rate,
      purchaseRate: inv.last_purchase_rate ?? null,
      last_purchase_rate: inv.last_purchase_rate,

      // Location
      rack: inv.rack_no || "-",
      rack_no: inv.rack_no,

      // Branch info
      branch: branchName,
      branch_name: branchName,

      // Supplier
      supplier: inv.supplier_name || "-",
      supplier_name: inv.supplier_name,

      // Status
      status: status,
      is_expired: inv.is_expired,
      is_active: inv.is_active,

      // Timestamps
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      last_purchase_date: inv.last_purchase_date,

      // Keep medicine object for reference
      medicine: medicine,
    };

    return mapped;
  });
};

// Helper to format expiry date
const formatExpiryDate = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  } catch {
    return "-";
  }
};

// Status calculation with all thresholds
const calculateStatus = (inv) => {
  const currentStock = Number(inv.current_stock ?? inv.qty ?? 0);

  const minStock = Number(
    inv.minimum_stock ?? inv.minStock ?? inv.medicine_min_stock ?? 0,
  );
  const reorderPoint = Number(
    inv.medicine_reorder_point ?? inv.reorder_point ?? 0,
  );

  if (inv.is_expired) {
    return "Expired";
  }

  if (inv.expiry_date) {
    const expiryDate = new Date(inv.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) return "Expired";
    if (daysUntilExpiry <= 30) return "Expiring Soon";
  }

  if (currentStock <= 0) {
    return "Out of Stock";
  }

  if (reorderPoint > 0 && currentStock <= reorderPoint) {
    return "Low Stock";
  }
  if (minStock > 0 && currentStock <= minStock) {
    return "Low Stock";
  }

  if (minStock === 0 && reorderPoint === 0) {
    if (currentStock <= 5) return "Low Stock";
  }

  return "In Stock";
};

export default useInventory;
