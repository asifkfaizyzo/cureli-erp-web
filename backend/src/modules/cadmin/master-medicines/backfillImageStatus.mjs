// backend/src/modules/cadmin/master-medicines/backfillImageStatus.mjs (do not remove this comment)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function backfill() {
  console.log('Starting image_status backfill...\n');

  // Step 1: Set all to NONE first (migration already does this via default,
  // but being explicit in case some rows exist with null)
  console.log('Setting all to NONE...');
  await prisma.$executeRaw`
    UPDATE master_medicines
    SET image_status = 'NONE'
    WHERE is_active = true
  `;

  // Step 2: Set VERIFIED — has at least one UPLOADED image
  console.log('Setting VERIFIED...');
  const verifiedResult = await prisma.$executeRaw`
    UPDATE master_medicines m
    SET image_status = 'VERIFIED'
    WHERE m.is_active = true
      AND EXISTS (
        SELECT 1 FROM master_medicine_images i
        WHERE i.master_medicine_id = m.master_medicine_id
          AND i.source = 'UPLOADED'
      )
  `;
  console.log(`  VERIFIED rows updated: ${verifiedResult}`);

  // Step 3: Set RAW — has images but none are UPLOADED
  console.log('Setting RAW...');
  const rawResult = await prisma.$executeRaw`
    UPDATE master_medicines m
    SET image_status = 'RAW'
    WHERE m.is_active = true
      AND image_status = 'NONE'
      AND EXISTS (
        SELECT 1 FROM master_medicine_images i
        WHERE i.master_medicine_id = m.master_medicine_id
      )
  `;
  console.log(`  RAW rows updated: ${rawResult}`);

  // Verify counts
  const counts = await prisma.$queryRaw`
    SELECT image_status, COUNT(*)::int as count
    FROM master_medicines
    WHERE is_active = true
    GROUP BY image_status
    ORDER BY image_status
  `;

  console.log('\nFinal counts:');
  for (const row of counts) {
    console.log(`  ${row.image_status}: ${row.count}`);
  }

  console.log('\nBackfill complete.');
  await prisma.$disconnect();
}

backfill().catch(console.error);