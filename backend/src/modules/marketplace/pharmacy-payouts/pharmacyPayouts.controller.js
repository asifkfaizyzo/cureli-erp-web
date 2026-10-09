import * as service from "./pharmacyPayouts.service.js";

function ok(res, data, message = "Success") {
  return res.json({ success: true, message, data });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

/**
 * Robustly resolves the active shop's ID across multiple common auth payloads
 */
function getShopId(req) {
  const shopId = req.shop?.shop_id || 
                 req.shop_id ||
                 req.user?.shop_id || 
                 req.user?.shopId || 
                 req.user?.shop?.shop_id || 
                 req.user?.Shop?.shop_id;
                 
  if (!shopId) {
    console.error("[payouts controller] Missing shop association in active session.", {
      user: req.user,
      shop: req.shop,
      shop_id: req.shop_id
    });
    throw new Error("Unauthorized: No shop association found on this session");
  }
  return shopId;
}

export async function getCurrentWeek(req, res) {
  try {
    const shopId = getShopId(req);
    const result = await service.getCurrentWeekPayout(shopId);
    return ok(res, result);
  } catch (err) {
    console.error("[payouts controller] getCurrentWeek error:", err);
    return fail(res, err.message, 500);
  }
}

export async function getHistory(req, res) {
  try {
    const shopId = getShopId(req);
    const { page, limit } = req.query;
    const result = await service.getPayoutHistory(shopId, { page, limit });
    return ok(res, result);
  } catch (err) {
    console.error("[payouts controller] getHistory error:", err);
    return fail(res, err.message, 500);
  }
}

export async function getDetail(req, res) {
  try {
    const shopId = getShopId(req);
    const { payoutId } = req.params;
    const result = await service.getPayoutDetail(shopId, payoutId);
    return ok(res, result);
  } catch (err) {
    console.error("[payouts controller] getDetail error:", err);
    const status = err.code === "NOT_FOUND" ? 404 : 500;
    return fail(res, err.message, status);
  }
}

export async function getSummary(req, res) {
  try {
    const shopId = getShopId(req);
    const result = await service.getEarningsSummary(shopId);
    return ok(res, result);
  } catch (err) {
    console.error("[payouts controller] getSummary error:", err);
    return fail(res, err.message, 500);
  }
}