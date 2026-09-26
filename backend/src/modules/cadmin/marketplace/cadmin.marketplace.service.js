// backend/src/modules/cadmin/marketplace/cadmin.marketplace.service.js (do not remove this comment)
// backend/src/modules/cadmin/marketplace/cadmin.marketplace.service.js

import prisma from "../../../config/prisma.js";

// Helper to sanitize/validate UUIDs safe from DB execution faults
const isUuid = (val) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

// ─────────────────────────────────────────────
// SHOPS
// ─────────────────────────────────────────────

export const listShopsWithMarketplace = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  marketplace_status = "",
}) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(search
      ? {
          OR: [
            { business_name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { gst_number: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "active" ? { is_active: true } : {}),
    ...(status === "inactive" ? { is_active: false } : {}),
    ...(marketplace_status
      ? {
          marketplaceProfile: {
            marketplace_status: marketplace_status.toUpperCase(),
          },
        }
      : {}),
  };

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        shop_id: true,
        business_name: true,
        city: true,
        state: true,
        is_active: true,
        verification_status: true,
        created_at: true,
        owner: {
          select: {
            full_name: true,
            email: true,
            phone_number: true,
          },
        },
        marketplaceProfile: {
          select: {
            marketplace_profile_id: true,
            marketplace_status: true,
            is_live: true,
            onboarding_completed: true,
            storefront_name: true,
            logo_url: true,
          },
        },
        _count: {
          select: { branches: true },
        },
      },
    }),
    prisma.shop.count({ where }),
  ]);

  return {
    shops,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

export const getShopDetail = async (shop_id) => {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: {
      shop_id: true,
      business_name: true,
      legal_name: true,
      gst_number: true,
      business_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      verification_status: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      owner: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone_number: true,
        },
      },
      marketplaceProfile: {
        select: {
          marketplace_profile_id: true,
          marketplace_status: true,
          is_live: true,
          onboarding_completed: true,
          storefront_name: true,
          storefront_description: true,
          support_phone: true,
          logo_url: true,
          banner_url: true,
          created_at: true,
          updated_at: true,
          // ── Added Banking Fields ──
          bank_account_holder: true,
          bank_name: true,
          bank_branch_name: true,
          bank_ifsc: true,
          bank_account_number: true,
          bank_mmid: true,
          bank_vpa: true,
          // ── Added Draft JSON persistence ──
          onboarding_draft: true,
        },
      },
      currentSubscription: {
        select: {
          subscription_id: true,
          status: true,
          end_date: true,
          plan: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: {
          branches: true,
          users: true,
        },
      },
    },
  });

  if (!shop) throw new Error("Shop not found");

  const branches = await prisma.branch.findMany({
    where: { shop_id },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      city: true,
      state: true,
      contact_number: true,
      is_active: true,
      created_at: true,
      marketplaceSettings: {
        select: {
          branch_marketplace_id: true,
          marketplace_enabled: true,
          latitude: true,
          longitude: true,
          formatted_address: true,
          opening_time: true,
          closing_time: true,
          is_24_hours: true,
          pickup_enabled: true,
          delivery_enabled: true,
          delivery_mode: true,
          shop_image_url: true,
          contact_override: true,
          open_days: true,
          last_auto_opened_date: true,
          updated_at: true,
        },
      },
    },
  });

  return { ...shop, branches };
};

export const setShopBlockStatus = async (shop_id, block) => {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    select: {
      shop_id: true,
      is_active: true,
      marketplaceProfile: {
        select: {
          marketplace_profile_id: true,
          marketplace_status: true,
        },
      },
    },
  });

  if (!shop) throw new Error("Shop not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shop.update({
      where: { shop_id },
      data: { is_active: !block },
      select: {
        shop_id: true,
        business_name: true,
        is_active: true,
      },
    });

    if (block && shop.marketplaceProfile?.marketplace_status === "LIVE") {
      await tx.marketplaceProfile.update({
        where: { shop_id },
        data: { marketplace_status: "SUSPENDED", is_live: false },
      });

      await tx.branchMarketplaceSettings.updateMany({
        where: {
          marketplace_profile_id:
            shop.marketplaceProfile.marketplace_profile_id,
          marketplace_enabled: true,
        },
        data: { marketplace_enabled: false },
      });
    }

    return updated;
  });
};

export const setBranchBlockStatus = async (shop_id, branch_id, block) => {
  const branch = await prisma.branch.findFirst({
    where: { branch_id, shop_id },
    select: {
      branch_id: true,
      is_active: true,
      marketplaceSettings: {
        select: { branch_marketplace_id: true },
      },
    },
  });

  if (!branch) throw new Error("Branch not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.branch.update({
      where: { branch_id },
      data: { is_active: !block },
      select: {
        branch_id: true,
        branch_name: true,
        is_active: true,
      },
    });

    if (block && branch.marketplaceSettings) {
      await tx.branchMarketplaceSettings.update({
        where: { branch_id },
        data: { marketplace_enabled: false },
      });
    }

    return updated;
  });
};

export const updateBranchMarketplaceConfig = async (
  shop_id,
  branch_id,
  data
) => {
  const branch = await prisma.branch.findFirst({
    where: { branch_id, shop_id },
    select: { branch_id: true },
  });

  if (!branch)
    throw new Error("Branch not found or does not belong to this shop");

  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true },
  });

  if (!profile) throw new Error("Shop has no marketplace profile yet");

  const updateData = {
    marketplace_enabled: data.marketplace_enabled ?? false,
    pickup_enabled: data.pickup_enabled ?? false,
    delivery_enabled: data.delivery_enabled ?? false,
    delivery_mode: data.delivery_mode ?? "CURELI",
    is_24_hours: data.is_24_hours ?? false,
    contact_override: data.contact_override ?? null,
    shop_image_url: data.shop_image_url ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    google_place_id: data.google_place_id ?? null,
    formatted_address: data.formatted_address ?? null,
    opening_time: data.is_24_hours ? null : (data.opening_time ?? null),
    closing_time: data.is_24_hours ? null : (data.closing_time ?? null),
    open_days: Array.isArray(data.open_days) ? data.open_days : [],
  };

  return prisma.branchMarketplaceSettings.upsert({
    where: { branch_id },
    create: {
      branch_id,
      marketplace_profile_id: profile.marketplace_profile_id,
      ...updateData,
    },
    update: updateData,
    include: {
      branch: {
        select: { branch_id: true, branch_name: true },
      },
    },
  });
};

// ─────────────────────────────────────────────
// UPDATE SHOP STOREFRONT & BANK DETAILS
// ─────────────────────────────────────────────

export const updateShopStorefront = async (shop_id, data) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true },
  });

  if (!profile) throw new Error("Marketplace profile not found for this shop");

  return prisma.marketplaceProfile.update({
    where: { shop_id },
    data: {
      ...(data.storefront_name !== undefined && {
        storefront_name: data.storefront_name,
      }),
      ...(data.storefront_description !== undefined && {
        storefront_description: data.storefront_description,
      }),
      ...(data.support_phone !== undefined && {
        support_phone: data.support_phone,
      }),
      ...(data.logo_url !== undefined && {
        logo_url: data.logo_url,
      }),
      ...(data.banner_url !== undefined && {
        banner_url: data.banner_url,
      }),
      // ── Banking payouts ──
      ...(data.bank_account_holder !== undefined && {
        bank_account_holder: data.bank_account_holder,
      }),
      ...(data.bank_name !== undefined && {
        bank_name: data.bank_name,
      }),
      ...(data.bank_branch_name !== undefined && {
        bank_branch_name: data.bank_branch_name,
      }),
      ...(data.bank_ifsc !== undefined && {
        bank_ifsc: data.bank_ifsc,
      }),
      ...(data.bank_account_number !== undefined && {
        bank_account_number: data.bank_account_number,
      }),
      ...(data.bank_mmid !== undefined && {
        bank_mmid: data.bank_mmid,
      }),
      ...(data.bank_vpa !== undefined && {
        bank_vpa: data.bank_vpa,
      }),
    },
    select: {
      marketplace_profile_id: true,
      storefront_name: true,
      storefront_description: true,
      support_phone: true,
      logo_url: true,
      banner_url: true,
      marketplace_status: true,
      updated_at: true,
      bank_account_holder: true,
      bank_name: true,
      bank_branch_name: true,
      bank_ifsc: true,
      bank_account_number: true,
      bank_mmid: true,
      bank_vpa: true,
    },
  });
};

// ─────────────────────────────────────────────
// HOLIDAYS
// ─────────────────────────────────────────────

export const getShopHolidays = async (shop_id) => {
  return prisma.branchHoliday.findMany({
    where: { shop_id },
    orderBy: { holiday_date: "asc" },
    include: {
      branch: {
        select: {
          branch: {
            select: {
              branch_name: true,
            },
          },
        },
      },
    },
  });
};

export const createShopHoliday = async (shop_id, data, cadmin_user_id) => {
  const { branch_id, holiday_date, reason, scope } = data;

  const bSettings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id },
  });
  if (!bSettings) {
    throw new Error("Target branch settings not configured on the marketplace");
  }

  // Ensure UUID formatting safety
  const safeCreatedBy = isUuid(cadmin_user_id)
    ? cadmin_user_id
    : "00000000-0000-0000-0000-000000000000";

  return prisma.branchHoliday.create({
    data: {
      branch_id,
      shop_id,
      holiday_date: new Date(holiday_date),
      reason: reason || null,
      scope: scope === "SHOP" ? "SHOP" : "BRANCH",
      created_by: safeCreatedBy,
    },
  });
};

export const deleteShopHoliday = async (shop_id, holiday_id) => {
  const holiday = await prisma.branchHoliday.findFirst({
    where: { holiday_id, shop_id },
  });
  if (!holiday) throw new Error("Holiday not found");

  return prisma.branchHoliday.delete({
    where: { holiday_id },
  });
};

export const setShopMarketplaceVisibility = async (shop_id, visible) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: {
      marketplace_profile_id: true,
      marketplace_status: true,
      is_live: true,
    },
  });

  if (!profile) throw new Error("Marketplace profile not found for this shop");

  // Can only toggle visibility if the shop is verified (LIVE status)
  if (visible && profile.marketplace_status !== "LIVE") {
    throw new Error("Cannot make shop visible — marketplace status is not Verified");
  }

  const updated = await prisma.marketplaceProfile.update({
    where: { shop_id },
    data: { is_live: visible },
    select: {
      marketplace_profile_id: true,
      marketplace_status: true,
      is_live: true,
    },
  });

  // If hiding the shop, also disable all branch visibility
  if (!visible) {
    await prisma.branchMarketplaceSettings.updateMany({
      where: {
        marketplace_profile_id: profile.marketplace_profile_id,
        marketplace_enabled: true,
      },
      data: { marketplace_enabled: false },
    });
  }

  return updated;
};

// ── NEW: Toggle branch marketplace visibility (marketplace_enabled) ──
export const setBranchMarketplaceVisibility = async (shop_id, branch_id, visible) => {
  const branch = await prisma.branch.findFirst({
    where: { branch_id, shop_id },
    select: { branch_id: true, is_active: true },
  });

  if (!branch) throw new Error("Branch not found");

  if (visible && !branch.is_active) {
    throw new Error("Cannot make branch visible — branch is blocked");
  }

  const settings = await prisma.branchMarketplaceSettings.findUnique({
    where: { branch_id },
    select: { branch_marketplace_id: true },
  });

  if (!settings) throw new Error("Branch is not linked to marketplace");

  // Check that the parent shop is_live before enabling
  if (visible) {
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { shop_id },
      select: { is_live: true, marketplace_status: true },
    });
    if (!profile?.is_live) {
      throw new Error("Cannot enable branch — shop is hidden from marketplace");
    }
  }

  return prisma.branchMarketplaceSettings.update({
    where: { branch_id },
    data: { marketplace_enabled: visible },
    select: {
      branch_marketplace_id: true,
      marketplace_enabled: true,
    },
  });
};

// ─────────────────────────────────────────────
// MOBILE USERS
// ─────────────────────────────────────────────

export const listMobileUsers = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
}) => {
  const skip = (page - 1) * limit;

  const where = {
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { full_name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "active" ? { status: "active" } : {}),
    ...(status === "suspended" ? { status: "suspended" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.cureliMobileUser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        phone: true,
        full_name: true,
        email: true,
        status: true,
        phone_verified: true,
        created_at: true,
        last_seen_at: true,
        suspended_at: true,
        suspension_reason: true,
        _count: {
          select: {
            sessions: true,
            addresses: true,
          },
        },
      },
    }),
    prisma.cureliMobileUser.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

export const getMobileUserDetail = async (user_id) => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: {
      id: true,
      phone: true,
      phone_verified: true,
      full_name: true,
      email: true,
      status: true,
      profile_image_key: true,
      referral_code: true,
      suspended_at: true,
      suspension_reason: true,
      suspended_by: true,
      deleted_at: true,
      created_at: true,
      updated_at: true,
      last_seen_at: true,
      addresses: {
        where: { deleted_at: null },
        orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
        select: {
          id: true,
          label: true,
          custom_label: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          state: true,
          pincode: true,
          is_default: true,
        },
      },
      sessions: {
        where: {
          is_active: true,
          expires_at: { gt: new Date() },
        },
        orderBy: { last_active_at: "desc" },
        take: 5,
        select: {
          id: true,
          device_name: true,
          device_platform: true,
          app_version: true,
          ip_address: true,
          created_at: true,
          last_active_at: true,
          expires_at: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return user;
};

export const setMobileUserBlockStatus = async (
  user_id,
  block,
  reason = "",
  cadmin_name = "CAdmin"
) => {
  const user = await prisma.cureliMobileUser.findUnique({
    where: { id: user_id },
    select: { id: true, status: true, deleted_at: true },
  });

  if (!user) throw new Error("User not found");
  if (user.deleted_at) throw new Error("Cannot modify a deleted account");
  if (block && user.status === "suspended")
    throw new Error("User is already suspended");
  if (!block && user.status === "active")
    throw new Error("User is already active");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.cureliMobileUser.update({
      where: { id: user_id },
      data: {
        status: block ? "suspended" : "active",
        suspended_at: block ? new Date() : null,
        suspension_reason: block ? reason : null,
        suspended_by: block ? cadmin_name : null,
      },
      select: {
        id: true,
        full_name: true,
        phone: true,
        status: true,
        suspended_at: true,
        suspension_reason: true,
      },
    });

    if (block) {
      await tx.cureliMobileSession.updateMany({
        where: { user_id, is_active: true },
        data: {
          is_active: false,
          revoked_at: new Date(),
          revoked_reason: "cadmin_suspension",
        },
      });
    }

    return updated;
  });
};