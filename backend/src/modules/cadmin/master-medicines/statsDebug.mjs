// backend/src/modules/cadmin/master-medicines/statsDebug.mjs (do not remove this comment)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runDiagnostics() {
  console.log('Starting diagnostics...\n');

  const t = async (label, fn) => {
    const start = Date.now();
    await fn();
    console.log(`${label}: ${Date.now() - start}ms`);
  };

  await t('1. totalMasters', () =>
    prisma.masterMedicine.count({ where: { is_active: true } })
  );

  await t('2. totalVariants', () =>
    prisma.masterMedicineVariant.count()
  );

  await t('3. totalImages', () =>
    prisma.masterMedicineImage.count()
  );

  await t('4. drugCount', () =>
    prisma.masterMedicine.count({ where: { is_active: true, type: 'DRUG' } })
  );

  await t('5. otcCount', () =>
    prisma.masterMedicine.count({ where: { is_active: true, type: 'OTC' } })
  );

  await t('6. categoryCounts (groupBy)', () =>
    prisma.masterMedicine.groupBy({
      by: ['primary_category'],
      where: { is_active: true, primary_category: { not: null } },
      _count: { primary_category: true },
      orderBy: { _count: { primary_category: 'desc' } },
      take: 10,
    })
  );

  await t('7. formCounts (groupBy)', () =>
    prisma.masterMedicine.groupBy({
      by: ['form'],
      where: { is_active: true, form: { not: null } },
      _count: { form: true },
      orderBy: { _count: { form: 'desc' } },
      take: 10,
    })
  );

  await t('8. multiVariantCount', () =>
    prisma.masterMedicine.count({
      where: { is_active: true, variant_count: { gt: 1 } },
    })
  );

  await t('9. prescriptionRequiredCount', () =>
    prisma.masterMedicine.count({
      where: { is_active: true, prescription_required: true },
    })
  );

  await t('10. recentlyAdded', () =>
    prisma.masterMedicine.count({
      where: {
        is_active: true,
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    })
  );

  await t('11. imageStatusCounts (raw SQL)', () =>
    prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM master_medicine_images i
            WHERE i.master_medicine_id = m.master_medicine_id
              AND i.source = 'UPLOADED'
          )
        )::int AS verified,

        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM master_medicine_images i
            WHERE i.master_medicine_id = m.master_medicine_id
          )
          AND NOT EXISTS (
            SELECT 1 FROM master_medicine_images i
            WHERE i.master_medicine_id = m.master_medicine_id
              AND i.source = 'UPLOADED'
          )
        )::int AS raw,

        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1 FROM master_medicine_images i
            WHERE i.master_medicine_id = m.master_medicine_id
          )
        )::int AS none
      FROM master_medicines m
      WHERE m.is_active = true
    `
  );

  await t('12. unmappedCount', () =>
    prisma.medicine.count({
      where: {
        master_medicine_id: null,
        linked_variant_id: null,
        link_status: { in: ['PENDING', 'UNLINKED'] },
        link_rejected: false,
        is_active: true,
      },
    })
  );

  await t('13. needsReviewCount', () =>
    prisma.medicine.count({
      where: {
        link_status: 'SUGGESTED',
        suggested_master_id: { not: null },
        link_rejected: false,
        is_active: true,
      },
    })
  );

  await t('14. totalLinkedCount', () =>
    prisma.medicine.count({
      where: {
        linked_variant_id: { not: null },
        link_status: { in: ['AUTO_LINKED', 'MANUAL_LINKED'] },
        is_active: true,
      },
    })
  );
  await t('11b. LEFT JOIN version', () =>
  prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE has_uploaded = true)::int  AS verified,
      COUNT(*) FILTER (WHERE has_any = true AND has_uploaded = false)::int AS raw,
      COUNT(*) FILTER (WHERE has_any = false)::int AS none
    FROM (
      SELECT
        m.master_medicine_id,
        BOOL_OR(i.image_id IS NOT NULL)   AS has_any,
        BOOL_OR(i.source = 'UPLOADED')    AS has_uploaded
      FROM master_medicines m
      LEFT JOIN master_medicine_images i
        ON i.master_medicine_id = m.master_medicine_id
      WHERE m.is_active = true
      GROUP BY m.master_medicine_id
    ) AS agg
  `
);

  console.log('\nDiagnostics complete.');
  await prisma.$disconnect();
}

runDiagnostics().catch(console.error);