// backend/scripts/backfill-selling-rate.js (do not remove this comment)
// backend/scripts/backfill-selling-rate.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillSellingRate() {
  try {
    console.log("🔄 Starting backfill of selling_rate...");

    // Update all items where selling_rate is null
    const result = await prisma.salesInvoiceItem.updateMany({
      where: {
        selling_rate: null,
      },
      data: {
        // Copy MRP to selling_rate for historical invoices
        // @ts-ignore - Prisma doesn't support field-to-field copy in updateMany
      },
    });

    // Alternative: Use raw SQL for better control
    const updated = await prisma.$executeRaw`
      UPDATE sales_invoice_items 
      SET selling_rate = mrp 
      WHERE selling_rate IS NULL
    `;

    console.log(` Updated ${updated} rows`);
    console.log(" Backfill complete!");
  } catch (error) {
    console.error(" Backfill failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillSellingRate();
