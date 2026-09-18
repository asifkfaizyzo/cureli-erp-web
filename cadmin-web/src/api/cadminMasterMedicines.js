//cadmin-web\src\api\cadminMasterMedicines.js
import CAdminAPI from "./axios";

// ══════════════════════════════════════════════════════════════
// CATALOG APIs
// ══════════════════════════════════════════════════════════════

export function getMasterMedicines(params = {}) {
  return CAdminAPI.get("/master-medicines", { params });
}

export function getMasterMedicineById(id) {
  return CAdminAPI.get(`/master-medicines/${id}`);
}

export function getMasterMedicineStats() {
  return CAdminAPI.get("/master-medicines/stats");
}

export function getFilterOptions() {
  return CAdminAPI.get("/master-medicines/filters");
}

export function autocompleteSearch(query, limit = 10) {
  return CAdminAPI.get("/master-medicines/autocomplete", {
    params: { q: query, limit },
  });
}

// ══════════════════════════════════════════════════════════════
// MAPPING APIs
// ══════════════════════════════════════════════════════════════

export function getUnmappedMedicines(params = {}) {
  return CAdminAPI.get("/master-medicines/unmapped", { params });
}

export function getNeedsReview(params = {}) {
  return CAdminAPI.get("/master-medicines/review", { params });
}

export function acceptReviewMatch(medicineId) {
  return CAdminAPI.post(`/master-medicines/review/${medicineId}/accept`);
}

export function rejectReviewMatch(medicineId) {
  return CAdminAPI.post(`/master-medicines/review/${medicineId}/reject`);
}

//  RENAMED + updated to send variantId
export function matchToVariant(medicineIds, variantId) {
  return CAdminAPI.post("/master-medicines/match", {
    medicineIds,
    variantId, //  was masterMedicineId
  });
}

// ══════════════════════════════════════════════════════════════
// DISTINCT SHOPS API
// ══════════════════════════════════════════════════════════════

export function getDistinctShops(params = {}) {
  return CAdminAPI.get("/master-medicines/shops", { params });
}



// Keep old name as alias during transition so nothing breaks immediately
export const matchToMaster = matchToVariant;

export function ignoreUnmapped(medicineIds) {
  return CAdminAPI.post("/master-medicines/ignore", { medicineIds });
}

// ══════════════════════════════════════════════════════════════
// LINKED MEDICINES APIs
// ══════════════════════════════════════════════════════════════

export function getLinkedMedicines(masterMedicineId) {
  return CAdminAPI.get(`/master-medicines/${masterMedicineId}/linked`);
}

//  NEW: get linked medicines by specific variant
export function getLinkedByVariant(variantId) {
  return CAdminAPI.get(`/master-medicines/variants/${variantId}/linked`);
}

export function unlinkMedicine(medicineId) {
  return CAdminAPI.post(`/master-medicines/unlink/${medicineId}`);
}
export function createMasterMedicine(data) {
  return CAdminAPI.post("/master-medicines", data);
}
// ══════════════════════════════════════════════════════════════
// IMAGE APIs
// ══════════════════════════════════════════════════════════════

export function uploadImage(
  masterMedicineId,
  file,
  type = "PRIMARY",
  skuId = null,
) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("type", type);
  if (skuId) formData.append("skuId", skuId);

  return CAdminAPI.post(
    `/master-medicines/${masterMedicineId}/images`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
}

export function deleteImage(imageId) {
  return CAdminAPI.delete(`/master-medicines/images/${imageId}`);
}

// ══════════════════════════════════════════════════════════════
// IMAGE URL HELPER
// ══════════════════════════════════════════════════════════════

export function getImageUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith("http")) return relativePath;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  // Remove leading slash if present to avoid double slash
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.slice(1)
    : relativePath;
  return `${baseUrl}/${cleanPath}`;
}

// ══════════════════════════════════════════════════════════════
// IMAGE STATUS HELPERS (moved from mock data)
// ══════════════════════════════════════════════════════════════

export const IMAGE_STATUS = {
  VERIFIED: "VERIFIED",
  RAW: "RAW",
  NONE: "NONE",
};

export function computeImageStatus(images) {
  if (!images || images.length === 0) return IMAGE_STATUS.NONE;
  const hasUploaded = images.some((img) => img.source === "UPLOADED");
  if (hasUploaded) return IMAGE_STATUS.VERIFIED;
  return IMAGE_STATUS.RAW;
}

export function getImageStatusInfo(status) {
  switch (status) {
    case IMAGE_STATUS.VERIFIED:
      return {
        label: "Verified",
        color: "green",
        bgClass: "bg-green-100",
        textClass: "text-green-700",
        borderClass: "border-green-200",
        iconBg: "bg-green-500",
      };
    case IMAGE_STATUS.RAW:
      return {
        label: "Raw",
        color: "amber",
        bgClass: "bg-amber-100",
        textClass: "text-amber-700",
        borderClass: "border-amber-200",
        iconBg: "bg-amber-500",
      };
    case IMAGE_STATUS.NONE:
    default:
      return {
        label: "No Image",
        color: "red",
        bgClass: "bg-red-100",
        textClass: "text-red-700",
        borderClass: "border-red-200",
        iconBg: "bg-red-500",
      };
  }
}

export function getConfidenceColorClasses(score) {
  if (score >= 90)
    return {
      bg: "bg-green-500",
      text: "text-green-700",
      badge: "bg-green-100 text-green-800",
    };
  if (score >= 70)
    return {
      bg: "bg-yellow-500",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-800",
    };
  if (score >= 50)
    return {
      bg: "bg-orange-500",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-800",
    };
  return {
    bg: "bg-red-500",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  };
}



export function getMappingHistory(params = {}) {
  return CAdminAPI.get("/master-medicines/history", { params });
}

export function unignoreMedicine(medicineId) {
  return CAdminAPI.post(`/master-medicines/unignore/${medicineId}`);
}
