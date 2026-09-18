// backend/src/modules/cadmin/broadcast/mobile-email/cadminMobileEmailBroadcast.controller.js

import { success, fail } from "../../../../utils/response.js";
import * as audit from "../../../audit/index.js";
import * as service from "./cadminMobileEmailBroadcast.service.js";
import {
  sendMobileEmailSchema,
  scheduleMobileEmailSchema,
  sendTestMobileEmailSchema,
} from "./cadminMobileEmailBroadcast.schema.js";

export async function previewAudience(req, res) {
  try {
    const filters = req.body.target_filters || req.body || {};
    const result = await service.previewCustomerAudience(filters);
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || "Preview failed", 500);
  }
}

export async function sendNow(req, res) {
  try {
    const parsed = sendMobileEmailSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const auditContext = audit.extractRequestContext(req);
    const result = await service.sendCustomerEmailBroadcastNow(parsed.data, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });
    return success(res, result, "Customer email broadcast queued successfully");
  } catch (err) {
    return fail(res, err.message || "Send failed", 500);
  }
}

export async function sendTestEmail(req, res) {
  try {
    const parsed = sendTestMobileEmailSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const adminEmail = req.cadmin?.email;
    const result = await service.sendTestEmailToAdmin(parsed.data, adminEmail);
    return success(res, result, `Test email sent to ${adminEmail}`);
  } catch (err) {
    return fail(res, err.message || "Test email failed", 500);
  }
}

export async function createDraft(req, res) {
  try {
    const parsed = sendMobileEmailSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const auditContext = audit.extractRequestContext(req);
    const result = await service.createCustomerEmailDraft(parsed.data, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || "CAdmin",
    });
    return success(res, result, "Draft created", 201);
  } catch (err) {
    return fail(res, err.message || "Create draft failed", 500);
  }
}

export async function updateDraft(req, res) {
  try {
    const result = await service.updateCustomerEmailDraft(req.params.id, req.body);
    return success(res, result, "Draft updated");
  } catch (err) {
    return fail(res, err.message || "Update draft failed", 500);
  }
}

export async function deleteDraft(req, res) {
  try {
    const result = await service.deleteCustomerEmailDraft(req.params.id);
    return success(res, result, "Draft deleted");
  } catch (err) {
    return fail(res, err.message || "Delete draft failed", 500);
  }
}

export async function scheduleCampaign(req, res) {
  try {
    const parsed = scheduleMobileEmailSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error.errors[0].message, 400);

    const result = await service.scheduleCustomerEmailCampaign(
      req.params.id,
      parsed.data.scheduled_for
    );
    return success(res, result, "Campaign scheduled successfully");
  } catch (err) {
    return fail(res, err.message || "Schedule failed", 500);
  }
}

export async function getDrafts(req, res) {
  try {
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "10");
    const result = await service.getCustomerEmailDrafts(req.cadmin.cadmin_id, { page, limit });
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || "Fetch drafts failed", 500);
  }
}

export async function getScheduled(req, res) {
  try {
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "10");
    const result = await service.getCustomerEmailScheduled({ page, limit });
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || "Fetch scheduled failed", 500);
  }
}

export async function getHistory(req, res) {
  try {
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "20");
    const search = req.query.search;
    const result = await service.getCustomerEmailHistory({ page, limit, search });
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || "Fetch history failed", 500);
  }
}

export async function getCampaignById(req, res) {
  try {
    const result = await service.getCustomerEmailCampaignById(req.params.id);
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || "Fetch campaign failed", 404);
  }
}