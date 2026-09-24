// backend/src/modules/mobile/notifications/mobile.notifications.routes.js (do not remove this comment)
// backend/src/modules/mobile/notifications/mobile.notifications.routes.js

import { Router } from 'express';
import { streamMobileNotifications } from './mobile.notifications.controller.js';

const router = Router();

/**
 * GET /mobile/notifications/stream?token=<access_token>
 *
 * SSE endpoint for mobile customers.
 * Token is passed as query param because EventSource (and react-native-sse)
 * cannot set custom headers — same pattern as ERP /api/notifications/stream.
 *
 * No mobileAuth middleware here — auth is handled inline in the controller
 * because SSE connections must not call next() and must keep the response open.
 */
router.get('/stream', streamMobileNotifications);

export default router;