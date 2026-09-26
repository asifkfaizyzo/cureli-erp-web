// pharmacy-web/src/hooks/useSuppliers.js (do not remove this comment)
// src/hooks/useSuppliers.js
import { useState, useEffect, useCallback } from "react";
import suppliersAPI from "../api/suppliers";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
} from "../store/useAuthStore";

export const useSuppliers = () => {
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);

  const fetchSuppliers = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          ...filters,
          ...(branchContext.mode === "BRANCH" &&
            branchContext.branch_id && {
              branch_id: branchContext.branch_id,
            }),
        };

        const response = await suppliersAPI.getAll(params);

        if (response.success) {
          const suppliersData = response.data.suppliers || [];
          setSuppliers(suppliersData);
          setMode(response.data.mode || "BRANCH");
        } else {
          setError(response.message || "Failed to fetch suppliers");
          setSuppliers([]);
        }
      } catch (err) {
        console.error("useSuppliers fetch error:", err);
        setError(err.message || "Failed to fetch suppliers");
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    },
    [branchContext.mode, branchContext.branch_id],
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const createSupplier = useCallback(
    async (data) => {
      try {
        if (branchContext.mode !== "BRANCH" || !branchContext.branch_id) {
          return {
            success: false,
            error: "Please select a branch to create suppliers",
          };
        }

        const response = await suppliersAPI.create(
          data,
          branchContext.branch_id,
        );

        if (response.success) {
          await fetchSuppliers();
          return { success: true, data: response.data };
        }
        return { success: false, error: response.message };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [branchContext.branch_id, branchContext.mode, fetchSuppliers],
  );

  const updateSupplier = useCallback(
    async (supplierId, data) => {
      try {
        const response = await suppliersAPI.update(supplierId, data);
        if (response.success) {
          await fetchSuppliers();
          return { success: true, data: response.data };
        }
        return { success: false, error: response.message };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [fetchSuppliers],
  );

  // Super Admin methods
  const getSupplierBranches = useCallback(
    async (supplierId) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.getSupplierBranches(supplierId);
        return { success: response.success, data: response.data };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin],
  );

  const addSupplierToBranch = useCallback(
    async (supplierId, branchId) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.addToBranch(supplierId, branchId);
        if (response.success) {
          await fetchSuppliers();
        }
        return {
          success: response.success,
          data: response.data,
          message: response.message,
        };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin, fetchSuppliers],
  );

  const removeSupplierFromBranch = useCallback(
    async (supplierId, branchId) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.removeFromBranch(
          supplierId,
          branchId,
        );
        if (response.success) {
          await fetchSuppliers();
        }
        return { success: response.success, message: response.message };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin, fetchSuppliers],
  );

  const updateSupplierBranches = useCallback(
    async (supplierId, branchIds) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.updateBranches(
          supplierId,
          branchIds,
        );
        if (response.success) {
          await fetchSuppliers();
        }
        return { success: response.success, data: response.data };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin, fetchSuppliers],
  );

  const getAvailableForBranch = useCallback(
    async (branchId, search = "") => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.getAvailableForBranch(
          branchId,
          search,
        );
        return { success: response.success, data: response.data };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin],
  );

  //  Deactivate supplier
  const deactivateSupplier = useCallback(
    async (supplierId) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.deactivate(supplierId);
        if (response.success) {
          await fetchSuppliers();
        }
        return {
          success: response.success,
          data: response.data,
          message: response.message,
        };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin, fetchSuppliers],
  );

  //  Reactivate supplier
  const reactivateSupplier = useCallback(
    async (supplierId, branchId) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.reactivate(supplierId, branchId);
        if (response.success) {
          await fetchSuppliers();
        }
        return {
          success: response.success,
          data: response.data,
          message: response.message,
        };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin, fetchSuppliers],
  );

  //  Remove from all branches
  const removeFromAllBranches = useCallback(
    async (supplierId) => {
      if (!isSuperAdmin) return { success: false, error: "Not authorized" };

      try {
        const response = await suppliersAPI.removeFromAllBranches(supplierId);
        if (response.success) {
          await fetchSuppliers();
        }
        return {
          success: response.success,
          data: response.data,
          message: response.message,
        };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [isSuperAdmin, fetchSuppliers],
  );

  return {
    suppliers,
    loading,
    error,
    mode,
    isGlobalMode: mode === "GLOBAL",
    isBranchMode: mode === "BRANCH",
    currentBranchId: branchContext.branch_id,
    currentBranchName: branchContext.branch_name,
    isSuperAdmin,
    refresh: fetchSuppliers,
    createSupplier,
    updateSupplier,
    getSupplierBranches,
    addSupplierToBranch,
    removeSupplierFromBranch,
    updateSupplierBranches,
    getAvailableForBranch,
    deactivateSupplier,
    reactivateSupplier,
    removeFromAllBranches,
  };
};
