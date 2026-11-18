// backend/src/config/meta.config.js

/**
 * Meta Conversions API & App Events Configuration
 * 
 * HEALTHCARE PRIVACY SAFEGUARD:
 * `META_TRACKING_ENABLED` defaults to `false`.
 * No Meta API transmissions will occur until explicitly set to 'true' in environment.
 */

export const metaConfig = {
  enabled: process.env.META_TRACKING_ENABLED === "true",
  datasetId: process.env.META_DATASET_ID || "2130568890887538",
  accessToken: process.env.META_ACCESS_TOKEN || "",
  apiVersion: process.env.META_API_VERSION || "v21.0",
  testEventCode: process.env.META_TEST_EVENT_CODE || null,
  currency: "INR",
  maxRetries: 5,
  initialBackoffMs: 2000,
};

export function isMetaTrackingEnabled() {
  return metaConfig.enabled && Boolean(metaConfig.accessToken);
}