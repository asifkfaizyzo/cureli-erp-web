// backend/src/modules/public/unsubscribe/unsubscribe.routes.js (do not remove this comment)
// unsubscribe.routes.js

import { Router } from 'express';
import express from 'express';
import * as controller from './unsubscribe.controller.js';

const router = Router();

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// ─── Specific routes FIRST ────────────────────────────────────────────────────

// GET /api/public/unsubscribe/status?email=xxx
router.get(
  '/unsubscribe/status',
  controller.checkStatusController
);

// POST /api/public/unsubscribe/one-click  (RFC 8058 - Gmail button)
router.post(
  '/unsubscribe/one-click',
  controller.oneClickUnsubscribeController
);

// POST /api/public/unsubscribe/api  (JSON response)
router.post(
  '/unsubscribe/api',
  controller.unsubscribeApiController
);

// ─── Token catch-all routes LAST ─────────────────────────────────────────────

// GET /api/public/unsubscribe/:token?email=xxx  (renders HTML confirmation page)
router.get(
  '/unsubscribe/:token',
  controller.unsubscribePageController
);

// POST /api/public/unsubscribe/:token  (form submission from confirmation page)
router.post(
  '/unsubscribe/:token',
  controller.processUnsubscribeController
);

export default router;