// backend/src/modules/mobile/checkout/mobile.checkout.routes.js (do not remove this comment)
// backend/src/modules/mobile/checkout/mobile.checkout.routes.js

import { Router } from 'express';
import { mobileAuth } from '../../../middleware/mobile.auth.js';
import { requireProfileComplete } from "../../../middleware/requireProfileComplete.js";

import {
  quoteHandler,
  createSessionHandler,
  confirmHandler,
  webhookHandler,
} from './mobile.checkout.controller.js';

const router = Router();

// Webhook — no auth, Razorpay calls this directly
router.post('/webhook', webhookHandler);

// Auth-required routes
router.use(mobileAuth);
router.use(requireProfileComplete); 
router.post('/quote',          quoteHandler);
router.post('/create-session', createSessionHandler);
router.post('/confirm',        confirmHandler);

export default router;