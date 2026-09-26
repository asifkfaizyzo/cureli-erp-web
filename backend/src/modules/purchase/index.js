// backend/src/modules/purchase/index.js (do not remove this comment)
// backend/src/modules/purchase/index.js

// Import from purchase.service.js (Part 1)
export {
  createPurchaseInvoice,
  confirmPurchaseInvoice,
  getPurchaseInvoices,
  getInvoiceDetails,
  getPurchaseStats,
} from "./purchase.service.js";

// Import from purchase1.service.js (Part 2)
export {
  updatePurchaseInvoice,
  cancelPurchaseInvoice,
  updatePaymentStatus,
  recordPayment,
  createPurchaseReturn,
  approveOrRejectReturn,
  getPurchaseReturns,
  getSupplierCredits,
  applyCreditNote,
  expireOldCreditNotes,
  getReturnDetails,
  cancelApprovedReturn,
  revertReturnToPending,
} from "./purchase1.service.js";