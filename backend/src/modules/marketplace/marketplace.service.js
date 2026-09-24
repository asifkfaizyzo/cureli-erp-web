// backend/src/modules/marketplace/marketplace.service.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.service.js

import prisma from "../../config/prisma.js";

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export const getOrCreateProfile = async (shop_id) => {
  let profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    include: {
      branchSettings: {
        include: {
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
              branch_type: true,
              is_active: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    profile = await prisma.marketplaceProfile.create({
      data: {
        shop_id,
        marketplace_status: "NOT_STARTED",
      },
      include: {
        branchSettings: {
          include: {
            branch: {
              select: {
                branch_id: true,
                branch_name: true,
                branch_type: true,
                is_active: true,
              },
            },
          },
        },
      },
    });
  }

  return profile;
};

// GET STATUS — UPDATED: Selected banking fields
export const getMarketplaceStatus = async (shop_id) => {
  const profile = await getOrCreateProfile(shop_id);

  const allBranches = await prisma.branch.findMany({
    where: { shop_id, is_active: true },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      city: true,
      state: true,
      contact_number: true,
    },
    orderBy: [{ branch_type: "asc" }, { branch_name: "asc" }],
  });

  return {
    marketplace_profile_id: profile.marketplace_profile_id,
    marketplace_status: profile.marketplace_status,
    onboarding_completed: profile.onboarding_completed,
    is_live: profile.is_live,
    storefront_name: profile.storefront_name,
    storefront_description: profile.storefront_description,
    support_phone: profile.support_phone,
    logo_url: profile.logo_url,
    banner_url: profile.banner_url,
    // ── BANKING DETAILS RETRIEVED ─────────────────────────────
    bank_account_holder: profile.bank_account_holder,
    bank_name: profile.bank_name,
    bank_branch_name: profile.bank_branch_name,
    bank_ifsc: profile.bank_ifsc,
    bank_account_number: profile.bank_account_number,
    bank_mmid: profile.bank_mmid,
    bank_vpa: profile.bank_vpa,
    // ──────────────────────────────────────────────────────────
    onboarding_draft: profile.onboarding_draft,
    branch_settings: profile.branchSettings,
    all_branches: allBranches,
  };
};

// SAVE DRAFT


export const saveDraft = async (shop_id, patch) => {
  // Use getOrCreateProfile so draft autosave never fails if profile isn't created yet
  const profile = await getOrCreateProfile(shop_id);

  const existingDraft =
    profile.onboarding_draft &&
    typeof profile.onboarding_draft === "object"
      ? profile.onboarding_draft
      : {};

  const mergedDraft = deepMerge(existingDraft, patch);

  return await prisma.marketplaceProfile.update({
    where: { shop_id },
    data: {
      onboarding_draft: mergedDraft,
      marketplace_status:
        profile.marketplace_status === "NOT_STARTED"
          ? "DRAFT"
          : profile.marketplace_status,
    },
    select: {
      marketplace_profile_id: true,
      marketplace_status: true,
      onboarding_draft: true,
      updated_at: true,
    },
  });
};

// SAVE STOREFRONT
export const saveStorefront = async (shop_id, data) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true, marketplace_status: true },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  return await prisma.marketplaceProfile.update({
    where: { shop_id },
    data: {
      storefront_name: data.storefront_name,
      storefront_description: data.storefront_description,
      support_phone: data.support_phone,
      logo_url: data.logo_url,
      banner_url: data.banner_url ?? null,
      marketplace_status:
        profile.marketplace_status === "NOT_STARTED"
          ? "DRAFT"
          : profile.marketplace_status,
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
    },
  });
};

// ── ADDED SAVE BANKING DETAILS ───────────────────────────────────
export const saveBanking = async (shop_id, data) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  return await prisma.marketplaceProfile.update({
    where: { shop_id },
    data: {
      bank_account_holder: data.bank_account_holder,
      bank_name: data.bank_name,
      bank_branch_name: data.bank_branch_name,
      bank_ifsc: data.bank_ifsc,
      bank_account_number: data.bank_account_number,
      bank_mmid: data.bank_mmid ?? null,
      bank_vpa: data.bank_vpa ?? null,
    },
    select: {
      marketplace_profile_id: true,
      bank_account_holder: true,
      bank_name: true,
      bank_branch_name: true,
      bank_ifsc: true,
      bank_account_number: true,
      bank_mmid: true,
      bank_vpa: true,
      updated_at: true,
    },
  });
};

// SAVE BRANCH SELECTIONS
export const saveBranchSelections = async (shop_id, branch_ids) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  const validBranches = await prisma.branch.findMany({
    where: { branch_id: { in: branch_ids }, shop_id, is_active: true },
    select: { branch_id: true },
  });

  const validIds = validBranches.map((b) => b.branch_id);
  const invalidIds = branch_ids.filter((id) => !validIds.includes(id));

  if (invalidIds.length > 0) {
    throw new Error(`Invalid or inactive branches: ${invalidIds.join(", ")}`);
  }

  const existing = await prisma.branchMarketplaceSettings.findMany({
    where: { marketplace_profile_id: profile.marketplace_profile_id },
    select: { branch_id: true },
  });

  const existingIds = existing.map((e) => e.branch_id);

  const upsertOps = branch_ids.map((branch_id) =>
    prisma.branchMarketplaceSettings.upsert({
      where: { branch_id },
      create: {
        branch_id,
        marketplace_profile_id: profile.marketplace_profile_id,
        marketplace_enabled: false,
      },
      update: {},
    })
  );

  const deselectedIds = existingIds.filter((id) => !branch_ids.includes(id));

  const disableOps = deselectedIds.map((branch_id) =>
    prisma.branchMarketplaceSettings.update({
      where: { branch_id },
      data: { marketplace_enabled: false },
    })
  );

  await prisma.$transaction([...upsertOps, ...disableOps]);

  return { selected: branch_ids, deselected: deselectedIds };
};

// SAVE BRANCH CONFIG — UPDATED: Delivery Mode
export const saveBranchConfig = async (shop_id, branch_id, data, caller) => {
  if (
    caller.role !== "super_admin" &&
    caller.branch_id !== branch_id
  ) {
    throw new Error("You can only configure your own branch");
  }

  const branch = await prisma.branch.findFirst({
    where: { branch_id, shop_id, is_active: true },
    select: { branch_id: true },
  });

  if (!branch) {
    throw new Error("Branch not found or does not belong to this shop");
  }

  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  const updateData = {
    marketplace_enabled: data.marketplace_enabled,
    pickup_enabled: data.pickup_enabled ?? false,
    delivery_enabled: data.delivery_enabled ?? false,
    delivery_mode: data.delivery_mode ?? "CURELI", // <-- Map saved delivery mode
    is_24_hours: data.is_24_hours ?? false,
    contact_override: data.contact_override ?? null,
    shop_image_url: data.shop_image_url ?? null,
    open_days: Array.isArray(data.open_days) ? data.open_days : [],
  };

  if (data.marketplace_enabled) {
    if (!data.is_24_hours) {
      updateData.opening_time = data.opening_time ?? null;
      updateData.closing_time = data.closing_time ?? null;
    } else {
      updateData.opening_time = null;
      updateData.closing_time = null;
    }
  }

  if (caller.role === "super_admin" && data.marketplace_enabled) {
    updateData.latitude = data.latitude ?? null;
    updateData.longitude = data.longitude ?? null;
    updateData.google_place_id = data.google_place_id ?? null;
    updateData.formatted_address = data.formatted_address ?? null;
  }

  return await prisma.branchMarketplaceSettings.upsert({
    where: { branch_id },
    create: {
      branch_id,
      marketplace_profile_id: profile.marketplace_profile_id,
      ...updateData,
    },
    update: updateData,
    include: {
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
  });
};

// GET STOREFRONT — UPDATED: Selected banking details
export const getStorefront = async (shop_id) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: {
      marketplace_profile_id: true,
      storefront_name: true,
      storefront_description: true,
      support_phone: true,
      logo_url: true,
      banner_url: true,
      // ── BANKING FIELDS RETRIEVED ─────────────────────────────
      bank_account_holder: true,
      bank_name: true,
      bank_branch_name: true,
      bank_ifsc: true,
      bank_account_number: true,
      bank_mmid: true,
      bank_vpa: true,
      // ──────────────────────────────────────────────────────────
      marketplace_status: true,
      is_live: true,
      onboarding_completed: true,
    },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  return profile;
};

// GET BRANCH SETTINGS
export const getBranchSettings = async (shop_id, caller) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: { marketplace_profile_id: true },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  const branchFilter =
    caller.role === "super_admin"
      ? {}
      : { branch_id: caller.branch_id };

  return await prisma.branchMarketplaceSettings.findMany({
    where: {
      marketplace_profile_id: profile.marketplace_profile_id,
      ...branchFilter,
    },
    include: {
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          branch_type: true,
          city: true,
          state: true,
          contact_number: true,
        },
      },
    },
    orderBy: [
      { branch: { branch_type: "asc" } },
      { branch: { branch_name: "asc" } },
    ],
  });
};

// GO LIVE — UPDATED: Added banking requirements check
export const goLive = async (shop_id) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    include: {
      branchSettings: {
        include: {
          branch: { select: { branch_name: true } },
        },
      },
    },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  const errors = [];

  // Storefront validations
  if (!profile.storefront_name?.trim()) {
    errors.push({ field: "storefront_name", message: "Storefront name is required" });
  }
  if (!profile.support_phone?.trim()) {
    errors.push({ field: "support_phone", message: "Support phone is required" });
  }
  if (!profile.logo_url?.trim()) {
    errors.push({ field: "logo_url", message: "Logo is required" });
  }

  // ── ADDED BANKING VALIDATION CHECKS ──────────────────────
  if (!profile.bank_account_holder?.trim()) {
    errors.push({ field: "bank_account_holder", message: "Bank Account Holder is required" });
  }
  if (!profile.bank_name?.trim()) {
    errors.push({ field: "bank_name", message: "Bank Name is required" });
  }
  if (!profile.bank_branch_name?.trim()) {
    errors.push({ field: "bank_branch_name", message: "Bank Branch Name is required" });
  }
  if (!profile.bank_ifsc?.trim()) {
    errors.push({ field: "bank_ifsc", message: "Bank IFSC Code is required" });
  }
  if (!profile.bank_account_number?.trim()) {
    errors.push({ field: "bank_account_number", message: "Bank Account Number is required" });
  }
  // ─────────────────────────────────────────────────────────

  const enabledBranches = profile.branchSettings.filter(
    (b) => b.marketplace_enabled
  );

  if (enabledBranches.length === 0) {
    errors.push({
      field: "branches",
      message: "At least one branch must be marketplace-enabled",
    });
  }

  for (const bs of enabledBranches) {
    const name = bs.branch?.branch_name || bs.branch_id;

    if (!bs.latitude || !bs.longitude) {
      errors.push({
        field: `branch.${bs.branch_id}.location`,
        message: `${name}: Location (lat/lng) is required`,
      });
    }
    if (!bs.google_place_id) {
      errors.push({
        field: `branch.${bs.branch_id}.google_place_id`,
        message: `${name}: Google Place ID is required`,
      });
    }
    if (!bs.formatted_address) {
      errors.push({
        field: `branch.${bs.branch_id}.formatted_address`,
        message: `${name}: Formatted address is required`,
      });
    }
    if (!bs.pickup_enabled && !bs.delivery_enabled) {
      errors.push({
        field: `branch.${bs.branch_id}.fulfillment`,
        message: `${name}: Enable at least pickup or delivery`,
      });
    }
    if (!bs.is_24_hours) {
      if (!bs.opening_time) {
        errors.push({
          field: `branch.${bs.branch_id}.opening_time`,
          message: `${name}: Opening time is required`,
        });
      }
      if (!bs.closing_time) {
        errors.push({
          field: `branch.${bs.branch_id}.closing_time`,
          message: `${name}: Closing time is required`,
        });
      }
    }
  }

  if (errors.length > 0) {
    const err = new Error("Go-live validation failed");
    err.statusCode = 422;
    err.validationErrors = errors;
    throw err;
  }

  return await prisma.marketplaceProfile.update({
    where: { shop_id },
    data: {
      marketplace_status: "LIVE",
      is_live: true,
      onboarding_completed: true,
      onboarding_draft: null,
    },
    select: {
      marketplace_profile_id: true,
      marketplace_status: true,
      is_live: true,
      onboarding_completed: true,
      updated_at: true,
    },
  });
};

// SUSPEND MARKETPLACE
export const suspendMarketplace = async (shop_id) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: {
      marketplace_profile_id: true,
      marketplace_status: true,
    },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  if (profile.marketplace_status !== "LIVE") {
    throw new Error("Only a live marketplace can be suspended");
  }

  const [updatedProfile] = await prisma.$transaction([
    prisma.marketplaceProfile.update({
      where: { shop_id },
      data: {
        marketplace_status: "SUSPENDED",
        is_live: false,
      },
      select: {
        marketplace_profile_id: true,
        marketplace_status: true,
        is_live: true,
        updated_at: true,
      },
    }),
    prisma.branchMarketplaceSettings.updateMany({
      where: {
        marketplace_profile_id: profile.marketplace_profile_id,
        marketplace_enabled: true,
      },
      data: {
        marketplace_enabled: false,
      },
    }),
  ]);

  return updatedProfile;
};

// RESUME MARKETPLACE
export const resumeMarketplace = async (shop_id) => {
  const profile = await prisma.marketplaceProfile.findUnique({
    where: { shop_id },
    select: {
      marketplace_status: true,
      onboarding_completed: true,
    },
  });

  if (!profile) throw new Error("Marketplace profile not found");

  if (profile.marketplace_status !== "SUSPENDED") {
    throw new Error("Only a suspended marketplace can be resumed");
  }

  return await prisma.marketplaceProfile.update({
    where: { shop_id },
    data: {
      marketplace_status: "LIVE",
      is_live: true,
    },
    select: {
      marketplace_profile_id: true,
      marketplace_status: true,
      is_live: true,
      updated_at: true,
    },
  });
};