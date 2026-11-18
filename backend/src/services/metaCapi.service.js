// backend/src/services/metaCapi.service.js

import axios from "axios";
import { metaConfig, isMetaTrackingEnabled } from "../config/meta.config.js";

/**
 * Meta Conversions API Transmission Service
 * Includes Healthcare Privacy Gate enforcement to ensure no PHI/health data is transmitted.
 */

export async function sendMetaCapiEvents(events) {
  if (!isMetaTrackingEnabled()) {
    console.log("[Meta CAPI] Tracking disabled by feature flag or missing access token. Skipping transmission.");
    return { success: true, skipped: true, reason: "TRACKING_DISABLED" };
  }

  if (!Array.isArray(events) || events.length === 0) {
    return { success: true, count: 0 };
  }

  // Healthcare Privacy Gate Verification
  const sanitizedEvents = events.map(sanitizeEventForHealthcarePrivacy);

  const url = `https://graph.facebook.com/${metaConfig.apiVersion}/${metaConfig.datasetId}/events`;

  const payload = {
    data: sanitizedEvents,
  };

  if (metaConfig.testEventCode) {
    payload.test_event_code = metaConfig.testEventCode;
  }

  try {
    const response = await axios.post(url, payload, {
      params: { access_token: metaConfig.accessToken },
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    return {
      success: true,
      events_received: response.data?.events_received || events.length,
      fbtrace_id: response.data?.fbtrace_id,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error("[Meta CAPI Error]:", errorMessage);
    throw new Error(`Meta CAPI Transmission Failed: ${errorMessage}`);
  }
}

/**
 * Enforces strict healthcare privacy by scrubbing any health-related attributes.
 */
function sanitizeEventForHealthcarePrivacy(event) {
  const { custom_data = {}, user_data = {}, ...rest } = event;

  // Strict allowlist for custom_data: value, currency, content_type, num_items
  const sanitizedCustomData = {};
  if (custom_data.value !== undefined) sanitizedCustomData.value = Number(custom_data.value);
  if (custom_data.currency) sanitizedCustomData.currency = metaConfig.currency;
  if (custom_data.content_type) sanitizedCustomData.content_type = "product";
  if (custom_data.num_items !== undefined) sanitizedCustomData.num_items = Number(custom_data.num_items);

  // ABSOLUTELY NO: content_name, contents (medicine names/SKUs), prescription tags, diagnosis tags

  return {
    ...rest,
    user_data,
    custom_data: sanitizedCustomData,
  };
}