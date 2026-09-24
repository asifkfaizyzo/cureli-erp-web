// backend/src/modules/purchase/purchase1.service.js

import prisma from "../../config/prisma.js";
import inventoryService from "../inventory/inventory.service.js";
import * as audit from "../audit/index.js";
import { sendMail } from "../../utils/email.js";
import { returnApprovalToSupplier } from "../notifications/templates/email/returnApprovalToSupplier.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  buildBranchFilter,
  calculatePaymentStatus,
  calculateLineItemForDB,
  calculateInvoiceTotals,
  generateCreditNoteNumber,
  generateReturnInvoiceNumber,
} from "./purchase.helpers.js";

// ============================================
// PROCESS APPROVED RETURN
// ============================================

export async function processApprovedReturn(
  tx,
  returnInvoice,
  lineItems,
  userId,
) {
  const shopId = returnInvoice.shop_id;
  const branchId = returnInvoice.branch_id;

  let generatedCreditNoteNumber = null;

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
          expiry_date: new Date(item.expiry_date),
          mrp: item.mrp,
          current_stock: 0,
          available_stock: 0,
          last_purchase_rate: item.purchase_rate,
          last_purchase_date: new Date(returnInvoice.invoice_date),
        },
      });

      await tx.stockLedger.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          inventory_id: newInventory.inventory_id,
          batch_number: item.batch_number,
          expiry_date: new Date(item.expiry_date),
          movement_type: "PURCHASE_RETURN",
          quantity_in: 0,
          quantity_out: parseFloat(item.quantity),
          quantity_net: -parseFloat(item.quantity),
          balance_after: -parseFloat(item.quantity),
          rate: item.purchase_rate,
          reference_type: "PURCHASE_RETURN",
          reference_id: returnInvoice.invoice_id,
          reference_number: returnInvoice.invoice_number,
          transaction_date: new Date(returnInvoice.invoice_date),
          created_by: userId,
          remarks: `Return: ${returnInvoice.return_reason}`,
        },
      });

      await tx.purchaseInvoiceItem.update({
        where: { item_id: item.item_id },
        data: { inventory_id: newInventory.inventory_id },
      });
    } else {
      const currentQty = parseFloat(inventory.current_stock) || 0;
      const returnQty = parseFloat(item.quantity) || 0;
      const newCurrentStock = currentQty - returnQty;
      const newAvailableStock =
        parseFloat(inventory.available_stock || 0) - returnQty;

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
          movement_type: "PURCHASE_RETURN",
          quantity_in: 0,
          quantity_out: returnQty,
          quantity_net: -returnQty,
          balance_after: newCurrentStock,
          rate: item.purchase_rate,
          reference_type: "PURCHASE_RETURN",
          reference_id: returnInvoice.invoice_id,
          reference_number: returnInvoice.invoice_number,
          transaction_date: new Date(returnInvoice.invoice_date),
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
    generatedCreditNoteNumber = await generateCreditNoteNumber(shopId);

    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await tx.supplierCredit.create({
      data: {
        shop_id: shopId,
        supplier_id: returnInvoice.supplier_id,
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

    await tx.purchaseInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        credit_note_number: generatedCreditNoteNumber,
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
    generatedCreditNoteNumber = await generateCreditNoteNumber(shopId);

    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await tx.supplierCredit.create({
      data: {
        shop_id: shopId,
        supplier_id: returnInvoice.supplier_id,
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

    await tx.purchaseInvoice.update({
      where: { invoice_id: returnInvoice.invoice_id },
      data: {
        credit_note_number: generatedCreditNoteNumber,
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

  // 4. SEND EMAIL TO SUPPLIER
  try {
    const supplier = await tx.supplier.findUnique({
      where: { supplier_id: returnInvoice.supplier_id },
      select: { name: true, email: true },
    });

    const shop = await tx.shop.findUnique({
      where: { shop_id: shopId },
      select: { business_name: true, owner_user_id: true },
    });

    const owner = shop?.owner_user_id
      ? await tx.user.findUnique({
          where: { user_id: shop.owner_user_id },
          select: { phone_number: true },
        })
      : null;

    if (supplier && supplier.email) {
      const parentInvoiceData = returnInvoice.parent_invoice_id
        ? await tx.purchaseInvoice.findUnique({
            where: { invoice_id: returnInvoice.parent_invoice_id },
            select: { invoice_number: true },
          })
        : null;

      const itemsWithDetails = await Promise.all(
        lineItems.map(async (item) => {
          const medicine = await tx.medicine.findUnique({
            where: { medicine_id: item.medicine_id },
            select: { name: true, manufacturer: true },
          });

          const qty = parseFloat(item.quantity) || 0;
          const rate = parseFloat(item.purchase_rate) || 0;

          return {
            name: medicine?.name || "Unknown Product",
            manufacturer: medicine?.manufacturer || null,
            batch_number: item.batch_number,
            quantity: qty,
            purchase_rate: rate,
            line_total: item.line_total || qty * rate,
          };
        }),
      );

      const emailData = returnApprovalToSupplier({
        supplierName: supplier.name,
        returnInvoiceNumber: returnInvoice.invoice_number,
        parentInvoiceNumber: parentInvoiceData?.invoice_number || "N/A",
        returnReason: returnInvoice.return_reason,
        returnDate: new Date(returnInvoice.invoice_date).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
        totalAmount: netAmount,
        itemCount: lineItems.length,
        adjustmentType: returnInvoice.adjustment_type,
        creditNoteNumber: generatedCreditNoteNumber,
        refundAmount:
          returnInvoice.adjustment_type === "CASH_REFUND" ? netAmount : null,
        shopName: shop?.business_name || "Shop",
        shopContact: owner?.phone_number || null,
        items: itemsWithDetails,
      });

      setImmediate(async () => {
        try {
          await sendMail(supplier.email, emailData.subject, emailData.html);
        } catch (emailError) {
          console.error(
            `Failed to send return approval email to ${supplier.email}:`,
            emailError.message,
          );
        }
      });
    }
  } catch (error) {
    console.error("⚠️ Error preparing return approval email:", error.message);
  }
}

// ============================================
// UPDATE PURCHASE INVOICE
// ============================================

export async function updatePurchaseInvoice(
  userId,
  shopId,
  branchId,
  role,
  branchMode,
  invoiceId,
  data,
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

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: invoiceId,
      ...baseFilter,
    },
    include: {
      lineItems: true,
      supplier: true,
      returnInvoices: {
        where: {
          is_return: true,
          return_approval_status: "APPROVED",
        },
        select: {
          invoice_id: true,
          invoice_number: true,
          return_reason: true,
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Block editing if approved returns exist
  if (invoice.returnInvoices && invoice.returnInvoices.length > 0) {
    const returnNumbers = invoice.returnInvoices
      .map((r) => r.invoice_number)
      .join(", ");
    const returnReasons = invoice.returnInvoices
      .map((r) => r.return_reason)
      .join(", ");

    const err = new Error(
      `Cannot edit invoice ${invoice.invoice_number} because it has ${invoice.returnInvoices.length} approved return(s): ${returnNumbers}. ` +
        `Reason(s): ${returnReasons}. ` +
        `\n\nTo edit this invoice, you must first cancel the approved returns, or create a new purchase invoice instead.`,
    );
    err.code = "HAS_APPROVED_RETURNS";
    err.statusCode = 400;
    throw err;
  }

  const isConfirmed = invoice.status === "CONFIRMED";
  const isSuperAdmin = user.role === "super_admin";

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cancelled invoices cannot be updated");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  if (isConfirmed && !isSuperAdmin) {
    const err = new Error("Only super admin can edit confirmed invoices");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  if (invoice.status !== "DRAFT" && !isSuperAdmin) {
    const err = new Error("Only draft invoices can be updated");
    err.code = "NOT_DRAFT";
    throw err;
  }

  const { lineItems, paid_amount, payment_mode, ...invoiceData } = data;

  // ═══════════════════════════════════════════════════════════════════════════
  // FIXED: Deduplicate IDs & allow both branch-specific and shop-wide medicines
  // ═══════════════════════════════════════════════════════════════════════════
  if (lineItems && lineItems.length > 0) {
    const medicineIds = lineItems.map((item) => item.medicine_id);
    const uniqueMedicineIds = [...new Set(medicineIds)];

    const medicines = await prisma.medicine.findMany({
      where: {
        medicine_id: { in: uniqueMedicineIds },
        shop_id: shopId,
        ...(invoice.branch_id
          ? {
              OR: [
                { branch_id: invoice.branch_id },
                { branch_id: null },
              ],
            }
          : {}),
        is_active: true,
      },
      select: {
        medicine_id: true,
        name: true,
        branch_id: true,
      },
    });

    if (medicines.length !== uniqueMedicineIds.length) {
      const foundIds = new Set(medicines.map((m) => m.medicine_id));
      const missingIds = uniqueMedicineIds.filter((id) => !foundIds.has(id));

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
            `Please ensure all medicines belong to this invoice's branch.`,
        );
        err.code = "BRANCH_MISMATCH";
        throw err;
      }

      const err = new Error(
        `${missingIds.length} medicine(s) are invalid or not found in this shop.`,
      );
      err.code = "INVALID_MEDICINE";
      throw err;
    }
  }

  // ALL OPERATIONS IN ONE TRANSACTION
  const result = await prisma.$transaction(async (tx) => {
    let updateData = { ...invoiceData };

    if (paid_amount !== undefined && paid_amount !== null) {
      const paidAmt = parseFloat(paid_amount) || 0;
      const netAmt = parseFloat(invoice.net_amount);
      const paymentCalc = calculatePaymentStatus(
        paidAmt,
        netAmt,
        PAYMENT_BALANCE_THRESHOLD,
      );

      updateData = {
        ...updateData,
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode || invoice.payment_mode,
      };
    }

    let updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: updateData,
    });

    if (lineItems && lineItems.length > 0) {
      if (isConfirmed) {
        for (const oldItem of invoice.lineItems) {
          const isFreeItemRow =
            parseFloat(oldItem.line_total) === 0 &&
            parseFloat(oldItem.quantity) > 0;

          if (isFreeItemRow) {
            continue;
          }

          if (oldItem.inventory_id) {
            const purchasedQty = Number(oldItem.quantity) || 0;
            const freeQty = Number(oldItem.free_quantity) || 0;
            const oldTotalQty = purchasedQty + freeQty;

            await inventoryService.updateStock(
              {
                inventoryId: oldItem.inventory_id,
                shopId: shopId,
                branchId: invoice.branch_id,
                medicineId: oldItem.medicine_id,
                batchNumber: oldItem.batch_number,
                movementType: "PURCHASE_RETURN",
                quantityIn: 0,
                quantityOut: oldTotalQty,
                rate: oldItem.purchase_rate,
                referenceType: "PURCHASE_INVOICE_EDIT",
                referenceId: invoice.invoice_id,
                referenceNumber: `${invoice.invoice_number}-REV`,
                transactionDate: new Date(),
                remarks: `Stock reversal for edit (Super Admin) - Original: ${purchasedQty} + ${freeQty} free = ${oldTotalQty}`,
              },
              userId,
              tx,
            );
          }
        }
      }

      // Delete old line items
      await tx.purchaseInvoiceItem.deleteMany({
        where: { invoice_id: invoiceId },
      });

      // Create new line items
      const newItems = await Promise.all(
        lineItems.map((item) => {
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
              invoice_id: invoiceId,
              medicine_id: item.medicine_id,
              batch_number: item.batch_number,
              expiry_date: new Date(item.expiry_date),
              manufacturing_date: item.manufacturing_date
                ? new Date(item.manufacturing_date)
                : null,
              quantity: item.quantity,
              free_quantity: isFreeItem
                ? item.quantity
                : item.free_quantity || 0,
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

      const billableItems = lineItems.filter(
        (item) => item.is_free_item !== true,
      );
      const calculations = calculateInvoiceTotals(
        billableItems.length > 0 ? billableItems : lineItems,
      );

      const paidAmt =
        paid_amount !== undefined && paid_amount !== null
          ? parseFloat(paid_amount)
          : parseFloat(invoice.paid_amount) || 0;

      const newNetAmt = calculations.net_amount;
      const paymentCalc = calculatePaymentStatus(
        paidAmt,
        newNetAmt,
        PAYMENT_BALANCE_THRESHOLD,
      );

      updatedInvoice = await tx.purchaseInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          ...calculations,
          payment_status: paymentCalc.status,
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
        },
      });

      if (isConfirmed) {
        for (const item of newItems) {
          const isFreeItemRow =
            parseFloat(item.line_total) === 0 && parseFloat(item.quantity) > 0;

          if (isFreeItemRow) {
            const existingInventory = await tx.inventory.findFirst({
              where: {
                shop_id: shopId,
                branch_id: invoice.branch_id,
                medicine_id: item.medicine_id,
                batch_number: item.batch_number,
              },
            });

            if (existingInventory) {
              await tx.purchaseInvoiceItem.update({
                where: { item_id: item.item_id },
                data: { inventory_id: existingInventory.inventory_id },
              });
            }
            continue;
          }

          const inventory = await inventoryService.getOrCreateInventory(
            shopId,
            invoice.branch_id,
            item.medicine_id,
            item.batch_number,
            item.expiry_date,
            item.mrp,
          );

          const purchasedQty = Number(item.quantity) || 0;
          const freeQty = Number(item.free_quantity) || 0;
          const totalQuantity = purchasedQty + freeQty;

          await inventoryService.updateStock(
            {
              inventoryId: inventory.inventory_id,
              shopId: shopId,
              branchId: invoice.branch_id,
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
              remarks: `Purchase (edited by super admin): ${purchasedQty} + ${freeQty} free = ${totalQuantity}`,
            },
            userId,
            tx,
          );

          await tx.inventory.update({
            where: { inventory_id: inventory.inventory_id },
            data: {
              last_purchase_rate: item.purchase_rate,
              last_purchase_date: invoice.invoice_date,
              selling_rate: item.selling_rate,
              rack_no: item.rack_no || inventory.rack_no,
            },
          });

          await tx.purchaseInvoiceItem.update({
            where: { item_id: item.item_id },
            data: { inventory_id: inventory.inventory_id },
          });
        }
      }

      return { ...updatedInvoice, lineItems: newItems };
    }

    return updatedInvoice;
  });

  await audit.log({
    action: isConfirmed
      ? audit.AuditAction.PURCHASE_INVOICE_CONFIRMED_EDITED
      : audit.AuditAction.PURCHASE_INVOICE_UPDATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: isConfirmed
      ? audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE
      : audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      invoice_status: invoice.status,
      was_confirmed: isConfirmed,
      updated_fields: Object.keys(data),
      old_item_count: invoice.lineItems?.length || 0,
      new_item_count: lineItems?.length || invoice.lineItems?.length || 0,
      old_net_amount: invoice.net_amount,
      new_net_amount: result.net_amount,
    },
  });

  return result;
}

// ============================================
// CANCEL PURCHASE INVOICE
// ============================================

export async function cancelPurchaseInvoice(
  userId,
  shopId,
  branchId,
  role,
  branchMode,
  invoiceId,
  reason,
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

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: invoiceId,
      ...baseFilter,
    },
    include: { lineItems: true, supplier: true },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Invoice already cancelled");
    err.code = "ALREADY_CANCELLED";
    throw err;
  }

  if (invoice.status === "CONFIRMED") {
    const err = new Error(
      "Cannot cancel confirmed invoice. Create a purchase return instead.",
    );
    err.code = "INVOICE_CONFIRMED";
    throw err;
  }

  const result = await prisma.purchaseInvoice.update({
    where: { invoice_id: invoiceId },
    data: {
      status: "CANCELLED",
      remarks: reason || invoice.remarks,
    },
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CANCELLED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.supplier.name,
      cancellation_reason: reason,
    },
  });

  return result;
}

// ============================================
// UPDATE PAYMENT STATUS (Super Admin Only)
// ============================================

export async function updatePaymentStatus(
  userId,
  shopId,
  branchId,
  role,
  branchMode,
  invoiceId,
  data,
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

  if (user.role !== "super_admin") {
    const err = new Error(
      "Only super admin can change payment status directly",
    );
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: invoiceId,
      ...baseFilter,
    },
    include: { supplier: true },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cannot update payment status of cancelled invoice");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  const { payment_status, paid_amount, payment_mode, remarks } = data;
  const netAmount = parseFloat(invoice.net_amount);

  let newPaidAmount =
    paid_amount !== undefined
      ? parseFloat(paid_amount)
      : parseFloat(invoice.paid_amount);
  let newBalanceAmount = netAmount - newPaidAmount;
  let newPaymentStatus = payment_status;

  if (payment_status === "PAID") {
    newPaidAmount = netAmount;
    newBalanceAmount = 0;
  } else if (payment_status === "UNPAID") {
    newPaidAmount = 0;
    newBalanceAmount = netAmount;
  } else if (payment_status === "PARTIALLY_PAID") {
    if (newPaidAmount <= 0) {
      const err = new Error(
        "Partial payment requires a paid amount greater than 0",
      );
      err.code = "INVALID_AMOUNT";
      throw err;
    }

    if (newBalanceAmount <= PAYMENT_BALANCE_THRESHOLD) {
      newPaymentStatus = "PAID";
      newPaidAmount = netAmount;
      newBalanceAmount = 0;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        payment_status: newPaymentStatus,
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        payment_mode: payment_mode || invoice.payment_mode,
        remarks: remarks || invoice.remarks,
      },
    });

    if (
      payment_status === "PAID" &&
      parseFloat(invoice.paid_amount) < netAmount
    ) {
      const paymentDiff = netAmount - parseFloat(invoice.paid_amount);

      await tx.purchasePayment.create({
        data: {
          invoice_id: invoiceId,
          shop_id: shopId,
          supplier_id: invoice.supplier_id,
          payment_date: new Date(),
          amount: paymentDiff,
          payment_mode: payment_mode || "CASH",
          status: "COMPLETED",
          created_by: userId,
          remarks: remarks || "Payment status updated by Super Admin",
        },
      });
    }

    return updatedInvoice;
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_PAYMENT_STATUS_UPDATED,
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
      supplier_name: invoice.supplier.name,
      old_payment_status: invoice.payment_status,
      new_payment_status: newPaymentStatus,
      old_paid_amount: invoice.paid_amount,
      new_paid_amount: newPaidAmount,
      net_amount: netAmount,
      threshold_applied:
        newPaymentStatus === "PAID" && payment_status === "PARTIALLY_PAID",
    },
  });

  return result;
}

// ============================================
// RECORD PAYMENT
// ============================================

export async function recordPayment(
  userId,
  shopId,
  branchId,
  role,
  branchMode,
  invoiceId,
  data,
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

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: invoiceId,
      ...baseFilter,
    },
    include: { supplier: true },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cannot record payment for cancelled invoice");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  if (invoice.payment_status === "PAID") {
    const err = new Error("Invoice is already fully paid");
    err.code = "ALREADY_PAID";
    throw err;
  }

  const {
    amount,
    payment_mode,
    payment_date,
    reference_number,
    bank_name,
    remarks,
  } = data;
  const paymentAmount = parseFloat(amount);
  const currentPaid = parseFloat(invoice.paid_amount);
  const netAmount = parseFloat(invoice.net_amount);
  const newPaidAmount = currentPaid + paymentAmount;

  if (newPaidAmount > netAmount) {
    const err = new Error(
      `Payment of ₹${paymentAmount} would exceed balance of ₹${invoice.balance_amount}`,
    );
    err.code = "OVERPAYMENT";
    throw err;
  }

  const paymentCalc = calculatePaymentStatus(
    newPaidAmount,
    netAmount,
    PAYMENT_BALANCE_THRESHOLD,
  );

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.purchasePayment.create({
      data: {
        invoice_id: invoiceId,
        shop_id: shopId,
        supplier_id: invoice.supplier_id,
        payment_date: payment_date ? new Date(payment_date) : new Date(),
        amount: paymentAmount,
        payment_mode,
        reference_number: reference_number || null,
        bank_name: bank_name || null,
        status: "COMPLETED",
        created_by: userId,
        remarks: remarks || null,
      },
    });

    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode,
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_PAYMENT_RECORDED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      payment_id: result.payment.payment_id,
      payment_amount: paymentAmount,
      payment_mode,
      old_payment_status: invoice.payment_status,
      new_payment_status: paymentCalc.status,
      total_paid: paymentCalc.paidAmount,
      balance_remaining: paymentCalc.balanceAmount,
      threshold_applied:
        paymentCalc.status === "PAID" && netAmount - newPaidAmount > 0,
    },
  });

  return result;
}

// ============================================
// CREATE PURCHASE RETURN
// ============================================

export async function createPurchaseReturn(
  userId,
  shopId,
  branchId,
  data,
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

  if (!branchId) {
    const err = new Error("Branch selection is required for purchase returns");
    err.code = "BRANCH_REQUIRED";
    throw err;
  }

  const parentInvoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: data.parent_invoice_id,
      shop_id: shopId,
      status: "CONFIRMED",
      is_return: false,
    },
    include: {
      lineItems: true,
      supplier: true,
    },
  });

  if (!parentInvoice) {
    const err = new Error("Parent invoice not found or not confirmed");
    err.code = "INVALID_PARENT";
    throw err;
  }

  if (data.supplier_id !== parentInvoice.supplier_id) {
    const err = new Error("Supplier must match the parent invoice supplier");
    err.code = "SUPPLIER_MISMATCH";
    throw err;
  }

  for (const item of data.lineItems) {
    const parentItem = parentInvoice.lineItems.find(
      (pi) =>
        pi.medicine_id === item.medicine_id &&
        pi.batch_number === item.batch_number,
    );

    if (!parentItem) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
        },
      });

      if (!existingInventory) {
        const err = new Error(
          `Batch ${item.batch_number} for medicine not found in inventory. ` +
            `For returning goods not from this invoice, the batch must exist in inventory.`,
        );
        err.code = "BATCH_NOT_FOUND";
        throw err;
      }
    }
  }

  const returnInvoiceNumber = await generateReturnInvoiceNumber(shopId);
  const calculations = calculateInvoiceTotals(data.lineItems);

  const isSuperAdmin = user.role === "super_admin";
  const approvalStatus = isSuperAdmin ? "APPROVED" : "PENDING_APPROVAL";
  const statusValue = isSuperAdmin ? "CONFIRMED" : "DRAFT";

  const result = await prisma.$transaction(async (tx) => {
    const returnInvoice = await tx.purchaseInvoice.create({
      data: {
        invoice_number: returnInvoiceNumber,
        shop_id: shopId,
        branch_id: branchId,
        supplier_id: data.supplier_id,
        is_return: true,
        parent_invoice_id: data.parent_invoice_id,
        return_reason: data.return_reason,
        return_reason_notes: data.return_reason_notes || null,
        adjustment_type: data.adjustment_type,
        refund_amount:
          data.adjustment_type === "CASH_REFUND"
            ? calculations.net_amount
            : null,
        refund_notes: data.refund_notes || null,
        return_approval_status: approvalStatus,
        ...(isSuperAdmin && {
          approved_by: userId,
          approved_at: new Date(),
        }),
        invoice_date: new Date(data.invoice_date),
        created_by: userId,
        subtotal: calculations.subtotal,
        discount_amount: calculations.discount_amount,
        taxable_amount: calculations.taxable_amount,
        cgst_amount: calculations.cgst_amount,
        sgst_amount: calculations.sgst_amount,
        igst_amount: calculations.igst_amount || 0,
        total_tax: calculations.total_tax,
        round_off: calculations.round_off,
        net_amount: calculations.net_amount,
        balance_amount: calculations.net_amount,
        status: statusValue,
        payment_status: "UNPAID",
        remarks: data.remarks || null,
      },
    });

    const items = await Promise.all(
      data.lineItems.map((item) => {
        const itemCalc = calculateLineItemForDB(item);

        return tx.purchaseInvoiceItem.create({
          data: {
            invoice_id: returnInvoice.invoice_id,
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: new Date(item.expiry_date),
            manufacturing_date: null,
            quantity: item.quantity,
            free_quantity: 0,
            pack_size: null,
            unit_of_measure: "UNIT",
            purchase_rate: item.purchase_rate,
            mrp: item.mrp,
            scheme_discount: 0,
            trade_discount: 0,
            cgst_percent: item.cgst_percent || 0,
            sgst_percent: item.sgst_percent || 0,
            igst_percent: 0,
            discount_amount: itemCalc.discount_amount,
            taxable_amount: itemCalc.taxable_amount,
            cgst_amount: itemCalc.cgst_amount,
            sgst_amount: itemCalc.sgst_amount,
            igst_amount: itemCalc.igst_amount || 0,
            line_total: itemCalc.line_total,
          },
        });
      }),
    );

    if (isSuperAdmin) {
      await processApprovedReturn(tx, returnInvoice, items, userId);
    }

    return { ...returnInvoice, lineItems: items };
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_RETURN_CREATED,
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
      parent_invoice: parentInvoice.invoice_number,
      supplier_name: parentInvoice.supplier.name,
      return_reason: data.return_reason,
      adjustment_type: data.adjustment_type,
      item_count: data.lineItems.length,
      total_amount: result.net_amount,
      approval_status: approvalStatus,
      auto_approved: isSuperAdmin,
    },
  });

  return result;
}

// ============================================
// APPROVE/REJECT RETURN
// ============================================

export async function approveOrRejectReturn(
  userId,
  shopId,
  branchId,
  returnInvoiceId,
  data,
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

  if (user.role !== "super_admin") {
    const err = new Error("Only super admin can approve/reject returns");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const returnInvoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: returnInvoiceId,
      shop_id: shopId,
      is_return: true,
      return_approval_status: "PENDING_APPROVAL",
    },
    include: {
      lineItems: true,
      supplier: true,
      parentInvoice: true,
    },
  });

  if (!returnInvoice) {
    const err = new Error("Return invoice not found or already processed");
    err.code = "NOT_FOUND";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    if (data.action === "APPROVE") {
      const updated = await tx.purchaseInvoice.update({
        where: { invoice_id: returnInvoiceId },
        data: {
          return_approval_status: "APPROVED",
          approved_by: userId,
          approved_at: new Date(),
          status: "CONFIRMED",
        },
      });

      await processApprovedReturn(tx, updated, returnInvoice.lineItems, userId);

      return updated;
    } else {
      return await tx.purchaseInvoice.update({
        where: { invoice_id: returnInvoiceId },
        data: {
          return_approval_status: "REJECTED",
          rejected_by: userId,
          rejected_at: new Date(),
          rejection_reason: data.rejection_reason || "Rejected by Super Admin",
          status: "CANCELLED",
        },
      });
    }
  });

  await audit.log({
    action:
      data.action === "APPROVE"
        ? audit.AuditAction.PURCHASE_RETURN_APPROVED
        : audit.AuditAction.PURCHASE_RETURN_REJECTED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: returnInvoiceId,
    shop_id: shopId,
    branch_id: returnInvoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
    metadata: {
      invoice_number: returnInvoice.invoice_number,
      parent_invoice: returnInvoice.parentInvoice?.invoice_number,
      supplier_name: returnInvoice.supplier.name,
      return_reason: returnInvoice.return_reason,
      action: data.action,
      rejection_reason: data.rejection_reason,
      total_amount: returnInvoice.net_amount,
    },
  });

  return result;
}

// ============================================
// GET PURCHASE RETURNS
// ============================================

export async function getPurchaseReturns(
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
    approvalStatus,
    limit = 50,
    offset = 0,
  } = filters;

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    is_return: true,
    ...(supplierId && { supplier_id: supplierId }),
    ...(approvalStatus && { return_approval_status: approvalStatus }),
    ...(startDate &&
      endDate && {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
  };

  const [returns, total] = await Promise.all([
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
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
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
        lineItems: {
          select: {
            item_id: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  const transformedReturns = returns.map((ret) => ({
    ...ret,
    _count: {
      lineItems: ret.lineItems?.length || 0,
    },
    lineItems: undefined,
  }));

  return { returns: transformedReturns, total };
}

// ============================================
// GET SUPPLIER CREDITS
// ============================================

export async function getSupplierCredits(shopId, filters = {}) {
  const {
    supplierId,
    status,
    includeExpired = false,
    limit = 50,
    offset = 0,
  } = filters;

  const where = {
    shop_id: shopId,
    ...(supplierId && { supplier_id: supplierId }),
    ...(status && { status }),
    ...(!includeExpired && {
      OR: [
        { status: { not: "EXPIRED" } },
        { expiry_date: { gte: new Date() } },
      ],
    }),
  };

  const [credits, total] = await Promise.all([
    prisma.supplierCredit.findMany({
      where,
      include: {
        supplier: {
          select: {
            supplier_id: true,
            name: true,
            supplier_code: true,
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
    prisma.supplierCredit.count({ where }),
  ]);

  return { credits, total };
}

// ============================================
// APPLY CREDIT NOTE TO INVOICE
// ============================================

export async function applyCreditNote(userId, shopId, data, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (user.role !== "super_admin") {
    const err = new Error("Only super admin can apply credit notes");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const credit = await prisma.supplierCredit.findFirst({
    where: {
      credit_id: data.credit_id,
      shop_id: shopId,
      status: "ACTIVE",
    },
    include: {
      supplier: true,
    },
  });

  if (!credit) {
    const err = new Error("Credit note not found or not active");
    err.code = "CREDIT_NOT_FOUND";
    throw err;
  }

  if (new Date(credit.expiry_date) < new Date()) {
    const err = new Error("Credit note has expired");
    err.code = "CREDIT_EXPIRED";
    throw err;
  }

  const availableBalance = parseFloat(credit.balance_amount);
  const appliedAmount = parseFloat(data.applied_amount);

  if (appliedAmount > availableBalance) {
    const err = new Error(
      `Insufficient credit balance. Available: ₹${availableBalance.toFixed(2)}`,
    );
    err.code = "INSUFFICIENT_CREDIT";
    throw err;
  }

  const targetInvoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: data.applied_to_invoice_id,
      shop_id: shopId,
      supplier_id: credit.supplier_id,
      is_return: false,
      status: "CONFIRMED",
      payment_status: { not: "PAID" },
    },
  });

  if (!targetInvoice) {
    const err = new Error(
      "Target invoice not found, not confirmed, or already fully paid",
    );
    err.code = "INVALID_TARGET_INVOICE";
    throw err;
  }

  const invoiceBalance = parseFloat(targetInvoice.balance_amount);
  if (appliedAmount > invoiceBalance) {
    const err = new Error(
      `Applied amount exceeds invoice balance. Invoice balance: ₹${invoiceBalance.toFixed(2)}`,
    );
    err.code = "EXCEEDS_INVOICE_BALANCE";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.creditApplication.create({
      data: {
        credit_id: data.credit_id,
        applied_to_invoice_id: data.applied_to_invoice_id,
        applied_amount: appliedAmount,
        applied_date: new Date(),
        applied_by: userId,
        notes: data.notes || null,
      },
    });

    const newBalance = availableBalance - appliedAmount;
    const newUtilized = parseFloat(credit.utilized_amount) + appliedAmount;
    const newStatus = newBalance <= 0 ? "FULLY_UTILIZED" : "ACTIVE";

    await tx.supplierCredit.update({
      where: { credit_id: data.credit_id },
      data: {
        utilized_amount: newUtilized,
        balance_amount: newBalance,
        status: newStatus,
      },
    });

    const newPaidAmount = parseFloat(targetInvoice.paid_amount) + appliedAmount;
    const paymentCalc = calculatePaymentStatus(
      newPaidAmount,
      targetInvoice.net_amount,
      PAYMENT_BALANCE_THRESHOLD,
    );

    await tx.purchaseInvoice.update({
      where: { invoice_id: data.applied_to_invoice_id },
      data: {
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_status: paymentCalc.status,
      },
    });

    await tx.purchasePayment.create({
      data: {
        invoice_id: data.applied_to_invoice_id,
        shop_id: shopId,
        supplier_id: credit.supplier_id,
        payment_date: new Date(),
        amount: appliedAmount,
        payment_mode: "CREDIT",
        reference_number: credit.credit_note_number,
        status: "COMPLETED",
        created_by: userId,
        remarks: `Credit note ${credit.credit_note_number} applied`,
      },
    });

    return application;
  });

  await audit.log({
    action: audit.AuditAction.CREDIT_NOTE_APPLIED,
    entity_type: audit.EntityType.SUPPLIER_CREDIT,
    entity_id: data.credit_id,
    shop_id: shopId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
    metadata: {
      credit_note_number: credit.credit_note_number,
      supplier_name: credit.supplier.name,
      applied_to_invoice: targetInvoice.invoice_number,
      applied_amount: appliedAmount,
      remaining_balance: parseFloat(credit.balance_amount) - appliedAmount,
    },
  });

  return result;
}

// ============================================
// CHECK AND EXPIRE OLD CREDIT NOTES
// ============================================

export async function expireOldCreditNotes() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.supplierCredit.updateMany({
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

// ============================================
// GET RETURN INVOICE DETAILS
// ============================================

export async function getReturnDetails(
  invoiceId,
  shopId,
  branchId,
  role,
  branchMode,
) {
  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const returnInvoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: invoiceId,
      ...baseFilter,
      is_return: true,
    },
    include: {
      supplier: {
        select: {
          supplier_id: true,
          name: true,
          supplier_code: true,
          contact_person: true,
          office_phone: true,
          email: true,
          address_line_1: true,
          city: true,
          state: true,
          gst_number: true,
        },
      },
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          branch_type: true,
        },
      },
      parentInvoice: {
        select: {
          invoice_id: true,
          invoice_number: true,
          invoice_date: true,
          net_amount: true,
          status: true,
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
              hsn_code: true,
            },
          },
          inventory: {
            select: {
              inventory_id: true,
              current_stock: true,
            },
          },
        },
        orderBy: { created_at: "asc" },
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
          email: true,
        },
      },
      rejecter: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
      supplierCredits: {
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
    const err = new Error("Return invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  return returnInvoice;
}

// ============================================
// CANCEL APPROVED RETURN
// ============================================

export async function cancelApprovedReturn(
  userId,
  shopId,
  branchId,
  returnId,
  data,
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

  if (user.role !== "super_admin") {
    const err = new Error("Only super admin can cancel approved returns");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const returnInvoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: returnId,
      shop_id: shopId,
      is_return: true,
    },
    include: {
      lineItems: true,
      supplier: true,
      parentInvoice: true,
      supplierCredits: {
        where: { status: { not: "CANCELLED" } },
      },
    },
  });

  if (!returnInvoice) {
    const err = new Error("Return invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (returnInvoice.return_approval_status !== "APPROVED") {
    const err = new Error(
      `Cannot cancel return with status: ${returnInvoice.return_approval_status}. Only APPROVED returns can be cancelled.`,
    );
    err.code = "INVALID_STATUS";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. REVERSE STOCK DEDUCTION (Add stock back)
    for (const item of returnInvoice.lineItems) {
      const inventory = await tx.inventory.findFirst({
        where: {
          shop_id: shopId,
          branch_id: returnInvoice.branch_id,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
        },
      });

      if (inventory) {
        const returnQty = parseFloat(item.quantity) || 0;
        const newCurrentStock = parseFloat(inventory.current_stock) + returnQty;
        const newAvailableStock =
          parseFloat(inventory.available_stock) + returnQty;

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
            branch_id: returnInvoice.branch_id,
            medicine_id: item.medicine_id,
            inventory_id: inventory.inventory_id,
            batch_number: item.batch_number,
            expiry_date: new Date(item.expiry_date),
            movement_type: "PURCHASE",
            quantity_in: returnQty,
            quantity_out: 0,
            quantity_net: returnQty,
            balance_after: newCurrentStock,
            rate: item.purchase_rate,
            reference_type: "RETURN_CANCELLATION",
            reference_id: returnInvoice.invoice_id,
            reference_number: `${returnInvoice.invoice_number}-CANCELLED`,
            transaction_date: new Date(),
            created_by: userId,
            remarks: `Stock restored due to return cancellation: ${data.cancellation_reason}`,
          },
        });
      }
    }

    // 2. MARK CREDIT NOTE AS CANCELLED
    if (returnInvoice.supplierCredits.length > 0) {
      for (const credit of returnInvoice.supplierCredits) {
        await tx.supplierCredit.update({
          where: { credit_id: credit.credit_id },
          data: { status: "CANCELLED" },
        });
      }
    }

    // 3. REVERSE PARENT INVOICE ADJUSTMENT
    if (
      returnInvoice.parent_invoice_id &&
      returnInvoice.adjustment_type !== "CREDIT_NOTE"
    ) {
      const parentInvoice = await tx.purchaseInvoice.findUnique({
        where: { invoice_id: returnInvoice.parent_invoice_id },
      });

      if (parentInvoice) {
        const netAmount = Math.abs(parseFloat(returnInvoice.net_amount));
        const newBalance = parseFloat(parentInvoice.balance_amount) + netAmount;
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

    // 4. UPDATE RETURN INVOICE STATUS
    const updatedReturn = await tx.purchaseInvoice.update({
      where: { invoice_id: returnId },
      data: {
        return_approval_status: "CANCELLED",
        status: "CANCELLED",
        remarks:
          `CANCELLED: ${data.cancellation_reason}\n\n${returnInvoice.remarks || ""}`.trim(),
      },
    });

    return updatedReturn;
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_RETURN_CANCELLED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: returnId,
    shop_id: shopId,
    branch_id: returnInvoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
    metadata: {
      invoice_number: returnInvoice.invoice_number,
      parent_invoice: returnInvoice.parentInvoice?.invoice_number,
      supplier_name: returnInvoice.supplier.name,
      cancellation_reason: data.cancellation_reason,
      refund_action: data.refund_action,
      total_amount: returnInvoice.net_amount,
      credit_notes_cancelled: returnInvoice.supplierCredits.length,
    },
  });

  return result;
}

// ============================================
// REVERT RETURN TO PENDING
// ============================================

export async function revertReturnToPending(
  userId,
  shopId,
  branchId,
  returnId,
  data,
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

  if (user.role !== "super_admin") {
    const err = new Error("Only super admin can revert returns");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const returnInvoice = await prisma.purchaseInvoice.findFirst({
    where: {
      invoice_id: returnId,
      shop_id: shopId,
      is_return: true,
    },
    include: {
      lineItems: true,
      supplier: true,
      parentInvoice: true,
      supplierCredits: {
        where: { status: { not: "CANCELLED" } },
      },
    },
  });

  if (!returnInvoice) {
    const err = new Error("Return invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (returnInvoice.return_approval_status !== "APPROVED") {
    const err = new Error(
      `Cannot revert return with status: ${returnInvoice.return_approval_status}. Only APPROVED returns can be reverted.`,
    );
    err.code = "INVALID_STATUS";
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. ADD STOCK BACK
    for (const item of returnInvoice.lineItems) {
      const inventory = await tx.inventory.findFirst({
        where: {
          shop_id: shopId,
          branch_id: returnInvoice.branch_id,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
        },
      });

      if (inventory) {
        const returnQty = parseFloat(item.quantity) || 0;
        const newCurrentStock = parseFloat(inventory.current_stock) + returnQty;
        const newAvailableStock =
          parseFloat(inventory.available_stock) + returnQty;

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
            branch_id: returnInvoice.branch_id,
            medicine_id: item.medicine_id,
            inventory_id: inventory.inventory_id,
            batch_number: item.batch_number,
            expiry_date: new Date(item.expiry_date),
            movement_type: "PURCHASE",
            quantity_in: returnQty,
            quantity_out: 0,
            quantity_net: returnQty,
            balance_after: newCurrentStock,
            rate: item.purchase_rate,
            reference_type: "RETURN_REVERT",
            reference_id: returnInvoice.invoice_id,
            reference_number: `${returnInvoice.invoice_number}-REVERTED`,
            transaction_date: new Date(),
            created_by: userId,
            remarks: `Stock restored temporarily due to return revert: ${data.revert_reason}`,
          },
        });
      }
    }

    // 2. CANCEL CREDIT NOTES
    if (returnInvoice.supplierCredits.length > 0) {
      for (const credit of returnInvoice.supplierCredits) {
        await tx.supplierCredit.update({
          where: { credit_id: credit.credit_id },
          data: { status: "CANCELLED" },
        });
      }
    }

    // 3. REVERSE PARENT INVOICE ADJUSTMENT
    if (
      returnInvoice.parent_invoice_id &&
      returnInvoice.adjustment_type !== "CREDIT_NOTE"
    ) {
      const parentInvoice = await tx.purchaseInvoice.findUnique({
        where: { invoice_id: returnInvoice.parent_invoice_id },
      });

      if (parentInvoice) {
        const netAmount = Math.abs(parseFloat(returnInvoice.net_amount));
        const newBalance = parseFloat(parentInvoice.balance_amount) + netAmount;
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

    // 4. UPDATE RETURN STATUS TO PENDING
    const updatedReturn = await tx.purchaseInvoice.update({
      where: { invoice_id: returnId },
      data: {
        return_approval_status: "PENDING_APPROVAL",
        status: "DRAFT",
        approved_by: null,
        approved_at: null,
        credit_note_number: null,
        refund_amount:
          returnInvoice.adjustment_type === "CASH_REFUND"
            ? Math.abs(parseFloat(returnInvoice.net_amount))
            : null,
        remarks:
          `REVERTED TO PENDING: ${data.revert_reason}\n\n${returnInvoice.remarks || ""}`.trim(),
      },
    });

    return updatedReturn;
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_RETURN_REVERTED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: returnId,
    shop_id: shopId,
    branch_id: returnInvoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
    metadata: {
      invoice_number: returnInvoice.invoice_number,
      parent_invoice: returnInvoice.parentInvoice?.invoice_number,
      supplier_name: returnInvoice.supplier.name,
      revert_reason: data.revert_reason,
      total_amount: returnInvoice.net_amount,
      credit_notes_cancelled: returnInvoice.supplierCredits.length,
    },
  });

  return result;
}