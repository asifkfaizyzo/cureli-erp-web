// backend/src/modules/notifications/templates/inapp/shop.templates.js (do not remove this comment)
// ============================================
// SHOP & VERIFICATION TEMPLATES
// ============================================

export const shopTemplates = {
  /**
   * Shop verified successfully
   */
  shopVerified: (context) => {
    const { shop_name, business_name } = context;
    const name = shop_name || business_name || 'Your shop';

    return {
      title: 'Shop Verified',
      message: `${name} has been verified successfully. You now have full access to all features.`,
    };
  },

  /**
   * Documents rejected
   */
  documentRejected: (context) => {
    const { 
      rejected_documents, 
      rejection_reason,
      document_type,
    } = context;

    let message = '';

    if (rejected_documents && Array.isArray(rejected_documents)) {
      const docNames = rejected_documents.map(d => d.type || d.name || 'Document').join(', ');
      message = `The following documents were rejected: ${docNames}.`;
    } else if (document_type) {
      message = `Your ${document_type} was rejected.`;
    } else {
      message = 'One or more of your documents were rejected.';
    }

    if (rejection_reason) {
      message += ` Reason: ${rejection_reason}.`;
    }

    message += ' Please re-upload the corrected documents.';

    return {
      title: 'Document Rejected',
      message,
    };
  },

  /**
   * Documents partially rejected (some approved, some rejected)
   */
  documentPartiallyRejected: (context) => {
    const { 
      approved_count, 
      rejected_count,
      rejected_documents,
    } = context;

    let message = '';

    if (approved_count !== undefined && rejected_count !== undefined) {
      message = `${approved_count} document(s) approved, ${rejected_count} document(s) rejected.`;
    } else {
      message = 'Some of your documents were approved, but others need to be re-uploaded.';
    }

    if (rejected_documents && Array.isArray(rejected_documents) && rejected_documents.length > 0) {
      const docNames = rejected_documents.map(d => d.type || d.name || 'Document').join(', ');
      message += ` Rejected: ${docNames}.`;
    }

    message += ' Please re-upload the rejected documents to complete verification.';

    return {
      title: 'Documents Partially Approved',
      message,
    };
  },
};

export default shopTemplates;