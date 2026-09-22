// backend/src/modules/mobile/invoice/invoice.service.js

import prisma from "../../../config/prisma.js";
import s3Client, { S3_BUCKET } from "../../../config/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { buildInvoiceHtml } from "./invoice.html.js";
import { htmlToPdf } from "./invoice.generator.js";
import { getSignedUrl } from "../../../services/fileStorage.service.js";

// Import Notification Module structures
import { notify } from "../../notifications/notification.service.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";

const INVOICE_FOLDER = "order_invoices";

/**
 * Generate, upload, and link the 2-page marketplace invoice PDF.
 * Called fire-and-forget after a marketplace sale is confirmed.
 *
 * @param {string} marketplace_order_id
 * @param {string} sales_invoice_id
 */
export async function generateMarketplaceInvoice(
  marketplace_order_id,
  sales_invoice_id,
) {
  console.log(`[Invoice] Generating PDF for order ${marketplace_order_id}`);

  // ── 1. Fetch all data needed for the template ────────────
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id: marketplace_order_id },
    include: {
      shop: {
        select: {
          business_name: true,
          legal_name: true,
          gst_number: true,
        },
      },
      branch: {
        select: {
          branch_name: true,
          address_line_1: true,
          city: true,
          state: true,
          pincode: true,
          contact_number: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const invoice = await prisma.salesInvoice.findUnique({
    where: { invoice_id: sales_invoice_id },
    include: {
      lineItems: {
        include: {
          medicine: {
            select: {
              name: true,
              manufacturer: true,
              hsn_code: true,
            },
          },
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!invoice) throw new Error("Sales invoice not found");

  // ── 2. Build GST summary ─────────────────────────────────
  const gstSummary = {};
  const items = invoice.lineItems.map((item) => {
    const cgst = Number(item.cgst_percent || 0);
    const sgst = Number(item.sgst_percent || 0);
    const rate = cgst + sgst;
    const key = rate.toFixed(0);

    if (!gstSummary[key]) gstSummary[key] = { taxable: 0, cgst: 0, sgst: 0 };
    gstSummary[key].taxable += Number(item.taxable_amount || 0);
    gstSummary[key].grid_cgst = (gstSummary[key].cgst += Number(item.cgst_amount || 0));
    gstSummary[key].sgst += Number(item.sgst_amount || 0);

    let expiryDisplay = "—";
    if (item.expiry_date) {
      const d = new Date(item.expiry_date);
      expiryDisplay = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    }

    return {
      medicine_name: item.medicine?.name || "",
      manufacturer: item.medicine?.manufacturer || "",
      hsn_code: item.medicine?.hsn_code || "",
      batch_number: item.batch_number || "",
      expiry_display: expiryDisplay,
      quantity: Number(item.quantity),
      mrp: Number(item.mrp || 0),
      selling_rate: Number(item.selling_rate || item.mrp || 0),
      discount_percent: Number(item.discount_percent || 0),
      taxable_amount: Number(item.taxable_amount || 0),
      cgst_percent: cgst,
      sgst_percent: sgst,
      cgst_amount: Number(item.cgst_amount || 0),
      sgst_amount: Number(item.sgst_amount || 0),
      line_total: Number(item.line_total || 0),
    };
  });

  // ── 3. Generate HTML and PDF ─────────────────────────────
  const html = buildInvoiceHtml({
    shop: order.shop,
    branch: order.branch,
    order,
    invoice,
    items,
    gstSummary,
  });

  const pdfBuffer = await htmlToPdf(html);

  // ── 4. Upload to S3 ──────────────────────────────────────
  const storageKey = `${order.order_number}.pdf`;
  const s3Key = `${INVOICE_FOLDER}/${storageKey}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ContentDisposition: `inline; filename="${order.order_number}-invoice.pdf"`,
    }),
  );

  // ── 5. Update MarketplaceOrder with PDF key ──────────────
  await prisma.marketplaceOrder.update({
    where: { order_id: marketplace_order_id },
    data: {
      invoice_pdf_key: storageKey,
      invoice_generated_at: new Date(),
    },
  });

  console.log(`[Invoice] PDF generated and stored: ${s3Key}`);

  // ── 6. Email to customer (Refactored to Notification Engine) ──
  try {
    const customer = await prisma.cureliMobileUser.findUnique({
      where: { id: order.customer_id },
      select: { email: true, full_name: true },
    });

    if (customer?.email) {
      // Generate a signed S3 URL for secure download link (valid for 7 days in the email body)
      const signedDownloadUrl = await getSignedUrl({
        folder: INVOICE_FOLDER,
        filename: storageKey,
        expiresIn: 604800, // 7 days (604800 seconds)
      });

      // Dispatch delivery via Notification System, passing S3 download URL & the PDF buffer
      await notify({
        type: NOTIFICATION_EVENTS.MARKETPLACE_ORDER_BILLED,
        audience: [
          {
            email: customer.email,
            name: customer.full_name || "Valued Customer",
          },
        ],
        context: {
          orderNumber: order.order_number,
          pharmacyName: order.shop?.business_name || "Cureli Partner Pharmacy",
          grandTotal: Number(invoice.grand_total || 0),
          orderDate: order.created_at,
          invoiceUrl: signedDownloadUrl,
          attachments: [
            {
              filename: `${order.order_number}-invoice.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        },
      });

      console.log(`[Invoice] Delivery notification dispatched successfully for ${customer.email}`);
    }
  } catch (emailErr) {
    console.error("[Invoice] Refactored email dispatch failed (non-fatal):", emailErr.message);
  }

  return { storageKey };
}

/**
 * Get a signed download URL for a marketplace order invoice.
 *
 * @param {string} order_id
 * @param {string} accessor_type - 'customer' | 'pharmacy'
 * @param {string} accessor_id  - customer_id or shop_id
 */
export async function getInvoiceDownloadUrl(
  order_id,
  accessor_type,
  accessor_id,
) {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_id },
    select: {
      order_id: true,
      shop_id: true,
      customer_id: true,
      invoice_pdf_key: true,
    },
  });

  if (!order) throw new Error("Order not found");

  // Access control
  if (accessor_type === "customer" && order.customer_id !== accessor_id) {
    throw new Error("Order not found");
  }
  if (accessor_type === "pharmacy" && order.shop_id !== accessor_id) {
    throw new Error("Order not found");
  }

  if (!order.invoice_pdf_key) {
    // Check if a sales invoice exists — if so, PDF is still generating
    const fullOrder = await prisma.marketplaceOrder.findUnique({
      where: { order_id },
      select: { sales_invoice_id: true },
    });

    if (fullOrder?.sales_invoice_id) {
      return { url: null, pending: true, expires_in: 0 };
    }

    throw new Error("Invoice not yet generated");
  }

  const url = await getSignedUrl({
    folder: INVOICE_FOLDER,
    filename: order.invoice_pdf_key,
    expiresIn: 900, // 15 minutes
  });

  return { url, expires_in: 900 };
}