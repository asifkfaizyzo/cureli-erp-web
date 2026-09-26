// backend/src/modules/notifications/templates/inapp/ticket.templates.js (do not remove this comment)
// ============================================
// TICKET TEMPLATES
// ============================================

export const ticketTemplates = {
  /**
   * Ticket created confirmation
   */
  ticketCreated: (context) => {
    const { ticket_number, subject, category } = context;

    let message = 'Your support ticket';
    
    if (ticket_number) {
      message += ` #${ticket_number}`;
    }
    
    message += ' has been created successfully.';
    
    if (subject) {
      message += ` Subject: "${truncate(subject, 50)}".`;
    }
    
    message += ' We will respond shortly.';

    return {
      title: 'Ticket Created',
      message,
    };
  },

  /**
   * Ticket status changed
   */
  ticketStatusChanged: (context) => {
    const { 
      ticket_number, 
      old_status, 
      new_status,
      admin_notes,
    } = context;

    const statusLabels = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'RESOLVED': 'Resolved',
      'CANCELLED': 'Cancelled',
      'CLOSED': 'Closed',
    };

    const newStatusLabel = statusLabels[new_status] || new_status;
    
    let title = 'Ticket Updated';
    let message = `Ticket`;
    
    if (ticket_number) {
      message += ` #${ticket_number}`;
    }

    // Customize based on new status
    switch (new_status) {
      case 'IN_PROGRESS':
        title = 'Ticket In Progress';
        message += ' is now being reviewed by our team.';
        break;
      case 'RESOLVED':
        title = 'Ticket Resolved';
        message += ' has been resolved.';
        if (admin_notes) {
          message += ` Resolution: "${truncate(admin_notes, 100)}".`;
        }
        break;
      case 'CANCELLED':
        title = 'Ticket Cancelled';
        message += ' has been cancelled.';
        if (admin_notes) {
          message += ` Reason: "${truncate(admin_notes, 100)}".`;
        }
        break;
      case 'CLOSED':
        title = 'Ticket Closed';
        message += ' has been closed.';
        break;
      default:
        message += ` status changed to ${newStatusLabel}.`;
    }

    return {
      title,
      message,
    };
  },
};

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function truncate(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export default ticketTemplates;