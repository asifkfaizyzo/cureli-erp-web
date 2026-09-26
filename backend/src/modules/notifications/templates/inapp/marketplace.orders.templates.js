// backend/src/modules/notifications/templates/inapp/marketplace.orders.templates.js (do not remove this comment)
// ============================================
// backend/src/modules/notifications/templates/inapp/marketplace.orders.templates.js
// ============================================

export const marketplaceOrderTemplates = {
  /**
   * Fired when a new order is placed — shown to all pharmacy ERP users.
   * context: { order_number, customer_name, item_count, total_amount }
   */
  orderPlaced: (context) => ({
    title: `New Order ${context.order_number}`,
    message: `${context.customer_name} placed an order for ${context.item_count} item${context.item_count !== 1 ? 's' : ''} — ₹${context.total_amount}`,
  }),

  /**
   * Fired when a customer cancels their order.
   * context: { order_number, customer_name }
   */
  orderCancelled: (context) => ({
    title: `Order ${context.order_number} Cancelled`,
    message: `${context.customer_name} cancelled their order.`,
  }),
};