// backend/src/modules/notifications/email.config.js (do not remove this comment)
// backend/src/modules/notifications/email.config.js
// ============================================
// EMAIL CONFIGURATION - S3 ONLY
// ============================================

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.USER_FRONTEND_ORIGIN || 'http://localhost:5173';

// S3 Configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'cureli-prod-assets';
const S3_REGION = process.env.AWS_REGION || 'ap-south-1';

// S3 Logo URLs
const S3_EMAIL_ASSETS_BASE = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/email-assets`;

export const EMAIL_CONFIG = {
  // ============================================
  // URLs
  // ============================================
  FRONTEND_URL,
  
  // ============================================
  // S3 Configuration
  // ============================================
  S3: {
    BUCKET: S3_BUCKET,
    REGION: S3_REGION,
    BASE_URL: S3_EMAIL_ASSETS_BASE,
  },
  
  // ============================================
  // Logo URLs (S3 hosted)
  // ============================================
  LOGO: {
    WHITE: process.env.EMAIL_LOGO_WHITE || `${S3_EMAIL_ASSETS_BASE}/cureli-logo-white.png`,
    DARK: process.env.EMAIL_LOGO_DARK || `${S3_EMAIL_ASSETS_BASE}/cureli-logo-dark.png`,
  },
  
  // ============================================
  // Company Information
  // ============================================
  COMPANY: {
    NAME: 'Cureli Health',
    SUPPORT_EMAIL: 'support@curelihealth.com',
    WEBSITE: 'https://curelihealth.com',
  },
  
  // ============================================
  // Logo Styling
  // ============================================
  LOGO_STYLES: {
    HEADER: {
      WIDTH: '140px',
      HEIGHT: 'auto',
      MARGIN_BOTTOM: '16px',
    },
    FOOTER: {
      WIDTH: '80px',
      HEIGHT: 'auto',
      MARGIN_BOTTOM: '12px',
    },
  },
  
  // ============================================
  // Brand Colors
  // ============================================
  COLORS: {
    PRIMARY: '#05015A',
    PRIMARY_LIGHT: '#0a0280',
    SUCCESS: '#059669',
    SUCCESS_LIGHT: '#10b981',
    WARNING: '#f59e0b',
    WARNING_DARK: '#d97706',
    ERROR: '#dc2626',
    ERROR_DARK: '#b91c1c',
    GRAY: '#6b7280',
    GRAY_DARK: '#4b5563',
  },
  
  // ============================================
  // Dynamic Values
  // ============================================
  CURRENT_YEAR: new Date().getFullYear(),
};

/**
 * Get logo configuration object
 * @param {'WHITE' | 'DARK'} type - Logo type
 * @param {'header' | 'footer'} size - Size preset
 * @returns {Object} - Logo configuration
 */
export const getLogo = (type = 'WHITE', size = 'header') => {
  const logoUrl = EMAIL_CONFIG.LOGO[type] || EMAIL_CONFIG.LOGO.WHITE;
  const styles = size === 'footer' 
    ? EMAIL_CONFIG.LOGO_STYLES.FOOTER 
    : EMAIL_CONFIG.LOGO_STYLES.HEADER;
  
  return {
    url: logoUrl,
    alt: EMAIL_CONFIG.COMPANY.NAME,
    width: styles.WIDTH,
    height: styles.HEIGHT,
    marginBottom: styles.MARGIN_BOTTOM,
  };
};

/**
 * Debug function to log logo configuration
 */
export const debugLogoConfig = () => {
  console.log('\n📧 Email Logo Configuration (S3):');
  console.log(`   White Logo: ${EMAIL_CONFIG.LOGO.WHITE}`);
  console.log(`   Dark Logo: ${EMAIL_CONFIG.LOGO.DARK}`);
  console.log(`   S3 Bucket: ${S3_BUCKET}`);
  console.log(`   S3 Region: ${S3_REGION}\n`);
};

export default EMAIL_CONFIG;