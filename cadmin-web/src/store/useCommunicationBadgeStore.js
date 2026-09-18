// cadmin-web/src/store/useCommunicationBadgeStore.js

import { create } from "zustand";
import { getAllTickets } from "../api/cadminTickets";
import { getEnquiryStats } from "../api/cadminEnquiries";
import { getCustomerTicketStats } from "../api/cadminCustomerTickets";

const POLL_INTERVAL_MS = 60_000; // 60 seconds

let _intervalId = null;

export const useCommunicationBadgeStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  pendingTickets:         0,
  pendingEnquiries:       0,
  pendingCustomerTickets: 0,
  isLoading:              false,
  lastFetched:            null,

  // ── Derived ───────────────────────────────────────────────
  // Admin communications pending (Shop Tickets + Enquiries)
  get hasAdminPending() {
    const s = get();
    return s.pendingTickets > 0 || s.pendingEnquiries > 0;
  },

  // Marketplace communications pending (Customer Tickets)
  get hasMarketplacePending() {
    const s = get();
    return s.pendingCustomerTickets > 0;
  },

  // ── Fetch ─────────────────────────────────────────────────
  fetchCounts: async () => {
    try {
      set({ isLoading: true });

      const [ticketsRes, enquiriesRes, customerTicketsRes] = await Promise.allSettled([
        getAllTickets({ page: 1, limit: 1, status: "PENDING" }),
        getEnquiryStats(),
        getCustomerTicketStats(),
      ]);

      let pendingTickets         = get().pendingTickets;
      let pendingEnquiries       = get().pendingEnquiries;
      let pendingCustomerTickets = get().pendingCustomerTickets;

      if (ticketsRes.status === "fulfilled") {
        pendingTickets =
          ticketsRes.value?.data?.data?.pagination?.total ?? 0;
      }

      if (enquiriesRes.status === "fulfilled") {
        const d =
          enquiriesRes.value?.data?.data?.stats ??
          enquiriesRes.value?.data?.data ??
          enquiriesRes.value?.data ??
          {};
        pendingEnquiries = d.pending ?? d.pendingEnquiries ?? 0;
      }

      if (customerTicketsRes.status === "fulfilled") {
        const data =
          customerTicketsRes.value?.data?.data ??
          customerTicketsRes.value?.data ??
          {};
        pendingCustomerTickets = (data.open ?? 0) + (data.in_progress ?? 0);
      }

      set({
        pendingTickets,
        pendingEnquiries,
        pendingCustomerTickets,
        isLoading:   false,
        lastFetched: new Date().toISOString(),
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Polling ───────────────────────────────────────────────
  startPolling: () => {
    if (_intervalId) return;

    get().fetchCounts();

    _intervalId = setInterval(() => {
      get().fetchCounts();
    }, POLL_INTERVAL_MS);
  },

  stopPolling: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  },

  refresh: () => {
    get().fetchCounts();
  },
}));