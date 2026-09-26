// backend/src/modules/public/unsubscribe/unsubscribe.controller.js (do not remove this comment)
// backend/src/modules/public/unsubscribe/unsubscribe.controller.js

import {
  processUnsubscribe,
  isUnsubscribed,
  buildUnsubscribeUrl,
} from "../../cadmin/broadcast/email/emailBroadcast.unsubscribe.js";

// ============================================
// CONFIGURATION
// ============================================

const APP_NAME = "Cureli";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@cureli.com";

// ============================================
// UNSUBSCRIBE PAGE (GET)
// ============================================

/**
 * Render unsubscribe confirmation page
 * GET /api/public/unsubscribe/:token?email=xxx
 */
export async function unsubscribePageController(req, res) {
  try {
    const { token } = req.params;
    const { email } = req.query;

    if (!token || !email) {
      return res.status(400).send(renderErrorPage("Invalid unsubscribe link"));
    }

    // Check if already unsubscribed
    const alreadyUnsubscribed = await isUnsubscribed(email);

    if (alreadyUnsubscribed) {
      return res.send(renderSuccessPage(email, true));
    }

    // Render confirmation page
    return res.send(renderConfirmationPage(email, token));
  } catch (err) {
    console.error("[Unsubscribe] Page render failed:", err);
    return res
      .status(500)
      .send(renderErrorPage("Something went wrong. Please try again."));
  }
}

// ============================================
// PROCESS UNSUBSCRIBE (POST)
// ============================================

/**
 * Process unsubscribe request
 * POST /api/public/unsubscribe/:token
 */
export async function processUnsubscribeController(req, res) {
  try {
    const { token } = req.params;
    const { email, reason } = req.body;

    if (!token || !email) {
      return res
        .status(400)
        .send(renderErrorPage("Invalid unsubscribe request"));
    }

    const result = await processUnsubscribe(token, email, reason);

    if (!result.success) {
      return res
        .status(400)
        .send(renderErrorPage(result.error || "Failed to unsubscribe"));
    }

    return res.send(renderSuccessPage(email, result.alreadyUnsubscribed));
  } catch (err) {
    console.error("[Unsubscribe] Process failed:", err);
    return res
      .status(500)
      .send(renderErrorPage("Something went wrong. Please try again."));
  }
}

// ============================================
// ONE-CLICK UNSUBSCRIBE (POST - RFC 8058)
// ============================================

/**
 * One-click unsubscribe handler (for email clients that support it)
 * POST /api/public/unsubscribe/one-click
 *
 * RFC 8058 compliant - requires List-Unsubscribe-Post header
 */
export async function oneClickUnsubscribeController(req, res) {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const result = await processUnsubscribe(
      token,
      email,
      "One-click unsubscribe",
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    // Return 200 OK for one-click (email clients expect this)
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Unsubscribe] One-click failed:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

// ============================================
// API ENDPOINT (JSON Response)
// ============================================

/**
 * API endpoint for unsubscribe (returns JSON)
 * POST /api/public/unsubscribe/api
 */
export async function unsubscribeApiController(req, res) {
  try {
    const { token, email, reason } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: "Token and email are required",
      });
    }

    const result = await processUnsubscribe(token, email, reason);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("[Unsubscribe] API failed:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred",
    });
  }
}

// ============================================
// CHECK SUBSCRIPTION STATUS
// ============================================

/**
 * Check if email is unsubscribed
 * GET /api/public/unsubscribe/status?email=xxx
 */
export async function checkStatusController(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const unsubscribed = await isUnsubscribed(email);

    return res.json({
      success: true,
      email,
      unsubscribed,
    });
  } catch (err) {
    console.error("[Unsubscribe] Status check failed:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to check status",
    });
  }
}

// ============================================
// HTML PAGE RENDERERS
// ============================================

/**
 * Render confirmation page (asks user to confirm unsubscribe)
 */
function renderConfirmationPage(email, token) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe - ${APP_NAME}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
    }
    
    .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #05015A 0%, #0a0280 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    
    .logo svg {
      width: 32px;
      height: 32px;
      fill: white;
    }
    
    h1 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    
    .email-display {
      background: #f3f4f6;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      color: #4b5563;
      margin: 20px 0;
      word-break: break-all;
    }
    
    p {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    
    .reason-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 20px;
      resize: vertical;
      min-height: 80px;
    }
    
    .reason-input:focus {
      outline: none;
      border-color: #05015A;
      box-shadow: 0 0 0 3px rgba(5, 1, 90, 0.1);
    }
    
    .btn {
      display: inline-block;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #4b5563;
      margin-left: 12px;
    }
    
    .btn-secondary:hover {
      background: #e5e7eb;
    }
    
    .buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .note {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #9ca3af;
    }
    
    .note a {
      color: #05015A;
      text-decoration: none;
    }
    
    .note a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
    </div>
    
    <h1>Unsubscribe from Emails</h1>
    
    <div class="email-display">${escapeHtml(email)}</div>
    
    <p>
      Are you sure you want to unsubscribe from broadcast emails? 
      You will no longer receive promotional updates and announcements from ${APP_NAME}.
    </p>
    
    <form method="POST" action="/api/public/unsubscribe/${token}">
      <input type="hidden" name="email" value="${escapeHtml(email)}">
      
      <textarea 
        name="reason" 
        class="reason-input" 
        placeholder="Help us improve: Why are you unsubscribing? (optional)"
      ></textarea>
      
      <div class="buttons">
        <button type="submit" class="btn btn-primary">
          Unsubscribe
        </button>
        <a href="javascript:window.close()" class="btn btn-secondary">
          Cancel
        </a>
      </div>
    </form>
    
    <p class="note">
      You can always re-subscribe by contacting 
      <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Render success page
 */
function renderSuccessPage(email, alreadyUnsubscribed = false) {
  const message = alreadyUnsubscribed
    ? "You were already unsubscribed from our broadcast emails."
    : "You have been successfully unsubscribed from broadcast emails.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - ${APP_NAME}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
    }
    
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    
    .icon svg {
      width: 40px;
      height: 40px;
      stroke: white;
      stroke-width: 3;
      fill: none;
    }
    
    h1 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    
    .email-display {
      background: #f3f4f6;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      color: #4b5563;
      margin: 20px 0;
      word-break: break-all;
    }
    
    p {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    
    .note {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #9ca3af;
    }
    
    .note a {
      color: #05015A;
      text-decoration: none;
    }
    
    .note a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    
    <h1>Unsubscribed Successfully</h1>
    
    <div class="email-display">${escapeHtml(email)}</div>
    
    <p>${message}</p>
    
    <p class="note">
      Changed your mind? Contact 
      <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      to re-subscribe.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Render error page
 */
function renderErrorPage(errorMessage) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - ${APP_NAME}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
    }
    
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    
    .icon svg {
      width: 40px;
      height: 40px;
      stroke: white;
      stroke-width: 3;
      fill: none;
    }
    
    h1 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    
    p {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    
    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      margin: 20px 0;
    }
    
    .note {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #9ca3af;
    }
    
    .note a {
      color: #05015A;
      text-decoration: none;
    }
    
    .note a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    
    <h1>Something Went Wrong</h1>
    
    <div class="error-message">${escapeHtml(errorMessage)}</div>
    
    <p>
      We couldn't process your unsubscribe request. 
      Please try again or contact support.
    </p>
    
    <p class="note">
      Need help? Contact 
      <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(text).replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

export default {
  unsubscribePageController,
  processUnsubscribeController,
  oneClickUnsubscribeController,
  unsubscribeApiController,
  checkStatusController,
};
