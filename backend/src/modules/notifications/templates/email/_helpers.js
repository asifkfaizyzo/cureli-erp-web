// backend/src/modules/notifications/templates/email/_helpers.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/_helpers.js
// ============================================
// EMAIL TEMPLATE HELPERS
// ============================================

import EMAIL_CONFIG, { getLogo } from '../../email.config.js';
import { ICONS } from './_icons.js';

// Re-export for convenience
export { EMAIL_CONFIG };

/**
 * Renders the logo HTML for email templates
 * @param {'WHITE' | 'DARK'} type - Logo type
 * @param {'header' | 'footer'} size - Size preset
 * @returns {string} - HTML string for logo
 */
export const renderLogo = (type = 'WHITE', size = 'header') => {
  const logo = getLogo(type, size);
  return `<img src="${logo.url}" alt="${logo.alt}" style="width:${logo.width};margin-bottom:${logo.marginBottom};opacity:${logo.opacity};"/>`;
};

/**
 * Renders the standard email footer
 * @returns {string} - HTML string for footer
 */
export const renderFooter = () => {
  return `
    <div class="footer-bg" style="background-color:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      ${renderLogo('WHITE', 'footer')}
      <p style="margin:0 0 6px;color:#d1d5db;">© ${EMAIL_CONFIG.CURRENT_YEAR} <strong>${EMAIL_CONFIG.COMPANY.NAME}</strong></p>
      <p style="margin:0;color:#9ca3af;">All rights reserved</p>
    </div>
  `;
};

/**
 * Renders a CTA button with an icon
 * 
 * @param {Object} options
 * @param {string} options.href       - Button URL
 * @param {string} options.text       - Button label text
 * @param {string} [options.icon]     - Icon key from ICONS (e.g. 'KEY', 'CLIPBOARD')
 * @param {string} [options.color]    - 'primary' | 'error' | 'success'
 * @returns {string} HTML string
 */
export function renderButton({ href, text, icon, color = 'primary' }) {
  const colors = {
    primary: { bg: '#05015A', hover: '#0a0280' },
    error:   { bg: '#dc2626', hover: '#b91c1c' },
    success: { bg: '#059669', hover: '#047857' },
  };

  const { bg } = colors[color] || colors.primary;

  // Build the icon HTML safely — white fill for button context
  const iconHtml = icon
    ? (ICONS[icon] || '').replace(/fill="#[^"]+"/g, 'fill="#ffffff"')
    : '';

  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}"
         target="_blank"
         style="
           display:inline-block;
           background-color:${bg};
           color:#ffffff;
           text-decoration:none;
           padding:14px 32px;
           border-radius:8px;
           font-size:15px;
           font-weight:600;
           letter-spacing:0.3px;
           line-height:1;
         ">
        ${iconHtml}
        <span style="
          vertical-align:middle;
          color:#ffffff;
          -webkit-text-fill-color:#ffffff;
        ">${text}</span>
      </a>
    </div>
  `;
}

/**
 * Base meta tags and styles for dark mode support
 * @param {string} title - Page title
 * @returns {string} - HTML string for head content
 */
export const getBaseHeadContent = (title = 'Cureli Health') => {
  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td, div, p, a, span { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #1a1a2e !important; }
      .content-bg { background-color: #16213e !important; border-color: #2d3748 !important; }
      .card-bg { background-color: #1e293b !important; border-color: #374151 !important; }
      .text-primary { color: #e0e0e0 !important; }
      .text-secondary { color: #b0b0b0 !important; }
      .text-muted { color: #888888 !important; }
      .brand-text { color: #60a5fa !important; }
      .success-box { background-color: #064e3b !important; border-color: #10b981 !important; }
      .success-text { color: #6ee7b7 !important; }
      .warning-box { background-color: #44403c !important; border-color: #ca8a04 !important; }
      .warning-text { color: #fcd34d !important; }
      .error-box { background-color: #450a0a !important; border-color: #dc2626 !important; }
      .error-text { color: #fca5a5 !important; }
      .info-box { background-color: #1e3a5f !important; border-color: #3b82f6 !important; }
      .info-text { color: #93c5fd !important; }
      .otp-box { background-color: #0f3460 !important; border-color: #e94560 !important; }
      .otp-code { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
      .table-label { color: #9ca3af !important; }
      .table-value { color: #e0e0e0 !important; }
      .header-primary { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%) !important; }
      .header-success { background: linear-gradient(135deg, #047857 0%, #059669 100%) !important; }
      .header-warning { background: linear-gradient(135deg, #b45309 0%, #d97706 100%) !important; }
      .header-error { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%) !important; }
      .header-gray { background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%) !important; }
      .footer-bg { background-color: #0f172a !important; }
    }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 20px !important; }
      .btn { padding: 12px 28px !important; font-size: 14px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
  `;
};

/**
 * Get support email link
 * @returns {string} - HTML link to support email
 */
export const getSupportLink = () => {
  return `<a href="mailto:${EMAIL_CONFIG.COMPANY.SUPPORT_EMAIL}" style="color:#05015A;text-decoration:none;font-weight:500;">${EMAIL_CONFIG.COMPANY.SUPPORT_EMAIL}</a>`;
};

export default {
  EMAIL_CONFIG,
  renderLogo,
  renderFooter,
  renderButton,
  getBaseHeadContent,
  getSupportLink,
};