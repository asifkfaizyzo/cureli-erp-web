// backend/src/modules/mobile/push/mobile.push.routes.js (do not remove this comment)
// backend/src/modules/mobile/push/mobile.push.routes.js

import { Router } from 'express';
import { mobileAuth } from '../../../middleware/mobile.auth.js';
import {
  registerPushToken,
  removePushToken,
  getPreferences,
  updatePreferences,
  getNotificationInbox,
  markNotificationsRead,
} from './mobile.push.controller.js';

const router = Router();

// All routes require mobile auth
router.use(mobileAuth);

// ── Token management ──────────────────────────────────────────────────────────
router.post('/register-token', registerPushToken);
router.post('/remove-token',   removePushToken);

// ── Preferences ───────────────────────────────────────────────────────────────
router.get('/preferences',   getPreferences);
router.patch('/preferences', updatePreferences);

// ── Notification inbox ────────────────────────────────────────────────────────
router.get('/inbox',       getNotificationInbox);
router.post('/inbox/read', markNotificationsRead);

export default router;