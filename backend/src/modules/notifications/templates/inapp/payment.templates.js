// backend/src/modules/notifications/templates/inapp/payment.templates.js (do not remove this comment)
// ============================================
// backend\src\modules\notifications\templates\inapp\payment.templates.js
// ============================================

export const paymentTemplates = {
  /**
   * Payment successful
   */
  paymentSuccess: (context) => {
    const { 
      amount, 
      transaction_id,
      plan_name,
      payment_method,
    } = context;

    let message = 'Payment of';
    
    if (amount) {
      message += ` ₹${formatAmount(amount)}`;
    }
    
    message += ' was successful';
    
    if (plan_name) {
      message += ` for ${plan_name}`;
    }
    
    message += '.';
    
    if (transaction_id) {
      message += ` Transaction ID: ${transaction_id}.`;
    }

    return {
      title: 'Payment Successful',
      message,
    };
  },

  /**
   * Payment failed
   */
  paymentFailed: (context) => {
    const { 
      amount, 
      error_message,
      plan_name,
      retry_url,
    } = context;

    let message = 'Payment';
    
    if (amount) {
      message += ` of ₹${formatAmount(amount)}`;
    }
    
    if (plan_name) {
      message += ` for ${plan_name}`;
    }
    
    message += ' failed.';
    
    if (error_message) {
      message += ` Reason: ${error_message}.`;
    }
    
    message += ' Please try again or use a different payment method.';

    return {
      title: 'Payment Failed',
      message,
    };
  },
};

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function formatAmount(amount) {
  if (!amount) return '0';
  return Number(amount).toLocaleString('en-IN');
}

export default paymentTemplates;