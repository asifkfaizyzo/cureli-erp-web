// backend/prisma/seed.prod.js (do not remove this comment)
// prisma/seed.prod.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const uuid = () => randomUUID();

async function main() {
  console.log("🌱 Starting PRODUCTION CAdmin bootstrap...\n");

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDATE REQUIRED ENV VARS
  // ─────────────────────────────────────────────────────────────────────────
  const required = [
    "CADMIN_DEFAULT_PASSWORD",
    "CADMIN_DEFAULT_USERNAME",
    "CADMIN_DEFAULT_EMAIL",
    "CADMIN_DEFAULT_PHONE",
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(` ${key} must be set in production environment`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK IF SUPER_CADMIN ALREADY EXISTS
  // This seed is idempotent — safe to run multiple times
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🔍 Checking for existing Super Admin...");

  const existing = await prisma.cAdmin.findFirst({
    where: { is_super_cadmin: true },
  });

  if (existing) {
    console.log(" Super Admin already exists. Skipping bootstrap.");
    console.log(`   Username: ${existing.username}`);
    console.log(`   Email:    ${existing.email}`);
    console.log("\n⚠️  No changes made to database.");
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE SUPER CADMIN
  // ─────────────────────────────────────────────────────────────────────────
  console.log("👑 Creating Super Admin...\n");

  const superCadmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: process.env.CADMIN_DEFAULT_NAME || "Super Admin",
      username: process.env.CADMIN_DEFAULT_USERNAME,
      email: process.env.CADMIN_DEFAULT_EMAIL,
      phone_number: process.env.CADMIN_DEFAULT_PHONE,
      password_hash: await bcrypt.hash(process.env.CADMIN_DEFAULT_PASSWORD, 10),
      is_active: true,
      is_super_cadmin: true,
      // No role assignments — super admin is outside the custom role system
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("═".repeat(60));
  console.log("🎉 PRODUCTION BOOTSTRAP COMPLETED!");
  console.log("═".repeat(60));
  console.log("\n👑 SUPER ADMIN CREATED:\n");
  console.log(`   Username: ${superCadmin.username}`);
  console.log(`   Email:    ${superCadmin.email}`);
  console.log(`   Phone:    ${superCadmin.phone_number}`);
  console.log(
    "\n⚠️  Keep credentials secure. Change password after first login.",
  );
  console.log("⚠️  Create additional admin roles via the Admin Management UI.");
  console.log("\n" + "═".repeat(60));
}

main()
  .catch((e) => {
    console.error(" Bootstrap failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
