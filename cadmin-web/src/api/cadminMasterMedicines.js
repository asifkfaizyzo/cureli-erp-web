// cadmin-web/src/api/cadminMasterMedicines.js (do not remove this comment)
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

export function matchToVariant(medicineIds, variantId) {
  return CAdminAPI.post("/master-medicines/match", {
    medicineIds,
    variantId,
  });
}

// ══════════════════════════════════════════════════════════════
// DISTINCT SHOPS API
// ══════════════════════════════════════════════════════════════

export function getDistinctShops(params = {}) {
  return CAdminAPI.get("/master-medicines/shops", { params });
}

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
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.slice(1)
    : relativePath;
  return `${baseUrl}/${cleanPath}`;
}

// ══════════════════════════════════════════════════════════════
// IMAGE STATUS HELPERS
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

// ══════════════════════════════════════════════════════════════
// HISTORY & UNIGNORE
// ══════════════════════════════════════════════════════════════

export function getMappingHistory(params = {}) {
  return CAdminAPI.get("/master-medicines/history", { params });
}

export function unignoreMedicine(medicineId) {
  return CAdminAPI.post(`/master-medicines/unignore/${medicineId}`);
}

export const createVariantUnderMaster = (masterId, variantData) =>
  CAdminAPI.post(`/master-medicines/${masterId}/variants`, variantData);
//  ^^^^^^^^ FIXED: was "cadminApi" (lowercase) — would throw ReferenceError

// ══════════════════════════════════════════════════════════════
// ADMIN ACTIVITY APIs
// ══════════════════════════════════════════════════════════════

export function getAdminActivitySummary(params = {}) {
  return CAdminAPI.get("/master-medicines/admin-activity/summary", { params });
}

export function getAdminActivityDetail(params = {}) {
  return CAdminAPI.get("/master-medicines/admin-activity/detail", { params });
}

// ── CSV Download Helpers ─────────────────────────────────────

async function triggerDownload(response, fallbackName) {
  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = match?.[1] || fallbackName;

  const blob = new Blob([response.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadAdminActivityCSV(params = {}) {
  const res = await CAdminAPI.get("/master-medicines/admin-activity/export", {
    params,
    responseType: "blob",
  });
  await triggerDownload(res, `admin-activity-${params.dateFrom || "all"}.csv`);
}

export async function downloadAdminActivityDetailCSV(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== null && v !== undefined && v !== "",
    ),
  );
  const res = await CAdminAPI.get(
    "/master-medicines/admin-activity/export-detail",
    {
      params: cleanParams,
      responseType: "blob",
    },
  );
  await triggerDownload(
    res,
    `activity-${params.actorType || "user"}-${params.dateFrom || "all"}.csv`,
  );
}