// backend/src/modules/sales/sales.service.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_MODES,
  buildBranchFilter,
  calculateLineItem,
  calculateInvoiceTotals,
  calculatePaymentStatus,
  generateSalesInvoiceNumber,
  checkStockAvailability,
  reserveStock,
  releaseReservedStock,
  confirmStockDeduction,
} from "./sales.helpers.js";
import customerService from "../customers/customer.service.js";

// ============================================
// PHONE NORMALIZATION HELPER
// ============================================

/**
 * Normalize Indian phone numbers to 10 digits.
 * Strips +91, 91, 0 prefixes. Returns null if invalid.
 *
 * @param {string|null} phone
 * @returns {string|null} 10-digit string or null
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

// ============================================
// INVOICE PDF GENERATION WITH RETRY
// ============================================

/**
 * Generate marketplace invoice PDF with exponential backoff retry.
 * Non-fatal — if all retries fail, the order is still valid.
 * The user can manually retry via the regenerate endpoint.
 *
 * @param {string} marketplace_order_id
 * @param {string} sales_invoice_id
 * @param {number} maxRetries
 */
async function generateInvoiceWithRetry(
  marketplace_order_id,
  sales_invoice_id,
  maxRetries = 3,
) {
  const delays = [2000, 10000, 30000]; // 2s, 10s, 30s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { generateMarketplaceInvoice } = await import(
        "../mobile/invoice/invoice.service.js"
      );
      await generateMarketplaceInvoice(marketplace_order_id, sales_invoice_id);
      return; // Success — exit
    } catch (err) {
      console.error(
        `[Invoice] PDF generation attempt ${attempt + 1}/${maxRetries} failed:`,
        err.message,
      );
      if (attempt < maxRetries - 1) {
        const delay = delays[attempt] || 30000;
        console.log(`[Invoice] Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `PDF generation failed after ${maxRetries} attempts for order ${marketplace_order_id}`,
  );
}

// ============================================
// CUSTOM ERROR
// ============================================

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "SALES_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ============================================
// SALES SERVICE CLASS
// ============================================

class SalesService {
  // ============================================
  // GET AVAILABLE BATCHES FOR A MEDICINE
  // Returns batches with stock for dropdown selection
  // ============================================

  // backend/src/modules/sales/sales.service.js
  // ONLY change getAvailableBatches method - everything else stays identical

  async getAvailableBatches(shopId, branchId, medicineId, options = {}) {
    const { includeExpiring = true } = options;
    // ✅ Removed includeLowStock - no longer needed

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      shop_id: shopId,
      branch_id: branchId,
      medicine_id: medicineId,
      is_active: true,
      is_expired: false,
      // ✅ FIX: Always gt: 0 — show any batch with at least 1 unit
      // Old code used gt: 5 when includeLowStock=false, hiding valid stock
      available_stock: { gt: 0 },
      expiry_date: { gte: today },
    };

    const batches = await prisma.inventory.findMany({
      where,
      select: {
        inventory_id: true,
        batch_number: true,
        expiry_date: true,
        current_stock: true,
        reserved_stock: true,
        available_stock: true,
        mrp: true,
        selling_rate: true,
        rack_no: true,
        medicine: {
          select: {
            medicine_id: true,
            name: true,
            manufacturer: true,
            pack_size: true,
            gst_percentage: true,
            cgst_percentage: true,
            sgst_percentage: true,
          },
        },
      },
      orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    });

    const enrichedBatches = batches.map((batch) => {
      const expiryDate = new Date(batch.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24),
      );

      // ✅ Status for UI display - low_stock warning but doesn't block
      let status = "available";
      if (daysUntilExpiry <= 30) status = "expiring_soon";
      if (parseFloat(batch.available_stock) <= 5) status = "low_stock";

      return {
        ...batch,
        days_until_expiry: daysUntilExpiry,
        status,
        display_label: `${batch.batch_number} | Exp: ${expiryDate.toLocaleDateString(
          "en-IN",
          {
            month: "short",
            year: "numeric",
          },
        )} | Stock: ${batch.available_stock} | MRP: ₹${batch.mrp}`,
      };
    });

    // ✅ REMOVED: The old post-query filter that was hiding low-stock batches
    // if (!includeLowStock) {
    //   filteredBatches = filteredBatches.filter((b) => b.days_until_expiry > 30);
    // }

    // Only filter by expiry preference
    if (!includeExpiring) {
      return enrichedBatches.filter((b) => b.days_until_expiry > 30);
    }

    return enrichedBatches;
  }

  // ============================================
  // CREATE DRAFT SALE
  // Reserves stock immediately
  // ============================================

  async createDraftSale(userId, shopId, branchId, data, auditContext) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for sales",
        400,
        "BRANCH_REQUIRED",
      );
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    let customer = null;
    let customerDiscountPercent = 0;

    if (data.customer_id) {
      customer = await prisma.customer.findFirst({
        where: {
          customer_id: data.customer_id,
          shop_id: shopId,
          is_active: true,
        },
      });

      if (!customer) {
        throw new ApiError(
          "Customer not found or inactive",
          404,
          "CUSTOMER_NOT_FOUND",
        );
      }

      customerDiscountPercent = parseFloat(customer.discount_percent) || 0;
    }

    const stockCheck = await checkStockAvailability(
      shopId,
      branchId,
      data.lineItems,
    );
    if (!stockCheck.isValid) {
      throw new ApiError(
        `Stock validation failed: ${stockCheck.errors.map((e) => e.error).join("; ")}`,
        400,
        "INSUFFICIENT_STOCK",
      );
    }

    const medicineIds = [
      ...new Set(data.lineItems.map((item) => item.medicine_id)),
    ];
    const medicines = await prisma.medicine.findMany({
      where: { medicine_id: { in: medicineIds } },
      select: {
        medicine_id: true,
        name: true,
        cgst_percentage: true,
        sgst_percentage: true,
      },
    });

    const medicineMap = new Map(medicines.map((m) => [m.medicine_id, m]));

    const enrichedLineItems = data.lineItems.map((item) => {
      const medicine = medicineMap.get(item.medicine_id);
      return {
        ...item,
        cgst_percent:
          item.cgst_percent ?? parseFloat(medicine?.cgst_percentage || 0),
        sgst_percent:
          item.sgst_percent ?? parseFloat(medicine?.sgst_percentage || 0),
      };
    });

    const calculations = calculateInvoiceTotals(
      enrichedLineItems,
      customerDiscountPercent,
      parseFloat(data.bill_discount_percent) || 0,
    );

    const invoiceNumber = await generateSalesInvoiceNumber(shopId, branchId);

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.create({
        data: {
          invoice_number: invoiceNumber,
          sale_channel: data.marketplace_order_id ? "MARKETPLACE" : "COUNTER",
          shop_id: shopId,
          branch_id: branchId,
          customer_id: data.customer_id || null,
          walkin_name: data.walkin_name || null,
          walkin_phone: data.walkin_phone || null,
          invoice_date: new Date(data.invoice_date),
          due_date: data.due_date ? new Date(data.due_date) : null,
          created_by: userId,

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
          balance_amount: calculations.net_amount,

          status: INVOICE_STATUS.DRAFT,
          payment_status: PAYMENT_STATUS.UNPAID,

          prescription_number: data.prescription_number || null,
          doctor_name: data.doctor_name || null,

          remarks: data.remarks || null,
        },
      });

      const lineItems = await Promise.all(
        enrichedLineItems.map(async (item) => {
          //  Fetch inventory FIRST to get selling_rate
          const inventory = await tx.inventory.findUnique({
            where: { inventory_id: item.inventory_id },
            select: {
              batch_number: true,
              expiry_date: true,
              mrp: true,
              selling_rate: true,
              last_purchase_rate: true,
            },
          });

          if (!inventory) {
            throw new Error(
              `Inventory record not found for inventory_id: ${item.inventory_id}`,
            );
          }

          //  Use selling_rate from inventory for calculations
          const effectiveSellingRate = inventory.selling_rate || inventory.mrp;
          const effectiveMRP = item.mrp || inventory.mrp;

          //  Calculate with correct selling rate
          const itemCalc = calculateLineItem({
            quantity: item.quantity,
            mrp: effectiveSellingRate, // ← Use selling_rate for calculation
            discount_percent: item.discount_percent || 0,
            cgst_percent: item.cgst_percent,
            sgst_percent: item.sgst_percent,
          });

          return tx.salesInvoiceItem.create({
            data: {
              invoice_id: invoice.invoice_id,
              medicine_id: item.medicine_id,
              inventory_id: item.inventory_id,
              batch_number: inventory.batch_number,
              expiry_date: inventory.expiry_date,
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure || "UNIT",

              //  Store both selling_rate and MRP
              selling_rate: effectiveSellingRate,
              mrp: effectiveMRP,

              purchase_rate: inventory.last_purchase_rate || null,
              discount_percent: item.discount_percent || 0,
              discount_amount: itemCalc.discount_amount,
              taxable_amount: itemCalc.taxable_amount,
              cgst_percent: item.cgst_percent,
              cgst_amount: itemCalc.cgst_amount,
              sgst_percent: item.sgst_percent,
              sgst_amount: itemCalc.sgst_amount,
              line_total: itemCalc.line_total,
            },
          });
        }),
      );

      await reserveStock(
        tx,
        shopId,
        branchId,
        enrichedLineItems,
        invoice.invoice_id,
      );

      return { ...invoice, lineItems };
    });

    await audit.log({
      action: audit.AuditAction.SALES_INVOICE_CREATED,
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
        invoice_number: result.invoice_number,
        customer_id: data.customer_id,
        customer_name: customer?.name || data.walkin_name || "Walk-in",
        item_count: data.lineItems.length,
        net_amount: calculations.net_amount,
        status: INVOICE_STATUS.DRAFT,
      },
    });

    return result;
  }

  // ============================================
  // ADD ITEMS TO EXISTING DRAFT
  // ============================================

  async addItemsToDraft(
    userId,
    shopId,
    branchId,
    invoiceId,
    data,
    auditContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED] },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or not in draft/parked status",
        404,
        "NOT_FOUND",
      );
    }

    const stockCheck = await checkStockAvailability(
      shopId,
      branchId,
      data.lineItems,
    );
    if (!stockCheck.isValid) {
      throw new ApiError(
        `Stock validation failed: ${stockCheck.errors.map((e) => e.error).join("; ")}`,
        400,
        "INSUFFICIENT_STOCK",
      );
    }

    const medicineIds = [
      ...new Set(data.lineItems.map((item) => item.medicine_id)),
    ];
    const medicines = await prisma.medicine.findMany({
      where: { medicine_id: { in: medicineIds } },
      select: {
        medicine_id: true,
        cgst_percentage: true,
        sgst_percentage: true,
      },
    });

    const medicineMap = new Map(medicines.map((m) => [m.medicine_id, m]));

    const enrichedLineItems = data.lineItems.map((item) => {
      const medicine = medicineMap.get(item.medicine_id);
      return {
        ...item,
        cgst_percent:
          item.cgst_percent ?? parseFloat(medicine?.cgst_percentage || 0),
        sgst_percent:
          item.sgst_percent ?? parseFloat(medicine?.sgst_percentage || 0),
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const newItems = await Promise.all(
        enrichedLineItems.map(async (item) => {
          //  Fetch inventory FIRST
          const inventory = await tx.inventory.findUnique({
            where: { inventory_id: item.inventory_id },
            select: {
              batch_number: true,
              expiry_date: true,
              mrp: true,
              selling_rate: true,
              last_purchase_rate: true,
            },
          });

          if (!inventory) {
            throw new Error(
              `Inventory record not found for inventory_id: ${item.inventory_id}`,
            );
          }

          //  Use selling_rate from inventory
          const effectiveSellingRate = inventory.selling_rate || inventory.mrp;
          const effectiveMRP = item.mrp || inventory.mrp;

          const itemCalc = calculateLineItem({
            quantity: item.quantity,
            mrp: effectiveSellingRate, // ← Use selling_rate
            discount_percent: item.discount_percent || 0,
            cgst_percent: item.cgst_percent,
            sgst_percent: item.sgst_percent,
          });

          return tx.salesInvoiceItem.create({
            data: {
              invoice_id: invoiceId,
              medicine_id: item.medicine_id,
              inventory_id: item.inventory_id,
              batch_number: inventory.batch_number,
              expiry_date: inventory.expiry_date,
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure || "UNIT",

              //  Store both
              selling_rate: effectiveSellingRate,
              mrp: effectiveMRP,

              purchase_rate: inventory.last_purchase_rate || null,
              discount_percent: item.discount_percent || 0,
              discount_amount: itemCalc.discount_amount,
              taxable_amount: itemCalc.taxable_amount,
              cgst_percent: item.cgst_percent,
              cgst_amount: itemCalc.cgst_amount,
              sgst_percent: item.sgst_percent,
              sgst_amount: itemCalc.sgst_amount,
              line_total: itemCalc.line_total,
            },
          });
        }),
      );
      await reserveStock(tx, shopId, branchId, enrichedLineItems, invoiceId);

      const allLineItems = await tx.salesInvoiceItem.findMany({
        where: { invoice_id: invoiceId },
      });

      const customerDiscountPercent = parseFloat(
        invoice.customer?.discount_percent || 0,
      );
      const billDiscountPercent = parseFloat(
        invoice.bill_discount_percent || 0,
      );

      const allItemsForCalc = allLineItems.map((item) => ({
        quantity: parseFloat(item.quantity),
        mrp: parseFloat(item.mrp),
        discount_percent: parseFloat(item.discount_percent),
        cgst_percent: parseFloat(item.cgst_percent),
        sgst_percent: parseFloat(item.sgst_percent),
      }));

      const calculations = calculateInvoiceTotals(
        allItemsForCalc,
        customerDiscountPercent,
        billDiscountPercent,
      );

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,
          balance_amount:
            calculations.net_amount - parseFloat(invoice.paid_amount || 0),
        },
      });

      return { ...updatedInvoice, lineItems: allLineItems, newItems };
    });

    return result;
  }

  // ============================================
  // REMOVE ITEM FROM DRAFT
  // ============================================

  async removeItemFromDraft(
    userId,
    shopId,
    branchId,
    invoiceId,
    itemId,
    auditContext,
  ) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED] },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or not in draft/parked status",
        404,
        "NOT_FOUND",
      );
    }

    const itemToRemove = invoice.lineItems.find(
      (item) => item.item_id === itemId,
    );
    if (!itemToRemove) {
      throw new ApiError(
        "Item not found in this invoice",
        404,
        "ITEM_NOT_FOUND",
      );
    }

    if (invoice.lineItems.length === 1) {
      throw new ApiError(
        "Cannot remove the last item. Cancel the invoice instead.",
        400,
        "LAST_ITEM",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await releaseReservedStock(tx, [itemToRemove]);

      await tx.salesInvoiceItem.delete({
        where: { item_id: itemId },
      });

      const remainingItems = await tx.salesInvoiceItem.findMany({
        where: { invoice_id: invoiceId },
      });

      const customerDiscountPercent = parseFloat(
        invoice.customer?.discount_percent || 0,
      );
      const billDiscountPercent = parseFloat(
        invoice.bill_discount_percent || 0,
      );

      const itemsForCalc = remainingItems.map((item) => ({
        quantity: parseFloat(item.quantity),
        mrp: parseFloat(item.mrp),
        discount_percent: parseFloat(item.discount_percent),
        cgst_percent: parseFloat(item.cgst_percent),
        sgst_percent: parseFloat(item.sgst_percent),
      }));

      const calculations = calculateInvoiceTotals(
        itemsForCalc,
        customerDiscountPercent,
        billDiscountPercent,
      );

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,
          balance_amount:
            calculations.net_amount - parseFloat(invoice.paid_amount || 0),
        },
      });

      return { ...updatedInvoice, lineItems: remainingItems };
    });

    return result;
  }

  // ============================================
  // PARK INVOICE (Save for later)
  // ============================================

  async parkInvoice(userId, shopId, branchId, invoiceId, data, auditContext) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.DRAFT,
      },
    });

    if (!invoice) {
      throw new ApiError("Draft invoice not found", 404, "NOT_FOUND");
    }

    const updatedInvoice = await prisma.salesInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: INVOICE_STATUS.PARKED,
        remarks: data?.remarks || invoice.remarks,
      },
    });

    return updatedInvoice;
  }

  // ============================================
  // RESUME PARKED INVOICE
  // ============================================

  async resumeParkedInvoice(userId, shopId, branchId, invoiceId) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.PARKED,
      },
      include: {
        lineItems: {
          include: {
            medicine: {
              select: {
                name: true,
                manufacturer: true,
              },
            },
            inventory: {
              select: {
                available_stock: true,
                batch_number: true,
                expiry_date: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Parked invoice not found", 404, "NOT_FOUND");
    }

    const updatedInvoice = await prisma.salesInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: INVOICE_STATUS.DRAFT,
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
                available_stock: true,
                reserved_stock: true,
                batch_number: true,
                expiry_date: true,
                mrp: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    return updatedInvoice;
  }

  // ============================================
  // GET PARKED INVOICES
  // ============================================

  async getParkedInvoices(shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const invoices = await prisma.salesInvoice.findMany({
      where: {
        ...baseFilter,
        status: INVOICE_STATUS.PARKED,
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        creator: {
          select: {
            full_name: true,
          },
        },
        _count: {
          select: { lineItems: true },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return invoices;
  }

  // ============================================
  // CONFIRM SALE
  // Deducts stock, records payment
  // ============================================

  async confirmSale(userId, shopId, branchId, invoiceId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED] },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or already confirmed/cancelled",
        404,
        "NOT_FOUND",
      );
    }

    if (invoice.lineItems.length === 0) {
      throw new ApiError(
        "Cannot confirm invoice with no items",
        400,
        "NO_ITEMS",
      );
    }

    const payments = data?.payments || [];
    let totalPaid = 0;
    let creditAmount = 0;

    for (const payment of payments) {
      if (payment.payment_mode === PAYMENT_MODES.CREDIT) {
        creditAmount += parseFloat(payment.amount);
      } else {
        totalPaid += parseFloat(payment.amount);
      }
    }

    const netAmount = parseFloat(invoice.net_amount);
    const totalPayment = totalPaid + creditAmount;

    if (creditAmount > 0 && invoice.customer_id) {
      const creditCheck = await customerService.checkCreditAvailability(
        invoice.customer_id,
        creditAmount,
      );

      if (!creditCheck.allowed) {
        throw new ApiError(creditCheck.reason, 400, "CREDIT_LIMIT_EXCEEDED");
      }
    }

    if (creditAmount > 0 && !invoice.customer_id) {
      throw new ApiError(
        "Credit sales require a registered customer",
        400,
        "CREDIT_REQUIRES_CUSTOMER",
      );
    }

    if (totalPayment > netAmount + PAYMENT_BALANCE_THRESHOLD) {
      throw new ApiError(
        `Total payment (₹${totalPayment}) exceeds invoice amount (₹${netAmount})`,
        400,
        "OVERPAYMENT",
      );
    }

    const paymentCalc = calculatePaymentStatus(totalPayment, netAmount);

    const result = await prisma.$transaction(async (tx) => {
      await confirmStockDeduction(tx, invoice, invoice.lineItems, userId);

      const confirmedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          status: INVOICE_STATUS.CONFIRMED,
          confirmed_by: userId,
          confirmed_at: new Date(),
          payment_status: paymentCalc.status,
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
          credit_amount: creditAmount,
          is_credit_sale: creditAmount > 0,
        },
      });

      for (const payment of payments) {
        if (parseFloat(payment.amount) <= 0) continue;

        await tx.salesPayment.create({
          data: {
            invoice_id: invoiceId,
            shop_id: shopId,
            branch_id: branchId,
            customer_id: invoice.customer_id,
            payment_date: new Date(),
            amount: payment.amount,
            payment_mode: payment.payment_mode,
            reference_number: payment.reference_number || null,
            status: "COMPLETED",
            created_by: userId,
          },
        });
      }

      if (creditAmount > 0 && invoice.customer_id) {
        const customer = await tx.customer.findUnique({
          where: { customer_id: invoice.customer_id },
        });

        const currentBalance = parseFloat(customer?.outstanding_balance || 0);
        const newBalance = currentBalance + creditAmount;

        await tx.customerLedger.create({
          data: {
            customer_id: invoice.customer_id,
            shop_id: shopId,
            branch_id: branchId,
            transaction_type: "SALE",
            reference_type: "SALES_INVOICE",
            reference_id: invoiceId,
            reference_number: invoice.invoice_number,
            debit_amount: creditAmount,
            credit_amount: 0,
            balance_after: newBalance,
            transaction_date: new Date(),
            remarks: `Credit sale: ${invoice.invoice_number}`,
            created_by: userId,
          },
        });

        await tx.customer.update({
          where: { customer_id: invoice.customer_id },
          data: {
            outstanding_balance: newBalance,
          },
        });
      }

      return confirmedInvoice;
    });

    // ── Marketplace order handling (post-transaction) ─────────────────
    const marketplace_order_id = data.marketplace_order_id;

    if (marketplace_order_id) {
      try {
        // ── 1. Fetch marketplace order with phone snapshot ──────────
        const mktOrder = await prisma.marketplaceOrder.findUnique({
          where: { order_id: marketplace_order_id },
          select: {
            order_id: true,
            status: true,
            shop_id: true,
            branch_id: true,
            customer_id: true,
            order_number: true,
            customer_name_snapshot: true,
            customer_phone_snapshot: true,
            sales_invoice_id: true,
          },
        });

        if (!mktOrder) throw new Error("Marketplace order not found");
        if (mktOrder.shop_id !== shopId)
          throw new Error("Marketplace order does not belong to this shop");
        if (mktOrder.sales_invoice_id)
          throw new Error("Marketplace order already billed");
        if (!["PLACED", "ACCEPTED"].includes(mktOrder.status))
          throw new Error(
            `Marketplace order must be PLACED or ACCEPTED before billing (current: ${mktOrder.status})`,
          );

        // ── 2. Auto-create CRM Customer if phone is new ─────────────
        let crmCustomerId = null;
        const normalizedPhone = normalizePhone(
          mktOrder.customer_phone_snapshot,
        );

        if (normalizedPhone) {
          const existingCustomer = await prisma.customer.findFirst({
            where: {
              shop_id: shopId,
              phone: normalizedPhone,
            },
            select: { customer_id: true },
          });

          if (existingCustomer) {
            crmCustomerId = existingCustomer.customer_id;
          } else {
            const newCustomer = await prisma.customer.create({
              data: {
                name:
                  mktOrder.customer_name_snapshot ||
                  `Customer ${normalizedPhone}`,
                phone: normalizedPhone,
                shop_id: shopId,
                branch_id: mktOrder.branch_id,
                created_by: userId,
                is_active: true,
              },
              select: { customer_id: true },
            });
            crmCustomerId = newCustomer.customer_id;
            console.log(
              `[Sales] Auto-created CRM customer ${crmCustomerId} for phone ${normalizedPhone}`,
            );
          }

          // Link CRM customer to the sales invoice
          if (crmCustomerId) {
            await prisma.salesInvoice.update({
              where: { invoice_id: result.invoice_id },
              data: { customer_id: crmCustomerId },
            });
          }
        }

        // ── 3. Atomic order transition + invoice linking ────────────
        const now = new Date();
        const fromStatus = mktOrder.status;

        await prisma.$transaction(async (tx2) => {
          // Step A: If PLACED → ACCEPTED first
          if (fromStatus === "PLACED") {
            await tx2.marketplaceOrder.update({
              where: { order_id: marketplace_order_id },
              data: {
                status: "ACCEPTED",
                accepted_at: now,
              },
            });

            await tx2.marketplaceOrderStatusHistory.create({
              data: {
                order_id: marketplace_order_id,
                from_status: "PLACED",
                to_status: "ACCEPTED",
                changed_by_type: "pharmacy",
                changed_by_id: userId,
                reason: `Invoice ${result.invoice_number} confirmed`,
              },
            });
          }

          // Step B: ACCEPTED → READY_FOR_PICKUP + link invoice
          await tx2.marketplaceOrder.update({
            where: { order_id: marketplace_order_id },
            data: {
              sales_invoice_id: result.invoice_id,
              status: "READY_FOR_PICKUP",
              ready_at: now,
            },
          });

          await tx2.marketplaceOrderStatusHistory.create({
            data: {
              order_id: marketplace_order_id,
              from_status: "ACCEPTED",
              to_status: "READY_FOR_PICKUP",
              changed_by_type: "pharmacy",
              changed_by_id: userId,
              reason: `Invoice ${result.invoice_number} confirmed`,
            },
          });
        });

        // ── 4. Fire notification events ─────────────────────────────
        const { fireOrderStatusChangedEvents } =
          await import("../marketplace-orders/marketplace.orders.events.js");

        // Fire ACCEPTED event if we just transitioned from PLACED
        if (fromStatus === "PLACED") {
          await fireOrderStatusChangedEvents({
            order_id: marketplace_order_id,
            order_number: mktOrder.order_number,
            shop_id: shopId,
            customer_id: mktOrder.customer_id,
            new_status: "ACCEPTED",
            customer_name: mktOrder.customer_name_snapshot,
          });
        }

        // Fire READY_FOR_PICKUP event
        await fireOrderStatusChangedEvents({
          order_id: marketplace_order_id,
          order_number: mktOrder.order_number,
          shop_id: shopId,
          customer_id: mktOrder.customer_id,
          new_status: "READY_FOR_PICKUP",
          customer_name: mktOrder.customer_name_snapshot,
        });

        // ── 5. Generate PDF in background with retry ────────────────
        generateInvoiceWithRetry(marketplace_order_id, result.invoice_id, 3)
          .then(() =>
            console.log(
              `[Sales] Invoice PDF generated for ${mktOrder.order_number}`,
            ),
          )
          .catch((err) =>
            console.error(
              `[Sales] Invoice PDF generation failed after all retries:`,
              err.message,
            ),
          );

        console.log(
          `[Sales] Marketplace order ${mktOrder.order_number} linked to ${result.invoice_number}`,
        );
      } catch (mktErr) {
        console.error("[Sales] Marketplace linking failed:", mktErr.message);
      }
    }

    await audit.log({
      action: audit.AuditAction.SALES_INVOICE_CONFIRMED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: invoiceId,
      shop_id: shopId,
      branch_id: branchId,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        invoice_number: invoice.invoice_number,
        customer_name:
          invoice.customer?.name || invoice.walkin_name || "Walk-in",
        net_amount: netAmount,
        paid_amount: totalPaid,
        credit_amount: creditAmount,
        payment_status: paymentCalc.status,
        item_count: invoice.lineItems.length,
      },
    });

    return result;
  }

  // ============================================
  // CANCEL INVOICE
  // ============================================

  async cancelInvoice(
    userId,
    shopId,
    branchId,
    invoiceId,
    reason,
    auditContext,
  ) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
      },
      include: {
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Invoice not found", 404, "NOT_FOUND");
    }

    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      throw new ApiError("Invoice already cancelled", 400, "ALREADY_CANCELLED");
    }

    if (invoice.status === INVOICE_STATUS.CONFIRMED) {
      throw new ApiError(
        "Cannot cancel confirmed invoice. Use Sales Return instead.",
        400,
        "CANNOT_CANCEL_CONFIRMED",
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await releaseReservedStock(tx, invoice.lineItems);

      const cancelledInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          status: INVOICE_STATUS.CANCELLED,
          cancelled_at: new Date(),
          cancelled_by: userId,
          cancellation_reason: reason,
        },
      });

      return cancelledInvoice;
    });

    await audit.log({
      action: audit.AuditAction.SALES_INVOICE_CANCELLED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: invoiceId,
      shop_id: shopId,
      branch_id: branchId,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        invoice_number: invoice.invoice_number,
        cancellation_reason: reason,
        was_status: invoice.status,
      },
    });

    return result;
  }

  // ============================================
  // RECORD PAYMENT
  // ============================================

  async recordPayment(userId, shopId, branchId, invoiceId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        status: INVOICE_STATUS.CONFIRMED,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Confirmed invoice not found", 404, "NOT_FOUND");
    }

    if (invoice.payment_status === PAYMENT_STATUS.PAID) {
      throw new ApiError("Invoice already fully paid", 400, "ALREADY_PAID");
    }

    const paymentAmount = parseFloat(data.amount);
    const currentPaid = parseFloat(invoice.paid_amount);
    const netAmount = parseFloat(invoice.net_amount);
    const newPaidAmount = currentPaid + paymentAmount;

    if (newPaidAmount > netAmount + PAYMENT_BALANCE_THRESHOLD) {
      throw new ApiError(
        `Payment of ₹${paymentAmount} would exceed balance of ₹${invoice.balance_amount}`,
        400,
        "OVERPAYMENT",
      );
    }

    const paymentCalc = calculatePaymentStatus(newPaidAmount, netAmount);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.salesPayment.create({
        data: {
          invoice_id: invoiceId,
          shop_id: shopId,
          branch_id: branchId,
          customer_id: invoice.customer_id,
          payment_date: data.payment_date
            ? new Date(data.payment_date)
            : new Date(),
          amount: paymentAmount,
          payment_mode: data.payment_mode,
          reference_number: data.reference_number || null,
          status: "COMPLETED",
          remarks: data.remarks || null,
          created_by: userId,
        },
      });

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          payment_status: paymentCalc.status,
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
          credit_amount: Math.max(
            0,
            parseFloat(invoice.credit_amount) - paymentAmount,
          ),
        },
      });

      if (invoice.customer_id && invoice.is_credit_sale) {
        const customer = await tx.customer.findUnique({
          where: { customer_id: invoice.customer_id },
        });

        const currentBalance = parseFloat(customer?.outstanding_balance || 0);
        const newBalance = Math.max(0, currentBalance - paymentAmount);

        await tx.customerLedger.create({
          data: {
            customer_id: invoice.customer_id,
            shop_id: shopId,
            branch_id: branchId,
            transaction_type: "PAYMENT",
            reference_type: "SALES_PAYMENT",
            reference_id: payment.payment_id,
            reference_number: `PMT-${payment.payment_id.slice(-8)}`,
            debit_amount: 0,
            credit_amount: paymentAmount,
            balance_after: newBalance,
            transaction_date: new Date(),
            remarks: `Payment received for ${invoice.invoice_number}`,
            created_by: userId,
          },
        });

        await tx.customer.update({
          where: { customer_id: invoice.customer_id },
          data: {
            outstanding_balance: newBalance,
          },
        });
      }

      return { payment, invoice: updatedInvoice };
    });

    return result;
  }

  // ============================================
  // GET SALES INVOICES
  // ============================================

  async getSalesInvoices(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      status,
      paymentStatus,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_return: false,
      ...(customerId && { customer_id: customerId }),
      ...(status && { status }),
      ...(paymentStatus && { payment_status: paymentStatus }),
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
          { walkin_name: { contains: search, mode: "insensitive" } },
          { walkin_phone: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { phone: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
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
          creator: {
            select: {
              full_name: true,
            },
          },
          _count: {
            select: { lineItems: true, payments: true },
          },
        },
        orderBy: { invoice_date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    return { invoices, total };
  }

  // ============================================
  // GET INVOICE DETAILS
  // ============================================

  async getInvoiceDetails(invoiceId, shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        ...baseFilter,
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
            pincode: true,
            contact_number: true,
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
                schedule: true,
              },
            },
            inventory: {
              select: {
                inventory_id: true,
                batch_number: true, //  Make sure this is included
                expiry_date: true, //  Make sure this is included
                current_stock: true,
                available_stock: true,
                mrp: true, //  Make sure this is included
                selling_rate: true, //  Make sure this is included
                rack_no: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
        payments: {
          orderBy: { payment_date: "desc" },
          include: {
            creator: {
              select: { full_name: true },
            },
          },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        confirmer: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        canceller: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
          },
        },
        returnInvoices: {
          select: {
            invoice_id: true,
            invoice_number: true,
            net_amount: true,
            status: true,
            return_reason: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new ApiError("Invoice not found", 404, "NOT_FOUND");
    }

    return invoice;
  }

  // ============================================
  // GET SALES STATISTICS
  // ============================================

  async getSalesStats(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      status: INVOICE_STATUS.CONFIRMED,
      is_return: false,
      ...(startDate &&
        endDate && {
          invoice_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [
      totalInvoices,
      totalSales,
      totalReceived,
      totalOutstanding,
      todaySales,
    ] = await Promise.all([
      prisma.salesInvoice.count({ where }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: { net_amount: true },
      }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: { paid_amount: true },
      }),
      prisma.salesInvoice.aggregate({
        where: {
          ...where,
          payment_status: { not: PAYMENT_STATUS.PAID },
        },
        _sum: { balance_amount: true },
      }),
      prisma.salesInvoice.aggregate({
        where: {
          ...baseFilter,
          status: INVOICE_STATUS.CONFIRMED,
          is_return: false,
          invoice_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { net_amount: true },
        _count: true,
      }),
    ]);

    return {
      totalInvoices,
      totalSalesAmount: totalSales._sum.net_amount || 0,
      totalReceivedAmount: totalReceived._sum.paid_amount || 0,
      totalOutstandingAmount: totalOutstanding._sum.balance_amount || 0,
      todaySalesAmount: todaySales._sum.net_amount || 0,
      todayInvoiceCount: todaySales._count || 0,
    };
  }

  // ============================================
  // UPDATE SALES INVOICE (DRAFT/PARKED only)
  // Completely replaces line items
  // ============================================

  // ============================================
  // UPDATE SALES INVOICE (DRAFT/PARKED/CONFIRMED for Super Admin)
  // Completely replaces line items
  // For CONFIRMED invoices: restores stock first, then deducts new stock
  // ============================================

  async updateSalesInvoice(
    userId,
    shopId,
    branchId,
    invoiceId,
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

    //  FIX: For Super Admin, also allow CONFIRMED status
    const allowedStatuses =
      user.role === "super_admin"
        ? [
            INVOICE_STATUS.DRAFT,
            INVOICE_STATUS.PARKED,
            INVOICE_STATUS.CONFIRMED,
          ]
        : [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED];

    // Fetch existing invoice
    const existingInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: allowedStatuses },
      },
      include: {
        lineItems: {
          include: {
            inventory: true,
          },
        },
        customer: true,
        //  Check for approved returns - these block editing
        returnInvoices: {
          where: {
            return_approval_status: "APPROVED",
            status: { not: INVOICE_STATUS.CANCELLED },
          },
          select: {
            invoice_id: true,
            invoice_number: true,
            return_approval_status: true,
          },
        },
      },
    });

    if (!existingInvoice) {
      // Check if invoice exists but has wrong status
      const invoiceExists = await prisma.salesInvoice.findFirst({
        where: {
          invoice_id: invoiceId,
          shop_id: shopId,
        },
        select: { status: true, invoice_number: true },
      });

      if (invoiceExists) {
        if (invoiceExists.status === INVOICE_STATUS.CANCELLED) {
          throw new ApiError(
            `Invoice ${invoiceExists.invoice_number} is cancelled and cannot be edited`,
            400,
            "INVOICE_CANCELLED",
          );
        }
        if (
          invoiceExists.status === INVOICE_STATUS.CONFIRMED &&
          user.role !== "super_admin"
        ) {
          throw new ApiError(
            "Only Super Admin can edit confirmed invoices",
            403,
            "PERMISSION_DENIED",
          );
        }
      }

      throw new ApiError(
        "Invoice not found or not in editable status",
        404,
        "NOT_FOUND",
      );
    }

    const isConfirmed = existingInvoice.status === INVOICE_STATUS.CONFIRMED;

    //  Block editing if there are approved returns
    if (
      existingInvoice.returnInvoices &&
      existingInvoice.returnInvoices.length > 0
    ) {
      const returnNumbers = existingInvoice.returnInvoices
        .map((r) => r.invoice_number)
        .join(", ");
      throw new ApiError(
        `Cannot edit invoice with approved returns (${returnNumbers}). Cancel the returns first.`,
        400,
        "APPROVED_RETURNS_EXIST",
      );
    }

    //  For confirmed invoices, require super_admin
    if (isConfirmed && user.role !== "super_admin") {
      throw new ApiError(
        "Only Super Admin can edit confirmed invoices",
        403,
        "PERMISSION_DENIED",
      );
    }

    // Validate stock availability for new line items (skip for items we're restoring)
    if (data.lineItems && data.lineItems.length > 0) {
      // For confirmed invoices, we need to account for stock that will be restored
      const stockToRestore = new Map();

      if (isConfirmed) {
        for (const item of existingInvoice.lineItems) {
          const key = item.inventory_id;
          const current = stockToRestore.get(key) || 0;
          stockToRestore.set(key, current + parseFloat(item.quantity));
        }
      }

      // Check stock with restoration taken into account
      for (const item of data.lineItems) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            inventory_id: item.inventory_id,
            shop_id: shopId,
            branch_id: branchId,
            is_active: true,
          },
          include: {
            medicine: { select: { name: true } },
          },
        });

        if (!inventory) {
          throw new ApiError(
            `Inventory batch not found: ${item.inventory_id}`,
            400,
            "INVENTORY_NOT_FOUND",
          );
        }

        let availableStock = parseFloat(inventory.available_stock);

        // If confirmed, add back the stock that will be restored for this batch
        if (isConfirmed && stockToRestore.has(item.inventory_id)) {
          availableStock += stockToRestore.get(item.inventory_id);
        }

        const requestedQty = parseFloat(item.quantity);

        if (availableStock < requestedQty) {
          throw new ApiError(
            `Insufficient stock for ${inventory.medicine.name} (Batch: ${inventory.batch_number}). ` +
              `Available: ${availableStock}, Requested: ${requestedQty}`,
            400,
            "INSUFFICIENT_STOCK",
          );
        }

        // Check expiry
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(inventory.expiry_date);

        if (expiryDate < today) {
          throw new ApiError(
            `Batch ${inventory.batch_number} has expired on ${expiryDate.toISOString().split("T")[0]}`,
            400,
            "BATCH_EXPIRED",
          );
        }
      }
    }

    // Get medicine data for GST defaults
    const medicineIds = data.lineItems
      ? [...new Set(data.lineItems.map((item) => item.medicine_id))]
      : [];

    const medicines = await prisma.medicine.findMany({
      where: { medicine_id: { in: medicineIds } },
      select: {
        medicine_id: true,
        name: true,
        cgst_percentage: true,
        sgst_percentage: true,
      },
    });

    const medicineMap = new Map(medicines.map((m) => [m.medicine_id, m]));

    // Enrich line items with tax defaults
    const enrichedLineItems = data.lineItems
      ? data.lineItems.map((item) => {
          const medicine = medicineMap.get(item.medicine_id);
          return {
            ...item,
            cgst_percent:
              item.cgst_percent ?? parseFloat(medicine?.cgst_percentage || 0),
            sgst_percent:
              item.sgst_percent ?? parseFloat(medicine?.sgst_percentage || 0),
          };
        })
      : [];

    // Calculate new totals
    let calculations;
    let customerDiscountPercent = parseFloat(
      existingInvoice.customer_discount_percent || 0,
    );

    if (data.customer_id && data.customer_id !== existingInvoice.customer_id) {
      const newCustomer = await prisma.customer.findFirst({
        where: {
          customer_id: data.customer_id,
          shop_id: shopId,
          is_active: true,
        },
      });
      if (newCustomer) {
        customerDiscountPercent = parseFloat(newCustomer.discount_percent) || 0;
      }
    }

    if (enrichedLineItems.length > 0) {
      calculations = calculateInvoiceTotals(
        enrichedLineItems.map((item) => ({
          quantity: item.quantity,
          mrp: item.selling_rate || item.mrp,
          discount_percent: item.discount_percent || 0,
          cgst_percent: item.cgst_percent,
          sgst_percent: item.sgst_percent,
        })),
        customerDiscountPercent,
        parseFloat(data.bill_discount_percent) ||
          parseFloat(existingInvoice.bill_discount_percent) ||
          0,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // ═══════════════════════════════════════════════════════════════════
      // STEP 1: For CONFIRMED invoices, restore the original stock first
      // ═══════════════════════════════════════════════════════════════════

      if (isConfirmed && existingInvoice.lineItems.length > 0) {
        for (const item of existingInvoice.lineItems) {
          const inventory = await tx.inventory.findUnique({
            where: { inventory_id: item.inventory_id },
          });

          if (inventory) {
            const qty = parseFloat(item.quantity);
            const currentStock = parseFloat(inventory.current_stock);
            const currentAvailable = parseFloat(inventory.available_stock);

            // Restore stock (reverse the sale deduction)
            await tx.inventory.update({
              where: { inventory_id: item.inventory_id },
              data: {
                current_stock: currentStock + qty,
                available_stock: currentAvailable + qty,
              },
            });

            // Create stock ledger entry for restoration
            await tx.stockLedger.create({
              data: {
                shop_id: shopId,
                branch_id: branchId,
                medicine_id: item.medicine_id,
                inventory_id: item.inventory_id,
                batch_number: item.batch_number,
                expiry_date: new Date(item.expiry_date),
                movement_type: "SALE_RETURN", // Using SALE_RETURN for stock restoration
                reference_type: "INVOICE_EDIT_RESTORE",
                reference_id: existingInvoice.invoice_id,
                reference_number: `${existingInvoice.invoice_number}-EDIT-RESTORE`,
                quantity_in: qty,
                quantity_out: 0,
                quantity_net: qty,
                balance_after: currentStock + qty,
                rate: item.mrp,
                amount: parseFloat(item.line_total),
                transaction_date: new Date(),
                created_by: userId,
                remarks: `Stock restored for invoice edit (Super Admin): ${existingInvoice.invoice_number}`,
              },
            });
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 2: If line items are provided, replace them all
      // ═══════════════════════════════════════════════════════════════════

      if (data.lineItems && data.lineItems.length > 0) {
        // For DRAFT/PARKED: Release reserved stock
        if (!isConfirmed) {
          await releaseReservedStock(tx, existingInvoice.lineItems);
        }

        // Delete old line items
        await tx.salesInvoiceItem.deleteMany({
          where: { invoice_id: invoiceId },
        });

        // Create new line items
        const newLineItems = await Promise.all(
          enrichedLineItems.map(async (item) => {
            // Fetch inventory data
            const inventory = await tx.inventory.findUnique({
              where: { inventory_id: item.inventory_id },
              select: {
                batch_number: true,
                expiry_date: true,
                mrp: true,
                selling_rate: true,
                last_purchase_rate: true,
              },
            });

            if (!inventory) {
              throw new Error(
                `Inventory record not found for inventory_id: ${item.inventory_id}`,
              );
            }

            // Use selling_rate from inventory or from request
            const effectiveSellingRate =
              item.selling_rate || inventory.selling_rate || inventory.mrp;
            const effectiveMRP = item.mrp || inventory.mrp;

            // Calculate with correct selling rate
            const itemCalc = calculateLineItem({
              quantity: item.quantity,
              mrp: effectiveSellingRate,
              discount_percent: item.discount_percent || 0,
              cgst_percent: item.cgst_percent,
              sgst_percent: item.sgst_percent,
            });

            return tx.salesInvoiceItem.create({
              data: {
                invoice_id: invoiceId,
                medicine_id: item.medicine_id,
                inventory_id: item.inventory_id,
                batch_number: inventory.batch_number,
                expiry_date: inventory.expiry_date,
                quantity: item.quantity,
                unit_of_measure: item.unit_of_measure || "UNIT",
                selling_rate: effectiveSellingRate,
                mrp: effectiveMRP,
                purchase_rate: inventory.last_purchase_rate || null,
                discount_percent: item.discount_percent || 0,
                discount_amount: itemCalc.discount_amount,
                taxable_amount: itemCalc.taxable_amount,
                cgst_percent: item.cgst_percent,
                cgst_amount: itemCalc.cgst_amount,
                sgst_percent: item.sgst_percent,
                sgst_amount: itemCalc.sgst_amount,
                line_total: itemCalc.line_total,
              },
            });
          }),
        );

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Handle stock for new items
        // ═══════════════════════════════════════════════════════════════════

        if (isConfirmed) {
          // For CONFIRMED: Deduct stock immediately (like confirmStockDeduction)

          for (const item of newLineItems) {
            const inventory = await tx.inventory.findUnique({
              where: { inventory_id: item.inventory_id },
            });

            if (inventory) {
              const qty = parseFloat(item.quantity);
              const currentStock = parseFloat(inventory.current_stock);
              const currentAvailable = parseFloat(inventory.available_stock);

              // Deduct stock
              await tx.inventory.update({
                where: { inventory_id: item.inventory_id },
                data: {
                  current_stock: currentStock - qty,
                  available_stock: currentAvailable - qty,
                },
              });

              // Create stock ledger entry for new deduction
              await tx.stockLedger.create({
                data: {
                  shop_id: shopId,
                  branch_id: branchId,
                  medicine_id: item.medicine_id,
                  inventory_id: item.inventory_id,
                  batch_number: item.batch_number,
                  expiry_date: new Date(item.expiry_date),
                  movement_type: "SALE",
                  reference_type: "INVOICE_EDIT_DEDUCT",
                  reference_id: existingInvoice.invoice_id,
                  reference_number: `${existingInvoice.invoice_number}-EDIT-DEDUCT`,
                  quantity_in: 0,
                  quantity_out: qty,
                  quantity_net: -qty,
                  balance_after: currentStock - qty,
                  rate: item.mrp,
                  amount: parseFloat(item.line_total),
                  transaction_date: new Date(),
                  created_by: userId,
                  remarks: `Stock deducted for invoice edit (Super Admin): ${existingInvoice.invoice_number}`,
                },
              });
            }
          }
        } else {
          // For DRAFT/PARKED: Reserve new stock
          await reserveStock(
            tx,
            shopId,
            branchId,
            enrichedLineItems,
            invoiceId,
          );
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // STEP 4: Update invoice header
      // ═══════════════════════════════════════════════════════════════════

      const updateData = {
        ...(data.customer_id !== undefined && {
          customer_id: data.customer_id,
        }),
        ...(data.walkin_name !== undefined && {
          walkin_name: data.walkin_name,
        }),
        ...(data.walkin_phone !== undefined && {
          walkin_phone: data.walkin_phone,
        }),
        ...(data.invoice_date && { invoice_date: new Date(data.invoice_date) }),
        ...(data.due_date && { due_date: new Date(data.due_date) }),
        ...(data.bill_discount_percent !== undefined && {
          bill_discount_percent: data.bill_discount_percent,
        }),
        ...(data.prescription_number !== undefined && {
          prescription_number: data.prescription_number,
        }),
        ...(data.doctor_name !== undefined && {
          doctor_name: data.doctor_name,
        }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      };

      // If calculations exist (new line items), update totals
      if (calculations) {
        Object.assign(updateData, {
          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_percent: customerDiscountPercent,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_percent:
            parseFloat(data.bill_discount_percent) ||
            parseFloat(existingInvoice.bill_discount_percent) ||
            0,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,
          balance_amount:
            calculations.net_amount -
            parseFloat(existingInvoice.paid_amount || 0),
        });
      }

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: updateData,
        include: {
          lineItems: {
            include: {
              medicine: {
                select: {
                  medicine_id: true,
                  name: true,
                  manufacturer: true,
                },
              },
              inventory: {
                select: {
                  batch_number: true,
                  expiry_date: true,
                  available_stock: true,
                  mrp: true,
                  selling_rate: true,
                },
              },
            },
          },
          customer: true,
        },
      });

      return updatedInvoice;
    });

    // Audit log
    await audit.log({
      action: isConfirmed
        ? audit.AuditAction.SALES_INVOICE_EDITED_SUPER_ADMIN
        : audit.AuditAction.SALES_INVOICE_UPDATED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: invoiceId,
      shop_id: shopId,
      branch_id: branchId,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: isConfirmed
        ? audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE
        : audit.AuditReasonCode.USER_REQUEST,
      metadata: {
        invoice_number: result.invoice_number,
        customer_name: result.customer?.name || result.walkin_name || "Walk-in",
        was_status: existingInvoice.status,
        is_confirmed_edit: isConfirmed,
        new_item_count: result.lineItems?.length || 0,
        old_item_count: existingInvoice.lineItems?.length || 0,
        old_net_amount: existingInvoice.net_amount,
        new_net_amount: calculations?.net_amount || existingInvoice.net_amount,
      },
    });

    return result;
  }

  // ============================================
  // UPDATE PAYMENT STATUS (Super Admin only)
  // Direct override of payment status without creating payment record
  // ============================================

  async updatePaymentStatus(
    userId,
    shopId,
    branchId,
    invoiceId,
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

    // Only super_admin can directly update payment status
    if (user.role !== "super_admin") {
      throw new ApiError(
        "Only Super Admin can directly update payment status",
        403,
        "PERMISSION_DENIED",
      );
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        status: INVOICE_STATUS.CONFIRMED,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Confirmed invoice not found", 404, "NOT_FOUND");
    }

    const netAmount = parseFloat(invoice.net_amount);
    const currentPaidAmount = parseFloat(invoice.paid_amount) || 0;

    let newPaidAmount = currentPaidAmount;
    let newBalanceAmount = parseFloat(invoice.balance_amount);
    let newPaymentStatus = data.payment_status;

    // Calculate amounts based on new status
    if (data.payment_status === PAYMENT_STATUS.PAID) {
      // Mark as fully paid
      newPaidAmount =
        data.paid_amount !== undefined ? data.paid_amount : netAmount;
      newBalanceAmount = 0;
    } else if (data.payment_status === PAYMENT_STATUS.UNPAID) {
      // Reset to unpaid
      newPaidAmount = 0;
      newBalanceAmount = netAmount;
    } else if (data.payment_status === PAYMENT_STATUS.PARTIALLY_PAID) {
      // Use provided paid_amount or keep current
      if (data.paid_amount !== undefined) {
        newPaidAmount = data.paid_amount;
        newBalanceAmount = netAmount - newPaidAmount;
      }
      // Validate partial payment
      if (newPaidAmount <= 0 || newPaidAmount >= netAmount) {
        throw new ApiError(
          `For PARTIALLY_PAID status, paid amount must be between ₹1 and ₹${netAmount - 1}`,
          400,
          "INVALID_AMOUNT",
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update invoice payment status
      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          payment_status: newPaymentStatus,
          paid_amount: newPaidAmount,
          balance_amount: newBalanceAmount,
          // Update credit amount if marking as paid
          ...(data.payment_status === PAYMENT_STATUS.PAID && {
            credit_amount: 0,
            is_credit_sale: false,
          }),
        },
      });

      // If customer exists and was credit sale, update customer balance
      if (invoice.customer_id && invoice.is_credit_sale) {
        const customer = await tx.customer.findUnique({
          where: { customer_id: invoice.customer_id },
        });

        if (customer) {
          const currentOutstanding =
            parseFloat(customer.outstanding_balance) || 0;
          const originalCreditAmount = parseFloat(invoice.credit_amount) || 0;

          let newOutstanding = currentOutstanding;

          if (data.payment_status === PAYMENT_STATUS.PAID) {
            // Reduce outstanding by the credit amount that was on this invoice
            newOutstanding = Math.max(
              0,
              currentOutstanding - originalCreditAmount,
            );
          } else if (
            data.payment_status === PAYMENT_STATUS.UNPAID &&
            currentPaidAmount > 0
          ) {
            // If reverting to unpaid, add back to outstanding
            newOutstanding = currentOutstanding + currentPaidAmount;
          }

          if (newOutstanding !== currentOutstanding) {
            await tx.customer.update({
              where: { customer_id: invoice.customer_id },
              data: { outstanding_balance: newOutstanding },
            });

            // Create customer ledger entry
            await tx.customerLedger.create({
              data: {
                customer_id: invoice.customer_id,
                shop_id: shopId,
                branch_id: branchId,
                transaction_type: "ADJUSTMENT",
                reference_type: "PAYMENT_STATUS_OVERRIDE",
                reference_id: invoiceId,
                reference_number: invoice.invoice_number,
                debit_amount:
                  newOutstanding > currentOutstanding
                    ? newOutstanding - currentOutstanding
                    : 0,
                credit_amount:
                  newOutstanding < currentOutstanding
                    ? currentOutstanding - newOutstanding
                    : 0,
                balance_after: newOutstanding,
                transaction_date: new Date(),
                remarks: `Payment status override by Super Admin: ${invoice.payment_status} → ${data.payment_status}`,
                created_by: userId,
              },
            });
          }
        }
      }

      return updatedInvoice;
    });

    // Audit log
    await audit.log({
      action: audit.AuditAction.SALES_PAYMENT_STATUS_UPDATED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: invoiceId,
      shop_id: shopId,
      branch_id: branchId,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
      metadata: {
        invoice_number: invoice.invoice_number,
        customer_name:
          invoice.customer?.name || invoice.walkin_name || "Walk-in",
        old_payment_status: invoice.payment_status,
        new_payment_status: data.payment_status,
        old_paid_amount: currentPaidAmount,
        new_paid_amount: newPaidAmount,
        net_amount: netAmount,
      },
    });

    return result;
  }
}

export default new SalesService();
