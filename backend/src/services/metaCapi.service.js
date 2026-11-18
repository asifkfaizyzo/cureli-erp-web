// backend/src/services/metaCapi.service.js

import axios from "axios";
import { getMetaConfig, isMetaTransmissionEnabled } from "../config/meta.config.js";
import { validateCapiEventPayload } from "./metaPrivacyPolicy.js";

/**
 * Meta Conversions API Transmission Boundary
 *
 * SECURITY & PRIVACY GUARANTEES:
 * - Gated by `isMetaTransmissionEnabled()`.
 * - Independently validates every event via `validateCapiEventPayload()` before sending.
 * - Uses `Authorization: Bearer` header so access token never appears in URLs or query strings.
 * - Never logs request payloads, user identifiers, or access tokens.
 */

export function sanitizeTransmissionError(error) {
  if (error?.name === "MetaPrivacyPolicyError") {
    return `PRIVACY_POLICY_REJECTED:${error.code}`;
  }
  const status = error?.response?.status;
  if (status) {
    return `META_HTTP_${status}`;
  }
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "META_NETWORK_TIMEOUT";
  }
  return "META_TRANSMISSION_ERROR";
}

export async function sendMetaCapiEvents(events, options = {}) {
  const { configOverride, httpClient = axios } = options;
  const cfg = getMetaConfig(configOverride);

  if (!isMetaTransmissionEnabled(cfg)) {
    return { success: true, skipped: true, reason: "TRACKING_DISABLED" };
  }

  if (!Array.isArray(events) || events.length === 0) {
    return { success: true, count: 0 };
  }

  // Independent final privacy validation boundary
  const validatedEvents = events.map((ev) => validateCapiEventPayload(ev, cfg));

  const url = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.datasetId}/events`;

  const payload = {
    data: validatedEvents,
  };

  // Only attach test_event_code when explicitly allowed in non-production testing
  if (cfg.allowTestEvents && cfg.testEventCode) {
    payload.test_event_code = cfg.testEventCode;
  }

  try {
    const response = await httpClient.post(url, payload, {
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return {
      success: true,
      events_received: response.data?.events_received ?? validatedEvents.length,
      fbtrace_id: response.data?.fbtrace_id ?? null,
    };
  } catch (error) {
    const safeErrorCode = sanitizeTransmissionError(error);
    const safeErr = new Error(safeErrorCode);
    safeErr.code = safeErrorCode;
    throw safeErr;
  }
}