/**
 * SSE Service Manager (Singleton)
 * Maintains active SSE connections for:
 *  - CAdmin        (Map<cadminId,    Set<Response>>)
 *  - ERP Users     (Map<userId,      Set<Response>>)
 *  - Mobile Customers (Map<customerId, Set<Response>>)
 *  - Riders        (Map<riderId,     Set<Response>>)
 */
class SSEService {
  constructor() {
    this.cadminClients = new Map(); // Map<cadminId,    Set<Response>>
    this.userClients   = new Map(); // Map<userId,      Set<Response>>
    this.mobileClients = new Map(); // Map<customerId,  Set<Response>>
    this.riderClients  = new Map(); // Map<riderId,     Set<Response>>
  }

  // ── CAdmin Connection Handling ──────────────────────────────────────────

  addCAdminClient(cadminId, res) {
    if (!this.cadminClients.has(cadminId)) {
      this.cadminClients.set(cadminId, new Set());
    }
    this.cadminClients.get(cadminId).add(res);
  }

  removeCAdminClient(cadminId, res) {
    const clients = this.cadminClients.get(cadminId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.cadminClients.delete(cadminId);
    }
  }

  notifyCAdmin(cadminId, eventName, data) {
    const clients = this.cadminClients.get(cadminId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeCAdminClient(cadminId, res);
      }
    });
  }

  /**
   * Broadcasts an event to all connected CAdmins globally.
   * Automatically clears connections that have hung up.
   * @param {string} eventName - Name of the SSE event
   * @param {object} data - Payload data
   */
  notifyAllCAdmins(eventName, data) {
    if (this.cadminClients.size === 0) return;
    const message = this.formatSSEMessage(eventName, data);
    
    this.cadminClients.forEach((clientsSet, cadminId) => {
      clientsSet.forEach((res) => {
        try {
          res.write(message);
        } catch {
          this.removeCAdminClient(cadminId, res);
        }
      });
    });
  }

  // ── ERP Users ─────────────────────────────────────────────────────────────

  addUserClient(userId, res) {
    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set());
    }
    this.userClients.get(userId).add(res);
  }

  removeUserClient(userId, res) {
    const clients = this.userClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.userClients.delete(userId);
    }
  }

  notifyUser(userId, eventName, data) {
    const clients = this.userClients.get(userId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeUserClient(userId, res);
      }
    });
  }

  // ── Mobile Customers ──────────────────────────────────────────────────────

  addMobileClient(customerId, res) {
    if (!this.mobileClients.has(customerId)) {
      this.mobileClients.set(customerId, new Set());
    }
    this.mobileClients.get(customerId).add(res);
  }

  removeMobileClient(customerId, res) {
    const clients = this.mobileClients.get(customerId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.mobileClients.delete(customerId);
    }
  }

  notifyMobile(customerId, eventName, data) {
    const clients = this.mobileClients.get(customerId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeMobileClient(customerId, res);
      }
    });
  }

  // ── Riders ────────────────────────────────────────────────────────────────

  addRiderClient(riderId, res) {
    if (!this.riderClients.has(riderId)) {
      this.riderClients.set(riderId, new Set());
    }
    this.riderClients.get(riderId).add(res);
  }

  removeRiderClient(riderId, res) {
    const clients = this.riderClients.get(riderId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.riderClients.delete(riderId);
    }
  }

  notifyRider(riderId, eventName, data) {
    const clients = this.riderClients.get(riderId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeRiderClient(riderId, res);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Formats a message into the SSE wire format.
   * @param {string} eventName - The SSE event name.
   * @param {object} data      - The payload to serialize as JSON.
   * @returns {string}         - Formatted SSE string.
   */
  formatSSEMessage(eventName, data) {
    return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  /**
   * Debug helper — returns a snapshot of active connection counts.
   * Useful for health-check endpoints.
   */
  getConnectionStats() {
    const countClients = (map) => {
      let total = 0;
      map.forEach((set) => (total += set.size));
      return total;
    };

    return {
      cadmin:   { sessions: this.cadminClients.size,  connections: countClients(this.cadminClients)  },
      users:    { sessions: this.userClients.size,    connections: countClients(this.userClients)    },
      mobile:   { sessions: this.mobileClients.size,  connections: countClients(this.mobileClients)  },
      riders:   { sessions: this.riderClients.size,   connections: countClients(this.riderClients)   },
    };
  }
}

// Export singleton instance — one shared instance across the entire process
export const sseService = new SSEService();