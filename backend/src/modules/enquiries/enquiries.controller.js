// backend/src/modules/enquiries/enquiries.controller.js (do not remove this comment)
// backend/src/modules/enquiries/enquiries.controller.js
import { success, fail } from "../../utils/response.js";
import { verifyRecaptcha } from "../../utils/recaptcha.js";
import * as enquiryService from "./enquiries.service.js";
import * as audit from "../audit/index.js";

// Logger utility - only logs in development
const log = {
  info: (...args) => {
    // if (process.env.NODE_ENV !== "production") {
    //   console.log(...args);
    // }
  },
  error: (...args) => console.error(...args),
};

// No changes needed - external submission, no authenticated user
export const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, message, recaptchaToken } = req.validated;

    // Double-check validation (Zod already validates, but safety first)
    if (!name || !email || !message) {
      return fail(res, "Name, email, and message are required", 400);
    }

    // reCAPTCHA verification in production
    if (process.env.NODE_ENV === "production") {
      if (!recaptchaToken) {
        return fail(res, "Security verification required", 400);
      }

      try {
        const recaptchaResult = await verifyRecaptcha(recaptchaToken);

        if (!recaptchaResult || !recaptchaResult.success) {
          log.info("reCAPTCHA verification failed:", recaptchaResult);
          return fail(
            res,
            "Security verification failed. Please try again.",
            400,
          );
        }

        // Check reCAPTCHA score (v3 returns a score 0.0 - 1.0)
        if (
          recaptchaResult.score !== undefined &&
          recaptchaResult.score < 0.5
        ) {
          log.info("reCAPTCHA score too low:", recaptchaResult.score);
          return fail(
            res,
            "Security verification failed. Please try again.",
            400,
          );
        }
      } catch (recaptchaError) {
        log.error("reCAPTCHA verification error:", recaptchaError);
        // Optionally allow request through if reCAPTCHA service is down
        // return fail(res, "Security service unavailable. Please try again.", 503);
      }
    }

    const enquiry = await enquiryService.createEnquiry({
      name,
      email,
      phone: phone || null,
      message,
    });

    log.info(" Enquiry created:", enquiry.enquiry_number);
    return success(
      res,
      { enquiry_number: enquiry.enquiry_number },
      "Your enquiry has been submitted successfully!",
      201,
    );
  } catch (error) {
    log.error("Submit enquiry error:", error);
    return fail(res, "Failed to submit enquiry. Please try again.", 500);
  }
};

// Read-only, no changes needed
export const listEnquiries = async (req, res) => {
  try {
    // Use validated query params from middleware
    const { page, limit, status, search, sortBy, sortOrder } =
      req.validatedQuery || req.query;



    const result = await enquiryService.listEnquiries({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status: status || "ALL",
      search: search || "",
      sortBy: sortBy || "created_at",
      sortOrder: sortOrder || "desc",
    });

    

    return success(res, result, "Enquiries fetched successfully");
  } catch (error) {
    log.error(" List enquiries error:", error);
    return fail(res, "Failed to fetch enquiries", 500);
  }
};

// Read-only, no changes needed
export const getEnquiryStats = async (req, res) => {
  try {
    const stats = await enquiryService.getEnquiryStats();

    return success(res, { stats }, "Enquiry stats fetched successfully");
  } catch (error) {
    log.error(" Get enquiry stats error:", error);
    return fail(res, "Failed to fetch enquiry stats", 500);
  }
};

// Read-only, no changes needed
export const getEnquiryDetails = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;

    if (!enquiryId) {
      return fail(res, "Enquiry ID is required", 400);
    }

    const enquiry = await enquiryService.getEnquiryById(enquiryId);

    if (!enquiry) {
      return fail(res, "Enquiry not found", 404);
    }

    return success(res, { enquiry }, "Enquiry details fetched successfully");
  } catch (error) {
    log.error("Get enquiry details error:", error);
    return fail(res, "Failed to fetch enquiry details", 500);
  }
};

//  UPDATED: Extract audit context and pass to service
export const replyToEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;
    const { subject, message } = req.validated;
    const adminId = req.cadmin.cadmin_id;

    if (!enquiryId) {
      return fail(res, "Enquiry ID is required", 400);
    }

    if (!subject || !message) {
      return fail(res, "Subject and message are required", 400);
    }

    // Extract audit context
    const auditContext = audit.extractRequestContext(req);

    const result = await enquiryService.replyToEnquiry(
      enquiryId,
      adminId,
      { subject, message },
      auditContext,
    );

    if (!result.emailSent) {
      log.error("Email send failed:", result.emailError);
      return success(
        res,
        { reply: result.reply, emailSent: false },
        `Reply saved but email failed to send: ${result.emailError}`,
        201,
      );
    }

    log.info(" Reply sent successfully for enquiry:", enquiryId);

    return success(
      res,
      { reply: result.reply, emailSent: true },
      "Reply sent successfully",
      201,
    );
  } catch (error) {
    log.error("Reply to enquiry error:", error);
    if (error.message === "Enquiry not found") {
      return fail(res, "Enquiry not found", 404);
    }
    return fail(res, "Failed to send reply", 500);
  }
};

//  UPDATED: Extract audit context and pass to service
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;
    const { status } = req.validated;

    if (!enquiryId) {
      return fail(res, "Enquiry ID is required", 400);
    }

    if (!status) {
      return fail(res, "Status is required", 400);
    }

    // Extract audit context
    const auditContext = audit.extractRequestContext(req);

    const enquiry = await enquiryService.updateEnquiryStatus(
      enquiryId,
      status,
      auditContext,
    );

    log.info(" Enquiry status updated:", enquiryId, "->", status);

    return success(res, { enquiry }, "Enquiry status updated successfully");
  } catch (error) {
    log.error("Update enquiry status error:", error);
    if (error.message === "Enquiry not found") {
      return fail(res, "Enquiry not found", 404);
    }
    return fail(res, "Failed to update enquiry status", 500);
  }
};

// No changes needed - deletion not audited
export const deleteEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;

    if (!enquiryId) {
      return fail(res, "Enquiry ID is required", 400);
    }

    await enquiryService.deleteEnquiry(enquiryId);

    log.info(" Enquiry deleted:", enquiryId);

    return success(res, {}, "Enquiry deleted successfully");
  } catch (error) {
    log.error("Delete enquiry error:", error);
    if (error.message === "Enquiry not found") {
      return fail(res, "Enquiry not found", 404);
    }
    return fail(res, "Failed to delete enquiry", 500);
  }
};
