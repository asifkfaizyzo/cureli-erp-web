// backend/src/modules/notifications/templates/email/_baseStyles.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/_baseStyles.js
// ============================================
// SHARED EMAIL STYLES - DARK MODE COMPATIBLE
// ============================================

export const BASE_META_TAGS = `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
`;

export const BASE_STYLES = `
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    
    body, table, td, div, p, a, span { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
    }
    
    /* Dark mode overrides */
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #1a1a2e !important; }
      .content-bg { background-color: #16213e !important; border-color: #2d3748 !important; }
      .card-bg { background-color: #1e293b !important; border-color: #374151 !important; }
      .otp-box { background-color: #0f3460 !important; border-color: #e94560 !important; }
      .otp-code { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
      .otp-label { color: #a0aec0 !important; }
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
      .link-box { background-color: #1e293b !important; }
      .link-text { color: #60a5fa !important; }
      .table-bg { background-color: #1e293b !important; }
      .table-row { border-color: #374151 !important; }
      .table-label { color: #9ca3af !important; }
      .table-value { color: #e0e0e0 !important; }
      .header-bg { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%) !important; }
      .header-success { background: linear-gradient(135deg, #047857 0%, #059669 100%) !important; }
      .header-warning { background: linear-gradient(135deg, #b45309 0%, #d97706 100%) !important; }
      .header-error { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%) !important; }
      .footer-bg { background-color: #0f172a !important; }
    }
    
    /* Prevent image color inversion */
    @media (prefers-color-scheme: dark) {
      img { filter: none !important; }
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 20px !important; }
      .btn { padding: 12px 28px !important; font-size: 14px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
      .header-title { font-size: 20px !important; }
    }
  </style>
`;

export const CURRENT_YEAR = new Date().getFullYear();

export default { BASE_META_TAGS, BASE_STYLES, CURRENT_YEAR };