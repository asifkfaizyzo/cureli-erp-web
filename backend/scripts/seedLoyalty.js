// backend/scripts/seedLoyalty.js (do not remove this comment)
// backend/scripts/seedLoyalty.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for default Loyalty Config...");
  
  const existing = await prisma.loyaltyConfig.findFirst();
  
  if (existing) {
    console.log(`Loyalty Config already initialized (ID: ${existing.config_id}, Version: ${existing.version}).`);
    return;
  }

  console.log("Initializing Loyalty Config with default values...");
  const seeded = await prisma.loyaltyConfig.create({
    data: {
      is_enabled: false,
      earn_rate_amount: 100, // ₹100 subtotal = 1 point
      earn_basis: "SUBTOTAL",
      redemption_value: 1,   // 1 point = ₹1
      min_redeem_points: 50,
      min_order_amount: 299,
      max_redeem_points: null,
      max_redeem_percent: null,
      points_expiry_days: null, // never expire by default
    },
  });

  console.log(`Successfully seeded default Loyalty Config (ID: ${seeded.config_id}).`);
}

main()
  .catch((e) => {
    console.error("Failed to seed Loyalty Config:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });