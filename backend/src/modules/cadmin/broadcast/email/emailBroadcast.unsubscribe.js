// backend/src/modules/cadmin/broadcast/email/emailBroadcast.unsubscribe.js (do not remove this comment)
// backend/src/modules/cadmin/broadcast/email/emailBroadcast.unsubscribe.js

import prisma from '../../../../config/prisma.js';
import crypto from 'crypto';

/**
 * Email Unsubscribe Manager
 * 
 * Features:
 * - Token-based one-click unsubscribe
 * - Suppression list management
 * - Bulk email filtering
 */

// ============================================
// CONFIGURATION
// ============================================

const BASE_URL = process.env.APP_URL ;
const TOKEN_LENGTH = 32; // 64 hex characters

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate secure unsubscribe token
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Generate token for specific email (deterministic for same email)
 * This allows regenerating the same link if needed
 */
function generateDeterministicToken(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'cureli-unsubscribe-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase().trim())
    .digest('hex');
}

// ============================================
// UNSUBSCRIBE URL GENERATION
// ============================================

/**
 * Get or create unsubscribe token for an email
 * 
 * @param {string} email - Recipient email
 * @param {string} userId - Optional user ID
 * @param {string} cadminId - Optional CAdmin ID
 * @returns {string} - Unsubscribe URL
 */
export async function getUnsubscribeUrl(email, userId = null, cadminId = null) {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if already exists
  let record = await prisma.emailUnsubscribe.findUnique({
    where: { email: normalizedEmail },
  });
  
  // If already unsubscribed, return null (they won't receive email anyway)
  if (record) {
    return null;
  }
  
  // Generate deterministic token
  const token = generateDeterministicToken(normalizedEmail);
  
  // Return URL without creating record (record created on actual unsubscribe)
  return `${BASE_URL}/api/public/unsubscribe/${token}?email=${encodeURIComponent(normalizedEmail)}`;
}

/**
 * Generate unsubscribe URL without checking database
 * Used for building email templates
 */
export function buildUnsubscribeUrl(email) {
  if (!email) return '';
  
  const normalizedEmail = email.toLowerCase().trim();
  const token = generateDeterministicToken(normalizedEmail);
  
  return `${BASE_URL}/api/public/unsubscribe/${token}?email=${encodeURIComponent(normalizedEmail)}`;
}

// ============================================
// UNSUBSCRIBE OPERATIONS
// ============================================

/**
 * Process unsubscribe request
 * 
 * @param {string} token - Unsubscribe token
 * @param {string} email - Email address (for verification)
 * @param {string} reason - Optional reason
 * @returns {Object} - Result
 */
export async function processUnsubscribe(token, email, reason = null) {
  const normalizedEmail = email.toLowerCase().trim();
  const expectedToken = generateDeterministicToken(normalizedEmail);
  
  // Verify token
  if (token !== expectedToken) {
    return {
      success: false,
      error: 'Invalid unsubscribe link',
    };
  }
  
  // Check if already unsubscribed
  const existing = await prisma.emailUnsubscribe.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (existing) {
    return {
      success: true,
      message: 'You have already unsubscribed from broadcast emails',
      alreadyUnsubscribed: true,
    };
  }
  
  // Find associated user or cadmin
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    select: { user_id: true },
  });
  
  const cadmin = await prisma.cAdmin.findFirst({
    where: { email: normalizedEmail },
    select: { cadmin_id: true },
  });
  
  // Create unsubscribe record
  await prisma.emailUnsubscribe.create({
    data: {
      email: normalizedEmail,
      token: token,
      user_id: user?.user_id || null,
      cadmin_id: cadmin?.cadmin_id || null,
      reason: reason,
    },
  });
  

  
  return {
    success: true,
    message: 'Successfully unsubscribed from broadcast emails',
  };
}

/**
 * Resubscribe an email (admin action)
 */
export async function resubscribe(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  const deleted = await prisma.emailUnsubscribe.deleteMany({
    where: { email: normalizedEmail },
  });
  
  return {
    success: deleted.count > 0,
    message: deleted.count > 0 
      ? 'Email resubscribed successfully' 
      : 'Email was not in unsubscribe list',
  };
}

// ============================================
// SUPPRESSION LIST QUERIES
// ============================================

/**
 * Check if single email is unsubscribed
 */
export async function isUnsubscribed(email) {
  if (!email) return false;
  
  const record = await prisma.emailUnsubscribe.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  
  return !!record;
}

/**
 * Filter out unsubscribed emails from a list
 * 
 * @param {Array} emails - Array of email strings
 * @returns {Array} - Filtered array (only subscribed emails)
 */
export async function filterUnsubscribedEmails(emails) {
  if (!emails || emails.length === 0) return [];
  
  const normalizedEmails = emails.map((e) => e.toLowerCase().trim());
  
  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where: {
      email: { in: normalizedEmails },
    },
    select: { email: true },
  });
  
  const unsubscribedSet = new Set(unsubscribed.map((u) => u.email));
  
  return emails.filter((e) => !unsubscribedSet.has(e.toLowerCase().trim()));
}

/**
 * Filter recipients array (objects with email property)
 * 
 * @param {Array} recipients - Array of {email, ...} objects
 * @returns {Array} - Filtered array
 */
export async function filterUnsubscribedRecipients(recipients) {
  if (!recipients || recipients.length === 0) return [];
  
  const emails = recipients.map((r) => r.email.toLowerCase().trim());
  
  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where: {
      email: { in: emails },
    },
    select: { email: true },
  });
  
  const unsubscribedSet = new Set(unsubscribed.map((u) => u.email));
  
  const filtered = recipients.filter(
    (r) => !unsubscribedSet.has(r.email.toLowerCase().trim())
  );
  
  const excludedCount = recipients.length - filtered.length;
  
  
  return filtered;
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Get unsubscribe list with pagination
 */
export async function getUnsubscribeList({ page = 1, limit = 20, search = '' }) {
  const skip = (page - 1) * limit;
  
  const where = search
    ? { email: { contains: search, mode: 'insensitive' } }
    : {};
  
  const [records, total] = await Promise.all([
    prisma.emailUnsubscribe.findMany({
      where,
      orderBy: { unsubscribed_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.emailUnsubscribe.count({ where }),
  ]);
  
  return {
    records,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get total unsubscribe count
 */
export async function getUnsubscribeCount() {
  return prisma.emailUnsubscribe.count();
}

/**
 * Manually add email to unsubscribe list (admin action)
 */
export async function addToSuppressionList(email, reason = 'Added by admin') {
  const normalizedEmail = email.toLowerCase().trim();
  
  const existing = await prisma.emailUnsubscribe.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (existing) {
    return { success: false, message: 'Email already in suppression list' };
  }
  
  const token = generateDeterministicToken(normalizedEmail);
  
  await prisma.emailUnsubscribe.create({
    data: {
      email: normalizedEmail,
      token: token,
      reason: reason,
    },
  });
  
  return { success: true, message: 'Email added to suppression list' };
}

/**
 * Export unsubscribe list as CSV data
 */
export async function exportUnsubscribeList() {
  const records = await prisma.emailUnsubscribe.findMany({
    orderBy: { unsubscribed_at: 'desc' },
  });
  
  const csvHeader = 'email,unsubscribed_at,reason\n';
  const csvRows = records
    .map((r) => `"${r.email}","${r.unsubscribed_at.toISOString()}","${r.reason || ''}"`)
    .join('\n');
  
  return csvHeader + csvRows;
}

export default {
  getUnsubscribeUrl,
  buildUnsubscribeUrl,
  processUnsubscribe,
  resubscribe,
  isUnsubscribed,
  filterUnsubscribedEmails,
  filterUnsubscribedRecipients,
  getUnsubscribeList,
  getUnsubscribeCount,
  addToSuppressionList,
  exportUnsubscribeList,
};