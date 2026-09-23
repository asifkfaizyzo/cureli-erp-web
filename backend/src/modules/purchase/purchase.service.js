// backend/src/modules/purchase/purchase.service.js

import prisma from "../../config/prisma.js";
import inventoryService from "../inventory/inventory.service.js";
import * as audit from "../audit/index.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  buildBranchFilter,
  calculatePaymentStatus,
  calculateLineItemForDB,
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from "./purchase.helpers.js";

// ============================================
// CREATE PURCHASE INVOICE
//  Updated with improved validation for same medicine different batches
//  Updated to handle free items
// ============================================

export async function createPurchaseInvoice(
  userId,
  shopId,
  branchId,
  data,
  auditContext,
) {
  const {
    supplier_id,
    invoice_date,
    lineItems,
    paid_amount,
    payment_mode,
    ...invoiceData
  } = data;

  if (!branchId) {
    const err = new Error(
      "Branch selection is required to create purchase invoices. Please select a specific branch.",
    );
    err.code = "BRANCH_REQUIRED";
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const supplier = await prisma.supplier.findFirst({
    where: { supplier_id, shop_id: shopId, is_active: true },
  });

  if (!supplier) {
    const err = new Error("Supplier not found or inactive");
    err.code = "NOT_FOUND";
    throw err;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  FIXED: Separate billable and free items using is_free_item flag
  // ═══════════════════════════════════════════════════════════════════════

  const billableItems = lineItems.filter((item) => item.is_free_item !== true);
  const freeItems = lineItems.filter((item) => item.is_free_item === true);

  

  // Get unique medicine IDs from billable items only (free items will share medicine_id)
  const medicineIds = billableItems.map((item) => item.medicine_id);
  const uniqueMedicineIds = [...new Set(medicineIds)];

  // Validate all medicines exist and belong to this branch
  const medicines = await prisma.medicine.findMany({
    where: {
      medicine_id: { in: uniqueMedicineIds },
      shop_id: shopId,
      branch_id: branchId,
      is_active: true,
    },
    select: {
      medicine_id: true,
      name: true,
    },
  });

  if (medicines.length !== uniqueMedicineIds.length) {
    const foundIds = new Set(medicines.map((m) => m.medicine_id));
    const missingIds = uniqueMedicineIds.filter((id) => !foundIds.has(id));

    // Check if medicines exist in other branches
    const otherBranchMeds = await prisma.medicine.findMany({
      where: {
        medicine_id: { in: missingIds },
        shop_id: shopId,
        is_active: true,
      },
      select: { medicine_id: true, name: true, branch_id: true },
    });

    if (otherBranchMeds.length > 0) {
      const details = otherBranchMeds
        .slice(0, 3)
        .map((m) => `"${m.name}"`)
        .join(", ");
      const more =
        otherBranchMeds.length > 3
          ? ` and ${otherBranchMeds.length - 3} more`
          : "";

      const err = new Error(
        `${otherBranchMeds.length} medicine(s) belong to a different branch: ${details}${more}. ` +
          `Please add these medicines to the current branch first, or switch to the correct branch.`,
      );
      err.code = "BRANCH_MISMATCH";
      throw err;
    }

    // Check if medicines exist at all
    const existingMeds = await prisma.medicine.findMany({
      where: { medicine_id: { in: missingIds } },
      select: { medicine_id: true, name: true },
    });

    if (existingMeds.length === 0) {
      const err = new Error(
        `${missingIds.length} medicine(s) not found in database. ` +
          `Please add these products to the master list first.`,
      );
      err.code = "INVALID_MEDICINE";
      throw err;
    }

    const err = new Error(
      `${missingIds.length} medicine(s) are invalid or don't belong to this shop.`,
    );
    err.code = "INVALID_MEDICINE";
    throw err;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  FIXED: VALIDATE BATCH UNIQUENESS for BILLABLE items only
  // Free items can share batch with their parent
  // ═══════════════════════════════════════════════════════════════════════
  const batchMap = new Map();
  for (const item of billableItems) {
    const key = `${item.medicine_id}|${item.batch_number}`;
    if (batchMap.has(key)) {
      const medicine = medicines.find(
        (m) => m.medicine_id === item.medicine_id,
      );
      const err = new Error(
        `Duplicate batch "${item.batch_number}" for medicine "${medicine?.name || "Unknown"}". ` +
          `Each medicine+batch combination should appear only once in billable items. ` +
          `If you're adding free items, mark them with is_free_item flag.`,
      );
      err.code = "DUPLICATE_BATCH";
      throw err;
    }
    batchMap.set(key, true);
  }

  const invoiceNumber = await generateInvoiceNumber(shopId);

  //  Calculate totals from BILLABLE items only (exclude free items)
  const calculations = calculateInvoiceTotals(billableItems);

  const paidAmt = parseFloat(paid_amount) || 0;
  const netAmt = calculations.net_amount;
  const paymentCalc = calculatePaymentStatus(
    paidAmt,
    netAmt,
    PAYMENT_BALANCE_THRESHOLD,
  );

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.purchaseInvoice.create({
      data: {
        ...invoiceData,
        invoice_number: invoiceNumber,
        shop_id: shopId,
        branch_id: branchId,
        supplier_id,
        invoice_date: new Date(invoice_date),
        created_by: userId,
        subtotal: calculations.subtotal,
        discount_amount: calculations.discount_amount,
        taxable_amount: calculations.taxable_amount,
        cgst_amount: calculations.cgst_amount,
        sgst_amount: calculations.sgst_amount,
        igst_amount: calculations.igst_amount,
        total_tax: calculations.total_tax,
        round_off: calculations.round_off,
        net_amount: netAmt,
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode || null,
        status: "DRAFT",
      },
    });

    //  Create ALL line items (both billable and free)
    const items = await Promise.all(
      lineItems.map((item) => {
        // For free items, set amounts to 0
        const isFreeItem = item.is_free_item === true;
        const itemCalc = isFreeItem
          ? {
              discount_amount: 0,
              taxable_amount: 0,
              cgst_amount: 0,
              sgst_amount: 0,
              igst_amount: 0,
              line_total: 0,
            }
          : calculateLineItemForDB(item);

        return tx.purchaseInvoiceItem.create({
          data: {
            invoice_id: invoice.invoice_id,
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: new Date(item.expiry_date),
            manufacturing_date: item.manufacturing_date
              ? new Date(item.manufacturing_date)
              : null,
            quantity: item.quantity,
            free_quantity: isFreeItem ? item.quantity : item.free_quantity || 0,
            pack_size: item.pack_size || null,
            unit_of_measure: item.unit_of_measure || "UNIT",
            purchase_rate: item.purchase_rate,
            mrp: item.mrp,
            scheme_discount: item.scheme_discount || 0,
            trade_discount: item.trade_discount || 0,
            cgst_percent: item.cgst_percent || 0,
            sgst_percent: item.sgst_percent || 0,
            igst_percent: item.igst_percent || 0,
            selling_rate: item.selling_rate || null,
            margin_percent: item.margin_percent || null,
            rack_no: item.rack_no || null,
            discount_amount: itemCalc.discount_amount,
            taxable_amount: itemCalc.taxable_amount,
            cgst_amount: itemCalc.cgst_amount,
            sgst_amount: itemCalc.sgst_amount,
            igst_amount: itemCalc.igst_amount,
            line_total: itemCalc.line_total,
          },
        });
      }),
    );

    // Create payment record if amount paid
    if (paidAmt > 0) {
      await tx.purchasePayment.create({
        data: {
          invoice_id: invoice.invoice_id,
          shop_id: shopId,
          supplier_id,
          payment_date: new Date(invoice_date),
          amount: paidAmt,
          payment_mode: payment_mode || "CASH",
          status: "COMPLETED",
          created_by: userId,
          remarks:
            paymentCalc.status === "PAID" && paidAmt < netAmt
              ? `Full payment (balance ₹${(netAmt - paidAmt).toFixed(2)} within threshold)`
              : "Initial payment on invoice creation",
        },
      });
    }

    return { ...invoice, lineItems: items };
  });

  // Audit log
  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CREATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: result.invoice_id,
    shop_id: shopId,
    branch_id: branchId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: result.invoice_number,
      supplier_id,
      supplier_name: supplier.name,
      item_count: billableItems.length,
      free_item_count: freeItems.length,
      total_amount: result.net_amount,
      paid_amount: paidAmt,
      payment_status: paymentCalc.status,
    },
  });

  return result;
}

// ============================================
// CONFIRM PURCHASE INVOICE & UPDATE STOCK
//  FIXED: Skip free item rows to prevent double-counting
// ============================================

export async function confirmPurchaseInvoice(
  userId,
  shopId,
  branchId,
  invoiceId,
  auditContext,
) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { invoice_id: invoiceId, shop_id: shopId },
    include: { lineItems: true, supplier: true },
  });

  if (!invoice) {
    const err = new Error("Invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (user.role !== "super_admin" && invoice.branch_id !== branchId) {
    const err = new Error("You don't have access to confirm this invoice");
    err.code = "BRANCH_ACCESS_DENIED";
    throw err;
  }

  if (invoice.status === "CONFIRMED") {
    const err = new Error("Invoice already confirmed");
    err.code = "ALREADY_CONFIRMED";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cannot confirm cancelled invoice");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  const invoiceBranchId = invoice.branch_id;

  //  Count billable vs free items for logging
  const billableItems = invoice.lineItems.filter(
    (item) =>
      !(parseFloat(item.line_total) === 0 && parseFloat(item.quantity) > 0),
  );
  const freeItemRows = invoice.lineItems.filter(
    (item) =>
      parseFloat(item.line_total) === 0 && parseFloat(item.quantity) > 0,
  );

  
  const result = await prisma.$transaction(async (tx) => {
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: "CONFIRMED",
        confirmed_by: userId,
        confirmed_at: new Date(),
      },
    });

    // Process each line item and update stock
    for (const item of invoice.lineItems) {
      // ═══════════════════════════════════════════════════════════════════════
      //  FIXED: SKIP FREE ITEM ROWS FOR STOCK UPDATE
      // Free item rows have line_total = 0 with quantity > 0
      // Their quantity is ALREADY included in the parent row's free_quantity
      // We still link them to inventory but DON'T add to stock
      // ═══════════════════════════════════════════════════════════════════════
      const isFreeItemRow =
        parseFloat(item.line_total) === 0 && parseFloat(item.quantity) > 0;

      if (isFreeItemRow) {
       

        // Still link to inventory for record keeping
        const existingInventory = await tx.inventory.findFirst({
          where: {
            shop_id: shopId,
            branch_id: invoiceBranchId,
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
          },
        });

        if (existingInventory) {
          // Just link the item to existing inventory, no stock update
          await tx.purchaseInvoiceItem.update({
            where: { item_id: item.item_id },
            data: { inventory_id: existingInventory.inventory_id },
          });
        }
        // Skip stock update for free item rows
        continue;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // NORMAL PROCESSING FOR BILLABLE ITEMS
      // ═══════════════════════════════════════════════════════════════════════
      const inventory = await inventoryService.getOrCreateInventory(
        shopId,
        invoiceBranchId,
        item.medicine_id,
        item.batch_number,
        item.expiry_date,
        item.mrp,
      );

      //  Calculate total quantity: purchased qty + free qty (from sch field)
      const purchasedQty = Number(item.quantity) || 0;
      const freeQty = Number(item.free_quantity) || 0;
      const totalQuantity = purchasedQty + freeQty;

      

      // Update stock
      await inventoryService.updateStock(
        {
          inventoryId: inventory.inventory_id,
          shopId: shopId,
          branchId: invoiceBranchId,
          medicineId: item.medicine_id,
          batchNumber: item.batch_number,
          movementType: "PURCHASE",
          quantityIn: totalQuantity,
          quantityOut: 0,
          rate: item.purchase_rate,
          referenceType: "PURCHASE_INVOICE",
          referenceId: invoice.invoice_id,
          referenceNumber: invoice.invoice_number,
          transactionDate: invoice.invoice_date,
          remarks:
            freeQty > 0
              ? `Purchase: ${purchasedQty} + ${freeQty} free from ${invoice.supplier_invoice_no || invoice.invoice_number}`
              : `Purchase from ${invoice.supplier_invoice_no || invoice.invoice_number}`,
        },
        userId,
        tx,
      );

      // Update inventory metadata
      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          last_purchase_rate: item.purchase_rate,
          last_purchase_date: invoice.invoice_date,
          selling_rate: item.selling_rate || inventory.selling_rate,
          rack_no: item.rack_no || inventory.rack_no,
        },
      });

      // Link item to inventory
      await tx.purchaseInvoiceItem.update({
        where: { item_id: item.item_id },
        data: {
          inventory_id: inventory.inventory_id,
        },
      });
    }

    return updatedInvoice;
  });

  // Audit log
  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CONFIRMED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoiceBranchId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.supplier.name,
      billable_items: billableItems.length,
      free_item_rows: freeItemRows.length,
      total_amount: invoice.net_amount,
    },
  });

  return result;
}

// ============================================
// GET PURCHASE INVOICES
// ============================================

export async function getPurchaseInvoices(
  shopId,
  branchId,
  role,
  branchMode,
  filters = {},
) {
  const {
    startDate,
    endDate,
    supplierId,
    status,
    paymentStatus,
    limit = 50,
    offset = 0,
  } = filters;

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    is_return: false,
    ...(supplierId && { supplier_id: supplierId }),
    ...(status && { status }),
    ...(paymentStatus && { payment_status: paymentStatus }),
    ...(startDate &&
      endDate && {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
  };

  const [invoices, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: {
          select: {
            name: true,
            gst_number: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        creator: {
          select: {
            full_name: true,
          },
        },
        lineItems: {
          select: {
            item_id: true,
            line_total: true,
          },
        },
      },
      orderBy: { invoice_date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  //  Calculate billable vs free items
  const transformedInvoices = invoices.map((invoice) => {
    const billableItems = invoice.lineItems.filter(
      (item) => parseFloat(item.line_total) > 0,
    );
    const freeItems = invoice.lineItems.filter(
      (item) => parseFloat(item.line_total) === 0,
    );

    return {
      ...invoice,
      _count: {
        lineItems: billableItems.length,
        freeItems: freeItems.length,
      },
      lineItems: undefined,
    };
  });

  return { invoices: transformedInvoices, total };
}

// ============================================
// GET INVOICE DETAILS
// ============================================

export async function getInvoiceDetails(
  invoiceId,
  shopId,
  branchId,
  role,
  branchMode,
) {
  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: invoiceId,
      ...baseFilter,
    },
    include: {
      supplier: {
        select: {
          supplier_id: true,
          name: true,
          supplier_code: true,
          contact_person: true,
          office_phone: true,
          personal_phone: true,
          email: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          state: true,
          pincode: true,
          gst_number: true,
          pan_number: true,
          drug_license_no: true,
          credit_days: true,
          credit_limit: true,
        },
      },
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          branch_type: true,
          address_line_1: true,
          city: true,
          state: true,
        },
      },
      lineItems: {
        include: {
          medicine: {
            select: {
              medicine_id: true,
              name: true,
              generic_name: true,
              manufacturer: true,
              category: true,
              sub_category: true,
              hsn_code: true,
              pack_size: true,
              schedule: true,
            },
          },
          inventory: {
            select: {
              inventory_id: true,
              current_stock: true,
              available_stock: true,
              selling_rate: true,
              rack_no: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
      payments: {
        select: {
          payment_id: true,
          payment_date: true,
          amount: true,
          payment_mode: true,
          reference_number: true,
          bank_name: true,
          status: true,
          remarks: true,
          created_at: true,
        },
        orderBy: {
          payment_date: "desc",
        },
      },
      creator: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
      confirmer: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  //  Mark free items in response
  const lineItemsWithFreeFlag = invoice.lineItems.map((item) => ({
    ...item,
    is_free_item:
      parseFloat(item.line_total) === 0 && parseFloat(item.quantity) > 0,
  }));

  return {
    ...invoice,
    lineItems: lineItemsWithFreeFlag,
  };
}

// ============================================
// GET PURCHASE STATISTICS
// ============================================

export async function getPurchaseStats(
  shopId,
  branchId,
  role,
  branchMode,
  filters = {},
) {
  const { startDate, endDate } = filters;

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    status: "CONFIRMED",
    is_return: false,
    ...(startDate &&
      endDate && {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
  };

  const [totalInvoices, totalAmount, unpaidAmount] = await Promise.all([
    prisma.purchaseInvoice.count({ where }),
    prisma.purchaseInvoice.aggregate({
      where,
      _sum: { net_amount: true },
    }),
    prisma.purchaseInvoice.aggregate({
      where: {
        ...where,
        payment_status: { not: "PAID" },
      },
      _sum: { balance_amount: true },
    }),
  ]);

  return {
    totalInvoices,
    totalAmount: totalAmount._sum.net_amount || 0,
    unpaidAmount: unpaidAmount._sum.balance_amount || 0,
  };
}

/**
 * Reverts a CONFIRMED purchase invoice back to DRAFT state
 * - Reverses the stock addition (deducts stock)
 * - Sets status back to DRAFT
 * - Super Admin only
 */
export async function revertPurchaseInvoiceToDraft(userId, shopId, branchId, invoiceId, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "super_admin") {
    const err = new Error("Only super admin can revert confirmed invoices to draft");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { invoice_id: invoiceId, shop_id: shopId },
    include: {
      lineItems: true,
      returnInvoices: {
        where: { is_return: true, return_approval_status: "APPROVED" }
      }
    }
  });

  if (!invoice) {
    const err = new Error("Invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status !== "CONFIRMED") {
    const err = new Error("Only CONFIRMED invoices can be reverted to draft");
    err.code = "INVALID_STATUS";
    throw err;
  }

  // Block reversion if there are already approved returns against this invoice
  if (invoice.returnInvoices.length > 0) {
    const err = new Error("Cannot revert invoice because it has approved returns. Cancel the returns first.");
    err.code = "HAS_APPROVED_RETURNS";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. REVERSE STOCK ADDITION
    for (const item of invoice.lineItems) {
      const isFreeItemRow = parseFloat(item.line_total) === 0 && parseFloat(item.quantity) > 0;
      if (isFreeItemRow) continue; // Skip free rows

      if (item.inventory_id) {
        const purchasedQty = Number(item.quantity) || 0;
        const freeQty = Number(item.free_quantity) || 0;
        const totalQty = purchasedQty + freeQty;

        // Deduct the quantity originally added
        await inventoryService.updateStock(
          {
            inventoryId: item.inventory_id,
            shopId: shopId,
            branchId: invoice.branch_id,
            medicineId: item.medicine_id,
            batchNumber: item.batch_number,
            movementType: "PURCHASE_RETURN", // Deducts stock safely
            quantityIn: 0,
            quantityOut: totalQty,
            rate: item.purchase_rate,
            referenceType: "PURCHASE_INVOICE_REVERT",
            referenceId: invoice.invoice_id,
            referenceNumber: `${invoice.invoice_number}-REVERT`,
            transactionDate: new Date(),
            remarks: `Stock reversal: Reverting confirmed invoice ${invoice.invoice_number} to Draft`,
          },
          userId,
          tx,
        );
      }
    }

    // 2. UPDATE INVOICE STATUS BACK TO DRAFT
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: "DRAFT",
        confirmed_by: null,
        confirmed_at: null,
      },
    });

    return updatedInvoice;
  });

  // 3. AUDIT LOG
  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_UPDATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
    metadata: {
      invoice_number: invoice.invoice_number,
      action: "REVERT_TO_DRAFT",
      previous_status: "CONFIRMED",
    },
  });

  return result;
}
