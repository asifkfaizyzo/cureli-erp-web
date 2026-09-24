// backend/src/modules/cadmin/broadcast/email/emailBroadcast.template.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/emailBroadcast.template.js

/**
 * Builds complete HTML email for broadcast
 *
 * Features:
 * - Responsive design (mobile-friendly)
 * - Inline image support (with CID)
 * - File attachment list
 * - Action button (CTA)
 * - Unsubscribe footer
 * - Dark mode compatible
 */

// ============================================
// TEMPLATE CONFIGURATION
// ============================================

const BRAND_COLORS = {
  primary: "#05015A",
  primaryLight: "#0a0280",
  secondary: "#1f2937",
  accent: "#4f46e5",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  text: {
    primary: "#1f2937",
    secondary: "#4b5563",
    muted: "#9ca3af",
  },
  background: {
    main: "#f4f6fb",
    card: "#ffffff",
    footer: "#1f2937",
  },
};

const EMAIL_CONFIG = {
  maxWidth: 600,
  padding: 40,
  borderRadius: 12,
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

// ============================================
// COMPONENT BUILDERS
// ============================================

/**
 * Build email header with subject
 */
function buildHeader(subject) {
  return `
    <tr>
      <td style="
        background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%);
        padding: 32px ${EMAIL_CONFIG.padding}px;
        border-radius: ${EMAIL_CONFIG.borderRadius}px ${EMAIL_CONFIG.borderRadius}px 0 0;
      ">
        <h1 style="
          margin: 0;
          color: white;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.3;
        ">
          ${escapeHtml(subject)}
        </h1>
      </td>
    </tr>
  `;
}

/**
 * Build greeting section
 */
function buildGreeting(recipientName) {
  const name = recipientName || "there";
  return `
    <p style="
      margin: 0 0 20px 0;
      font-size: 16px;
      color: ${BRAND_COLORS.text.primary};
      line-height: 1.5;
    ">
      Hi <strong>${escapeHtml(name)}</strong>,
    </p>
  `;
}

/**
 * Build inline image section (embedded in email)
 */
function buildInlineImage(inlineImage) {
  if (!inlineImage || !inlineImage.url) {
    return "";
  }

  // Use CID if available (for embedded images), otherwise use URL
  const src = inlineImage.cid ? `cid:${inlineImage.cid}` : inlineImage.url;

  return `
    <div style="margin: 24px 0; text-align: center;">
      <img 
        src="${src}" 
        alt="${escapeHtml(inlineImage.original_name || "Image")}"
        style="
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
          margin: 0 auto;
        "
      />
    </div>
  `;
}

/**
 * Build action button (CTA)
 */
function buildActionButton(actionUrl, actionLabel) {
  if (!actionUrl || !actionLabel) {
    return "";
  }

  return `
    <div style="margin: 32px 0; text-align: center;">
      <a 
        href="${escapeHtml(actionUrl)}" 
        target="_blank"
        rel="noopener noreferrer"
        style="
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        "
      >
        ${escapeHtml(actionLabel)}
      </a>
    </div>
  `;
}

/**
 * Build file attachments list
 */
function buildAttachmentsList(attachments) {
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
    return "";
  }

  const attachmentItems = attachments
    .map((att) => {
      const size = att.size ? formatFileSize(att.size) : "";
      return `
        <div style="
          display: flex;
          align-items: center;
          padding: 10px 12px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
        ">
          <span style="margin-right: 8px;">📎</span>
          <a 
            href="${escapeHtml(att.url)}" 
            target="_blank"
            rel="noopener noreferrer"
            style="
              color: ${BRAND_COLORS.primary};
              text-decoration: none;
              font-size: 14px;
              flex: 1;
            "
          >
            ${escapeHtml(att.original_name || att.filename || "Attachment")}
          </a>
          ${size ? `<span style="color: ${BRAND_COLORS.text.muted}; font-size: 12px;">${size}</span>` : ""}
        </div>
      `;
    })
    .join("");

  return `
    <div style="
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    ">
      <p style="
        margin: 0 0 12px 0;
        font-size: 13px;
        color: ${BRAND_COLORS.text.muted};
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">
        Attachments
      </p>
      ${attachmentItems}
    </div>
  `;
}

/**
 * Build unsubscribe footer
 */
function buildFooter(unsubscribeUrl) {
  const currentYear = new Date().getFullYear();

  return `
    <tr>
      <td style="
        background-color: ${BRAND_COLORS.background.footer};
        padding: 24px ${EMAIL_CONFIG.padding}px;
        border-radius: 0 0 ${EMAIL_CONFIG.borderRadius}px ${EMAIL_CONFIG.borderRadius}px;
      ">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">
                This email was sent by the Cureli team.
              </p>
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px;">
                © ${currentYear} Cureli. All rights reserved.
              </p>
              ${
                unsubscribeUrl
                  ? `
                <p style="margin: 0;">
                  <a 
                    href="${escapeHtml(unsubscribeUrl)}" 
                    target="_blank"
                    style="
                      color: #9ca3af;
                      text-decoration: underline;
                      font-size: 12px;
                    "
                  >
                    Unsubscribe from broadcast emails
                  </a>
                </p>
              `
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

// ============================================
// MAIN TEMPLATE BUILDER
// ============================================

/**
 * Build complete HTML email
 *
 * @param {Object} options
 * @param {string} options.subject - Email subject
 * @param {string} options.messageHtml - Converted HTML message body
 * @param {string} options.recipientName - Recipient's name for greeting
 * @param {Object} options.inlineImage - Single inline image {url, cid, original_name}
 * @param {Array} options.attachments - File attachments [{url, original_name, size}]
 * @param {string} options.actionUrl - CTA button URL
 * @param {string} options.actionLabel - CTA button text
 * @param {string} options.unsubscribeUrl - Unsubscribe link
 * @param {boolean} options.isTest - If true, shows test banner
 * @returns {string} - Complete HTML email
 */
export function buildEmailHtml({
  subject,
  messageHtml,
  recipientName,
  inlineImage,
  attachments,
  actionUrl,
  actionLabel,
  unsubscribeUrl,
  isTest = false,
}) {
  // Test email banner
  const testBanner = isTest
    ? `
    <tr>
      <td style="
        background-color: #fef3c7;
        border: 2px dashed #f59e0b;
        padding: 12px 20px;
        text-align: center;
        border-radius: ${EMAIL_CONFIG.borderRadius}px ${EMAIL_CONFIG.borderRadius}px 0 0;
      ">
        <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 14px;">
          ⚠️ THIS IS A TEST EMAIL - Not sent to actual recipients
        </p>
      </td>
    </tr>
  `
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 10px !important; }
      .content-cell { padding: 24px !important; }
    }
  </style>
</head>
<body style="
  margin: 0;
  padding: 0;
  font-family: ${EMAIL_CONFIG.fontFamily};
  background-color: ${BRAND_COLORS.background.main};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
">
  <!-- Preheader text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${getPreheaderText(messageHtml)}
  </div>
  
  <!-- Wrapper Table -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND_COLORS.background.main};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table 
          role="presentation" 
          cellpadding="0" 
          cellspacing="0" 
          class="email-container"
          width="${EMAIL_CONFIG.maxWidth}" 
          style="max-width: ${EMAIL_CONFIG.maxWidth}px; width: 100%;"
        >
          
          ${testBanner}
          
          <!-- Header -->
          ${buildHeader(subject)}
          
          <!-- Content -->
          <tr>
            <td 
              class="content-cell"
              style="
                background-color: ${BRAND_COLORS.background.card};
                padding: ${EMAIL_CONFIG.padding}px;
                border-left: 1px solid #e5e7eb;
                border-right: 1px solid #e5e7eb;
              "
            >
              <!-- Greeting -->
              ${buildGreeting(recipientName)}
              
              <!-- Message Body -->
              <div style="
                font-size: 15px;
                color: ${BRAND_COLORS.text.secondary};
                line-height: 1.7;
              ">
                ${messageHtml}
              </div>
              
              <!-- Inline Image -->
              ${buildInlineImage(inlineImage)}
              
              <!-- Action Button -->
              ${buildActionButton(actionUrl, actionLabel)}
              
              <!-- File Attachments -->
              ${buildAttachmentsList(attachments)}
              
            </td>
          </tr>
          
          <!-- Footer -->
          ${buildFooter(unsubscribeUrl)}
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;

  return html.trim();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Escape HTML special characters
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

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Extract preheader text from message (first ~100 chars)
 */
function getPreheaderText(messageHtml) {
  if (!messageHtml) return "";

  const stripped = messageHtml
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return stripped.substring(0, 100);
}

// ============================================
// NODEMAILER ATTACHMENT FORMATTER
// ============================================

/**
 * Format attachments for Nodemailer
 *
 * @param {Object} inlineImage - Single inline image
 * @param {Array} fileAttachments - File attachments array
 * @returns {Array} - Nodemailer attachments array
 */
export function formatAttachmentsForNodemailer(
  inlineImage,
  fileAttachments = [],
) {
  const nodemailerAttachments = [];

  // Add inline image (embedded with CID)
  if (inlineImage && inlineImage.url) {
    const cid = `inline-image-${Date.now()}`;
    nodemailerAttachments.push({
      filename: inlineImage.original_name || "image.jpg",
      path: inlineImage.url,
      cid: cid,
    });
    // Return CID for use in template
    inlineImage.cid = cid;
  }

  // Add file attachments
  if (fileAttachments && Array.isArray(fileAttachments)) {
    for (const att of fileAttachments) {
      if (att.url) {
        nodemailerAttachments.push({
          filename: att.original_name || att.filename || "attachment",
          path: att.url,
        });
      }
    }
  }

  return nodemailerAttachments;
}

export default {
  buildEmailHtml,
  formatAttachmentsForNodemailer,
};
