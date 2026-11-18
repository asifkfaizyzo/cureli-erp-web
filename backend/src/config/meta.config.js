// backend/src/config/meta.config.js

/**
 * Meta Conversions API & Outbox Configuration
 *
 * HEALTHCARE PRIVACY SAFEGUARD:
 * - `META_TRACKING_ENABLED` defaults to `false`.
 * - Approved events, user_data keys, and custom_data keys default to empty (`[]`).
 * - Nothing is collected in the outbox or transmitted to Meta while disabled.
 */

function parseCsvAllowlist(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getMetaConfig(overrides = {}) {
  const envEnabled = process.env.META_TRACKING_ENABLED === "true";
  const apiVersionRaw = process.env.META_API_VERSION || "v25.0";
  const apiVersion = /^v\d+\.\d+$/.test(apiVersionRaw) ? apiVersionRaw : "v25.0";

  const baseConfig = {
    enabled: envEnabled,
    datasetId: process.env.META_DATASET_ID || "2130568890887538",
    accessToken: process.env.META_ACCESS_TOKEN || "",
    apiVersion,
    allowTestEvents:
      process.env.NODE_ENV !== "production" &&
      process.env.META_ALLOW_TEST_EVENTS === "true",
    testEventCode: process.env.META_TEST_EVENT_CODE || null,
    currency: "INR",
    maxRetries: 5,
    initialBackoffMs: 2000,
    processingLeaseMs: 5 * 60 * 1000, // 5 minutes
    maxBatchSize: 20,
    pollIntervalMs: 30 * 1000,
    // Explicit compliance allowlists: empty by default until documented approval
    approvedEvents: parseCsvAllowlist(process.env.META_APPROVED_EVENTS),
    approvedUserDataKeys: parseCsvAllowlist(process.env.META_APPROVED_USER_DATA_KEYS),
    approvedCustomDataKeys: parseCsvAllowlist(process.env.META_APPROVED_CUSTOM_DATA_KEYS),
  };

  return {
    ...baseConfig,
    ...overrides,
  };
}

export const metaConfig = getMetaConfig();

/**
 * Gates outbox collection and queue processing.
 * Returns true ONLY when META_TRACKING_ENABLED === "true".
 */
export function isMetaTrackingEnabled(configOverride) {
  const cfg = configOverride ? getMetaConfig(configOverride) : getMetaConfig();
  return cfg.enabled === true;
}

/**
 * Gates outbound HTTP transmission to Meta CAPI.
 * Requires tracking enabled AND a non-empty access token.
 */
export function isMetaTransmissionEnabled(configOverride) {
  const cfg = configOverride ? getMetaConfig(configOverride) : getMetaConfig();
  return cfg.enabled === true && Boolean(cfg.accessToken && cfg.accessToken.trim());
}