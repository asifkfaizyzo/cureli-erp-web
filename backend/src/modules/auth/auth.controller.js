// backend/src/modules/auth/auth.controller.js (do not remove this comment)
import { fail, success } from "../../utils/response.js";
import { requestPasswordReset, resetPassword } from "./auth.service.js";
import * as audit from "../audit/index.js";

export async function forgotPasswordController(req, res) {
  try {
    const { email } = req.validated;

    await requestPasswordReset(email);

    return success(
      res,
      {},
      "If that email exists, we've sent a password reset link"
    );
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to process request", 500);
  }
}

export async function resetPasswordController(req, res) {
  try {
    const { token, password } = req.validated;

    const auditContext = audit.extractRequestContext(req);

    await resetPassword(token, password, auditContext);

    return success(res, {}, "Password reset successful. You can now log in.");
  } catch (err) {
    if (err.code === "INVALID_TOKEN") {
      return fail(res, err.message, 400);
    }
    console.error(err);
    return fail(res, "Failed to reset password", 500);
  }
}