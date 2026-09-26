// backend/src/modules/marketplace/marketplace.holidays.controller.js (do not remove this comment)
// backend/src/modules/marketplace/marketplace.holidays.controller.js
// NEW FILE

import {
  listHolidays,
  createHoliday,
  deleteHoliday,
} from './marketplace.holidays.service.js';

export async function getHolidays(req, res) {
  try {
    const shop_id   = req.user.shop_id;
    const branch_id = req.query.branch_id || null;

    const holidays = await listHolidays(shop_id, branch_id);
    res.json({ success: true, data: { holidays } });
  } catch (err) {
    console.error('[HolidaysController] getHolidays error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function postHoliday(req, res) {
  try {
    const shop_id    = req.user.shop_id;
    const created_by = req.user.user_id;
    const { branch_id, scope, holiday_date, reason } = req.body;

    if (!branch_id)    return res.status(400).json({ success: false, message: 'branch_id is required' });
    if (!scope)        return res.status(400).json({ success: false, message: 'scope is required (BRANCH or SHOP)' });
    if (!holiday_date) return res.status(400).json({ success: false, message: 'holiday_date is required (YYYY-MM-DD)' });
    if (!['BRANCH', 'SHOP'].includes(scope)) {
      return res.status(400).json({ success: false, message: 'scope must be BRANCH or SHOP' });
    }

    const holiday = await createHoliday({
      shop_id,
      branch_id,
      scope,
      holiday_date,
      reason,
      created_by,
    });

    res.status(201).json({ success: true, data: { holiday } });
  } catch (err) {
    const status = err.message.includes('not found') ? 404
      : err.message.includes('already exists') ? 409
      : err.message.includes('past dates') ? 400
      : err.message.includes('Invalid date') ? 400
      : 500;

    res.status(status).json({ success: false, message: err.message });
  }
}

export async function deleteHolidayHandler(req, res) {
  try {
    const shop_id    = req.user.shop_id;
    const { holiday_id } = req.params;

    await deleteHoliday(holiday_id, shop_id);
    res.json({ success: true, message: 'Holiday removed' });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}