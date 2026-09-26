// backend/src/modules/cadmin/cadminDocs/cadminDocs.controller.js (do not remove this comment)
// backend/src/modules/cadmin/cadminDocs/cadminDocs.controller.js

import * as svc from "./cadminDocs.service.js";
import { success, fail } from "../../../utils/response.js";
import * as audit from "../../audit/index.js";

/**
 * GET /cadmin/files
 * List all shops pending verification with filters, sorting, pagination
 */
export async function listFilesController(req, res) {
  try {
    const params = req.validated || req.query;
    const result = await svc.listShopsForVerification(params);
    return success(res, result);
  } catch (err) {
    console.error("cadmin.docs.listFiles", err);
    return fail(res, err.message || "Failed to list verification records", err.status || 500);
  }
}

/**
 * GET /cadmin/shops/:shop_id
 * Get shop details with all files for verification modal
 */
export async function getShopDetailController(req, res) {
  try {
    const { shop_id } = req.params;

    if (!shop_id) {
      return fail(res, "Shop ID is required", 400);
    }

    const shopData = await svc.getShopVerificationDetail(shop_id);

    if (!shopData) {
      return fail(res, "Shop not found", 404);
    }

    return success(res, shopData);
  } catch (err) {
    console.error("cadmin.docs.getShopDetail", err);
    return fail(res, err.message || "Failed to fetch shop details", err.status || 500);
  }
}

/**
 * GET /cadmin/files/:file_id
 * Get single file details
 */
export async function getFileController(req, res) {
  try {
    const { file_id } = req.params;

    if (!file_id) {
      return fail(res, "File ID is required", 400);
    }

    const file = await svc.findFileById(file_id);

    if (!file) {
      return fail(res, "File not found", 404);
    }

    const shopData = await svc.getShopVerificationDetail(file.shop_id);

    if (!shopData) {
      return fail(res, "Shop not found", 404);
    }

    return success(res, shopData);
  } catch (err) {
    console.error("cadmin.docs.getFile", err);
    return fail(res, err.message || "Failed to fetch file details", err.status || 500);
  }
}

/**
 * PATCH /cadmin/files/:file_id/verify
 * Approve a document
 */
export async function verifyFileController(req, res) {
  try {
    const cadmin_id = req.cadmin.cadmin_id;
    const { file_id } = req.params;

    if (!file_id) {
      return fail(res, "File ID is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.verifyFile({ file_id, cadmin_id, auditContext });

    return success(res, result, "File verified successfully");
  } catch (err) {
    console.error("cadmin.docs.verifyFile", err);
    return fail(res, err.message || "Failed to verify file", err.status || 500);
  }
}

/**
 * PATCH /cadmin/files/:file_id/reject
 * Reject a document with a required reason
 */
export async function rejectFileController(req, res) {
  try {
    const cadmin_id = req.cadmin.cadmin_id;
    const { file_id } = req.params;
    const { reason } = req.validated;

    if (!file_id) {
      return fail(res, "File ID is required", 400);
    }

    if (!reason || !reason.trim()) {
      return fail(res, "Rejection reason is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.rejectFile({ file_id, cadmin_id, reason, auditContext });

    return success(res, result, "File rejected");
  } catch (err) {
    console.error("cadmin.docs.rejectFile", err);
    return fail(res, err.message || "Failed to reject file", err.status || 500);
  }
}

/**
 * POST /cadmin/files/batch
 * Batch verify/reject multiple files at once
 */
export async function batchUpdateFilesController(req, res) {
  try {
    const cadmin_id = req.cadmin.cadmin_id;
    const { verifyIds = [], rejectItems = [] } = req.body;

    if (verifyIds.length === 0 && rejectItems.length === 0) {
      return fail(res, "No files to update", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const result = await svc.batchUpdateFiles({
      cadmin_id,
      verifyIds,
      rejectItems,
      auditContext,
    });

    return success(res, result, `Updated ${result.updated} files`);
  } catch (err) {
    console.error("cadmin.docs.batchUpdate", err);
    return fail(res, err.message || "Failed to update files", err.status || 500);
  }
}