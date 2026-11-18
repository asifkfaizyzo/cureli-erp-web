// backend/src/services/metaPrivacyPolicy.js

import { getMetaConfig } from "../config/meta.config.js";

/**
 * Centralized Healthcare Privacy & Validation Policy for Meta Tracking.
 *
 * Enforces strict data minimization at TWO boundaries:
 * 1. Pre-storage (before writing to PostgreSQL `meta_outbox_events`)
 * 2. Pre-transmission (immediately before calling Meta Graph API)
 */

export class MetaPrivacyPolicyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MetaPrivacyPolicyError";
    this.code = code;
  }
}

// Candidate standard events that may ONLY be used if explicitly approved in config
export const CANDIDATE_META_EVENTS = Object.freeze([
  "Purchase",
  "CompleteRegistration",
  "Login",
]);

// Candidate hashed user_data keys (rejected unless explicitly approved in config)
export const CANDIDATE_USER_DATA_KEYS = Object.freeze([
  "em",
  "ph",
  "fn",
  "external_id",
  "country",
]);

// Candidate custom_data keys (rejected unless explicitly approved in config)
export const CANDIDATE_CUSTOM_DATA_KEYS = Object.freeze([
  "value",
  "currency",
  "num_items",
  "content_type",
]);

// Permanent blocklist of healthcare, PHI, demographic, and raw PII keys (NEVER allowed)
export const FORBIDDEN_KEYS = Object.freeze(
  new Set([
    // Raw PII
    "email",
    "phone",
    "full_name",
    "fullname",
    "first_name",
    "firstname",
    "last_name",
    "lastname",
    "name",
    "user_id",
    "userid",
    "customer_id",
    "customerid",
    "customer_name",
    "customer_phone",
    "address",
    "delivery_address",
    "pincode",
    "city",
    "state",
    // Demographic / sensitive attributes
    "dob",
    "db",
    "date_of_birth",
    "birth_date",
    "age",
    "patient_age",
    "gender",
    "ge",
    "sex",
    "patient_sex",
    // Healthcare / pharmacy / clinical data
    "patient",
    "patient_id",
    "patient_name",
    "patient_is_self",
    "prescription",
    "prescriptions",
    "prescription_id",
    "prescription_ids",
    "prescription_key",
    "prescription_files",
    "requires_prescription",
    "medicine",
    "medicines",
    "medicine_id",
    "medicine_name",
    "variant",
    "variant_id",
    "variantid",
    "sku",
    "sku_id",
    "skuid",
    "brand",
    "manufacturer",
    "pack_size",
    "category",
    "primary_category",
    "diagnosis",
    "condition",
    "symptom",
    "symptoms",
    "treatment",
    "dosage",
    "search_string",
    "query",
    "search_query",
    "contents",
    "content_ids",
    "content_name",
    "content_category",
    "items",
    "cart",
    "branch_id",
    "shop_id",
    "shop_name",
    "notes",
    "otp",
  ]),
);

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;
const EVENT_ID_REGEX = /^[a-zA-Z0-9_:-]{8,128}$/;
const PURCHASE_EVENT_ID_REGEX = /^cureli_purchase_[a-zA-Z0-9_-]{1,100}$/;

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function validateEventName(eventName, configOverride) {
  const cfg = getMetaConfig(configOverride);

  if (!eventName || typeof eventName !== "string") {
    throw new MetaPrivacyPolicyError(
      "INVALID_EVENT_NAME",
      "Event name must be a non-empty string",
    );
  }

  if (!CANDIDATE_META_EVENTS.includes(eventName)) {
    throw new MetaPrivacyPolicyError(
      "UNSUPPORTED_EVENT_NAME",
      `Unsupported Meta event name: ${eventName}`,
    );
  }

  if (!Array.isArray(cfg.approvedEvents) || !cfg.approvedEvents.includes(eventName)) {
    throw new MetaPrivacyPolicyError(
      "EVENT_NOT_APPROVED",
      `Event '${eventName}' is not approved for healthcare transmission`,
    );
  }

  return eventName;
}

export function validateEventId(eventId, eventName) {
  if (!eventId || typeof eventId !== "string") {
    throw new MetaPrivacyPolicyError(
      "INVALID_EVENT_ID",
      "Event ID must be a non-empty string",
    );
  }

  if (eventId.trim() !== eventId || !EVENT_ID_REGEX.test(eventId)) {
    throw new MetaPrivacyPolicyError(
      "MALFORMED_EVENT_ID",
      "Event ID must be 8-128 alphanumeric, underscore, hyphen, or colon characters",
    );
  }

  if (eventName === "Purchase" && !PURCHASE_EVENT_ID_REGEX.test(eventId)) {
    throw new MetaPrivacyPolicyError(
      "INVALID_PURCHASE_EVENT_ID",
      "Purchase event ID must match format cureli_purchase_<order_id>",
    );
  }

  return eventId;
}

export function validateMetaUserData(userData = {}, configOverride) {
  const cfg = getMetaConfig(configOverride);

  if (!isPlainObject(userData)) {
    throw new MetaPrivacyPolicyError(
      "INVALID_USER_DATA_OBJECT",
      "user_data must be a plain object",
    );
  }

  const approvedKeys = new Set(
    (cfg.approvedUserDataKeys || []).filter((k) => CANDIDATE_USER_DATA_KEYS.includes(k)),
  );

  const sanitizedUserData = {};

  for (const [key, rawValue] of Object.entries(userData)) {
    const normalizedKey = key.toLowerCase();

    if (FORBIDDEN_KEYS.has(normalizedKey)) {
      throw new MetaPrivacyPolicyError(
        "FORBIDDEN_USER_DATA_KEY",
        `Forbidden healthcare or PII property in user_data: ${key}`,
      );
    }

    if (!CANDIDATE_USER_DATA_KEYS.includes(key)) {
      throw new MetaPrivacyPolicyError(
        "UNEXPECTED_USER_DATA_KEY",
        `Unexpected property in user_data: ${key}`,
      );
    }

    if (!approvedKeys.has(key)) {
      throw new MetaPrivacyPolicyError(
        "UNAPPROVED_USER_DATA_KEY",
        `User identifier '${key}' has not received compliance approval`,
      );
    }

    // Must be a 64-char lowercase hex SHA-256 hash or a 1-element array of the same
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    if (values.length === 0 || values.length > 1) {
      throw new MetaPrivacyPolicyError(
        "INVALID_USER_DATA_VALUE",
        `Invalid value array length for user_data.${key}`,
      );
    }

    const hashCandidate = values[0];
    if (typeof hashCandidate !== "string" || !SHA256_HEX_REGEX.test(hashCandidate)) {
      throw new MetaPrivacyPolicyError(
        "UNHASHED_OR_INVALID_USER_IDENTIFIER",
        `user_data.${key} must be a pre-hashed 64-character lowercase SHA-256 hex string`,
      );
    }

    sanitizedUserData[key] = [hashCandidate];
  }

  return sanitizedUserData;
}

export function validateMetaCustomData(customData = {}, configOverride) {
  const cfg = getMetaConfig(configOverride);

  if (!isPlainObject(customData)) {
    throw new MetaPrivacyPolicyError(
      "INVALID_CUSTOM_DATA_OBJECT",
      "custom_data must be a plain object",
    );
  }

  const approvedKeys = new Set(
    (cfg.approvedCustomDataKeys || []).filter((k) =>
      CANDIDATE_CUSTOM_DATA_KEYS.includes(k),
    ),
  );

  const sanitizedCustomData = {};

  for (const [key, value] of Object.entries(customData)) {
    const normalizedKey = key.toLowerCase();

    if (FORBIDDEN_KEYS.has(normalizedKey)) {
      throw new MetaPrivacyPolicyError(
        "FORBIDDEN_CUSTOM_DATA_KEY",
        `Forbidden healthcare property in custom_data: ${key}`,
      );
    }

    if (value !== null && typeof value === "object") {
      throw new MetaPrivacyPolicyError(
        "NESTED_OBJECT_FORBIDDEN",
        `Nested objects or arrays are forbidden in custom_data.${key}`,
      );
    }

    if (!CANDIDATE_CUSTOM_DATA_KEYS.includes(key)) {
      throw new MetaPrivacyPolicyError(
        "UNEXPECTED_CUSTOM_DATA_KEY",
        `Unexpected property in custom_data: ${key}`,
      );
    }

    if (!approvedKeys.has(key)) {
      throw new MetaPrivacyPolicyError(
        "UNAPPROVED_CUSTOM_DATA_KEY",
        `Custom data field '${key}' has not received compliance approval`,
      );
    }

    if (key === "currency") {
      if (value !== "INR") {
        throw new MetaPrivacyPolicyError(
          "INVALID_CURRENCY",
          "custom_data.currency must be 'INR'",
        );
      }
      sanitizedCustomData.currency = "INR";
    } else if (key === "value") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 10_000_000
      ) {
        throw new MetaPrivacyPolicyError(
          "INVALID_MONETARY_VALUE",
          "custom_data.value must be a finite number between 0 and 10,000,000",
        );
      }
      sanitizedCustomData.value = Number(value.toFixed(2));
    } else if (key === "num_items") {
      if (!Number.isInteger(value) || value < 1 || value > 1000) {
        throw new MetaPrivacyPolicyError(
          "INVALID_NUM_ITEMS",
          "custom_data.num_items must be an integer between 1 and 1000",
        );
      }
      sanitizedCustomData.num_items = value;
    } else if (key === "content_type") {
      if (value !== "product") {
        throw new MetaPrivacyPolicyError(
          "INVALID_CONTENT_TYPE",
          "custom_data.content_type must be 'product'",
        );
      }
      sanitizedCustomData.content_type = "product";
    }
  }

  return sanitizedCustomData;
}

/**
 * Validates an event payload prior to outbox database insertion.
 */
export function validateMetaEventPayload(
  { eventId, eventName, userData = {}, eventData = {} },
  configOverride,
) {
  const validEventName = validateEventName(eventName, configOverride);
  const validEventId = validateEventId(eventId, validEventName);
  const validUserData = validateMetaUserData(userData, configOverride);
  const validCustomData = validateMetaCustomData(eventData, configOverride);

  return {
    eventId: validEventId,
    eventName: validEventName,
    userData: validUserData,
    eventData: validCustomData,
  };
}

const ALLOWED_TOP_LEVEL_CAPI_KEYS = Object.freeze(
  new Set([
    "event_name",
    "event_time",
    "event_id",
    "action_source",
    "event_source_url",
    "user_data",
    "custom_data",
  ]),
);

const ALLOWED_ACTION_SOURCES = Object.freeze(
  new Set(["app", "website", "system_generated", "system"]),
);

/**
 * Final boundary validation executed immediately before outbound Meta CAPI request.
 */
export function validateCapiEventPayload(event, configOverride) {
  if (!isPlainObject(event)) {
    throw new MetaPrivacyPolicyError(
      "INVALID_CAPI_EVENT",
      "CAPI event must be a plain object",
    );
  }

  for (const key of Object.keys(event)) {
    if (!ALLOWED_TOP_LEVEL_CAPI_KEYS.has(key)) {
      throw new MetaPrivacyPolicyError(
        "UNEXPECTED_TOP_LEVEL_KEY",
        `Unexpected top-level CAPI field: ${key}`,
      );
    }
  }

  const {
    event_name,
    event_time,
    event_id,
    action_source = "system_generated",
    user_data = {},
    custom_data = {},
  } = event;

  if (!Number.isInteger(event_time) || event_time <= 0) {
    throw new MetaPrivacyPolicyError(
      "INVALID_EVENT_TIME",
      "event_time must be a positive integer Unix timestamp",
    );
  }

  if (!ALLOWED_ACTION_SOURCES.has(action_source)) {
    throw new MetaPrivacyPolicyError(
      "INVALID_ACTION_SOURCE",
      `Unsupported action_source: ${action_source}`,
    );
  }

  const validated = validateMetaEventPayload(
    {
      eventId: event_id,
      eventName: event_name,
      userData: user_data,
      eventData: custom_data,
    },
    configOverride,
  );

  return {
    event_name: validated.eventName,
    event_time,
    event_id: validated.eventId,
    action_source,
    user_data: validated.userData,
    custom_data: validated.eventData,
  };
}