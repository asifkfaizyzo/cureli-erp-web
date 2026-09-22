// backend/src/utils/email.js

import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter using AWS SES SMTP endpoint.
 *
 * Required env vars:
 *   SMTP_HOST     = email-smtp.ap-south-1.amazonaws.com
 *   SMTP_PORT     = 587
 *   SMTP_USER     = your SES SMTP username (from SES console → SMTP settings)
 *   SMTP_PASS     = your SES SMTP password
 *
 * EMAIL_FROM_NAME    = Cureli Health          (display name)
 * EMAIL_FROM_ADDRESS = info@curelihealth.com  (verified SES identity)
 * EMAIL_REPLY_TO     = support@curelihealth.com
 */
export const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,          // TLS via STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // SES SMTP connection pool — keeps connections alive between sends
  pool:           true,
  maxConnections: 5,      // safe for SES SMTP (no hard limit documented)
  maxMessages:    100,    // recycle connection after 100 messages
  // Respect SES 14/sec rate limit — nodemailer will queue internally
  rateDelta:  1000,       // 1-second window
  rateLimit:  10,         // max 10 messages per second (safe under 14/sec)
});

/**
 * Simple one-shot send helper (used by system transactional emails).
 * Broadcast emails use mailer.sendMail() directly from the service.
 *
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {Array} [attachments=[]] - Optional nodemailer attachments array
 */
export async function sendMail(to, subject, html, attachments = []) {
  await mailer.sendMail({
    from:    `"${process.env.EMAIL_FROM_NAME    || 'Cureli Health'}" <${process.env.EMAIL_FROM_ADDRESS || 'info@curelihealth.com'}>`,
    replyTo: process.env.EMAIL_REPLY_TO || 'support@curelihealth.com',
    to,
    subject,
    html,
    attachments,
  });
}

export default { mailer, sendMail };