import { success, fail } from "../../../utils/response.js";
import {
  listAllRequests,
  getRequestDetail,
  getRequestFileUrl,
} from "./cadminPrescriptionRequests.service.js";

/**
 * GET /cadmin/prescription-requests
 * List all prescription requests across all shops.
 * Query: page, limit, search, status
 */
export async function listRequests(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();

    const result = await listAllRequests({ page, limit, search, status });
    return success(res, result, "Prescription requests fetched");
  } catch (err) {
    console.error(
      "[CAdmin PRx] listRequests error:",
      err.message,
    );
    return fail(res, "Failed to fetch prescription requests", 500);
  }
}

/**
 * GET /cadmin/prescription-requests/:requestId
 */
export async function getRequest(req, res) {
  try {
    const result = await getRequestDetail(req.params.requestId);
    return success(res, result, "Prescription request fetched");
  } catch (err) {
    console.error("[CAdmin PRx] getRequest error:", err.message);
    if (err.message === "Prescription request not found") {
      return fail(res, err.message, 404);
    }
    return fail(res, "Failed to fetch prescription request", 500);
  }
}

/**
 * GET /cadmin/prescription-requests/:requestId/files/:fileId/url
 */
export async function getFileUrl(req, res) {
  try {
    const { requestId, fileId } = req.params;
    const result = await getRequestFileUrl(requestId, fileId);
    return success(res, result);
  } catch (err) {
    console.error("[CAdmin PRx] getFileUrl error:", err.message);
    if (err.message === "File not found") {
      return fail(res, err.message, 404);
    }
    if (err.message === "Prescription file has expired") {
      return fail(res, err.message, 410);
    }
    return fail(res, "Failed to generate file URL", 500);
  }
}