// backend/src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.controller.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/mobile/cadminMobileBroadcast.controller.js

import { success, fail } from '../../../../utils/response.js';
import * as audit   from '../../../audit/index.js';
import * as service from './cadminMobileBroadcast.service.js';

export async function previewAudienceController(req, res) {
  try {
    const { audience_filters = {} } = req.body;
    const result = await service.previewMobileAudience(audience_filters);
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Preview failed', err.status || 500);
  }
}

export async function sendNowController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const result = await service.sendMobileBroadcastNow(req.body, {
      ...auditContext,
      actor_id:   req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || 'CAdmin',
    });
    return success(res, result, 'Broadcast sent successfully');
  } catch (err) {
    return fail(res, err.message || 'Send failed', err.status || 500);
  }
}

export async function createDraftController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const result = await service.createMobileBroadcastDraft(req.body, {
      ...auditContext,
      actor_id:   req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || 'CAdmin',
    });
    return success(res, result, 'Draft created', 201);
  } catch (err) {
    return fail(res, err.message || 'Create draft failed', err.status || 500);
  }
}

export async function updateDraftController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const result = await service.updateMobileBroadcastDraft(
      req.params.id,
      req.body,
      {
        ...auditContext,
        actor_id:   req.cadmin?.cadmin_id,
        actor_name: req.cadmin?.name || 'CAdmin',
      },
    );
    return success(res, result, 'Draft updated');
  } catch (err) {
    return fail(res, err.message || 'Update failed', err.status || 500);
  }
}

export async function getDraftsController(req, res) {
  try {
    const page  = parseInt(req.query.page  ?? '1');
    const limit = parseInt(req.query.limit ?? '10');
    const result = await service.getMobileBroadcastDrafts(
      req.cadmin.cadmin_id,
      { page, limit },
    );
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Fetch drafts failed', err.status || 500);
  }
}

export async function scheduleController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const result = await service.scheduleMobileBroadcast(
      req.params.id,
      req.body.scheduled_for,
      {
        ...auditContext,
        actor_id:   req.cadmin?.cadmin_id,
        actor_name: req.cadmin?.name || 'CAdmin',
      },
    );
    return success(res, result, 'Broadcast scheduled');
  } catch (err) {
    return fail(res, err.message || 'Schedule failed', err.status || 500);
  }
}

export async function getScheduledController(req, res) {
  try {
    const page  = parseInt(req.query.page  ?? '1');
    const limit = parseInt(req.query.limit ?? '10');
    const result = await service.getMobileBroadcastScheduled({ page, limit });
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Fetch scheduled failed', err.status || 500);
  }
}

export async function getHistoryController(req, res) {
  try {
    const page  = parseInt(req.query.page  ?? '1');
    const limit = parseInt(req.query.limit ?? '20');
    const result = await service.getMobileBroadcastHistory({ page, limit });
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Fetch history failed', err.status || 500);
  }
}

export async function getCampaignByIdController(req, res) {
  try {
    const result = await service.getMobileBroadcastById(req.params.id);
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Fetch campaign failed', err.status || 404);
  }
}

export async function cancelOrDeleteController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const result = await service.cancelOrDeleteMobileCampaign(req.params.id, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
    });
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Cancel/delete failed', err.status || 500);
  }
}