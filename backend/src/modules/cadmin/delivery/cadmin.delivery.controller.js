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