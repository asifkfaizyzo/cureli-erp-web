// backend/src/modules/rider/profile/rider.profile.service.js (do not remove this comment)

import prisma from "../../../config/prisma.js";
import { resolveAssetUrl } from "../../../services/assetUrl.service.js";

const GROUP_CONFIG = [
  { group: "DRIVING_LICENSE", label: "Driving License", dbType: "DRIVING_LICENSE_FRONT", hasBack: true },
  { group: "AADHAAR",         label: "Aadhaar Card",    dbType: "AADHAAR_FRONT",         hasBack: true },
  { group: "PAN",             label: "PAN Card",        dbType: "PAN_FRONT",             hasBack: false },
  { group: "VEHICLE_RC",      label: "Vehicle RC",      dbType: "VEHICLE_RC",            hasBack: false },
  { group: "PROFILE_PHOTO",   label: "Profile Photo",   dbType: "PROFILE_PHOTO",         hasBack: false },
];

export async function getRiderDocuments(riderId) {
  const rows = await prisma.riderDocument.findMany({
    where: { rider_id: riderId },
    select: {
      type: true,
      storage_key: true,
      back_storage_key: true,
    },
  });

  const byType = {};
  for (const row of rows) {
    byType[row.type] = row;
  }

  const documents = GROUP_CONFIG.map((cfg) => {
    const row = byType[cfg.dbType];

    if (!row || !row.storage_key) {
      return {
        group: cfg.group,
        label: cfg.label,
        has_back: cfg.hasBack,
        front_url: null,
        back_url: null,
      };
    }

    // Prepend the required folder path because db stores only filenames
    const frontKeyWithFolder = `rider_documents/${row.storage_key}`;
    const backKeyWithFolder = row.back_storage_key
      ? `rider_documents/${row.back_storage_key}`
      : null;

    return {
      group: cfg.group,
      label: cfg.label,
      has_back: cfg.hasBack,
      front_url: resolveAssetUrl(frontKeyWithFolder),
      back_url: cfg.hasBack && backKeyWithFolder
        ? resolveAssetUrl(backKeyWithFolder)
        : null,
    };
  });

  return { documents };
}