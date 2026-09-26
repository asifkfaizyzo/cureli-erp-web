//backend\src\modules\rider\delivery\rider.delivery.controller.js
import * as service from "./rider.delivery.service.js";
import {
  declineDeliverySchema,
  updateDeliveryStatusSchema,
  completeDeliverySchema,
} from "./rider.delivery.schema.js";

export async function getActiveDelivery(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const delivery = await service.getActiveDelivery(riderId);
    return res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function acceptDelivery(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { deliveryId } = req.params;
    const result = await service.acceptDelivery(deliveryId, riderId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function declineDelivery(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { deliveryId } = req.params;
    const validated = declineDeliverySchema.parse(req.body);
    const result = await service.declineDelivery(deliveryId, riderId, validated);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateDeliveryStatus(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { deliveryId } = req.params;
    const validated = updateDeliveryStatusSchema.parse(req.body);
    const result = await service.updateDeliveryStatus(deliveryId, riderId, validated);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function completeDelivery(req, res) {
  try {
    const riderId = req.rider.rider_id;
    const { deliveryId } = req.params;
    const validated = completeDeliverySchema.parse(req.body);
    const result = await service.completeDeliveryWithOtp(deliveryId, riderId, validated);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}