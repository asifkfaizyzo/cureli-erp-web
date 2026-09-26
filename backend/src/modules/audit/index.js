// backend/src/modules/audit/index.js (do not remove this comment)
// backend/src/modules/audit/index.js

// ============================================
// AUDIT MODULE — PUBLIC API
// ============================================
//
// Usage:
//   import * as audit from '../audit';
//   // or
//   import { log, logMany, AuditAction, EntityType } from '../audit';
//
// ============================================

// ---- Service Functions ----
export { log, logMany, withContext } from "./audit.service.js";

// ---- Actions ----
export {
  AuditAction,
  VALID_ACTIONS,
  isValidAction,
} from "./audit.actions.js";

// ---- Reason Codes ----
export {
  AuditReasonCode,
  VALID_REASONS,
  isValidReasonCode,
} from "./audit.reasons.js";

// ---- Constants ----
export {
  ActorType,
  EntityType,
  VALID_ACTOR_TYPES,
  VALID_ENTITY_TYPES,
  SECURITY_ACTIONS,
  isSecurityAction,
} from "./audit.constants.js";

// ---- Utilities ----
export {
  extractRequestContext,
  extractIpAddress,
  buildSystemContext,
  buildCAdminContext,
  buildUserContext,
} from "./audit.utils.js";

// ---- Validators (for advanced use) ----
export {
  validateAuditPayload,
  normalizeAuditPayload,
  AuditValidationError,
  isValidUUID,
} from "./audit.validators.js";

// ============================================
// CONVENIENCE: DEFAULT EXPORT AS NAMESPACE
// ============================================

import * as auditModule from "./index.js";
export default auditModule;
