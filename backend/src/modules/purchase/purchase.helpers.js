// backend/src/modules/purchase/purchase.helpers.js (do not remove this comment)
// backend/src/modules/purchase/purchase.helpers.js

import prisma from "../../config/prisma.js";

// ============================================
// CONSTANTS
// ============================================

export const PAYMENT_BALANCE_THRESHOLD = 10;

// ============================================
// HELPER: Build Branch Filter
// ============================================

export function buildBranchFilter(shopId, branchId, role, branchMode) {
  const filter = { shop_id: shopId };


  if (role === "super_admin" && branchMode === "GLOBAL") {
    
    return filter;
  }

  if (role === "super_admin" && branchMode === "BRANCH") {
    if (branchId) {
      filter.branch_id = branchId;
      
    } else {
      
    }
    return filter;
  }

   if (branchId) {
    filter.branch_id = branchId;
  }

  return filter;
}

// ============================================
// HELPER: Calculate Payment Status with Threshold
// ============================================

export function calculatePaymentStatus(
  paidAmount,
  netAmount,
  threshold = PAYMENT_BALANCE_THRESHOLD,
) {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const balance = net - paid;

  if (paid <= 0) {
    return {
      status: "UNPAID",
      paidAmount: 0,
      balanceAmount: net,
    };
  }

  if (balance <= threshold) {
    return {
      status: "PAID",
      paidAmount: net,
      balanceAmount: 0,
    };
  }

  return {
    status: "PARTIALLY_PAID",
    paidAmount: paid,
    balanceAmount: balance,
  };
}

// ============================================
// HELPER: Calculate Line Item for DB
// ============================================

export function calculateLineItemForDB(item) {
  const qty = parseFloat(item.quantity || 0);
  const rate = parseFloat(item.purchase_rate || 0);
  const schemeDisc = parseFloat(item.scheme_discount || 0);
  const tradeDisc = parseFloat(item.trade_discount || 0);

  const gross = qty * rate;

  const schemeAmt = (gross * schemeDisc) / 100;
  const afterScheme = gross - schemeAmt;
  const tradeAmt = (afterScheme * tradeDisc) / 100;

  const discountAmount = schemeAmt + tradeAmt;
  const taxableAmount = gross - discountAmount;

  const cgstPct = parseFloat(item.cgst_percent || 0);
  const sgstPct = parseFloat(item.sgst_percent || 0);
  const igstPct = parseFloat(item.igst_percent || 0);

  const cgstAmount = (taxableAmount * cgstPct) / 100;
  const sgstAmount = (taxableAmount * sgstPct) / 100;
  const igstAmount = (taxableAmount * igstPct) / 100;

  const lineTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  return {
    discount_amount: Number(discountAmount.toFixed(2)),
    taxable_amount: Number(taxableAmount.toFixed(2)),
    cgst_amount: Number(cgstAmount.toFixed(2)),
    sgst_amount: Number(sgstAmount.toFixed(2)),
    igst_amount: Number(igstAmount.toFixed(2)),
    line_total: Number(lineTotal.toFixed(2)),
  };
}

// ============================================
// HELPER: Calculate Invoice Totals
// ============================================

export function calculateInvoiceTotals(lineItems) {
  let subtotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  lineItems.forEach((item) => {
    const qty = parseFloat(item.quantity || 0);
    const rate = parseFloat(item.purchase_rate || 0);
    const schemeDisc = parseFloat(item.scheme_discount || 0);
    const tradeDisc = parseFloat(item.trade_discount || 0);

    const gross = qty * rate;
    const schemeAmt = (gross * schemeDisc) / 100;
    const afterScheme = gross - schemeAmt;
    const tradeAmt = (afterScheme * tradeDisc) / 100;

    const itemDiscount = schemeAmt + tradeAmt;
    const itemTaxable = gross - itemDiscount;

    const cgstPct = parseFloat(item.cgst_percent || 0);
    const sgstPct = parseFloat(item.sgst_percent || 0);
    const igstPct = parseFloat(item.igst_percent || 0);

    subtotal += gross;
    discountAmount += itemDiscount;
    taxableAmount += itemTaxable;
    cgstAmount += (itemTaxable * cgstPct) / 100;
    sgstAmount += (itemTaxable * sgstPct) / 100;
    igstAmount += (itemTaxable * igstPct) / 100;
  });

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grossTotal = taxableAmount + totalTax;
  const roundOff = Math.round(grossTotal) - grossTotal;
  const netAmount = Math.round(grossTotal);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_amount: Number(discountAmount.toFixed(2)),
    taxable_amount: Number(taxableAmount.toFixed(2)),
    cgst_amount: Number(cgstAmount.toFixed(2)),
    sgst_amount: Number(sgstAmount.toFixed(2)),
    igst_amount: Number(igstAmount.toFixed(2)),
    total_tax: Number(totalTax.toFixed(2)),
    round_off: Number(roundOff.toFixed(2)),
    net_amount: Number(netAmount.toFixed(2)),
    balance_amount: Number(netAmount.toFixed(2)),
  };
}

// ============================================
// HELPER: Generate Invoice Number
// ============================================

export async function generateInvoiceNumber(shopId) {
  const lastInvoice = await prisma.purchaseInvoice.findFirst({
    where: { shop_id: shopId, is_return: false },
    orderBy: { created_at: "desc" },
    select: { invoice_number: true },
  });

  if (!lastInvoice) return "PUR-000001";

  const lastNumber = parseInt(lastInvoice.invoice_number.split("-")[1]);
  return `PUR-${String(lastNumber + 1).padStart(6, "0")}`;
}

// ============================================
// HELPER: Generate Return Invoice Number
// ============================================

export async function generateReturnInvoiceNumber(shopId) {
  const lastReturn = await prisma.purchaseInvoice.findFirst({
    where: {
      shop_id: shopId,
      is_return: true,
    },
    orderBy: { created_at: "desc" },
    select: { invoice_number: true },
  });

  if (!lastReturn) return "RTN-000001";

  const lastNumber = parseInt(lastReturn.invoice_number.split("-")[1]) || 0;
  return `RTN-${String(lastNumber + 1).padStart(6, "0")}`;
}

// ============================================
// HELPER: Generate Credit Note Number
// ============================================

export async function generateCreditNoteNumber(shopId) {
  const lastCredit = await prisma.supplierCredit.findFirst({
    where: { shop_id: shopId },
    orderBy: { created_at: "desc" },
    select: { credit_note_number: true },
  });

  if (!lastCredit) return "CN-000001";

  const lastNumber = parseInt(lastCredit.credit_note_number.split("-")[1]) || 0;
  return `CN-${String(lastNumber + 1).padStart(6, "0")}`;
}

// ============================================
// HELPER: Process Approved Return
// ============================================

export async function processApprovedReturn(
  tx,
  returnInvoice,
  lineItems,
  userId,
) {
  const shopId = returnInvoice.shop_id;
  const branchId = returnInvoice.branch_id;

  // 1. DEDUCT STOCK from exact batches
  for (const item of lineItems) {
    const inventory = await tx.inventory.findFirst({
      where: {
        shop_id: shopId,
        branch_id: branchId,
        medicine_id: item.medicine_id,
        batch_number: item.batch_number,
      },
    });

    if (!inventory) {
      const newInventory = await tx.inventory.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          mrp: item.mrp,
          current_stock: 0,
          available_stock: 0,
          last_purchase_rate: item.purchase_rate,
          last_purchase_date: returnInvoice.invoice_date,
        },
      });

      await tx.stockMovement.create({
        data: {
          inventory_id: newInventory.inventory_id,
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          movement_type: "PURCHASE_RETURN",
          quantity_in: 0,
          quantity_out: item.quantity,
          balance_after: -item.quantity,
          rate: item.purchase_rate,
          reference_type: "PURCHASE_RETURN",
          reference_id: returnInvoice.invoice_id,
          reference_number: returnInvoice.invoice_number,
          transaction_date: returnInvoice.invoice_date,
          created_by: userId,
          remarks: `Return: ${returnInvoice.return_reason}`,
        },
      });

      await tx.purchaseInvoiceItem.update({
        where: { item_id: item.item_id },
        data: { inventory_id: newInventory.inventory_id },
      });
    } else {
      const newCurrentStock =
        parseFloat(inventory.current_stock) - parseFloat(item.quantity);
      const newAvailableStock =
        parseFloat(inventory.available_stock) - parseFloat(item.quantity);

      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          current_stock: newCurrentStock,
          available_stock: newAvailableStock,
        },
      });

      await tx.stockMovement.create({
        data: {
          inventory_id: inventory.inventory_id,
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          movement_type: "PURCHASE_RETURN",
          quantity_in: 0,
          quantity_out: item.quantity,
          balance_after: newCurrentStock,
          rate: item.purchase_rate,
          reference_type: "PURCHASE_RETURN",
          reference_id: returnInvoice.invoice_id,
          reference_number: returnInvoice.invoice_number,
          transaction_date: returnInvoice.invoice_date,
          created_by: userId,
          remarks: `Return: ${returnInvoice.return_reason}`,
        },
      });

      await tx.purchaseInvoiceItem.update({
        where: { item_id: item.item_id },
        data: { inventory_id: inventory.inventory_id },
      });
    }
  }

  // 2. PAYMENT ADJUSTMENT based on adjustment_type
  const netAmount = Math.abs(parseFloat(returnInvoice.net_amount));

  if (returnInvoice.adjustment_type === "CREDIT_NOTE") {
    const creditNoteNumber = await generateCreditNoteNumber(shopId);

    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await tx.supplierCredit.create({
      data: {
        shop_id: shopId,
        supplier_id: returnInvoice.supplier_id,
        return_invoice_id: returnInvoice.invoice_id,
        credit_note_number: creditNoteNumber,
        credit_amount: netAmount,
        utilized_amount: 0,
        balance_amount: netAmount,
        status: "ACTIVE",
        issued_date: issuedDate,
        expiry_date: expiryDate,
      },
    });

    await tx.purchaseInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        credit_note_number: creditNoteNumber,
        payment_status: "PAID",
      },
    });
  } else if (returnInvoice.adjustment_type === "CASH_REFUND") {
    await tx.purchaseInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        refund_amount: netAmount,
        payment_status: "UNPAID",
      },
    });
  } else if (returnInvoice.adjustment_type === "OFFSET_NEXT_PURCHASE") {
    const creditNoteNumber = await generateCreditNoteNumber(shopId);

    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await tx.supplierCredit.create({
      data: {
        shop_id: shopId,
        supplier_id: returnInvoice.supplier_id,
        return_invoice_id: returnInvoice.invoice_id,
        credit_note_number: creditNoteNumber,
        credit_amount: netAmount,
        utilized_amount: 0,
        balance_amount: netAmount,
        status: "ACTIVE",
        issued_date: issuedDate,
        expiry_date: expiryDate,
      },
    });

    await tx.purchaseInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        credit_note_number: creditNoteNumber,
        payment_status: "PAID",
      },
    });
  }

  // 3. Update parent invoice balance if applicable
  if (
    returnInvoice.parent_invoice_id &&
    returnInvoice.adjustment_type !== "CREDIT_NOTE"
  ) {
    const parentInvoice = await tx.purchaseInvoice.findUnique({
      where: { invoice_id: returnInvoice.parent_invoice_id },
    });

    if (parentInvoice && parentInvoice.payment_status !== "PAID") {
      const newBalance = Math.max(
        0,
        parseFloat(parentInvoice.balance_amount) - netAmount,
      );
      const newPaid = parseFloat(parentInvoice.net_amount) - newBalance;

      const paymentCalc = calculatePaymentStatus(
        newPaid,
        parentInvoice.net_amount,
        PAYMENT_BALANCE_THRESHOLD,
      );

      await tx.purchaseInvoice.update({
        where: { invoice_id: returnInvoice.parent_invoice_id },
        data: {
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
          payment_status: paymentCalc.status,
        },
      });
    }
  }
}
