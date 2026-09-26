// backend/scripts/seedReviewUser.js (do not remove this comment)
// prisma/seedReviewUser.js

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/hash.js";

const prisma = new PrismaClient();

async function main() {
  const reviewPhone = "+911234567890";
  const plainPassword = "123456";

  console.log(`Starting reviewer user database seeding...`);

  // Hash password using the core backend utility logic
  const passwordHash = await hashPassword(plainPassword);

  const reviewer = await prisma.cureliMobileUser.upsert({
    where: {
      phone: reviewPhone,
    },
    update: {
      password_hash: passwordHash,
      phone_verified: true,
      phone_verified_at: new Date(),
      status: "active",
      full_name: "App Store Reviewer",
      profile_complete: true,
      deleted_at: null,
    },
    create: {
      phone: reviewPhone,
      password_hash: passwordHash,
      phone_verified: true,
      phone_verified_at: new Date(),
      status: "active",
      full_name: "App Store Reviewer",
      profile_complete: true,
    },
  });

  console.log(`Reviewer user seeded successfully!`);
  console.log(`- ID: ${reviewer.id}`);
  console.log(`- Phone: ${reviewer.phone}`);
  console.log(`- Status: ${reviewer.status}`);
  console.log(`- Profile Complete: ${reviewer.profile_complete}`);
}

main()
  .catch((e) => {
    console.error("Error seeding reviewer user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });