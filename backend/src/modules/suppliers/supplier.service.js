// backend/src/modules/suppliers/supplier.service.js (do not remove this comment)
// backend/src/modules/suppliers/supplier.service.js
import prisma from "../../config/prisma.js";

/* =====================================================
   API ERROR
===================================================== */
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "SUPPLIER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* =====================================================
   SUPPLIER SERVICE - BRANCH CONTEXT AWARE
===================================================== */
class SupplierService {
  /* ============================================
     GET SUPPLIERS - Branch Context Aware
     
     BRANCH Mode: Returns suppliers linked to that branch
     GLOBAL Mode: Returns all unique suppliers with branch info (no duplicates)
  ============================================ */
  async getSuppliers(shopId, branchContext, filters = {}) {
    const { search, isActive, limit = 100, offset = 0 } = filters;
    const { mode, branch_id } = branchContext;

    // BRANCH MODE - Get suppliers for specific branch
    if (mode === "BRANCH" && branch_id) {
      return this._getSuppliersForBranch(shopId, branch_id, {
        search,
        isActive,
        limit,
        offset,
      });
    }

    // GLOBAL MODE - Get all unique suppliers with branch info
    return this._getAllSuppliersAggregated(shopId, {
      search,
      isActive,
      limit,
      offset,
    });
  }

  /* ============================================
     PRIVATE: Get Suppliers for Specific Branch
  ============================================ */
  async _getSuppliersForBranch(shopId, branchId, filters) {
    const { search, isActive, limit = 100, offset = 0 } = filters;

    try {
      //  Build where clause - filter by BOTH supplier.is_active AND supplierBranch.is_active
      const where = {
        branch_id: branchId,
        is_active: true, //  Only active links
        supplier: {
          shop_id: shopId,
          is_active: true, //  Only active suppliers
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { gst_number: { contains: search, mode: "insensitive" } },
              { contact_person: { contains: search, mode: "insensitive" } },
              { office_phone: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
      };



      const [supplierBranches, total] = await Promise.all([
        prisma.supplierBranch.findMany({
          where,
          include: {
            supplier: true,
            branch: {
              select: {
                branch_id: true,
                branch_name: true,
                branch_type: true,
              },
            },
          },
          orderBy: { supplier: { name: "asc" } },
          take: limit,
          skip: offset,
        }),
        prisma.supplierBranch.count({ where }),
      ]);

    

      //  Double-check filter in mapping
      const suppliers = supplierBranches
        .filter((sb) => sb.supplier && sb.supplier.is_active && sb.is_active)
        .map((sb) => ({
          ...sb.supplier,
          current_branch: sb.branch,
          supplier_branch_id: sb.id,
          linked_at: sb.created_at,
        }));

      return {
        suppliers,
        total: suppliers.length,
        mode: "BRANCH",
        branch_id: branchId,
      };
    } catch (error) {
      console.error("_getSuppliersForBranch ERROR:", error);
      throw new ApiError(
        `Failed to fetch suppliers for branch: ${error.message}`,
        500,
        "QUERY_ERROR",
      );
    }
  }

  /* ============================================
     PRIVATE: Get All Suppliers Aggregated (No Duplicates)
  ============================================ */
  async _getAllSuppliersAggregated(shopId, filters) {
    const { search, isActive, limit, offset } = filters;

    try {
      const where = {
        shop_id: shopId,
        ...(isActive !== undefined && { is_active: isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { gst_number: { contains: search, mode: "insensitive" } },
            { contact_person: { contains: search, mode: "insensitive" } },
            { office_phone: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          include: {
            branches: {
              where: { is_active: true },
              include: {
                branch: {
                  select: {
                    branch_id: true,
                    branch_name: true,
                    branch_type: true,
                    is_active: true,
                  },
                },
              },
              orderBy: {
                branch: {
                  branch_type: "asc",
                },
              },
            },
            _count: {
              select: {
                purchaseInvoices: true,
                payments: true,
              },
            },
          },
          orderBy: { name: "asc" },
          take: limit,
          skip: offset,
        }),
        prisma.supplier.count({ where }),
      ]);

      //  FIX: Safe mapping
      const formattedSuppliers = suppliers.map((supplier) => ({
        //  Handle both field names
        supplier_id: supplier.supplier_id || supplier.id,
        ...supplier,
        linked_branches: (supplier.branches || [])
          .map((sb) => ({
            branch_id: sb.branch?.branch_id,
            branch_name: sb.branch?.branch_name,
            branch_type: sb.branch?.branch_type,
            is_active: sb.branch?.is_active,
            linked_at: sb.created_at,
            supplier_branch_id: sb.id,
          }))
          .filter((b) => b.branch_id), //  Remove invalid branches
        branch_count: supplier.branches?.length || 0,
      }));

      return {
        suppliers: formattedSuppliers,
        total,
        mode: "GLOBAL",
      };
    } catch (error) {
      console.error("_getAllSuppliersAggregated ERROR:", error);
      throw new ApiError(
        `Failed to fetch all suppliers: ${error.message}`,
        500,
        "QUERY_ERROR",
      );
    }
  }

  /* ============================================
     CREATE SUPPLIER - Creates and links to branch
  ============================================ */
  async createSupplier(data, shopId, branchId, userId) {
    // Validate branch belongs to shop
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id: branchId,
        shop_id: shopId,
        is_active: true,
      },
    });

    if (!branch) {
      throw new ApiError("Invalid branch", 400, "INVALID_BRANCH");
    }

    // Check for duplicate name in shop
    const existingName = await prisma.supplier.findFirst({
      where: {
        shop_id: shopId,
        name: data.name,
      },
    });

    if (existingName) {
      // Supplier exists - check if already linked to this branch
      const existingLink = await prisma.supplierBranch.findUnique({
        where: {
          supplier_id_branch_id: {
            supplier_id: existingName.supplier_id,
            branch_id: branchId,
          },
        },
      });

      if (existingLink) {
        if (existingLink.is_active) {
          throw new ApiError(
            `Supplier "${data.name}" already exists in this branch`,
            409,
            "DUPLICATE_SUPPLIER_IN_BRANCH",
          );
        }

        // Reactivate existing link
        await prisma.supplierBranch.update({
          where: { id: existingLink.id },
          data: { is_active: true },
        });

        return {
          ...existingName,
          linked_to_existing: true,
          message: `Supplier "${data.name}" already exists and has been linked to this branch`,
        };
      }

      // Link existing supplier to this branch
      await prisma.supplierBranch.create({
        data: {
          supplier_id: existingName.supplier_id,
          branch_id: branchId,
          created_by: userId,
          is_active: true,
        },
      });

      return {
        ...existingName,
        linked_to_existing: true,
        message: `Supplier "${data.name}" already exists and has been linked to this branch`,
      };
    }

    // Check GST uniqueness if provided
    if (data.gst_number) {
      const gstExists = await prisma.supplier.findFirst({
        where: {
          shop_id: shopId,
          gst_number: data.gst_number,
        },
      });

      if (gstExists) {
        throw new ApiError(
          `Supplier with GST ${data.gst_number} already exists`,
          409,
          "DUPLICATE_GST",
        );
      }
    }

    //  FIX: Remove branch_id from data before creating supplier
    // The schema transform should have already removed it, but double-check
    const { branch_id: _branchId, ...supplierData } = data;

    // Create new supplier and link to branch
    const supplier = await prisma.$transaction(async (tx) => {
      const newSupplier = await tx.supplier.create({
        data: {
          ...supplierData,
          shop_id: shopId,
          created_by: userId,
        },
      });

      await tx.supplierBranch.create({
        data: {
          supplier_id: newSupplier.supplier_id,
          branch_id: branchId,
          created_by: userId,
          is_active: true,
        },
      });

      return newSupplier;
    });

    return supplier;
  }

  /* ============================================
     GET SUPPLIER BY ID
  ============================================ */
  async getSupplierById(supplierId, shopId, branchId = null) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: {
          where: { is_active: true },
          include: {
            branch: {
              select: {
                branch_id: true,
                branch_name: true,
                branch_type: true,
                is_active: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchaseInvoices: true,
            payments: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    // If branch context provided, verify supplier is linked to that branch
    if (branchId) {
      const isLinked = supplier.branches.some(
        (sb) => sb.branch_id === branchId,
      );
      if (!isLinked) {
        throw new ApiError(
          "Supplier not available in this branch",
          403,
          "NOT_IN_BRANCH",
        );
      }
    }

    return {
      ...supplier,
      linked_branches: supplier.branches.map((sb) => ({
        branch_id: sb.branch.branch_id,
        branch_name: sb.branch.branch_name,
        branch_type: sb.branch.branch_type,
        is_active: sb.branch.is_active,
        linked_at: sb.created_at,
        supplier_branch_id: sb.id,
      })),
      branch_count: supplier.branches.length,
    };
  }

  /* ============================================
     UPDATE SUPPLIER
  ============================================ */
  async updateSupplier(supplierId, shopId, data, branchId = null) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: branchId
          ? {
              where: { branch_id: branchId },
            }
          : undefined,
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    // If branch context, verify supplier is in that branch
    if (branchId && supplier.branches?.length === 0) {
      throw new ApiError(
        "Supplier not available in this branch",
        403,
        "NOT_IN_BRANCH",
      );
    }

    // Check name uniqueness if changing
    if (data.name && data.name !== supplier.name) {
      const nameExists = await prisma.supplier.findFirst({
        where: {
          shop_id: shopId,
          name: data.name,
          supplier_id: { not: supplierId },
        },
      });

      if (nameExists) {
        throw new ApiError(
          `Supplier "${data.name}" already exists`,
          409,
          "DUPLICATE_NAME",
        );
      }
    }

    return prisma.supplier.update({
      where: { supplier_id: supplierId },
      data,
    });
  }

  /* ============================================
   GET SUPPLIER BRANCHES - For "Manage Branches" Modal
============================================ */
  async getSupplierBranches(supplierId, shopId) {
    

    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: {
          include: {
            branch: {
              select: {
                branch_id: true,
                branch_name: true,
                branch_type: true,
                is_active: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchaseInvoices: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    // Get all active branches for the shop
    const allBranches = await prisma.branch.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
      },
      select: {
        branch_id: true,
        branch_name: true,
        branch_type: true,
      },
      orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
    });

    // Only consider ACTIVE links
    const linkedBranchIds = new Map(
      supplier.branches
        .filter((sb) => sb.is_active)
        .map((sb) => [sb.branch_id, sb]),
    );

    // Map branches with linked status
    const branchesWithStatus = allBranches.map((branch) => {
      const link = linkedBranchIds.get(branch.branch_id);
      return {
        ...branch,
        is_linked: !!link,
        supplier_branch_id: link?.id || null,
        linked_at: link?.created_at || null,
      };
    });

    return {
      supplier: {
        supplier_id: supplier.supplier_id,
        name: supplier.name,
        gst_number: supplier.gst_number,
        is_active: supplier.is_active, //  Include this!
        invoice_count: supplier._count.purchaseInvoices,
      },
      branches: branchesWithStatus,
      linked_count: linkedBranchIds.size,
      total_branches: allBranches.length,
    };
  }

  /* ============================================
     ADD SUPPLIER TO BRANCH - Super Admin Only
  ============================================ */
  async addSupplierToBranch(supplierId, branchId, shopId, userId) {
    // Verify supplier exists and belongs to shop
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    // Verify branch exists and belongs to shop
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id: branchId,
        shop_id: shopId,
        is_active: true,
      },
    });

    if (!branch) {
      throw new ApiError("Branch not found", 404, "BRANCH_NOT_FOUND");
    }

    // Check if already linked
    const existingLink = await prisma.supplierBranch.findUnique({
      where: {
        supplier_id_branch_id: {
          supplier_id: supplierId,
          branch_id: branchId,
        },
      },
    });

    if (existingLink) {
      if (existingLink.is_active) {
        throw new ApiError(
          "Supplier already linked to this branch",
          409,
          "ALREADY_LINKED",
        );
      }

      // Reactivate if was deactivated
      return prisma.supplierBranch.update({
        where: { id: existingLink.id },
        data: { is_active: true },
        include: {
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
              branch_type: true,
            },
          },
        },
      });
    }

    // Create new link
    return prisma.supplierBranch.create({
      data: {
        supplier_id: supplierId,
        branch_id: branchId,
        created_by: userId,
        is_active: true,
      },
      include: {
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
            branch_type: true,
          },
        },
      },
    });
  }

  /* ============================================
     REMOVE SUPPLIER FROM BRANCH - Super Admin Only
  ============================================ */
  async removeSupplierFromBranch(supplierId, branchId, shopId) {
    // Verify supplier belongs to shop
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: {
          where: { is_active: true },
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    // Prevent removing from last branch
    if (supplier.branches.length <= 1) {
      throw new ApiError(
        "Cannot remove supplier from last branch. Delete the supplier instead.",
        400,
        "LAST_BRANCH",
      );
    }

    // Check for pending invoices in this branch
    const pendingInvoices = await prisma.purchaseInvoice.count({
      where: {
        supplier_id: supplierId,
        branch_id: branchId,
        status: { in: ["DRAFT", "PENDING"] },
      },
    });

    if (pendingInvoices > 0) {
      throw new ApiError(
        `Cannot remove: ${pendingInvoices} pending invoice(s) in this branch`,
        400,
        "PENDING_INVOICES",
      );
    }

    // Soft delete the link
    const link = await prisma.supplierBranch.findUnique({
      where: {
        supplier_id_branch_id: {
          supplier_id: supplierId,
          branch_id: branchId,
        },
      },
    });

    if (!link) {
      throw new ApiError(
        "Supplier not linked to this branch",
        404,
        "NOT_LINKED",
      );
    }

    return prisma.supplierBranch.update({
      where: { id: link.id },
      data: { is_active: false },
    });
  }

  /* ============================================
     BULK ADD SUPPLIER TO BRANCHES - Super Admin Only
  ============================================ */
  async bulkUpdateSupplierBranches(supplierId, branchIds, shopId, userId) {
    

    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: {
          where: { is_active: true }, //  Only get active links
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    // Verify all branches belong to shop
    const validBranches = await prisma.branch.findMany({
      where: {
        branch_id: { in: branchIds },
        shop_id: shopId,
        is_active: true,
      },
    });

   

    if (validBranches.length !== branchIds.length) {
      throw new ApiError(
        "One or more invalid branches",
        400,
        "INVALID_BRANCHES",
      );
    }

    //  FIX: Get current ACTIVE linked branch IDs
    const currentLinks = supplier.branches.filter((sb) => sb.is_active);
    const currentBranchIds = currentLinks.map((sb) => sb.branch_id);

   

    // Calculate changes using array comparison
    const currentSet = new Set(currentBranchIds);
    const newSet = new Set(branchIds);

    const toAdd = branchIds.filter((id) => !currentSet.has(id));
    const toRemove = currentBranchIds.filter((id) => !newSet.has(id));

    

    // Must have at least one branch
    if (branchIds.length === 0) {
      throw new ApiError(
        "Supplier must be linked to at least one branch",
        400,
        "NO_BRANCHES",
      );
    }

    // Check pending invoices for branches being removed
    if (toRemove.length > 0) {
      const pendingInvoices = await prisma.purchaseInvoice.count({
        where: {
          supplier_id: supplierId,
          branch_id: { in: toRemove },
          status: { in: ["DRAFT", "PENDING"] },
        },
      });

      if (pendingInvoices > 0) {
        throw new ApiError(
          `Cannot remove branches with ${pendingInvoices} pending invoice(s)`,
          400,
          "PENDING_INVOICES",
        );
      }
    }

    // Execute changes in transaction
    const result = await prisma.$transaction(async (tx) => {
      let addedCount = 0;
      let removedCount = 0;

      // Add new links
      for (const branchId of toAdd) {
       

        await tx.supplierBranch.upsert({
          where: {
            supplier_id_branch_id: {
              supplier_id: supplierId,
              branch_id: branchId,
            },
          },
          create: {
            supplier_id: supplierId,
            branch_id: branchId,
            created_by: userId,
            is_active: true,
          },
          update: {
            is_active: true,
          },
        });
        addedCount++;
      }

      // Remove old links (soft delete)
      for (const branchId of toRemove) {
        

        await tx.supplierBranch.updateMany({
          where: {
            supplier_id: supplierId,
            branch_id: branchId,
          },
          data: { is_active: false },
        });
        removedCount++;
      }

      return { addedCount, removedCount };
    });

    

    return {
      added: result.addedCount,
      removed: result.removedCount,
      total_branches: branchIds.length,
    };
  }

  /* ============================================
     GET SUPPLIERS NOT IN BRANCH - For "Add Existing" Modal
  ============================================ */
  async getSuppliersNotInBranch(shopId, branchId, search = "") {
    // Get all supplier IDs already in this branch
    const linkedSuppliers = await prisma.supplierBranch.findMany({
      where: {
        branch_id: branchId,
        is_active: true,
      },
      select: { supplier_id: true },
    });

    const linkedIds = linkedSuppliers.map((ls) => ls.supplier_id);

    // Get suppliers not in this branch
    const suppliers = await prisma.supplier.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
        supplier_id: { notIn: linkedIds },
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { gst_number: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        branches: {
          where: { is_active: true },
          include: {
            branch: {
              select: {
                branch_id: true,
                branch_name: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return suppliers.map((s) => ({
      ...s,
      existing_branches: s.branches.map((sb) => sb.branch.branch_name),
    }));
  }
  /* ============================================
   DEACTIVATE SUPPLIER - Sets is_active = false (shop-wide)
============================================ */
  async deactivateSupplier(supplierId, shopId, userId) {


    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: {
          where: { is_active: true },
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    if (!supplier.is_active) {
      throw new ApiError(
        "Supplier is already deactivated",
        400,
        "ALREADY_DEACTIVATED",
      );
    }

    // Check for pending invoices
    const pendingInvoices = await prisma.purchaseInvoice.count({
      where: {
        supplier_id: supplierId,
        status: { in: ["DRAFT", "PENDING"] },
      },
    });

    if (pendingInvoices > 0) {
      throw new ApiError(
        `Cannot deactivate: ${pendingInvoices} pending invoice(s) exist`,
        400,
        "PENDING_INVOICES",
      );
    }

    // Check for unpaid invoices
    const unpaidInvoices = await prisma.purchaseInvoice.count({
      where: {
        supplier_id: supplierId,
        payment_status: { in: ["UNPAID", "PARTIAL"] },
        status: "CONFIRMED",
      },
    });

    // Deactivate supplier and all branch links
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate all branch links
      await tx.supplierBranch.updateMany({
        where: {
          supplier_id: supplierId,
        },
        data: { is_active: false },
      });

      // Deactivate the supplier
      const updatedSupplier = await tx.supplier.update({
        where: { supplier_id: supplierId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      return updatedSupplier;
    });

   

    return {
      supplier: result,
      branches_unlinked: supplier.branches.length,
      has_unpaid_invoices: unpaidInvoices > 0,
      unpaid_count: unpaidInvoices,
    };
  }

  /* ============================================
   REACTIVATE SUPPLIER - Sets is_active = true
============================================ */
  async reactivateSupplier(supplierId, shopId, branchId, userId) {
   

    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    if (supplier.is_active) {
      throw new ApiError("Supplier is already active", 400, "ALREADY_ACTIVE");
    }

    // Verify branch belongs to shop
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id: branchId,
        shop_id: shopId,
        is_active: true,
      },
    });

    if (!branch) {
      throw new ApiError("Invalid branch", 400, "INVALID_BRANCH");
    }

    // Reactivate supplier and link to specified branch
    const result = await prisma.$transaction(async (tx) => {
      // Reactivate the supplier
      const updatedSupplier = await tx.supplier.update({
        where: { supplier_id: supplierId },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      });

      // Create or reactivate branch link
      await tx.supplierBranch.upsert({
        where: {
          supplier_id_branch_id: {
            supplier_id: supplierId,
            branch_id: branchId,
          },
        },
        create: {
          supplier_id: supplierId,
          branch_id: branchId,
          created_by: userId,
          is_active: true,
        },
        update: {
          is_active: true,
        },
      });

      return updatedSupplier;
    });



    return {
      supplier: result,
      linked_branch: branch.branch_name,
    };
  }

  /* ============================================
   REMOVE FROM ALL BRANCHES (but keep supplier active)
============================================ */
  async removeFromAllBranches(supplierId, shopId) {
  

    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        branches: {
          where: { is_active: true },
          include: {
            branch: {
              select: { branch_name: true },
            },
          },
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    const activeLinks = supplier.branches.length;

    if (activeLinks === 0) {
      throw new ApiError(
        "Supplier is not linked to any branches",
        400,
        "NO_BRANCHES",
      );
    }

    // Check for pending invoices in any branch
    const pendingInvoices = await prisma.purchaseInvoice.count({
      where: {
        supplier_id: supplierId,
        status: { in: ["DRAFT", "PENDING"] },
      },
    });

    if (pendingInvoices > 0) {
      throw new ApiError(
        `Cannot remove: ${pendingInvoices} pending invoice(s) exist`,
        400,
        "PENDING_INVOICES",
      );
    }

    // Remove all branch links
    await prisma.supplierBranch.updateMany({
      where: {
        supplier_id: supplierId,
      },
      data: { is_active: false },
    });

  

    return {
      removed_from: activeLinks,
      branch_names: supplier.branches.map((b) => b.branch.branch_name),
    };
  }
}

export default new SupplierService();
