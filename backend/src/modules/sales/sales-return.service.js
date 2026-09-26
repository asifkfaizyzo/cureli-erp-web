// backend/src/modules/sales/sales-return.service.js (do not remove this comment)
// backend/src/modules/sales/sales-return.service.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  buildBranchFilter,
  calculateLineItem,
  calculateInvoiceTotals,
  calculatePaymentStatus,
} from "./sales.helpers.js";

// ============================================
// CONSTANTS
// ============================================

const SALES_RETURN_APPROVAL_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

const SALES_REFUND_MODE = {
  CASH: "CASH",
  CREDIT: "CREDIT",
  ADJUST_NEXT: "ADJUST_NEXT",
};

// ============================================
// CUSTOM ERROR
// ============================================

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "SALES_RETURN_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ============================================
// HELPER: Generate Sales Return Invoice Number
// ============================================

async function generateSalesReturnNumber(shopId, branchId) {
  const branch = await prisma.branch.findUnique({
    where: { branch_id: branchId },
    select: { branch_name: true },
  });

  const branchCode = branch?.branch_name
    ? branch.branch_name.substring(0, 3).toUpperCase().replace(/\s/g, "")
    : "BR1";

  const lastReturn = await prisma.salesInvoice.findFirst({
    where: {
      shop_id: shopId,
      branch_id: branchId,
      is_return: true,
    },
    orderBy: { created_at: "desc" },
    select: { invoice_number: true },
  });

  let nextNumber = 1;

  if (lastReturn) {
    const parts = lastReturn.invoice_number.split("-");
    if (parts.length >= 3) {
      nextNumber = parseInt(parts[2]) + 1;
    }
  }

  return `SRTN-${branchCode}-${String(nextNumber).padStart(6, "0")}`;
}

// ============================================
// HELPER: Generate Customer Credit Note Number
// ============================================

async function generateCustomerCreditNoteNumber(shopId) {
  const lastCredit = await prisma.customerCredit.findFirst({
    where: { shop_id: shopId },
    orderBy: { created_at: "desc" },
    select: { credit_note_number: true },
  });

  if (!lastCredit) return "CCN-000001";

  const lastNumber = parseInt(lastCredit.credit_note_number.split("-")[1]) || 0;
  return `CCN-${String(lastNumber + 1).padStart(6, "0")}`;
}

// ============================================
// HELPER: Determine if user can auto-approve
// ============================================

function canAutoApprove(role) {
  // Branch Admin and Super Admin auto-approve their own returns
  return ["super_admin", "branch_admin"].includes(role);
}

// ============================================
// HELPER: Process Approved Sales Return
// - Adds stock back to inventory
// - Creates credit note if ADJUST_NEXT
// - Updates customer ledger if CREDIT
// ============================================

async function processApprovedSalesReturn(
  tx,
  returnInvoice,
  lineItems,
  userId,
) {
  const shopId = returnInvoice.shop_id;
  const branchId = returnInvoice.branch_id;
  const customerId = returnInvoice.customer_id;
  const netAmount = Math.abs(parseFloat(returnInvoice.net_amount));

  let generatedCreditNoteNumber = null;

  // 1. ADD STOCK BACK to exact batches


  for (const item of lineItems) {
    const inventory = await tx.inventory.findFirst({
      where: {
        shop_id: shopId,
        branch_id: branchId,
        medicine_id: item.medicine_id,
        batch_number: item.batch_number,
      },
    });

    if (inventory) {
      const returnQty = parseFloat(item.quantity) || 0;
      const currentStock = parseFloat(inventory.current_stock) || 0;
      const currentAvailable = parseFloat(inventory.available_stock) || 0;
      const newCurrentStock = currentStock + returnQty;
      const newAvailableStock = currentAvailable + returnQty;

      // Update inventory
      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          current_stock: newCurrentStock,
          available_stock: newAvailableStock,
        },
      });

      // Create stock ledger entry
      await tx.stockLedger.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          inventory_id: inventory.inventory_id,
          batch_number: item.batch_number,
          expiry_date: new Date(item.expiry_date),
          movement_type: "SALE_RETURN",
          quantity_in: returnQty,
          quantity_out: 0,
          quantity_net: returnQty,
          balance_after: newCurrentStock,
          rate: item.mrp,
          amount: parseFloat(item.line_total || 0),
          reference_type: "SALES_RETURN",
          reference_id: returnInvoice.invoice_id,
          reference_number: returnInvoice.invoice_number,
          transaction_date: new Date(),
          created_by: userId,
          remarks: `Sales return: ${returnInvoice.return_reason}`,
        },
      });

      // Link inventory to item
      await tx.salesInvoiceItem.update({
        where: { item_id: item.item_id },
        data: { inventory_id: inventory.inventory_id },
      });

    } else {
    
    }
  }

  // 2. Update parent invoice item returned quantities
  if (returnInvoice.parent_invoice_id) {
    for (const item of lineItems) {
      const parentItem = await tx.salesInvoiceItem.findFirst({
        where: {
          invoice_id: returnInvoice.parent_invoice_id,
          medicine_id: item.medicine_id,
          inventory_id: item.inventory_id,
        },
      });

      if (parentItem) {
        const currentReturned = parseFloat(parentItem.returned_quantity || 0);
        await tx.salesInvoiceItem.update({
          where: { item_id: parentItem.item_id },
          data: {
            returned_quantity: currentReturned + parseFloat(item.quantity),
          },
        });
      }
    }
  }

  // 3. PROCESS REFUND based on refund_mode


  if (returnInvoice.refund_mode === SALES_REFUND_MODE.CASH) {
    // CASH refund - record payment as REFUNDED
    await tx.salesPayment.create({
      data: {
        invoice_id: returnInvoice.invoice_id,
        shop_id: shopId,
        branch_id: branchId,
        customer_id: customerId,
        payment_date: new Date(),
        amount: netAmount,
        payment_mode: "CASH",
        status: "REFUNDED",
        remarks: `Cash refund for return ${returnInvoice.invoice_number}`,
        created_by: userId,
      },
    });

    await tx.salesInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        refund_amount: netAmount,
        payment_status: PAYMENT_STATUS.PAID,
        paid_amount: netAmount,
        balance_amount: 0,
      },
    });


  } else if (
    returnInvoice.refund_mode === SALES_REFUND_MODE.CREDIT &&
    customerId
  ) {
    // CREDIT - Reduce customer's outstanding balance
    const customer = await tx.customer.findUnique({
      where: { customer_id: customerId },
    });

    const currentOutstanding = parseFloat(customer?.outstanding_balance || 0);
    const newOutstanding = Math.max(0, currentOutstanding - netAmount);

    // Create customer ledger entry (credit reduces balance)
    await tx.customerLedger.create({
      data: {
        customer_id: customerId,
        shop_id: shopId,
        branch_id: branchId,
        transaction_type: "RETURN",
        reference_type: "SALES_RETURN",
        reference_id: returnInvoice.invoice_id,
        reference_number: returnInvoice.invoice_number,
        debit_amount: 0,
        credit_amount: netAmount,
        balance_after: newOutstanding,
        transaction_date: new Date(),
        remarks: `Credit for return: ${returnInvoice.invoice_number} (${returnInvoice.return_reason})`,
        created_by: userId,
      },
    });

    // Update customer balance
    await tx.customer.update({
      where: { customer_id: customerId },
      data: {
        outstanding_balance: newOutstanding,
      },
    });

    await tx.salesInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        payment_status: PAYMENT_STATUS.PAID,
        paid_amount: netAmount,
        balance_amount: 0,
      },
    });

    
  } else if (
    returnInvoice.refund_mode === SALES_REFUND_MODE.ADJUST_NEXT &&
    customerId
  ) {
    // ADJUST_NEXT - Create customer credit note for future purchases
    generatedCreditNoteNumber = await generateCustomerCreditNoteNumber(shopId);

    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await tx.customerCredit.create({
      data: {
        shop_id: shopId,
        branch_id: branchId,
        customer_id: customerId,
        return_invoice_id: returnInvoice.invoice_id,
        credit_note_number: generatedCreditNoteNumber,
        credit_amount: netAmount,
        utilized_amount: 0,
        balance_amount: netAmount,
        status: "ACTIVE",
        issued_date: issuedDate,
        expiry_date: expiryDate,
      },
    });

    await tx.salesInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        credit_note_number: generatedCreditNoteNumber,
        payment_status: PAYMENT_STATUS.PAID,
        paid_amount: netAmount,
        balance_amount: 0,
      },
    });

   
  }

  return { creditNoteNumber: generatedCreditNoteNumber };
}

// ============================================
// HELPER: Reverse Approved Sales Return
// - Deducts stock (reverse the addition)
// - Cancels credit notes
// - Reverses customer ledger entries
// ============================================

async function reverseApprovedSalesReturn(
  tx,
  returnInvoice,
  lineItems,
  userId,
  reason,
) {
  const shopId = returnInvoice.shop_id;
  const branchId = returnInvoice.branch_id;
  const customerId = returnInvoice.customer_id;
  const netAmount = Math.abs(parseFloat(returnInvoice.net_amount));

  // 1. DEDUCT STOCK (reverse the addition)


  for (const item of lineItems) {
    const inventory = await tx.inventory.findFirst({
      where: {
        shop_id: shopId,
        branch_id: branchId,
        medicine_id: item.medicine_id,
        batch_number: item.batch_number,
      },
    });

    if (inventory) {
      const returnQty = parseFloat(item.quantity) || 0;
      const currentStock = parseFloat(inventory.current_stock) || 0;
      const currentAvailable = parseFloat(inventory.available_stock) || 0;
      const newCurrentStock = Math.max(0, currentStock - returnQty);
      const newAvailableStock = Math.max(0, currentAvailable - returnQty);

      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          current_stock: newCurrentStock,
          available_stock: newAvailableStock,
        },
      });

      await tx.stockLedger.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          inventory_id: inventory.inventory_id,
          batch_number: item.batch_number,
          expiry_date: new Date(item.expiry_date),
          movement_type: "SALE", // Deducting = same as sale
          quantity_in: 0,
          quantity_out: returnQty,
          quantity_net: -returnQty,
          balance_after: newCurrentStock,
          rate: item.mrp,
          reference_type: "RETURN_CANCELLATION",
          reference_id: returnInvoice.invoice_id,
          reference_number: `${returnInvoice.invoice_number}-CANCELLED`,
          transaction_date: new Date(),
          created_by: userId,
          remarks: `Return cancelled: ${reason}`,
        },
      });

     
    }
  }

  // 2. Reverse parent invoice item returned quantities
  if (returnInvoice.parent_invoice_id) {
    for (const item of lineItems) {
      const parentItem = await tx.salesInvoiceItem.findFirst({
        where: {
          invoice_id: returnInvoice.parent_invoice_id,
          medicine_id: item.medicine_id,
          inventory_id: item.inventory_id,
        },
      });

      if (parentItem) {
        const currentReturned = parseFloat(parentItem.returned_quantity || 0);
        await tx.salesInvoiceItem.update({
          where: { item_id: parentItem.item_id },
          data: {
            returned_quantity: Math.max(
              0,
              currentReturned - parseFloat(item.quantity),
            ),
          },
        });
      }
    }
  }

  // 3. REVERSE REFUND based on original refund_mode
  if (returnInvoice.refund_mode === SALES_REFUND_MODE.CREDIT && customerId) {
    // Reverse customer ledger - add back to outstanding
    const customer = await tx.customer.findUnique({
      where: { customer_id: customerId },
    });

    const currentOutstanding = parseFloat(customer?.outstanding_balance || 0);
    const newOutstanding = currentOutstanding + netAmount;

    await tx.customerLedger.create({
      data: {
        customer_id: customerId,
        shop_id: shopId,
        branch_id: branchId,
        transaction_type: "ADJUSTMENT",
        reference_type: "RETURN_CANCELLATION",
        reference_id: returnInvoice.invoice_id,
        reference_number: `${returnInvoice.invoice_number}-CANCELLED`,
        debit_amount: netAmount,
        credit_amount: 0,
        balance_after: newOutstanding,
        transaction_date: new Date(),
        remarks: `Return cancellation: ${reason}`,
        created_by: userId,
      },
    });

    await tx.customer.update({
      where: { customer_id: customerId },
      data: {
        outstanding_balance: newOutstanding,
      },
    });

 
  } else if (returnInvoice.refund_mode === SALES_REFUND_MODE.ADJUST_NEXT) {
    // Cancel any customer credits from this return
    await tx.customerCredit.updateMany({
      where: {
        return_invoice_id: returnInvoice.invoice_id,
        status: { not: "CANCELLED" },
      },
      data: {
        status: "CANCELLED",
      },
    });


  }
}

// ============================================
// SALES RETURN SERVICE CLASS
// ============================================

class SalesReturnService {
  // ============================================
  // CREATE SALES RETURN
  // ============================================

  async createSalesReturn(userId, shopId, branchId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for sales returns",
        400,
        "BRANCH_REQUIRED",
      );
    }

    // Validate parent invoice
    const parentInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: data.parent_invoice_id,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.CONFIRMED,
        is_return: false,
      },
      include: {
        lineItems: {
          include: {
            medicine: {
              select: {
                medicine_id: true,
                name: true,
                manufacturer: true,
                cgst_percentage: true,
                sgst_percentage: true,
              },
            },
            inventory: {
              select: {
                inventory_id: true,
                batch_number: true,
                expiry_date: true,
                current_stock: true,
                available_stock: true,
                mrp: true,
              },
            },
          },
        },
        customer: true,
        returnInvoices: {
          where: {
            status: { not: INVOICE_STATUS.CANCELLED },
            return_approval_status: {
              not: SALES_RETURN_APPROVAL_STATUS.CANCELLED,
            },
          },
          select: {
            invoice_id: true,
            return_approval_status: true,
            lineItems: {
              select: {
                medicine_id: true,
                inventory_id: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!parentInvoice) {
      throw new ApiError(
        "Parent invoice not found, not confirmed, or belongs to different branch",
        404,
        "PARENT_NOT_FOUND",
      );
    }

    // Walk-in check - cannot return without customer if walkin has no info
    // (Actually, walk-in returns ARE allowed if we have the invoice)
    // The rule is: must have parent invoice. So walk-in with receipt = OK

    // Build map of already returned quantities (approved + pending)
    const returnedQuantityMap = new Map();
    for (const returnInv of parentInvoice.returnInvoices) {
      // Only count approved and pending returns
      if (
        [
          SALES_RETURN_APPROVAL_STATUS.APPROVED,
          SALES_RETURN_APPROVAL_STATUS.PENDING_APPROVAL,
        ].includes(returnInv.return_approval_status)
      ) {
        for (const item of returnInv.lineItems) {
          const key = `${item.medicine_id}_${item.inventory_id}`;
          const current = returnedQuantityMap.get(key) || 0;
          returnedQuantityMap.set(key, current + parseFloat(item.quantity));
        }
      }
    }

    // Validate return items
    const validatedItems = [];
    for (const returnItem of data.lineItems) {
      const originalItem = parentInvoice.lineItems.find(
        (item) => item.item_id === returnItem.item_id,
      );

      if (!originalItem) {
        throw new ApiError(
          `Item ${returnItem.item_id} not found in original sale`,
          400,
          "ITEM_NOT_FOUND",
        );
      }

      const originalQty = parseFloat(originalItem.quantity);
      const returnQty = parseFloat(returnItem.quantity);
      const key = `${originalItem.medicine_id}_${originalItem.inventory_id}`;
      const alreadyReturned = returnedQuantityMap.get(key) || 0;
      const remainingReturnable = originalQty - alreadyReturned;

      if (returnQty <= 0) {
        throw new ApiError(
          `Return quantity must be greater than 0 for ${originalItem.medicine.name}`,
          400,
          "INVALID_QUANTITY",
        );
      }

      if (returnQty > remainingReturnable) {
        throw new ApiError(
          `Cannot return ${returnQty} units of ${originalItem.medicine.name}. ` +
            `Original: ${originalQty}, Already returned/pending: ${alreadyReturned}, Remaining: ${remainingReturnable}`,
          400,
          "EXCEEDS_RETURNABLE",
        );
      }

      validatedItems.push({
        originalItem,
        returnQty,
        medicine: originalItem.medicine,
        inventory: originalItem.inventory,
      });
    }

    // Calculate totals for return items
    const returnLineItems = validatedItems.map((item) => ({
      quantity: item.returnQty,
      mrp: parseFloat(item.originalItem.mrp),
      discount_percent: parseFloat(item.originalItem.discount_percent),
      cgst_percent: parseFloat(item.originalItem.cgst_percent),
      sgst_percent: parseFloat(item.originalItem.sgst_percent),
    }));

    const customerDiscountPercent = parseFloat(
      parentInvoice.customer_discount_percent || 0,
    );
    const billDiscountPercent = parseFloat(
      parentInvoice.bill_discount_percent || 0,
    );

    const calculations = calculateInvoiceTotals(
      returnLineItems,
      customerDiscountPercent,
      billDiscountPercent,
    );

    const returnInvoiceNumber = await generateSalesReturnNumber(
      shopId,
      branchId,
    );

    // Determine approval status based on role
    const shouldAutoApprove = canAutoApprove(user.role);
    const approvalStatus = shouldAutoApprove
      ? SALES_RETURN_APPROVAL_STATUS.APPROVED
      : SALES_RETURN_APPROVAL_STATUS.PENDING_APPROVAL;
    const invoiceStatus = shouldAutoApprove
      ? INVOICE_STATUS.CONFIRMED
      : "DRAFT";

    // Validate refund mode - CREDIT/ADJUST_NEXT requires customer
    if (
      (data.refund_mode === SALES_REFUND_MODE.CREDIT ||
        data.refund_mode === SALES_REFUND_MODE.ADJUST_NEXT) &&
      !parentInvoice.customer_id
    ) {
      throw new ApiError(
        `Refund mode "${data.refund_mode}" requires a registered customer. This is a walk-in sale. Please use CASH refund.`,
        400,
        "INVALID_REFUND_MODE",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create return invoice
      const returnInvoice = await tx.salesInvoice.create({
        data: {
          invoice_number: returnInvoiceNumber,
          shop_id: shopId,
          branch_id: branchId,
          customer_id: parentInvoice.customer_id,
          walkin_name: parentInvoice.walkin_name,
          walkin_phone: parentInvoice.walkin_phone,
          invoice_date: new Date(),
          created_by: userId,

          // Auto-confirm if auto-approved
          ...(shouldAutoApprove && {
            confirmed_by: userId,
            confirmed_at: new Date(),
          }),

          is_return: true,
          parent_invoice_id: data.parent_invoice_id,
          return_reason: data.return_reason,
          return_notes: data.return_notes || null,

          // Approval workflow
          return_approval_status: approvalStatus,
          ...(shouldAutoApprove && {
            approved_by: userId,
            approved_at: new Date(),
          }),

          // Refund info
          refund_mode: data.refund_mode,
          refund_notes: data.refund_notes || null,

          // Financials
          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_percent: calculations.customer_discount_percent,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_percent: calculations.bill_discount_percent,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,

          payment_status: PAYMENT_STATUS.UNPAID,
          paid_amount: 0,
          balance_amount: calculations.net_amount,

          status: invoiceStatus,

          remarks: data.remarks || null,
        },
      });

      // Create line items
      const createdItems = [];
      for (const item of validatedItems) {
        //  Use selling_rate from original item for calculations
        const effectiveSellingRate =
          item.originalItem.selling_rate || item.originalItem.mrp;

        const itemCalc = calculateLineItem({
          quantity: item.returnQty,
          mrp: effectiveSellingRate, // ← Use selling_rate
          discount_percent: item.originalItem.discount_percent,
          cgst_percent: item.originalItem.cgst_percent,
          sgst_percent: item.originalItem.sgst_percent,
        });

        const returnItem = await tx.salesInvoiceItem.create({
          data: {
            invoice_id: returnInvoice.invoice_id,
            medicine_id: item.originalItem.medicine_id,
            inventory_id: item.originalItem.inventory_id,
            batch_number: item.inventory.batch_number,
            expiry_date: item.inventory.expiry_date,
            quantity: item.returnQty,
            unit_of_measure: item.originalItem.unit_of_measure,

            //  Store both selling_rate and MRP
            selling_rate: effectiveSellingRate,
            mrp: item.originalItem.mrp,

            purchase_rate: item.originalItem.purchase_rate,
            discount_percent: item.originalItem.discount_percent,
            discount_amount: itemCalc.discount_amount,
            taxable_amount: itemCalc.taxable_amount,
            cgst_percent: item.originalItem.cgst_percent,
            cgst_amount: itemCalc.cgst_amount,
            sgst_percent: item.originalItem.sgst_percent,
            sgst_amount: itemCalc.sgst_amount,
            line_total: itemCalc.line_total,
          },
        });

        createdItems.push(returnItem);
      }

      // If auto-approved, process the return immediately
      if (shouldAutoApprove) {
        const processResult = await processApprovedSalesReturn(
          tx,
          returnInvoice,
          createdItems,
          userId,
        );

        // Update return invoice with credit note number if generated
        if (processResult.creditNoteNumber) {
          await tx.salesInvoice.update({
            where: { invoice_id: returnInvoice.invoice_id },
            data: { credit_note_number: processResult.creditNoteNumber },
          });
        }
      }

      return {
        ...returnInvoice,
        lineItems: createdItems,
        refund_amount: calculations.net_amount,
      };
    });

    // Audit log
    await audit.log({
      action: audit.AuditAction.SALES_RETURN_CREATED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: result.invoice_id,
      shop_id: shopId,
      branch_id: branchId,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        return_invoice_number: result.invoice_number,
        parent_invoice_number: parentInvoice.invoice_number,
        customer_name:
          parentInvoice.customer?.name ||
          parentInvoice.walkin_name ||
          "Walk-in",
        return_reason: data.return_reason,
        refund_mode: data.refund_mode,
        refund_amount: result.refund_amount,
        item_count: validatedItems.length,
        auto_approved: shouldAutoApprove,
        approval_status: approvalStatus,
      },
    });

    return result;
  }

  // ============================================
  // APPROVE OR REJECT RETURN (Super Admin / Branch Admin)
  // ============================================

  async approveOrRejectReturn(
    userId,
    shopId,
    branchId,
    returnId,
    data,
    auditContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    // Only super_admin and branch_admin can approve
    if (!["super_admin", "branch_admin"].includes(user.role)) {
      throw new ApiError(
        "Only Super Admin or Branch Admin can approve/reject returns",
        403,
        "PERMISSION_DENIED",
      );
    }

    const returnInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: returnId,
        shop_id: shopId,
        is_return: true,
        return_approval_status: SALES_RETURN_APPROVAL_STATUS.PENDING_APPROVAL,
      },
      include: {
        lineItems: true,
        customer: true,
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
          },
        },
      },
    });

    if (!returnInvoice) {
      throw new ApiError(
        "Return invoice not found or already processed",
        404,
        "NOT_FOUND",
      );
    }

    // Branch admin can only approve returns from their branch
    if (user.role === "branch_admin" && returnInvoice.branch_id !== branchId) {
      throw new ApiError(
        "You can only approve returns from your own branch",
        403,
        "BRANCH_MISMATCH",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      if (data.action === "APPROVE") {
        // Update status to approved
        const updated = await tx.salesInvoice.update({
          where: { invoice_id: returnId },
          data: {
            return_approval_status: SALES_RETURN_APPROVAL_STATUS.APPROVED,
            approved_by: userId,
            approved_at: new Date(),
            status: INVOICE_STATUS.CONFIRMED,
            confirmed_by: userId,
            confirmed_at: new Date(),
          },
        });

        // Process the return (add stock, handle refund)
        const processResult = await processApprovedSalesReturn(
          tx,
          updated,
          returnInvoice.lineItems,
          userId,
        );

        // Update with credit note number if generated
        if (processResult.creditNoteNumber) {
          await tx.salesInvoice.update({
            where: { invoice_id: returnId },
            data: { credit_note_number: processResult.creditNoteNumber },
          });
        }

        return updated;
      } else {
        // REJECT
        return await tx.salesInvoice.update({
          where: { invoice_id: returnId },
          data: {
            return_approval_status: SALES_RETURN_APPROVAL_STATUS.REJECTED,
            rejected_by: userId,
            rejected_at: new Date(),
            rejection_reason: data.rejection_reason || "Rejected by admin",
            status: INVOICE_STATUS.CANCELLED,
          },
        });
      }
    });

    // Audit log
    await audit.log({
      action:
        data.action === "APPROVE"
          ? audit.AuditAction.SALES_RETURN_APPROVED
          : audit.AuditAction.SALES_RETURN_REJECTED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: returnId,
      shop_id: shopId,
      branch_id: returnInvoice.branch_id,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        return_invoice_number: returnInvoice.invoice_number,
        parent_invoice_number: returnInvoice.parentInvoice?.invoice_number,
        customer_name:
          returnInvoice.customer?.name ||
          returnInvoice.walkin_name ||
          "Walk-in",
        return_reason: returnInvoice.return_reason,
        action: data.action,
        rejection_reason: data.rejection_reason,
        refund_amount: returnInvoice.net_amount,
      },
    });

    return result;
  }

  // ============================================
  // CANCEL APPROVED SALES RETURN (Super Admin)
  // ============================================

  async cancelSalesReturn(
    userId,
    shopId,
    branchId,
    returnId,
    data,
    auditContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    if (user.role !== "super_admin") {
      throw new ApiError(
        "Only Super Admin can cancel approved sales returns",
        403,
        "PERMISSION_DENIED",
      );
    }

    const returnInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: returnId,
        shop_id: shopId,
        is_return: true,
      },
      include: {
        lineItems: true,
        customer: true,
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
          },
        },
        customerCredits: {
          where: { status: { not: "CANCELLED" } },
        },
      },
    });

    if (!returnInvoice) {
      throw new ApiError("Return invoice not found", 404, "NOT_FOUND");
    }

    if (
      returnInvoice.return_approval_status !==
      SALES_RETURN_APPROVAL_STATUS.APPROVED
    ) {
      throw new ApiError(
        `Cannot cancel return with status: ${returnInvoice.return_approval_status}. Only APPROVED returns can be cancelled.`,
        400,
        "INVALID_STATUS",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reverse all changes
      await reverseApprovedSalesReturn(
        tx,
        returnInvoice,
        returnInvoice.lineItems,
        userId,
        data.cancellation_reason,
      );

      // Update return status
      const updatedReturn = await tx.salesInvoice.update({
        where: { invoice_id: returnId },
        data: {
          return_approval_status: SALES_RETURN_APPROVAL_STATUS.CANCELLED,
          status: INVOICE_STATUS.CANCELLED,
          cancelled_at: new Date(),
          cancelled_by: userId,
          cancellation_reason: data.cancellation_reason,
          remarks:
            `CANCELLED: ${data.cancellation_reason}\n\n${returnInvoice.remarks || ""}`.trim(),
        },
      });

      return updatedReturn;
    });

    // Audit log
    await audit.log({
      action: audit.AuditAction.SALES_RETURN_CANCELLED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: returnId,
      shop_id: shopId,
      branch_id: returnInvoice.branch_id,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
      metadata: {
        return_invoice_number: returnInvoice.invoice_number,
        parent_invoice_number: returnInvoice.parentInvoice?.invoice_number,
        customer_name:
          returnInvoice.customer?.name ||
          returnInvoice.walkin_name ||
          "Walk-in",
        cancellation_reason: data.cancellation_reason,
        refund_amount: returnInvoice.net_amount,
        credits_cancelled: returnInvoice.customerCredits?.length || 0,
      },
    });

    return result;
  }

  // ============================================
  // REVERT APPROVED RETURN TO PENDING (Super Admin)
  // ============================================

  async revertReturnToPending(
    userId,
    shopId,
    branchId,
    returnId,
    data,
    auditContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    if (user.role !== "super_admin") {
      throw new ApiError(
        "Only Super Admin can revert approved returns",
        403,
        "PERMISSION_DENIED",
      );
    }

    const returnInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: returnId,
        shop_id: shopId,
        is_return: true,
      },
      include: {
        lineItems: true,
        customer: true,
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
          },
        },
        customerCredits: {
          where: { status: { not: "CANCELLED" } },
        },
      },
    });

    if (!returnInvoice) {
      throw new ApiError("Return invoice not found", 404, "NOT_FOUND");
    }

    if (
      returnInvoice.return_approval_status !==
      SALES_RETURN_APPROVAL_STATUS.APPROVED
    ) {
      throw new ApiError(
        `Cannot revert return with status: ${returnInvoice.return_approval_status}. Only APPROVED returns can be reverted.`,
        400,
        "INVALID_STATUS",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reverse all changes
      await reverseApprovedSalesReturn(
        tx,
        returnInvoice,
        returnInvoice.lineItems,
        userId,
        data.revert_reason,
      );

      // Reset to pending
      const updatedReturn = await tx.salesInvoice.update({
        where: { invoice_id: returnId },
        data: {
          return_approval_status: SALES_RETURN_APPROVAL_STATUS.PENDING_APPROVAL,
          status: "DRAFT",
          approved_by: null,
          approved_at: null,
          confirmed_by: null,
          confirmed_at: null,
          credit_note_number: null,
          refund_amount: null,
          payment_status: PAYMENT_STATUS.UNPAID,
          paid_amount: 0,
          balance_amount: returnInvoice.net_amount,
          remarks:
            `REVERTED TO PENDING: ${data.revert_reason}\n\n${returnInvoice.remarks || ""}`.trim(),
        },
      });

      return updatedReturn;
    });

    // Audit log
    await audit.log({
      action: audit.AuditAction.SALES_RETURN_REVERTED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: returnId,
      shop_id: shopId,
      branch_id: returnInvoice.branch_id,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
      metadata: {
        return_invoice_number: returnInvoice.invoice_number,
        parent_invoice_number: returnInvoice.parentInvoice?.invoice_number,
        revert_reason: data.revert_reason,
        refund_amount: returnInvoice.net_amount,
        credits_cancelled: returnInvoice.customerCredits?.length || 0,
      },
    });

    return result;
  }

  // ============================================
  // GET SALES RETURNS
  // ============================================

  async getSalesReturns(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      returnReason,
      approvalStatus,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_return: true,
      ...(customerId && { customer_id: customerId }),
      ...(returnReason && { return_reason: returnReason }),
      ...(approvalStatus && { return_approval_status: approvalStatus }),
      ...(startDate &&
        endDate && {
          invoice_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          {
            parentInvoice: {
              invoice_number: { contains: search, mode: "insensitive" },
            },
          },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { walkin_name: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [returns, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        include: {
          customer: {
            select: {
              customer_id: true,
              name: true,
              phone: true,
            },
          },
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
          parentInvoice: {
            select: {
              invoice_id: true,
              invoice_number: true,
              invoice_date: true,
              net_amount: true,
            },
          },
          creator: {
            select: {
              full_name: true,
            },
          },
          approver: {
            select: {
              full_name: true,
            },
          },
          _count: {
            select: { lineItems: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    return { returns, total };
  }

  // ============================================
  // GET RETURN DETAILS
  // ============================================

  async getReturnDetails(returnId, shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const returnInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: returnId,
        ...baseFilter,
        is_return: true,
      },
      include: {
        customer: true,
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
            address_line_1: true,
            city: true,
            state: true,
          },
        },
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
            invoice_date: true,
            net_amount: true,
            payment_status: true,
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
                pack_size: true,
                hsn_code: true,
              },
            },
            inventory: {
              select: {
                batch_number: true,
                expiry_date: true,
                rack_no: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
        payments: {
          orderBy: { payment_date: "desc" },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        approver: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        rejecter: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        customerCredits: {
          select: {
            credit_id: true,
            credit_note_number: true,
            credit_amount: true,
            utilized_amount: true,
            balance_amount: true,
            status: true,
            expiry_date: true,
          },
        },
      },
    });

    if (!returnInvoice) {
      throw new ApiError("Return invoice not found", 404, "NOT_FOUND");
    }

    return returnInvoice;
  }

  // ============================================
  // GET RETURNABLE ITEMS FOR AN INVOICE
  // ============================================

  async getReturnableItems(invoiceId, shopId, branchId) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.CONFIRMED,
        is_return: false,
      },
      include: {
        lineItems: {
          include: {
            medicine: {
              select: {
                medicine_id: true,
                name: true,
                manufacturer: true,
                pack_size: true,
              },
            },
            inventory: {
              select: {
                batch_number: true,
                expiry_date: true,
              },
            },
          },
        },
        customer: true,
        returnInvoices: {
          where: {
            return_approval_status: {
              in: [
                SALES_RETURN_APPROVAL_STATUS.APPROVED,
                SALES_RETURN_APPROVAL_STATUS.PENDING_APPROVAL,
              ],
            },
          },
          select: {
            invoice_id: true,
            return_approval_status: true,
            lineItems: {
              select: {
                medicine_id: true,
                inventory_id: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or not confirmed",
        404,
        "NOT_FOUND",
      );
    }

    // Build map of returned/pending quantities
    const returnedQuantityMap = new Map();
    for (const returnInv of invoice.returnInvoices) {
      for (const item of returnInv.lineItems) {
        const key = `${item.medicine_id}_${item.inventory_id}`;
        const current = returnedQuantityMap.get(key) || 0;
        returnedQuantityMap.set(key, current + parseFloat(item.quantity));
      }
    }

    const returnableItems = invoice.lineItems.map((item) => {
      const key = `${item.medicine_id}_${item.inventory_id}`;
      const originalQty = parseFloat(item.quantity);
      const returnedQty = returnedQuantityMap.get(key) || 0;
      const returnableQty = originalQty - returnedQty;

      return {
        item_id: item.item_id,
        medicine_id: item.medicine_id,
        inventory_id: item.inventory_id,
        medicine_name: item.medicine.name,
        manufacturer: item.medicine.manufacturer,
        pack_size: item.medicine.pack_size,
        batch_number: item.inventory?.batch_number || item.batch_number,
        expiry_date: item.inventory?.expiry_date || item.expiry_date,

        //  Return both selling_rate and MRP
        selling_rate: item.selling_rate, // ← Add this
        mrp: item.mrp,

        original_quantity: originalQty,
        returned_quantity: returnedQty,
        returnable_quantity: returnableQty,
        discount_percent: item.discount_percent,
        cgst_percent: item.cgst_percent,
        sgst_percent: item.sgst_percent,
        can_return: returnableQty > 0,
      };
    });

    return {
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer?.name || invoice.walkin_name || "Walk-in",
      is_walkin: !invoice.customer_id,
      items: returnableItems,
      has_returnable_items: returnableItems.some((item) => item.can_return),
    };
  }

  // ============================================
  // GET CUSTOMER CREDITS
  // ============================================

  async getCustomerCredits(shopId, branchId, role, branchMode, filters = {}) {
    const {
      customerId,
      status,
      includeExpired = false,
      limit = 50,
      offset = 0,
    } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    // Remove shop_id from baseFilter and add to where separately
    // since CustomerCredit has shop_id directly
    const where = {
      shop_id: shopId,
      ...(branchId && { branch_id: branchId }),
      ...(customerId && { customer_id: customerId }),
      ...(status && { status }),
      ...(!includeExpired && {
        OR: [
          { status: { not: "EXPIRED" } },
          { expiry_date: { gte: new Date() } },
        ],
      }),
    };

    const [credits, total] = await Promise.all([
      prisma.customerCredit.findMany({
        where,
        include: {
          customer: {
            select: {
              customer_id: true,
              name: true,
              phone: true,
            },
          },
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
          returnInvoice: {
            select: {
              invoice_id: true,
              invoice_number: true,
              return_reason: true,
            },
          },
          applications: {
            include: {
              appliedInvoice: {
                select: {
                  invoice_id: true,
                  invoice_number: true,
                },
              },
              appliedBy: {
                select: {
                  full_name: true,
                },
              },
            },
            orderBy: { applied_date: "desc" },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.customerCredit.count({ where }),
    ]);

    return { credits, total };
  }

  // ============================================
  // APPLY CUSTOMER CREDIT TO INVOICE
  // ============================================

  async applyCustomerCredit(userId, shopId, branchId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    // Find the credit note
    const credit = await prisma.customerCredit.findFirst({
      where: {
        credit_id: data.credit_id,
        shop_id: shopId,
        status: "ACTIVE",
      },
      include: {
        customer: true,
      },
    });

    if (!credit) {
      throw new ApiError(
        "Credit note not found or not active",
        404,
        "CREDIT_NOT_FOUND",
      );
    }

    if (new Date(credit.expiry_date) < new Date()) {
      throw new ApiError("Credit note has expired", 400, "CREDIT_EXPIRED");
    }

    const availableBalance = parseFloat(credit.balance_amount);
    const appliedAmount = parseFloat(data.applied_amount);

    if (appliedAmount > availableBalance) {
      throw new ApiError(
        `Insufficient credit balance. Available: ₹${availableBalance.toFixed(2)}`,
        400,
        "INSUFFICIENT_CREDIT",
      );
    }

    // Find target invoice - must be same customer, confirmed, not fully paid
    const targetInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: data.applied_to_invoice_id,
        shop_id: shopId,
        customer_id: credit.customer_id,
        is_return: false,
        status: INVOICE_STATUS.CONFIRMED,
        payment_status: { not: PAYMENT_STATUS.PAID },
      },
    });

    if (!targetInvoice) {
      throw new ApiError(
        "Target invoice not found, not confirmed, or already fully paid. " +
          "Credit can only be applied to invoices of the same customer.",
        400,
        "INVALID_TARGET_INVOICE",
      );
    }

    const invoiceBalance = parseFloat(targetInvoice.balance_amount);
    if (appliedAmount > invoiceBalance) {
      throw new ApiError(
        `Applied amount exceeds invoice balance. Invoice balance: ₹${invoiceBalance.toFixed(2)}`,
        400,
        "EXCEEDS_INVOICE_BALANCE",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create application record
      const application = await tx.customerCreditApplication.create({
        data: {
          credit_id: data.credit_id,
          applied_to_invoice_id: data.applied_to_invoice_id,
          applied_amount: appliedAmount,
          applied_date: new Date(),
          applied_by: userId,
          notes: data.notes || null,
        },
      });

      // Update credit balance
      const newBalance = availableBalance - appliedAmount;
      const newUtilized = parseFloat(credit.utilized_amount) + appliedAmount;
      const newStatus = newBalance <= 0 ? "FULLY_UTILIZED" : "ACTIVE";

      await tx.customerCredit.update({
        where: { credit_id: data.credit_id },
        data: {
          utilized_amount: newUtilized,
          balance_amount: newBalance,
          status: newStatus,
        },
      });

      // Update invoice payment status
      const newPaidAmount =
        parseFloat(targetInvoice.paid_amount) + appliedAmount;
      const paymentCalc = calculatePaymentStatus(
        newPaidAmount,
        targetInvoice.net_amount,
      );

      await tx.salesInvoice.update({
        where: { invoice_id: data.applied_to_invoice_id },
        data: {
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
          payment_status: paymentCalc.status,
        },
      });

      // Create payment record
      await tx.salesPayment.create({
        data: {
          invoice_id: data.applied_to_invoice_id,
          shop_id: shopId,
          branch_id: targetInvoice.branch_id,
          customer_id: credit.customer_id,
          payment_date: new Date(),
          amount: appliedAmount,
          payment_mode: "CREDIT",
          reference_number: credit.credit_note_number,
          status: "COMPLETED",
          remarks: `Credit note ${credit.credit_note_number} applied`,
          created_by: userId,
        },
      });

      // Create customer ledger entry
      const customer = await tx.customer.findUnique({
        where: { customer_id: credit.customer_id },
      });

      // Credit application reduces outstanding (credit entry)
      const currentOutstanding = parseFloat(customer?.outstanding_balance || 0);
      const newOutstanding = Math.max(0, currentOutstanding - appliedAmount);

      await tx.customerLedger.create({
        data: {
          customer_id: credit.customer_id,
          shop_id: shopId,
          branch_id: targetInvoice.branch_id,
          transaction_type: "CREDIT_APPLICATION",
          reference_type: "CREDIT_APPLICATION",
          reference_id: application.application_id,
          reference_number: credit.credit_note_number,
          debit_amount: 0,
          credit_amount: appliedAmount,
          balance_after: newOutstanding,
          transaction_date: new Date(),
          remarks: `Credit ${credit.credit_note_number} applied to ${targetInvoice.invoice_number}`,
          created_by: userId,
        },
      });

      await tx.customer.update({
        where: { customer_id: credit.customer_id },
        data: {
          outstanding_balance: newOutstanding,
        },
      });

      return application;
    });

    // Audit log
    await audit.log({
      action: audit.AuditAction.CUSTOMER_CREDIT_APPLIED,
      entity_type: audit.EntityType.CUSTOMER,
      entity_id: credit.customer_id,
      shop_id: shopId,
      branch_id: branchId,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        credit_note_number: credit.credit_note_number,
        customer_name: credit.customer.name,
        applied_to_invoice: targetInvoice.invoice_number,
        applied_amount: appliedAmount,
        remaining_balance: parseFloat(credit.balance_amount) - appliedAmount,
      },
    });

    return result;
  }

  // ============================================
  // EXPIRE OLD CUSTOMER CREDIT NOTES
  // ============================================

  async expireOldCustomerCredits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.customerCredit.updateMany({
      where: {
        status: "ACTIVE",
        expiry_date: { lt: today },
      },
      data: {
        status: "EXPIRED",
      },
    });

    
    return result.count;
  }
}

export default new SalesReturnService();
