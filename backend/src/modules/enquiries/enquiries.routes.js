// backend/src/modules/enquiries/enquiries.routes.js (do not remove this comment)
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.js";
import { createEnquirySchema } from "./enquiries.schema.js";
import { submitEnquiry } from "./enquiries.controller.js";

const router = Router();

const enquirySubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many enquiries submitted. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictEnquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Enquiry limit reached. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// PUBLIC ONLY — no admin routes here
router.post(
  "/",
  strictEnquiryLimiter,
  enquirySubmitLimiter,
  validate(createEnquirySchema, "body"),
  submitEnquiry
);

export default router;