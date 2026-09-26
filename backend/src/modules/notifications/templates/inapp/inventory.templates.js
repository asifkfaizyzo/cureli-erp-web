// backend/src/modules/notifications/templates/inapp/inventory.templates.js (do not remove this comment)
// ============================================
// INVENTORY ALERT TEMPLATES
// ============================================

export const inventoryTemplates = {
  /**
   * Low stock alert - below reorder level
   */
  lowStock: (context) => {
    const { 
      medicine_name, 
      batch_number,
      current_stock, 
      minimum_stock,
      branch_name,
    } = context;

    let message = `${medicine_name || 'An item'}`;
    
    if (batch_number) {
      message += ` (Batch: ${batch_number})`;
    }
    
    message += ` is running low.`;
    
    if (current_stock !== undefined && minimum_stock !== undefined) {
      message += ` Current stock: ${current_stock}, Reorder level: ${minimum_stock}.`;
    }
    
    if (branch_name) {
      message += ` Branch: ${branch_name}.`;
    }

    return {
      title: 'Low Stock Alert',
      message,
    };
  },

  /**
   * Out of stock alert - zero stock
   */
  outOfStock: (context) => {
    const { 
      medicine_name, 
      batch_number,
      branch_name,
    } = context;

    let message = `${medicine_name || 'An item'}`;
    
    if (batch_number) {
      message += ` (Batch: ${batch_number})`;
    }
    
    message += ` is now out of stock.`;
    
    if (branch_name) {
      message += ` Branch: ${branch_name}.`;
    }
    
    message += ` Reorder immediately.`;

    return {
      title: 'Out of Stock',
      message,
    };
  },

  /**
   * Near expiry alert - within expiry threshold
   */
  nearExpiry: (context) => {
    const { 
      medicine_name, 
      batch_number,
      expiry_date,
      days_until_expiry,
      current_stock,
      branch_name,
    } = context;

    let message = `${medicine_name || 'An item'}`;
    
    if (batch_number) {
      message += ` (Batch: ${batch_number})`;
    }
    
    if (days_until_expiry !== undefined) {
      message += ` expires in ${days_until_expiry} day${days_until_expiry !== 1 ? 's' : ''}`;
    } else if (expiry_date) {
      message += ` expires on ${formatDate(expiry_date)}`;
    } else {
      message += ` is nearing expiry`;
    }
    
    message += '.';
    
    if (current_stock !== undefined) {
      message += ` Qty: ${current_stock}.`;
    }
    
    if (branch_name) {
      message += ` Branch: ${branch_name}.`;
    }

    return {
      title: 'Expiry Warning',
      message,
    };
  },

  /**
   * Expired stock alert - past expiry date
   */
  expiredStock: (context) => {
    const { 
      medicine_name, 
      batch_number,
      expiry_date,
      current_stock,
      branch_name,
    } = context;

    let message = `${medicine_name || 'An item'}`;
    
    if (batch_number) {
      message += ` (Batch: ${batch_number})`;
    }
    
    message += ` has expired`;
    
    if (expiry_date) {
      message += ` on ${formatDate(expiry_date)}`;
    }
    
    message += '.';
    
    if (current_stock !== undefined && current_stock > 0) {
      message += ` ${current_stock} units need to be removed from inventory.`;
    }
    
    if (branch_name) {
      message += ` Branch: ${branch_name}.`;
    }

    return {
      title: 'Expired Stock Alert',
      message,
    };
  },
};

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default inventoryTemplates;