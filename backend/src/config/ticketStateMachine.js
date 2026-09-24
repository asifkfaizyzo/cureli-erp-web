// backend/src/config/ticketStateMachine.js (do not remove this comment)
//backend\src\config\ticketStateMachine.js
/**
 * SINGLE SOURCE OF TRUTH for ticket state transitions.
 * Both user-side and cadmin-side services import from here.
 *
 * Format:
 *   { fromStatus: { toStatus: allowedActorTypes[] } }
 *
 * Actor types: "ERP_USER" | "CADMIN" | "SYSTEM"
 */

export const TICKET_TRANSITIONS = {
  PENDING: {
    IN_PROGRESS: ["CADMIN"],
    CANCELLED: ["ERP_USER", "CADMIN"],
  },
  IN_PROGRESS: {
    RESOLVED: ["CADMIN"],
    PENDING: ["CADMIN"], // push back
    CANCELLED: ["ERP_USER", "CADMIN"],
  },
  RESOLVED: {
    CLOSED: ["CADMIN", "SYSTEM"],
    PENDING: ["ERP_USER", "CADMIN"], // reopen
  },
  CLOSED: {
    PENDING: ["ERP_USER", "CADMIN"], // reopen
  },
  CANCELLED: {
    // terminal — nothing allowed
  },
};

export const REOPEN_LIMIT = 6;
export const REOPEN_WARNING_AT = 4;

/**
 * Check if a transition is allowed for a given actor type.
 */
export function canTransition(fromStatus, toStatus, actorType) {
  const allowed = TICKET_TRANSITIONS[fromStatus]?.[toStatus];
  if (!allowed) return false;
  return allowed.includes(actorType);
}

/**
 * Is this transition a "reopen"?
 */
export function isReopenTransition(fromStatus, toStatus) {
  return (
    (fromStatus === "RESOLVED" || fromStatus === "CLOSED") &&
    toStatus === "PENDING"
  );
}

/**
 * Get all statuses a given actor can transition TO from a given status.
 */
export function getAllowedTransitions(fromStatus, actorType) {
  const transitions = TICKET_TRANSITIONS[fromStatus] || {};
  return Object.entries(transitions)
    .filter(([, actors]) => actors.includes(actorType))
    .map(([toStatus]) => toStatus);
}

/**
 * Calculate priority from reopen count.
 * Used on both pharmacy-web and backend.
 */
export function calculatePriority(reopenCount) {
  if (reopenCount === 0) return "LOW";
  if (reopenCount <= 2) return "MEDIUM";
  if (reopenCount <= 4) return "HIGH";
  return "CRITICAL";
}

/**
 * Get reopen_count Prisma filter for a priority label.
 */
export function priorityToReopenFilter(priority) {
  switch (priority) {
    case "LOW":
      return { equals: 0 };
    case "MEDIUM":
      return { gte: 1, lte: 2 };
    case "HIGH":
      return { gte: 3, lte: 4 };
    case "CRITICAL":
      return { gte: 5 };
    default:
      return undefined;
  }
}
