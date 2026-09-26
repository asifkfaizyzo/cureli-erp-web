// backend/src/modules/inventory-import/inventoryImport.controller.js (do not remove this comment)
// src/modules/inventory-import/inventoryImport.controller.js

import inventoryImportService from "./inventoryImport.service.js";
import { success, fail }      from "../../utils/response.js";
import prisma                 from "../../config/prisma.js";
import fs                     from "fs";

function extractBranchContext(req) {
  const branchMode     = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"]   || null;

  if (req.user.role === "super_admin") {
    return {
      branchId:   branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }

  return { branchId: req.user.branch_id, branchMode: "BRANCH" };
}

class InventoryImportController {

  async upload(req, res) {
    try {
      const { branchId, branchMode } = extractBranchContext(req);

      if (!branchId || branchMode === "GLOBAL") {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return fail(
          res,
          "Please select a specific branch before importing inventory.",
          400,
          { code: "BRANCH_REQUIRED" }
        );
      }

      if (!req.file) {
        return fail(res, "No file uploaded. Please select a file.", 400);
      }

      const result = await inventoryImportService.initiateImport(
        req.file,
        branchId,
        req.user.user_id,
        req.user.shop_id
      );

      return success(res, result, "File uploaded successfully.", 201);
    } catch (error) {
      console.error("[InventoryImport] upload error:", error);

      if (req.file?.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
      }

      if (error.message?.includes("Unsupported file type")) return fail(res, error.message, 400);
      if (error.message?.includes("empty"))                  return fail(res, error.message, 400);
      if (error.message?.includes("No valid product rows"))  return fail(res, error.message, 400);

      return fail(res, error.message || "Upload failed.", 500);
    }
  }

  async getStatus(req, res) {
    try {
      const status = await inventoryImportService.getJobStatus(
        req.params.importJobId,
        req.user.shop_id
      );
      return success(res, status, "Status retrieved.");
    } catch (error) {
      console.error("[InventoryImport] getStatus error:", error);
      if (error.statusCode === 404) return fail(res, error.message, 404);
      return fail(res, error.message || "Failed to get status.", 500);
    }
  }

  async getJob(req, res) {
    try {
      const job = await inventoryImportService.getFullJob(
        req.params.importJobId,
        req.user.shop_id
      );
      return success(res, job, "Job retrieved.");
    } catch (error) {
      console.error("[InventoryImport] getJob error:", error);
      if (error.statusCode === 404) return fail(res, error.message, 404);
      return fail(res, error.message || "Failed to get job.", 500);
    }
  }

  async getJobDetail(req, res) {
    try {
      const detail = await inventoryImportService.getJobDetail(
        req.params.importJobId,
        req.user.shop_id
      );
      return success(res, detail, "Job detail retrieved.");
    } catch (error) {
      console.error("[InventoryImport] getJobDetail error:", error);
      if (error.statusCode === 404) return fail(res, error.message, 404);
      if (error.statusCode === 403) return fail(res, error.message, 403);
      return fail(res, error.message || "Failed to get job detail.", 500);
    }
  }

  async resolve(req, res) {
    try {
      const { importJobId }              = req.params;
      const { conflictDecisions = {} }   = req.body;

      const result = await inventoryImportService.submitConflictDecisions(
        importJobId,
        req.user.shop_id,
        conflictDecisions
      );

      return success(res, result, "Conflict decisions saved.");
    } catch (error) {
      console.error("[InventoryImport] resolve error:", error);

      if (error.code === "INVALID_STATE") {
        return fail(res, error.message, 400, { code: "INVALID_STATE" });
      }
      if (error.validationErrors) {
        return fail(res, error.message, 400, {
          code: "INVALID_DECISIONS",
          validationErrors: error.validationErrors,
        });
      }

      return fail(res, error.message || "Failed to save decisions.", 500);
    }
  }

  async confirm(req, res) {
    try {
      const result = await inventoryImportService.confirmImport(
        req.params.importJobId,
        req.user.shop_id,
        req.user.user_id
      );
      return success(res, result, "Import started. Poll status for completion.", 202);
    } catch (error) {
      console.error("[InventoryImport] confirm error:", error);

      if (error.code === "INVALID_STATE")        return fail(res, error.message, 400, { code: "INVALID_STATE" });
      if (error.code === "FILE_MISSING")         return fail(res, error.message, 500, { code: "FILE_MISSING" });
      if (error.code === "INCOMPLETE_DECISIONS") return fail(res, error.message, 400, { code: "INCOMPLETE_DECISIONS" });

      return fail(res, error.message || "Import failed.", 500);
    }
  }

  async cancelJob(req, res) {
    try {
      await inventoryImportService.cancelJob(
        req.params.importJobId,
        req.user.shop_id,
        req.user.user_id
      );
      return success(res, { importJobId: req.params.importJobId }, "Import job cancelled.");
    } catch (error) {
      console.error("[InventoryImport] cancelJob error:", error);
      if (error.statusCode === 404) return fail(res, error.message, 404);
      return fail(res, error.message || "Failed to cancel job.", 500);
    }
  }

  async getHistory(req, res) {
    try {
      const { branchId } = extractBranchContext(req);
      const result = await inventoryImportService.getImportHistory(
        req.user.shop_id,
        branchId,
        parseInt(req.query.page)  || 1,
        parseInt(req.query.limit) || 20
      );
      return success(res, result, "Import history retrieved.");
    } catch (error) {
      console.error("[InventoryImport] getHistory error:", error);
      return fail(res, error.message || "Failed to get history.", 500);
    }
  }

  async downloadErrorReport(req, res) {
    try {
      const { importJobId } = req.params;
      const shopId          = req.user.shop_id;

      const job = await prisma.inventoryImportJob.findUnique({
        where:  { import_job_id: importJobId },
        select: { shop_id: true, original_file_name: true, error_log: true },
      });

      if (!job)                   return fail(res, "Job not found.", 404);
      if (job.shop_id !== shopId) return fail(res, "Access denied.", 403);

      // Guard against non-array error_log (legacy jobs)
      const errorLog = Array.isArray(job.error_log) ? job.error_log : [];

      if (errorLog.length === 0) {
        return fail(res, "No errors to download.", 404);
      }

      const headers = ["Row Number", "Product Name", "Batch Number", "Error Code", "Field", "Message"];
      const lines   = [
        headers.join(","),
        ...errorLog.flatMap((r) => {
          const errors = r.errors || [r];
          return errors.map((e) =>
            [
              ((r.rowIndex ?? 0) + 1),
              `"${(r.productName || "").replace(/"/g, '""')}"`,
              `"${(r.batchNumber || "").replace(/"/g, '""')}"`,
              e.code    || "",
              e.field   || "",
              `"${(e.message || "").replace(/"/g, '""')}"`,
            ].join(",")
          );
        }),
      ];

      const baseName = job.original_file_name.replace(/\.[^.]+$/, "");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${baseName}_errors.csv"`);
      res.send(lines.join("\n"));
    } catch (error) {
      console.error("[InventoryImport] downloadErrorReport error:", error);
      return fail(res, error.message || "Failed to generate report.", 500);
    }
  }
}

const controller = new InventoryImportController();

export default {
  upload:              controller.upload.bind(controller),
  getStatus:           controller.getStatus.bind(controller),
  getJob:              controller.getJob.bind(controller),
  getJobDetail:        controller.getJobDetail.bind(controller),
  resolve:             controller.resolve.bind(controller),
  confirm:             controller.confirm.bind(controller),
  cancelJob:           controller.cancelJob.bind(controller),
  getHistory:          controller.getHistory.bind(controller),
  downloadErrorReport: controller.downloadErrorReport.bind(controller),
};