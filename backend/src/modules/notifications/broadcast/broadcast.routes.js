// backend/src/modules/notifications/broadcast/broadcast.routes.js (do not remove this comment)
import { Router } from 'express';
import { requireCAdmin } from '../../../middleware/requireCAdmin.js';
import { validate } from '../../../middleware/validate.js';
import { sendBroadcastSchema } from './broadcast.schema.js';
import { sendBroadcastController, previewBroadcastController } from './broadcast.controller.js';

const router = Router();

// All routes require CAdmin auth
router.use(requireCAdmin);

// POST /api/cadmin/broadcast - Send broadcast
router.post('/', validate(sendBroadcastSchema), sendBroadcastController);

// POST /api/cadmin/broadcast/preview - Preview audience
router.post('/preview', previewBroadcastController);

export default router;