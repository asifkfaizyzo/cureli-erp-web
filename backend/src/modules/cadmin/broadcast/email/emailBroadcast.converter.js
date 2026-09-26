// backend/src/modules/cadmin/broadcast/email/emailBroadcast.converter.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/emailBroadcast.converter.js

/**
 * Converts plain text to HTML email format
 * 
 * Features:
 * - Preserves paragraphs (double line breaks)
 * - Converts single line breaks to <br>
 * - Auto-links URLs
 * - Escapes HTML entities for security
 */

// ============================================
// URL DETECTION REGEX
// ============================================

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>\"\']+/gi;

// ============================================
// HTML ENTITY ESCAPING
// ============================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

// ============================================
// URL AUTO-LINKING
// ============================================

/**
 * Convert URLs in text to clickable links
 */
function autoLinkUrls(text) {
  return text.replace(URL_REGEX, (url) => {
    // Ensure URL has protocol
    let href = url;
    if (url.startsWith('www.')) {
      href = `https://${url}`;
    }
    
    // Create anchor tag with security attributes
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #05015A; text-decoration: underline;">${url}</a>`;
  });
}

// ============================================
// MAIN CONVERTER
// ============================================

/**
 * Convert plain text to formatted HTML
 * 
 * @param {string} plainText - Raw plain text input
 * @returns {string} - Formatted HTML
 * 
 * @example
 * Input:
 * "Hello Team,
 * 
 * Check out https://cureli.com
 * 
 * Thanks!"
 * 
 * Output:
 * "<p>Hello Team,</p><p>Check out <a href="https://cureli.com">https://cureli.com</a></p><p>Thanks!</p>"
 */
export function convertPlainTextToHtml(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    return '';
  }

  // Step 1: Escape HTML entities (security)
  let html = escapeHtml(plainText);

  // Step 2: Normalize line endings
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 3: Split by double line breaks (paragraphs)
  const paragraphs = html.split(/\n\n+/);

  // Step 4: Process each paragraph
  const processedParagraphs = paragraphs
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => {
      // Convert single line breaks to <br>
      let processed = paragraph.replace(/\n/g, '<br>');
      
      // Auto-link URLs
      processed = autoLinkUrls(processed);
      
      // Wrap in paragraph tag
      return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${processed}</p>`;
    });

  return processedParagraphs.join('');
}

// ============================================
// PLAIN TEXT EXTRACTION (for message_text fallback)
// ============================================

/**
 * Strip HTML and extract plain text
 * Used when we need to generate plain text from existing HTML
 */
export function stripHtmlToPlainText(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    // Remove HTML tags
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if text contains valid content
 */
export function isValidMessageContent(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const stripped = text.trim();
  return stripped.length >= 10;
}

/**
 * Get message preview (first N characters)
 */
export function getMessagePreview(text, maxLength = 100) {
  if (!text) return '';
  
  const stripped = stripHtmlToPlainText(text);
  if (stripped.length <= maxLength) {
    return stripped;
  }
  
  return stripped.substring(0, maxLength).trim() + '...';
}

export default {
  convertPlainTextToHtml,
  stripHtmlToPlainText,
  isValidMessageContent,
  getMessagePreview,
};