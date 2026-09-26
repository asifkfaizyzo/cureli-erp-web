// backend/src/modules/notifications/templates/inapp/user.templates.js (do not remove this comment)
// ============================================
// USER MANAGEMENT TEMPLATES
// ============================================

export const userTemplates = {
  /**
   * New user created in shop (notifies admins)
   */
  userCreated: (context) => {
    const { 
      new_user_name, 
      new_user_email,
      new_user_role,
      branch_name,
      created_by_name,
    } = context;

    const roleLabels = {
      'super_admin': 'Super Admin',
      'branch_admin': 'Branch Admin',
      'staff': 'Staff',
    };

    const roleLabel = roleLabels[new_user_role] || new_user_role || 'User';
    
    let message = `A new ${roleLabel}`;
    
    if (new_user_name) {
      message += ` "${new_user_name}"`;
    }
    
    message += ' has been added';
    
    if (branch_name) {
      message += ` to ${branch_name}`;
    }
    
    message += '.';
    
    if (created_by_name) {
      message += ` Added by: ${created_by_name}.`;
    }

    return {
      title: 'New User Added',
      message,
    };
  },

  /**
   * User deactivated (notifies admins, NOT the affected user)
   */
  userDeactivated: (context) => {
    const { 
      affected_user_name, 
      affected_user_role,
      deactivated_by_name,
      reason,
    } = context;

    let message = '';
    
    if (affected_user_name) {
      message = `${affected_user_name}`;
    } else {
      message = 'A user';
    }
    
    if (affected_user_role) {
      const roleLabels = {
        'super_admin': 'Super Admin',
        'branch_admin': 'Branch Admin',
        'staff': 'Staff',
      };
      message += ` (${roleLabels[affected_user_role] || affected_user_role})`;
    }
    
    message += ' has been deactivated';
    
    if (deactivated_by_name) {
      message += ` by ${deactivated_by_name}`;
    }
    
    message += '.';
    
    if (reason) {
      message += ` Reason: ${reason}.`;
    }

    return {
      title: 'User Deactivated',
      message,
    };
  },

  /**
   * User reactivated (notifies admins)
   */
  userReactivated: (context) => {
    const { 
      affected_user_name, 
      affected_user_role,
      reactivated_by_name,
    } = context;

    let message = '';
    
    if (affected_user_name) {
      message = `${affected_user_name}`;
    } else {
      message = 'A user';
    }
    
    if (affected_user_role) {
      const roleLabels = {
        'super_admin': 'Super Admin',
        'branch_admin': 'Branch Admin',
        'staff': 'Staff',
      };
      message += ` (${roleLabels[affected_user_role] || affected_user_role})`;
    }
    
    message += ' has been reactivated';
    
    if (reactivated_by_name) {
      message += ` by ${reactivated_by_name}`;
    }
    
    message += '.';

    return {
      title: 'User Reactivated',
      message,
    };
  },
};

export default userTemplates;