// backend/src/modules/suppliers/supplier.controller.js (do not remove this comment)
// backend/src/modules/suppliers/supplier.controller.js
import { success, fail } from "../../utils/response.js";
import supplierService from "./supplier.service.js";

/* ============================================
   HELPER: Get Branch Context from Request
============================================ */
const getBranchContext = (req) => {
  //  FIX: Add null checks
  const user = req.user;

  if (!user) {
    console.error(" getBranchContext: req.user is undefined");
    return { mode: "GLOBAL", branch_id: null };
  }

  const isSuperAdmin = user.role === "super_admin";

  // Check for explicit branch_id in query/body
  const explicitBranchId = req.query?.branch_id || req.body?.branch_id;

  // Super admin can be in GLOBAL mode or BRANCH mode
  if (isSuperAdmin) {
    if (explicitBranchId) {
      return { mode: "BRANCH", branch_id: explicitBranchId };
    }
    // Check header for branch context
    const headerBranchId = req.headers?.["x-branch-id"];
    if (headerBranchId && headerBranchId !== "all") {
      return { mode: "BRANCH", branch_id: headerBranchId };
    }
    return { mode: "GLOBAL", branch_id: null };
  }

  // Non-super admin always uses their assigned branch
  //  FIX: Handle case where user.branch_id might be undefined
  return {
    mode: user.branch_id ? "BRANCH" : "GLOBAL",
    branch_id: user.branch_id || null,
  };
};

/* ============================================
   GET SUPPLIERS
============================================ */
export async function getSuppliersController(req, res) {
  try {
    //  FIX: Add user check first
    if (!req.user) {
      console.error(" getSuppliersController: No user in request");
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const branchContext = getBranchContext(req);

    const filters = {
      search: req.query.search,
      isActive:
        req.query.isActive !== undefined
          ? req.query.isActive === "true"
          : undefined,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };

   
    const result = await supplierService.getSuppliers(
      shopId,
      branchContext,
      filters,
    );

    

    return success(res, result, "Suppliers retrieved successfully");
  } catch (error) {
    console.error(" supplier.getAll ERROR:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    });
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   CREATE SUPPLIER
============================================ */
export async function createSupplierController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const userId = req.user.user_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const branchContext = getBranchContext(req);

    //  Get branch_id from context or request body
    let branchId = branchContext.branch_id;

    // If branch_id was in the original request body (before schema transform removed it)
    if (!branchId && req.body?.branch_id) {
      branchId = req.body.branch_id;
    }

    // Must have a branch to create
    if (!branchId) {
      return fail(
        res,
        "Please select a branch to create suppliers",
        400,
        "BRANCH_REQUIRED",
      );
    }

    

    const supplier = await supplierService.createSupplier(
      req.validated,
      shopId,
      branchId,
      userId,
    );

    const message = supplier.linked_to_existing
      ? supplier.message
      : "Supplier created successfully";

    return success(res, supplier, message, 201);
  } catch (error) {
    console.error(" supplier.create ERROR:", error);

    //  Better error handling with specific codes
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || "CREATE_FAILED";

    return fail(res, error.message, statusCode, errorCode);
  }
}
/* ============================================
   GET SUPPLIER BY ID
============================================ */
export async function getSupplierByIdController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const { supplierId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const branchContext = getBranchContext(req);
    const branchId =
      branchContext.mode === "BRANCH" ? branchContext.branch_id : null;

    const supplier = await supplierService.getSupplierById(
      supplierId,
      shopId,
      branchId,
    );

    return success(res, supplier, "Supplier retrieved successfully");
  } catch (error) {
    console.error(" supplier.getById ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   UPDATE SUPPLIER
============================================ */
export async function updateSupplierController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const { supplierId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const branchContext = getBranchContext(req);
    const branchId =
      branchContext.mode === "BRANCH" ? branchContext.branch_id : null;

    const supplier = await supplierService.updateSupplier(
      supplierId,
      shopId,
      req.validated,
      branchId,
    );

    return success(res, supplier, "Supplier updated successfully");
  } catch (error) {
    console.error(" supplier.update ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   GET SUPPLIER BRANCHES - Super Admin Only
============================================ */
export async function getSupplierBranchesController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const { supplierId } = req.params;

    if (req.user.role !== "super_admin") {
      return fail(res, "Only super admin can manage supplier branches", 403);
    }

    const result = await supplierService.getSupplierBranches(
      supplierId,
      shopId,
    );

    return success(res, result, "Supplier branches retrieved successfully");
  } catch (error) {
    console.error(" supplier.getBranches ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   ADD SUPPLIER TO BRANCH - Super Admin Only
============================================ */
export async function addSupplierToBranchController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { supplierId } = req.params;
    const { branch_id } = req.validated;

    if (req.user.role !== "super_admin") {
      return fail(res, "Only super admin can add suppliers to branches", 403);
    }

    const result = await supplierService.addSupplierToBranch(
      supplierId,
      branch_id,
      shopId,
      userId,
    );

    return success(res, result, "Supplier added to branch successfully");
  } catch (error) {
    console.error(" supplier.addToBranch ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   REMOVE SUPPLIER FROM BRANCH - Super Admin Only
============================================ */
export async function removeSupplierFromBranchController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const { supplierId } = req.params;
    const { branch_id } = req.validated;

    if (req.user.role !== "super_admin") {
      return fail(
        res,
        "Only super admin can remove suppliers from branches",
        403,
      );
    }

    await supplierService.removeSupplierFromBranch(
      supplierId,
      branch_id,
      shopId,
    );

    return success(res, null, "Supplier removed from branch successfully");
  } catch (error) {
    console.error(" supplier.removeFromBranch ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   BULK UPDATE SUPPLIER BRANCHES - Super Admin Only
============================================ */
export async function bulkUpdateSupplierBranchesController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { supplierId } = req.params;
    const { branch_ids } = req.validated;

    if (req.user.role !== "super_admin") {
      return fail(res, "Only super admin can manage supplier branches", 403);
    }

    const result = await supplierService.bulkUpdateSupplierBranches(
      supplierId,
      branch_ids,
      shopId,
      userId,
    );

    return success(res, result, "Supplier branches updated successfully");
  } catch (error) {
    console.error(" supplier.bulkUpdateBranches ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   GET SUPPLIERS NOT IN BRANCH - For Quick Add Modal
============================================ */
export async function getSuppliersNotInBranchController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const { branchId } = req.params;
    const { search } = req.query;

    if (req.user.role !== "super_admin") {
      return fail(res, "Only super admin can access this", 403);
    }

    const suppliers = await supplierService.getSuppliersNotInBranch(
      shopId,
      branchId,
      search,
    );

    return success(
      res,
      { suppliers },
      "Available suppliers retrieved successfully",
    );
  } catch (error) {
    console.error(" supplier.getNotInBranch ERROR:", error);
    return fail(res, error.message, error.statusCode || 500);
  }
}

/* ============================================
   DEACTIVATE SUPPLIER - Shop-wide
============================================ */
export async function deactivateSupplierController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { supplierId } = req.params;

    if (req.user.role !== "super_admin") {
      return fail(res, "Only super admin can deactivate suppliers", 403);
    }

    const result = await supplierService.deactivateSupplier(
      supplierId,
      shopId,
      userId,
    );

    return success(res, result, "Supplier deactivated successfully");
  } catch (error) {
    console.error(" supplier.deactivate ERROR:", error);
    return fail(res, error.message, error.statusCode || 500, error.code);
  }
}

/* ============================================
   REACTIVATE SUPPLIER
============================================ */
export async function reactivateSupplierController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const userId = req.user.user_id;
    const { supplierId } = req.params;
    const { branch_id } = req.validated;

    if (req.user.role !== "super_admin") {
      return fail(res, "Only super admin can reactivate suppliers", 403);
    }

    const result = await supplierService.reactivateSupplier(
      supplierId,
      shopId,
      branch_id,
      userId,
    );

    return success(res, result, "Supplier reactivated successfully");
  } catch (error) {
    console.error(" supplier.reactivate ERROR:", error);
    return fail(res, error.message, error.statusCode || 500, error.code);
  }
}

/* ============================================
   REMOVE FROM ALL BRANCHES
============================================ */
export async function removeFromAllBranchesController(req, res) {
  try {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    const shopId = req.user.shop_id;
    const { supplierId } = req.params;

    if (req.user.role !== "super_admin") {
      return fail(
        res,
        "Only super admin can remove supplier from all branches",
        403,
      );
    }

    const result = await supplierService.removeFromAllBranches(
      supplierId,
      shopId,
    );

    return success(res, result, "Supplier removed from all branches");
  } catch (error) {
    console.error(" supplier.removeFromAllBranches ERROR:", error);
    return fail(res, error.message, error.statusCode || 500, error.code);
  }
}
