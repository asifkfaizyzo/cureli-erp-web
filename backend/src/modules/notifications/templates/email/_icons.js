// backend/src/modules/notifications/templates/email/_icons.js (do not remove this comment)
// backend/src/modules/notifications/templates/email/_icons.js
// ============================================
// EMAIL-SAFE SVG & CSS ICONS
// ============================================

/**
 * Email-safe icons using SVG and CSS shapes
 * These render consistently across Gmail, Outlook, Apple Mail, etc.
 *
 * Usage: renderIcon('KEY') → returns HTML string
 */

export const ICONS = {
  // 🔑 Key icon - for password reset
  KEY: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
           width="18" height="18" fill="currentColor">
        <path d="M12.65 10A6 6 0 1 0 11 13H17v2h2v-2h2v-2h-8.35zM7 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
      </svg>
    </span>`,

  // ⏰ Clock icon - for expiry warnings
  CLOCK: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#92400e">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
                 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 
                 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 
                 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
      </svg>
    </span>`,

  //  Checkmark icon - for approved/success
  CHECK: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      background-color:#059669;
      border-radius:50%;
      vertical-align:middle;
      margin-right:6px;
      text-align:center;
      line-height:18px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="12" height="12" fill="#ffffff"
           style="display:block;margin:3px auto 0;">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 
                 7l-1.41-1.41L9 16.17z"/>
      </svg>
    </span>`,

  //  X icon - for rejected/error
  CROSS: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      background-color:#dc2626;
      border-radius:50%;
      vertical-align:middle;
      margin-right:6px;
      text-align:center;
      line-height:18px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="12" height="12" fill="#ffffff"
           style="display:block;margin:3px auto 0;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 
                 6.41 10.59 12 5 17.59 6.41 19 12 13.41 
                 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    </span>`,

  // ⏳ Hourglass icon - for pending status
  HOURGLASS: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="18" height="18" fill="#f59e0b">
        <path d="M6 2v6l4 4-4 4v6h12v-6l-4-4 4-4V2H6zm10 
                 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"/>
      </svg>
    </span>`,

  // 📄 Document icon - for document review
  DOCUMENT: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="18" height="18" fill="#ffffff">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 
                 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
    </span>`,

  // 📋 Clipboard icon - for review documents button
  CLIPBOARD: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#ffffff">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 
                 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 
                 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 
                 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 
                 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
    </span>`,

  // 📧 Email/Envelope icon
  EMAIL: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="18" height="18" fill="#ffffff">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 
                 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 
                 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    </span>`,

  //  Email verified checkmark (colored for header)
  EMAIL_VERIFIED: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="18" height="18" fill="#ffffff">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 
                 7l-1.41-1.41L9 16.17z"/>
      </svg>
    </span>`,

  // ⚠️ Warning triangle icon
  WARNING: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#92400e">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    </span>`,

  // 🔒 Lock/Security icon
  LOCK: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#05015A">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 
                 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 
                 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 
                 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 
                 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 
                 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
    </span>`,

  // 🔒 Lock icon (white version for info boxes)
  LOCK_BLUE: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#0c4a6e">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 
                 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 
                 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 
                 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 
                 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 
                 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
    </span>`,

  MAILBOX: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 
                 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 
                 4l-8 5-8-5V6l8 5 8-5v2z"/>
        <circle cx="19" cy="5" r="3" fill="#ef4444"/>
      </svg>
    </span>`,

  // 💬 Chat bubble icon - for enquiry replied header & "Your Message" label
  CHAT: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="18" height="18" fill="#ffffff">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 
                 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    </span>`,

  // 💬 Chat icon dark (for "Your Message" label inside card)
  CHAT_DARK: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#374151">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 
                 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    </span>`,

  // 📩 Inbox with arrow - for "Our Response" label
  INBOX: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#05015A">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 
                 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 
                 12h-4c0 1.66-1.34 3-3 3s-3-1.34-3-3H5V5h14v10z"/>
      </svg>
    </span>`,

  // ⏱ Stopwatch icon - for response time
  STOPWATCH: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#065f46">
        <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 
                 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 
                 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
    </span>`,

  // 💡 Lightbulb icon - for tips/hints
  LIGHTBULB: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#05015A">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 
                 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 
                 0-3.86-3.14-7-7-7z"/>
      </svg>
    </span>`,

  // 💡 Lightbulb yellow - for warning/tip boxes with amber colors
  LIGHTBULB_AMBER: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#854d0e">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 
                 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 
                 0-3.86-3.14-7-7-7z"/>
      </svg>
    </span>`,

  // 🔐 Lock with key - for "Password Changed" & "Reset Password" headers
  LOCK_KEY: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 
                 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 
                 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 
                 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 
                 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 
                 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
    </span>`,

  //  Check in circle - for "Change Successful" label
  CHECK_CIRCLE: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#065f46">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
                 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 
                 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </span>`,

  // ⚠️ Warning triangle - for "Didn't make this change?" error box (red version)
  WARNING_RED: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#991b1b">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    </span>`,

  // ⚠️ Warning triangle amber - for "payment could not be processed"
  WARNING_AMBER: `
    <span style="
      display:inline-block;
      width:18px;height:18px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="18" height="18" fill="#dc2626">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    </span>`,

  // 🛡️ Shield icon - for security tips header
  SHIELD: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#05015A">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 
                 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 
                 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    </span>`,

  // 🔄 Refresh/Retry icon - for "Retry Payment" button
  REFRESH: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#ffffff">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 
                 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 
                 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 
                 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 
                 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
    </span>`,

  //  X icon for payment failed header & subject line
  PAYMENT_FAILED: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      background-color:#ffffff;
      border-radius:50%;
      vertical-align:middle;
      margin-right:8px;
      text-align:center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="14" height="14" fill="#dc2626"
           style="display:block;margin:3px auto 0;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 
                 6.41 10.59 12 5 17.59 6.41 19 12 13.41 
                 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    </span>`,

  // 💙 Heart - for footer "We'll be in touch soon!"
  HEART_BLUE: `
    <span style="
      display:inline-block;
      width:14px;height:14px;
      vertical-align:middle;
      margin-left:4px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="14" height="14" fill="#60a5fa">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 
                 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
                 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </span>`,
  PHONE: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 
                 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 
                 1zm-4 21c-.83 0-1.5-.67-1.5-1.5S10.67 19 11.5 19s1.5.67 
                 1.5 1.5S12.33 22 11.5 22zm4.5-4H7V4h9v14z"/>
      </svg>
    </span>`,

  // 🎉 Celebration/Star burst icon - for verified/activated headers
  CELEBRATE: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 
                 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 
                 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 
                 3.23L16.23 18z"/>
      </svg>
    </span>`,

  // 📦 Package/Box icon - for return approval header
  PACKAGE: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 
                 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 
                 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 
                 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
      </svg>
    </span>`,

  // 🚀 Rocket icon - for "What's Next" sections
  ROCKET: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#05015A">
        <path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05 
                 3.14-.29zm.82 11.46c.31-.13 3.58-1.53 5.87-3.56l-.27 
                 3.13-4.05 4.05-1.55-3.62zm7.83-9.52c-.5-2.04-2.17-3.71-4.21-4.21C10.64 
                 3.49 7.53 5.05 6.12 6.3L9.17 9H15v5.83l2.7 3.05c1.25-1.42 
                 2.81-4.53 2.14-8.59zM13 10c-.55 0-1-.45-1-1s.45-1 1-1 1 
                 .45 1 1-.45 1-1 1zm-8.99 8.99l3.64-1.55c-.93-.92-1.55-2.05-1.75-3.21L3 
                 16.97l1.01 2.02zM21 3l-2.93.49c-1.2.2-2.33.82-3.21 1.75L16.55 
                 8.35 21 3z"/>
      </svg>
    </span>`,

  // 🚀 Rocket white - for "What's Next" in info boxes with dark bg labels
  ROCKET_BLUE: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#0c4a6e">
        <path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05 
                 3.14-.29zm.82 11.46c.31-.13 3.58-1.53 5.87-3.56l-.27 
                 3.13-4.05 4.05-1.55-3.62zm7.83-9.52c-.5-2.04-2.17-3.71-4.21-4.21C10.64 
                 3.49 7.53 5.05 6.12 6.3L9.17 9H15v5.83l2.7 3.05c1.25-1.42 
                 2.81-4.53 2.14-8.59zM13 10c-.55 0-1-.45-1-1s.45-1 1-1 1 
                 .45 1 1-.45 1-1 1zm-8.99 8.99l3.64-1.55c-.93-.92-1.55-2.05-1.75-3.21L3 
                 16.97l1.01 2.02zM21 3l-2.93.49c-1.2.2-2.33.82-3.21 1.75L16.55 
                 8.35 21 3z"/>
      </svg>
    </span>`,

  // 👋 Hand wave - for welcome message
  WAVE: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#92400e">
        <path d="M21 7c0-1.38-1.12-2.5-2.5-2.5-.17 0-.34.02-.5.05V4c0-1.38-1.12-2.5-2.5-2.5-
                 .23 0-.46.03-.67.09C14.46.66 13.56 0 12.5 0c-1.23 0-2.24.89-2.46 
                 2.06C9.87 2.02 9.69 2 9.5 2 8.12 2 7 3.12 7 4.5v5.89c-.34-.31-.76-.54-1.21-.66L5 
                 9.5c-.96-.26-1.96.27-2.32 1.18-.4 1.02.06 2.17 1.04 2.61L5 
                 13.97c.54.26 1 .65 1.34 1.14L8.5 18.5c.92 1.35 2.45 2.16 4.08 
                 2.16L14 20.67V21h6v-.56l1-3.44V10c0-1.38-1.12-2.5-2.5-2.5-.17 
                 0-.34.02-.5.05V7z"/>
      </svg>
    </span>`,

  // ✨ Sparkle/Star - for "Continue Enjoying" label
  SPARKLE: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#05015A">
        <path d="M12 1L9.5 8.5 2 11l7.5 2.5L12 21l2.5-7.5L22 11l-7.5-2.5z"/>
      </svg>
    </span>`,

  // 📝 Note/Memo - for note/info boxes (amber context)
  NOTE: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#92400e">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 
                 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 
                 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </span>`,

  // 🚨 Alert/Siren - for urgent/critical headers
  ALERT: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 
                 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    </span>`,

  // ⚡ Lightning bolt - for consequences/urgent list headers
  LIGHTNING: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#92400e">
        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
      </svg>
    </span>`,

  // 💳 Credit card icon - for payment buttons
  CREDIT_CARD: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#ffffff">
        <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 
                 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
      </svg>
    </span>`,

  // 📢 Megaphone/Announcement icon - for system broadcast header
  MEGAPHONE: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 
                 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 
                 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.96.74-2.21 
                 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.99-.74 2.24-1.65 3.2-2.4zM4 
                 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11 
                 .17v5.66L12.55 13H8.5v-2h4.05L15 9.17z"/>
      </svg>
    </span>`,

  // 🎫 Ticket icon - for ticket created/updated header
  TICKET: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 
                 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 
                 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 
                 1.99-2 3.46s.81 2.77 2 3.46V20H4v-4.54c1.19-.69 2-1.99 
                 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 4h16v4.54z"/>
      </svg>
    </span>`,

  // 🔄 already exists as REFRESH - reuse for ticket status update header
  // Using a different "update" style icon for ticket status changed header
  UPDATE: `
    <span style="
      display:inline-block;
      width:20px;height:20px;
      vertical-align:middle;
      margin-right:8px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="20" height="20" fill="#ffffff">
        <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 
                 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0C18.32 
                 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 
                 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58 3.51-3.47 
                 9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 
                 1.21L11 13V8h1.5z"/>
      </svg>
    </span>`,

  // 🚫 Ban/Block icon - for suspended/unavailable sections
  BAN: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#991b1b">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 
                 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 
                 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 
                 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 
                 3.55-1.69 4.9z"/>
      </svg>
    </span>`,

  // 🔓 Unlock icon - for reactivate account button & restore access section
  UNLOCK: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#ffffff">
        <path d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-5h-1V6c0-2.76-2.24-5-5-5-2.28 
                 0-4.27 1.54-4.84 3.75l1.94.51C9.44 3.93 10.63 3 12 3c1.65 0 3 1.35 3 3v2H6c-1.1 
                 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
      </svg>
    </span>`,

  // 🙏 Thank you / hands - repurpose as a star/appreciation for thank you boxes
  THANKYOU: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#92400e">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 
                 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 
                 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 
                 3.23L16.23 18z"/>
      </svg>
    </span>`,

  // 💬 already exists as CHAT_DARK - for announcement contact box
  // 🔒 already exists as LOCK_KEY - for suspended header
  // ⏱ already exists as STOPWATCH - for response time

  // 🎫 Ticket small - for "What happens next" and view ticket buttons (16px version)
  TICKET_SMALL: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#ffffff">
        <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 
                 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 
                 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 
                 1.99-2 3.46s.81 2.77 2 3.46V20H4v-4.54c1.19-.69 2-1.99 
                 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 4h16v4.54z"/>
      </svg>
    </span>`,

  // 📝 NOTE already added in previous batch - amber version for warning boxes
  NOTE_DARK: `
    <span style="
      display:inline-block;
      width:16px;height:16px;
      vertical-align:middle;
      margin-right:6px;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           width="16" height="16" fill="#374151">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 
                 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 
                 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </span>`,
};

/**
 * Renders an icon by name
 * @param {string} name - Icon name from ICONS object
 * @returns {string} HTML string
 */
export function renderIcon(name) {
  return ICONS[name] || "";
}
