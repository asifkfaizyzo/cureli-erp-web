// backend/src/modules/notifications/templates/inapp/security.templates.js (do not remove this comment)
// ============================================
// SECURITY & ACCESS TEMPLATES
// ============================================

export const securityTemplates = {
  /**
   * Password changed by user
   */
  passwordChanged: (context) => {
    return {
      title: 'Password Changed',
      message: 'Your password was successfully changed. If you did not make this change, please contact support immediately.',
    };
  },

  /**
   * Password reset by admin
   */
  passwordResetByAdmin: (context) => {
    const { admin_name } = context;
    return {
      title: 'Password Reset by Admin',
      message: admin_name
        ? `Your password was reset by ${admin_name}. Please check your email for the new password.`
        : 'Your password was reset by an administrator. Please check your email for the new password.',
    };
  },

  /**
   * Email address changed
   */
  emailChanged: (context) => {
    const { old_email, new_email } = context;
    return {
      title: 'Email Address Changed',
      message: new_email
        ? `Your email address has been changed to ${new_email}.`
        : 'Your email address has been successfully updated.',
    };
  },

  /**
   * Phone number changed
   */
  phoneChanged: (context) => {
    const { new_phone } = context;
    return {
      title: 'Phone Number Changed',
      message: new_phone
        ? `Your phone number has been changed to ${maskPhone(new_phone)}.`
        : 'Your phone number has been successfully updated.',
    };
  },

  /**
   * User role changed
   */
  roleChanged: (context) => {
    const { old_role, new_role, changed_by } = context;
    
    const roleLabels = {
      'super_admin': 'Super Admin',
      'branch_admin': 'Branch Admin',
      'staff': 'Staff',
    };

    const newRoleLabel = roleLabels[new_role] || new_role;
    const oldRoleLabel = roleLabels[old_role] || old_role;

    if (old_role && new_role) {
      return {
        title: 'Role Updated',
        message: `Your role has been changed from ${oldRoleLabel} to ${newRoleLabel}.`,
      };
    }

    return {
      title: 'Role Updated',
      message: `Your role has been updated to ${newRoleLabel}.`,
    };
  },

  /**
   * User branch changed
   */
  branchChanged: (context) => {
    const { old_branch_name, new_branch_name } = context;

    if (old_branch_name && new_branch_name) {
      return {
        title: 'Branch Assignment Changed',
        message: `You have been transferred from ${old_branch_name} to ${new_branch_name}.`,
      };
    }

    if (new_branch_name) {
      return {
        title: 'Branch Assigned',
        message: `You have been assigned to ${new_branch_name}.`,
      };
    }

    return {
      title: 'Branch Assignment Changed',
      message: 'Your branch assignment has been updated.',
    };
  },
};

// ─────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

export default securityTemplates;