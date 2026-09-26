// cadmin-web/src/config/modules/auditConfig.js (do not remove this comment)
// ============================================
// AUDIT CONFIGURATION
// ============================================
// Action categories, labels, icons, and colors
// for the Audit Logs UI
// ============================================

import {
  Shield,
  Users,
  Store,
  CreditCard,
  FileText,
  MessageSquare,
  UserCog,
  Settings,
  GitBranch,
  Key,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Pencil,
  Ban,
  CheckCircle,
  XCircle,
  Upload,
  RefreshCw,
  AlertTriangle,
  Bell,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Mail,
  Phone,
  Building2,
  ClipboardList,
  Activity,
} from 'lucide-react';

// ============================================
// ACTION CATEGORIES
// ============================================
// Groups actions for filter dropdown

export const AUDIT_CATEGORIES = {
  authentication: {
    label: 'Authentication & Security',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    actions: [
      'CADMIN_LOGIN_SUCCESS',
      'CADMIN_LOGOUT',
      'USER_PASSWORD_CHANGED',
      'PASSWORD_RESET_COMPLETED',
      'USER_PASSWORD_RESET_BY_ADMIN',
      'CADMIN_PASSWORD_RESET_COMPLETED',
    ],
  },
  user_management: {
    label: 'User Management',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    actions: [
      'USER_CREATED',
      'USER_PROFILE_UPDATED',
      'USER_PROFILE_UPDATED_BY_ADMIN',
      'USER_ROLE_CHANGED',
      'USER_ROLE_CHANGED_BY_ADMIN',
      'USER_BRANCH_CHANGED',
      'USER_DEACTIVATED',
      'USER_REACTIVATED',
      'USER_ACTIVATED_BY_ADMIN',
      'USER_SUSPENDED_BY_ADMIN',
      'USER_EMAIL_CHANGED',
      'USER_PHONE_CHANGED',
    ],
  },
  shop_management: {
    label: 'Shop & Business',
    icon: Store,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    actions: [
      'SHOP_ACCOUNT_CREATED',
      'SHOP_SETUP_COMPLETED',
      'SHOP_ACTIVATED',
      'SHOP_SUSPENDED',
      'SHOP_SUSPENDED_DUE_TO_NON_PAYMENT',
      'SHOP_DETAILS_UPDATED',
      'SHOP_PLAN_ASSIGNED_BY_ADMIN',
    ],
  },
  branches: {
    label: 'Branch Management',
    icon: GitBranch,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    actions: [
      'BRANCH_CREATED',
      'BRANCH_RENAMED',
      'BRANCH_DEACTIVATED',
      'BRANCH_REACTIVATED',
    ],
  },
  subscriptions: {
    label: 'Subscriptions & Billing',
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    actions: [
      'SUBSCRIPTION_CREATED',
      'SUBSCRIPTION_CREATED_PENDING_PAYMENT',
      'SUBSCRIPTION_ACTIVATED',
      'SUBSCRIPTION_RENEWED',
      'SUBSCRIPTION_CANCELLED',
      'PLAN_UPGRADED',
      'PLAN_DOWNGRADED',
      'SUBSCRIPTION_ENTERED_GRACE',
      'PAYMENT_MARKED_OVERDUE',
      'USERS_DISABLED_DUE_TO_PLAN_DOWNGRADE',
      'BRANCHES_DEACTIVATED_DUE_TO_PLAN_DOWNGRADE',
    ],
  },
  plans: {
    label: 'Plan Management',
    icon: ClipboardList,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    actions: [
      'PLAN_CREATED',
      'PLAN_UPDATED',
      'PLAN_ACTIVATED',
      'PLAN_SUSPENDED',
      'PLAN_REACTIVATED',
      'PLAN_CLONED',
      'PLAN_DELETED',
      'PLAN_AUTO_SUSPENDED_BY_CRON',
    ],
  },
  documents: {
    label: 'Documents & Verification',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    actions: [
      'SHOP_DOCUMENT_UPLOADED',
      'SHOP_DOCUMENT_RESUBMITTED',
      'SHOP_DOCUMENT_UPLOADED_BY_ADMIN',
      'SHOP_DOCUMENT_REPLACED_BY_ADMIN',
      'SHOP_VERIFICATION_FILE_VERIFIED',
      'SHOP_VERIFICATION_FILE_REJECTED',
      'SHOP_VERIFICATION_FILE_BATCH_VERIFIED',
      'SHOP_VERIFICATION_FILE_BATCH_REJECTED',
      'SHOP_VERIFICATION_COMPLETED',
      'SHOP_VERIFICATION_PARTIALLY_REJECTED',
      'SHOP_VERIFICATION_REJECTED',
    ],
  },
  support: {
    label: 'Tickets & Support',
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    actions: [
      'TICKET_CREATED',
      'TICKET_CANCELLED',
      'TICKET_REOPENED',
      'TICKET_STATUS_UPDATED_BY_ADMIN',
      'TICKET_RESOLVED_BY_ADMIN',
      'TICKET_CLOSED_BY_ADMIN',
      'ENQUIRY_REPLIED',
      'ENQUIRY_STATUS_CHANGED',
    ],
  },
  admin_management: {
    label: 'Admin Management',
    icon: UserCog,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    actions: [
      'CADMIN_CREATED',
      'CADMIN_PROFILE_UPDATED',
      'CADMIN_ROLE_CHANGED',
      'CADMIN_ACTIVATED',
      'CADMIN_SUSPENDED',
    ],
  },
  system: {
    label: 'System & Automation',
    icon: Server,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    actions: [
      'SYSTEM_BROADCAST_CREATED',
      'SYSTEM_BROADCAST_SENT',
      'SYSTEM_BROADCAST_FAILED',
      'SYSTEM_MAINTENANCE_ENABLED',
      'SYSTEM_MAINTENANCE_DISABLED',
    ],
  },
};

// ============================================
// ACTION LABELS & DESCRIPTIONS
// ============================================

export const ACTION_CONFIG = {
  // Authentication & Security
  CADMIN_LOGIN_SUCCESS: {
    label: 'Admin Login',
    description: 'Admin logged in successfully',
    icon: LogIn,
    severity: 'info',
  },
  CADMIN_LOGOUT: {
    label: 'Admin Logout',
    description: 'Admin logged out',
    icon: LogOut,
    severity: 'info',
  },
  USER_PASSWORD_CHANGED: {
    label: 'Password Changed',
    description: 'User changed their password',
    icon: Key,
    severity: 'warning',
  },
  PASSWORD_RESET_COMPLETED: {
    label: 'Password Reset',
    description: 'Password was reset via email/phone',
    icon: RefreshCw,
    severity: 'warning',
  },
  USER_PASSWORD_RESET_BY_ADMIN: {
    label: 'Password Reset by Admin',
    description: 'Admin initiated password reset for user',
    icon: Key,
    severity: 'warning',
  },
  CADMIN_PASSWORD_RESET_COMPLETED: {
    label: 'Admin Password Reset',
    description: 'Admin password was reset',
    icon: Key,
    severity: 'critical',
  },

  // User Management
  USER_CREATED: {
    label: 'User Created',
    description: 'New user account was created',
    icon: UserPlus,
    severity: 'success',
  },
  USER_PROFILE_UPDATED: {
    label: 'Profile Updated',
    description: 'User updated their profile',
    icon: Pencil,
    severity: 'info',
  },
  USER_PROFILE_UPDATED_BY_ADMIN: {
    label: 'Profile Updated by Admin',
    description: 'Admin updated user profile',
    icon: UserCog,
    severity: 'info',
  },
  USER_ROLE_CHANGED: {
    label: 'Role Changed',
    description: 'User role was changed',
    icon: UserCog,
    severity: 'warning',
  },
  USER_ROLE_CHANGED_BY_ADMIN: {
    label: 'Role Changed by Admin',
    description: 'Admin changed user role',
    icon: UserCog,
    severity: 'warning',
  },
  USER_BRANCH_CHANGED: {
    label: 'Branch Changed',
    description: 'User was moved to different branch',
    icon: GitBranch,
    severity: 'info',
  },
  USER_DEACTIVATED: {
    label: 'User Deactivated',
    description: 'User account was deactivated',
    icon: UserMinus,
    severity: 'warning',
  },
  USER_REACTIVATED: {
    label: 'User Reactivated',
    description: 'User account was reactivated',
    icon: UserCheck,
    severity: 'success',
  },
  USER_ACTIVATED_BY_ADMIN: {
    label: 'User Activated by Admin',
    description: 'Admin activated user account',
    icon: UserCheck,
    severity: 'success',
  },
  USER_SUSPENDED_BY_ADMIN: {
    label: 'User Suspended by Admin',
    description: 'Admin suspended user account',
    icon: UserX,
    severity: 'critical',
  },
  USER_EMAIL_CHANGED: {
    label: 'Email Changed',
    description: 'User email address was changed',
    icon: Mail,
    severity: 'warning',
  },
  USER_PHONE_CHANGED: {
    label: 'Phone Changed',
    description: 'User phone number was changed',
    icon: Phone,
    severity: 'warning',
  },

  // Shop Management
  SHOP_ACCOUNT_CREATED: {
    label: 'Shop Created',
    description: 'New shop account was created',
    icon: Store,
    severity: 'success',
  },
  SHOP_SETUP_COMPLETED: {
    label: 'Shop Setup Completed',
    description: 'Shop completed onboarding setup',
    icon: CheckCircle,
    severity: 'success',
  },
  SHOP_ACTIVATED: {
    label: 'Shop Activated',
    description: 'Shop was activated',
    icon: CheckCircle,
    severity: 'success',
  },
  SHOP_SUSPENDED: {
    label: 'Shop Suspended',
    description: 'Shop was suspended',
    icon: Ban,
    severity: 'critical',
  },
  SHOP_SUSPENDED_DUE_TO_NON_PAYMENT: {
    label: 'Shop Suspended (Non-Payment)',
    description: 'Shop suspended due to payment failure',
    icon: AlertTriangle,
    severity: 'critical',
  },
  SHOP_DETAILS_UPDATED: {
    label: 'Shop Details Updated',
    description: 'Shop information was updated',
    icon: Pencil,
    severity: 'info',
  },
  SHOP_PLAN_ASSIGNED_BY_ADMIN: {
    label: 'Plan Assigned by Admin',
    description: 'Admin assigned a plan to shop',
    icon: ClipboardList,
    severity: 'info',
  },

  // Branches
  BRANCH_CREATED: {
    label: 'Branch Created',
    description: 'New branch was created',
    icon: GitBranch,
    severity: 'success',
  },
  BRANCH_RENAMED: {
    label: 'Branch Renamed',
    description: 'Branch name was changed',
    icon: Pencil,
    severity: 'info',
  },
  BRANCH_DEACTIVATED: {
    label: 'Branch Deactivated',
    description: 'Branch was deactivated',
    icon: XCircle,
    severity: 'warning',
  },
  BRANCH_REACTIVATED: {
    label: 'Branch Reactivated',
    description: 'Branch was reactivated',
    icon: CheckCircle,
    severity: 'success',
  },

  // Subscriptions & Billing
  SUBSCRIPTION_CREATED: {
    label: 'Subscription Created',
    description: 'New subscription was created',
    icon: CreditCard,
    severity: 'success',
  },
  SUBSCRIPTION_CREATED_PENDING_PAYMENT: {
    label: 'Subscription Pending Payment',
    description: 'Subscription created, awaiting payment',
    icon: Clock,
    severity: 'info',
  },
  SUBSCRIPTION_ACTIVATED: {
    label: 'Subscription Activated',
    description: 'Subscription was activated',
    icon: CheckCircle,
    severity: 'success',
  },
  SUBSCRIPTION_RENEWED: {
    label: 'Subscription Renewed',
    description: 'Subscription was renewed',
    icon: RefreshCw,
    severity: 'success',
  },
  SUBSCRIPTION_CANCELLED: {
    label: 'Subscription Cancelled',
    description: 'Subscription was cancelled',
    icon: XCircle,
    severity: 'warning',
  },
  PLAN_UPGRADED: {
    label: 'Plan Upgraded',
    description: 'Subscription plan was upgraded',
    icon: TrendingUp,
    severity: 'success',
  },
  PLAN_DOWNGRADED: {
    label: 'Plan Downgraded',
    description: 'Subscription plan was downgraded',
    icon: TrendingDown,
    severity: 'warning',
  },
  SUBSCRIPTION_ENTERED_GRACE: {
    label: 'Entered Grace Period',
    description: 'Subscription entered grace period',
    icon: Clock,
    severity: 'warning',
  },
  PAYMENT_MARKED_OVERDUE: {
    label: 'Payment Overdue',
    description: 'Payment was marked as overdue',
    icon: AlertTriangle,
    severity: 'critical',
  },
  USERS_DISABLED_DUE_TO_PLAN_DOWNGRADE: {
    label: 'Users Disabled (Downgrade)',
    description: 'Users disabled due to plan limits',
    icon: UserX,
    severity: 'warning',
  },
  BRANCHES_DEACTIVATED_DUE_TO_PLAN_DOWNGRADE: {
    label: 'Branches Deactivated (Downgrade)',
    description: 'Branches deactivated due to plan limits',
    icon: XCircle,
    severity: 'warning',
  },

  // Plans
  PLAN_CREATED: {
    label: 'Plan Created',
    description: 'New pricing plan was created',
    icon: ClipboardList,
    severity: 'success',
  },
  PLAN_UPDATED: {
    label: 'Plan Updated',
    description: 'Plan details were updated',
    icon: Pencil,
    severity: 'info',
  },
  PLAN_ACTIVATED: {
    label: 'Plan Activated',
    description: 'Plan was activated',
    icon: CheckCircle,
    severity: 'success',
  },
  PLAN_SUSPENDED: {
    label: 'Plan Suspended',
    description: 'Plan was suspended',
    icon: Ban,
    severity: 'warning',
  },
  PLAN_REACTIVATED: {
    label: 'Plan Reactivated',
    description: 'Plan was reactivated',
    icon: RefreshCw,
    severity: 'success',
  },
  PLAN_CLONED: {
    label: 'Plan Cloned',
    description: 'Plan was duplicated',
    icon: ClipboardList,
    severity: 'info',
  },
  PLAN_DELETED: {
    label: 'Plan Deleted',
    description: 'Plan was deleted',
    icon: XCircle,
    severity: 'warning',
  },
  PLAN_AUTO_SUSPENDED_BY_CRON: {
    label: 'Plan Auto-Suspended',
    description: 'Plan suspended by automated system',
    icon: Server,
    severity: 'warning',
  },

  // Documents
  SHOP_DOCUMENT_UPLOADED: {
    label: 'Document Uploaded',
    description: 'Shop uploaded a document',
    icon: Upload,
    severity: 'info',
  },
  SHOP_DOCUMENT_RESUBMITTED: {
    label: 'Document Resubmitted',
    description: 'Shop resubmitted a document',
    icon: RefreshCw,
    severity: 'info',
  },
  SHOP_DOCUMENT_UPLOADED_BY_ADMIN: {
    label: 'Document Uploaded by Admin',
    description: 'Admin uploaded document for shop',
    icon: Upload,
    severity: 'info',
  },
  SHOP_DOCUMENT_REPLACED_BY_ADMIN: {
    label: 'Document Replaced by Admin',
    description: 'Admin replaced a shop document',
    icon: RefreshCw,
    severity: 'info',
  },
  SHOP_VERIFICATION_FILE_VERIFIED: {
    label: 'Document Verified',
    description: 'Document was verified',
    icon: CheckCircle,
    severity: 'success',
  },
  SHOP_VERIFICATION_FILE_REJECTED: {
    label: 'Document Rejected',
    description: 'Document was rejected',
    icon: XCircle,
    severity: 'warning',
  },
  SHOP_VERIFICATION_FILE_BATCH_VERIFIED: {
    label: 'Documents Batch Verified',
    description: 'Multiple documents verified',
    icon: CheckCircle,
    severity: 'success',
  },
  SHOP_VERIFICATION_FILE_BATCH_REJECTED: {
    label: 'Documents Batch Rejected',
    description: 'Multiple documents rejected',
    icon: XCircle,
    severity: 'warning',
  },
  SHOP_VERIFICATION_COMPLETED: {
    label: 'Verification Completed',
    description: 'Shop verification completed',
    icon: CheckCircle,
    severity: 'success',
  },
  SHOP_VERIFICATION_PARTIALLY_REJECTED: {
    label: 'Verification Partial Rejection',
    description: 'Some documents were rejected',
    icon: AlertTriangle,
    severity: 'warning',
  },
  SHOP_VERIFICATION_REJECTED: {
    label: 'Verification Rejected',
    description: 'Shop verification was rejected',
    icon: XCircle,
    severity: 'critical',
  },

  // Support
  TICKET_CREATED: {
    label: 'Ticket Created',
    description: 'Support ticket was created',
    icon: MessageSquare,
    severity: 'info',
  },
  TICKET_CANCELLED: {
    label: 'Ticket Cancelled',
    description: 'Ticket was cancelled',
    icon: XCircle,
    severity: 'info',
  },
  TICKET_REOPENED: {
    label: 'Ticket Reopened',
    description: 'Ticket was reopened',
    icon: RefreshCw,
    severity: 'info',
  },
  TICKET_STATUS_UPDATED_BY_ADMIN: {
    label: 'Ticket Status Updated',
    description: 'Admin updated ticket status',
    icon: Pencil,
    severity: 'info',
  },
  TICKET_RESOLVED_BY_ADMIN: {
    label: 'Ticket Resolved',
    description: 'Ticket was resolved by admin',
    icon: CheckCircle,
    severity: 'success',
  },
  TICKET_CLOSED_BY_ADMIN: {
    label: 'Ticket Closed',
    description: 'Ticket was closed by admin',
    icon: XCircle,
    severity: 'info',
  },
  ENQUIRY_REPLIED: {
    label: 'Enquiry Replied',
    description: 'Admin replied to enquiry',
    icon: Mail,
    severity: 'info',
  },
  ENQUIRY_STATUS_CHANGED: {
    label: 'Enquiry Status Changed',
    description: 'Enquiry status was updated',
    icon: Pencil,
    severity: 'info',
  },

  // Admin Management
  CADMIN_CREATED: {
    label: 'Admin Created',
    description: 'New admin account was created',
    icon: UserPlus,
    severity: 'success',
  },
  CADMIN_PROFILE_UPDATED: {
    label: 'Admin Profile Updated',
    description: 'Admin updated their profile',
    icon: Pencil,
    severity: 'info',
  },
  CADMIN_ROLE_CHANGED: {
    label: 'Admin Role Changed',
    description: 'Admin role was changed',
    icon: UserCog,
    severity: 'warning',
  },
  CADMIN_ACTIVATED: {
    label: 'Admin Activated',
    description: 'Admin account was activated',
    icon: UserCheck,
    severity: 'success',
  },
  CADMIN_SUSPENDED: {
    label: 'Admin Suspended',
    description: 'Admin account was suspended',
    icon: UserX,
    severity: 'critical',
  },

  // System
  SYSTEM_BROADCAST_CREATED: {
    label: 'Broadcast Created',
    description: 'System broadcast was created',
    icon: Bell,
    severity: 'info',
  },
  SYSTEM_BROADCAST_SENT: {
    label: 'Broadcast Sent',
    description: 'System broadcast was sent',
    icon: Bell,
    severity: 'success',
  },
  SYSTEM_BROADCAST_FAILED: {
    label: 'Broadcast Failed',
    description: 'System broadcast failed to send',
    icon: AlertTriangle,
    severity: 'critical',
  },
  SYSTEM_MAINTENANCE_ENABLED: {
    label: 'Maintenance Enabled',
    description: 'System maintenance mode enabled',
    icon: Settings,
    severity: 'warning',
  },
  SYSTEM_MAINTENANCE_DISABLED: {
    label: 'Maintenance Disabled',
    description: 'System maintenance mode disabled',
    icon: Zap,
    severity: 'success',
  },
};

// ============================================
// ENTITY TYPE CONFIG
// ============================================

export const ENTITY_TYPE_CONFIG = {
  user: {
    label: 'User',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    route: '/users?search=',
  },
  shop: {
    label: 'Shop',
    icon: Store,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    route: '/shops?search=',
  },
  branch: {
    label: 'Branch',
    icon: GitBranch,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    route: null,
  },
  subscription: {
    label: 'Subscription',
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    route: '/subscriptions/manage?search=',
  },
  plan: {
    label: 'Plan',
    icon: ClipboardList,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    route: '/subscriptions/manage',
  },
  ticket: {
    label: 'Ticket',
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    route: '/communications/tickets?search=',
  },
  document: {
    label: 'Document',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    route: null,
  },
  enquiry: {
    label: 'Enquiry',
    icon: Mail,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    route: '/communications/enquiries?search=',
  },
  payment: {
    label: 'Payment',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    route: null,
  },
  cadmin: {
    label: 'Admin',
    icon: UserCog,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    route: '/admins?search=',
  },
  session: {
    label: 'Session',
    icon: Activity,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    route: null,
  },
  system: {
    label: 'System',
    icon: Server,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    route: null,
  },
};

// ============================================
// ACTOR TYPE CONFIG
// ============================================

export const ACTOR_TYPE_CONFIG = {
  erp_user: {
    label: 'ERP User',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  cadmin: {
    label: 'Admin',
    icon: UserCog,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  system: {
    label: 'System',
    icon: Server,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

// ============================================
// REASON CODE CONFIG
// ============================================

export const REASON_CODE_CONFIG = {
  USER_REQUEST: {
    label: 'User Request',
    description: 'Action initiated by user',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  ADMIN_ACTION: {
    label: 'Admin Action',
    description: 'Action performed by admin',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  SYSTEM_ENFORCEMENT: {
    label: 'System Enforcement',
    description: 'Enforced by system policies',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  PLAN_LIMIT_ENFORCEMENT: {
    label: 'Plan Limit',
    description: 'Enforced due to plan limits',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  PAYMENT_ISSUE: {
    label: 'Payment Issue',
    description: 'Related to payment problems',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  SECURITY_ACTION: {
    label: 'Security',
    description: 'Security-related action',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  DATA_CORRECTION: {
    label: 'Data Correction',
    description: 'Manual data fix by admin',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  AUTOMATION: {
    label: 'Automation',
    description: 'Automated system process',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  UNKNOWN: {
    label: 'Unknown',
    description: 'Reason not specified',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
  },
};

// ============================================
// SEVERITY CONFIG
// ============================================

export const SEVERITY_CONFIG = {
  info: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  success: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get category for an action
 */
export function getActionCategory(action) {
  for (const [categoryKey, category] of Object.entries(AUDIT_CATEGORIES)) {
    if (category.actions.includes(action)) {
      return { key: categoryKey, ...category };
    }
  }
  return null;
}

/**
 * Get action config with fallback
 */
export function getActionConfig(action) {
  return ACTION_CONFIG[action] || {
    label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Action performed',
    icon: Activity,
    severity: 'info',
  };
}

/**
 * Get entity type config with fallback
 */
export function getEntityTypeConfig(entityType) {
  return ENTITY_TYPE_CONFIG[entityType] || {
    label: entityType,
    icon: Activity,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    route: null,
  };
}

/**
 * Get actor type config with fallback
 */
export function getActorTypeConfig(actorType) {
  return ACTOR_TYPE_CONFIG[actorType] || {
    label: actorType,
    icon: Activity,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  };
}

/**
 * Get reason code config with fallback
 */
export function getReasonCodeConfig(reasonCode) {
  return REASON_CODE_CONFIG[reasonCode] || {
    label: reasonCode || 'N/A',
    description: '',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
  };
}

/**
 * Build category options for dropdown
 */
export function getCategoryOptions() {
  return Object.entries(AUDIT_CATEGORIES).map(([key, category]) => ({
    value: key,
    label: category.label,
    icon: category.icon,
    actions: category.actions,
  }));
}

/**
 * Build entity type options for dropdown
 */
export function getEntityTypeOptions() {
  return Object.entries(ENTITY_TYPE_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    icon: config.icon,
  }));
}

/**
 * Build actor type options for dropdown
 */
export function getActorTypeOptions() {
  return Object.entries(ACTOR_TYPE_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    icon: config.icon,
  }));
}