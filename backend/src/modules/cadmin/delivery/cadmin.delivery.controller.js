//backend\src\modules\cadmin\delivery\cadmin.delivery.controller.js
import * as cadminDeliveryService from "./cadmin.delivery.service.js";
import {
  getAvailableRidersSchema,
  assignRiderSchema,
} from "./cadmin.delivery.schema.js";

export async function getAvailableRiders(req, res) {
  try {
    const validated = getAvailableRidersSchema.parse(req.query);
    const result = await cadminDeliveryService.getAvailableRidersForOrder(validated);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function assignRider(req, res) {
  try {
    const validated = assignRiderSchema.parse(req.body);
    const assignedBy = req.cadmin?.full_name || req.cadmin?.email || "CAdmin";
    const result = await cadminDeliveryService.assignRiderToOrder({
      ...validated,
      assigned_by: assignedBy,
    });
    return res.status(200).json({
      success: true,
      message: "Rider assigned successfully",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function unassignRider(req, res) {
  try {
    const { order_id } = req.body || {};

    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "order_id is required" });
    }

    const unassignedBy =
      req.cadmin?.full_name || req.cadmin?.email || "CAdmin";

    const result = await cadminDeliveryService.unassignRiderFromOrder({
      order_id,
      unassigned_by: unassignedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Rider unassigned successfully",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── Same Day Batch Endpoints ─────────────────────────────────────────────

export async function batchAssign(req, res) {
  try {
    const { order_ids, rider_id } = req.body || {};

    if (!order_ids?.length || !rider_id) {
      return res.status(400).json({
        success: false,
        message: "order_ids (array) and rider_id are required",
      });
    }

    const assignedBy = req.cadmin?.full_name || req.cadmin?.email || "CAdmin";
    const result = await cadminDeliveryService.batchAssignOrders({
      order_ids,
      rider_id,
      assigned_by: assignedBy,
    });

    return res.status(200).json({
      success: true,
      message: `Batch of ${result.order_count} orders assigned successfully`,
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getAvailableTeamRiders(req, res) {
  try {
    const result = await cadminDeliveryService.getAvailableTeamRidersForBatch();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function addOrderToBatch(req, res) {
  try {
    const { order_id, rider_id } = req.body || {};

    if (!order_id || !rider_id) {
      return res.status(400).json({
        success: false,
        message: "order_id and rider_id are required",
      });
    }

    const assignedBy = req.cadmin?.full_name || req.cadmin?.email || "CAdmin";
    const result = await cadminDeliveryService.addOrderToBatch({
      order_id,
      rider_id,
      assigned_by: assignedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Order added to batch",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function reassignBatchOrder(req, res) {
  try {
    const { delivery_id, new_rider_id } = req.body || {};

    if (!delivery_id || !new_rider_id) {
      return res.status(400).json({
        success: false,
        message: "delivery_id and new_rider_id are required",
      });
    }

    const reassignedBy =
      req.cadmin?.full_name || req.cadmin?.email || "CAdmin";
    const result = await cadminDeliveryService.reassignBatchOrder({
      delivery_id,
      new_rider_id,
      reassigned_by: reassignedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Order reassigned successfully",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getBatchOrders(req, res) {
  try {
    const { batch_group_id } = req.query;
    if (!batch_group_id) {
      return res
        .status(400)
        .json({ success: false, message: "batch_group_id is required" });
    }
    const result = await cadminDeliveryService.getBatchOrders(batch_group_id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getActiveBatches(req, res) {
  try {
    const result = await cadminDeliveryService.getActiveBatches();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function removeOrderFromBatch(req, res) {
  try {
    const { delivery_id } = req.body || {};
    if (!delivery_id) {
      return res
        .status(400)
        .json({ success: false, message: "delivery_id is required" });
    }
    const result = await cadminDeliveryService.removeOrderFromBatch({ delivery_id });
    return res.status(200).json({
      success: true,
      message: "Order removed from batch",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getBatchHistory(req, res) {
  try {
    const { date, page, limit } = req.query;
    const result = await cadminDeliveryService.getBatchHistory({
      date,
      page,
      limit,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}