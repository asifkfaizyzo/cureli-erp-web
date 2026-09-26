// backend/src/config/customerTicketStateMachine.js (do not remove this comment)
/**
 * Single source of truth for Customer Support Ticket State Transitions.
 */

export const CUSTOMER_TICKET_TRANSITIONS = {
  OPEN: {
    IN_PROGRESS: ["CADMIN"],
    RESOLVED: ["CADMIN"],
    CLOSED: ["CADMIN"],
  },
  IN_PROGRESS: {
    OPEN: ["CADMIN"],
    RESOLVED: ["CADMIN"],
    CLOSED: ["CADMIN"],
  },
  RESOLVED: {
    OPEN: ["CUSTOMER", "CADMIN"], // Customer can reopen via reply
    CLOSED: ["CADMIN", "SYSTEM"],
  },
  CLOSED: {
    // Terminal state - no transitions allowed
  },
};

export function canTransitionCustomerTicket(fromStatus, toStatus, actorType) {
  const allowed = CUSTOMER_TICKET_TRANSITIONS[fromStatus]?.[toStatus];
  if (!allowed) return false;
  return allowed.includes(actorType);
}

export function isReopenTransition(fromStatus, toStatus) {
  return fromStatus === "RESOLVED" && toStatus === "OPEN";
}