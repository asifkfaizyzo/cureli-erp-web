// backend/src/providers/msg91/sendSms.js (do not remove this comment)
//backend\src\providers\msg91\sendSms.js
import axios from "axios";

const BASE = "https://control.msg91.com/api/v5/flow";

/**
 * Format phone number with country code
 * @param {string} phone - Phone number (with or without country code)
 * @param {string} countryCode - Country code (default: 91)
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone, countryCode = "91") {
  if (!phone) return "";
  const cleaned = phone.replace(/^\+/, "").replace(/^91/, "");
  return `${countryCode}${cleaned}`;
}

/**
 * Send SMS via MSG91 Flow API
 * @param {Object} params
 * @param {string} params.templateId - MSG91 template ID
 * @param {string} params.mobile - Phone number WITH country code
 * @param {Object} params.variables - Template variables
 * @returns {Promise<Object>} MSG91 response
 */
export async function msg91SendSms({ templateId, mobile, variables = {} }) {
  if (!process.env.MSG91_AUTH_KEY) {
    throw new Error("MSG91_AUTH_KEY not configured");
  }

  if (!templateId) {
    throw new Error("MSG91 template_id required");
  }

  if (!mobile) {
    throw new Error("Mobile number required");
  }

  const payload = {
    template_id: templateId,
    short_url: "0",
    recipients: [
      {
        mobiles: mobile,
        ...variables,
      },
    ],
  };



  try {
    const resp = await axios.post(BASE, payload, {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      timeout: 15000,
    });


    if (resp.data?.type !== "success") {
      const error = new Error(
        `MSG91 send failed: ${resp.data?.message || "Unknown error"}`,
      );
      error.response = resp;
      throw error;
    }

    return resp.data;
  } catch (err) {
    console.error(" MSG91 error:", err.response?.data || err.message);
    throw err;
  }
}
