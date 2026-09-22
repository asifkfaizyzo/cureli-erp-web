// cadmin-web/src/config/cadminPermissions.js

export const CADMIN_PERMISSIONS = {
  // ── Admin Management ──────────────────────────────────────────
  ADMINS_VIEW: "admins.view",
  ADMINS_VIEW_DETAIL: "admins.view_detail",
  ADMINS_VIEW_ACTIVITY: "admins.view_activity",
  ADMINS_CREATE: "admins.create",
  ADMINS_EDIT: "admins.edit",
  ADMINS_TOGGLE_ACCESS: "admins.toggle_access",

  // ── User Management ───────────────────────────────────────────
  USERS_VIEW: "users.view",
  USERS_VIEW_DETAIL: "users.view_detail",
  USERS_EDIT: "users.edit",
  USERS_TOGGLE_ACCESS: "users.toggle_access",
  USERS_RESET_PASSWORD: "users.reset_password",
  USERS_DELETE: "users.delete",

  // ── Shop Management ───────────────────────────────────────────
  SHOPS_VIEW: "shops.view",
  SHOPS_VIEW_DETAIL: "shops.view_detail",
  SHOPS_VIEW_STATS: "shops.view_stats",
  SHOPS_EDIT: "shops.edit",
  SHOPS_TOGGLE_ACTIVE: "shops.toggle_active",
  SHOPS_UPDATE_SUBSCRIPTION: "shops.update_subscription",
  SHOPS_UPLOAD_DOCUMENTS: "shops.upload_documents",

  // ── Plan Management ───────────────────────────────────────────
  PLANS_VIEW: "plans.view",
  PLANS_VIEW_DETAIL: "plans.view_detail",
  PLANS_VIEW_STATS: "plans.view_stats",
  PLANS_CREATE: "plans.create",
  PLANS_EDIT: "plans.edit",
  PLANS_ACTIVATE: "plans.activate",
  PLANS_SUSPEND: "plans.suspend",
  PLANS_REACTIVATE: "plans.reactivate",
  PLANS_CLONE: "plans.clone",
  PLANS_DELETE: "plans.delete",

  // ── Subscription Management ───────────────────────────────────
  SUBSCRIPTIONS_VIEW_AT_RISK: "subscriptions.view_at_risk",
  SUBSCRIPTIONS_VIEW_DETAIL: "subscriptions.view_detail",
  SUBSCRIPTIONS_SEND_REMINDER: "subscriptions.send_reminder",
  SUBSCRIPTIONS_EXTEND_GRACE: "subscriptions.extend_grace",
  SUBSCRIPTIONS_FORCE_SUSPEND: "subscriptions.force_suspend",
  SUBSCRIPTIONS_REACTIVATE: "subscriptions.reactivate",

  // ── Tickets (Shop / ERP) ──────────────────────────────────────
  TICKETS_VIEW: "tickets.view",
  TICKETS_VIEW_DETAIL: "tickets.view_detail",
  TICKETS_VIEW_STATS: "tickets.view_stats",
  TICKETS_VIEW_HISTORY: "tickets.view_history",
  TICKETS_UPDATE_STATUS: "tickets.update_status",

  // ── Customer Support Tickets (Mobile) ─────────────────────────
  CUSTOMER_TICKETS_VIEW: "customer_tickets.view",
  CUSTOMER_TICKETS_VIEW_DETAIL: "customer_tickets.view_detail",
  CUSTOMER_TICKETS_UPDATE_STATUS: "customer_tickets.update_status",
  CUSTOMER_TICKETS_REPLY: "customer_tickets.reply",

  // ── Master Medicines ──────────────────────────────────────────
  MASTER_MEDICINES_VIEW: "master_medicines.view",
  MASTER_MEDICINES_CREATE: "master_medicines.create",
  MASTER_MEDICINES_MANAGE_MAPPING: "master_medicines.manage_mapping",
  MASTER_MEDICINES_MANAGE_IMAGES: "master_medicines.manage_images",

  // ── Dashboard ─────────────────────────────────────────────────
  DASHBOARD_VIEW: "dashboard.view",

  // ── Document Verification ─────────────────────────────────────
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_VIEW_SHOP_DETAIL: "documents.view_shop_detail",
  DOCUMENTS_VIEW_FILE: "documents.view_file",
  DOCUMENTS_VERIFY: "documents.verify",
  DOCUMENTS_REJECT: "documents.reject",
  DOCUMENTS_BATCH_UPDATE: "documents.batch_update",

  // ── Audit Logs ────────────────────────────────────────────────
  AUDIT_VIEW: "audit.view",
  AUDIT_VIEW_DETAIL: "audit.view_detail",
  AUDIT_VIEW_STATS: "audit.view_stats",
  AUDIT_EXPORT: "audit.export",

  // ── Enquiries ─────────────────────────────────────────────────
  ENQUIRIES_VIEW: "enquiries.view",
  ENQUIRIES_VIEW_STATS: "enquiries.view_stats",
  ENQUIRIES_VIEW_DETAIL: "enquiries.view_detail",
  ENQUIRIES_REPLY: "enquiries.reply",
  ENQUIRIES_UPDATE_STATUS: "enquiries.update_status",
  ENQUIRIES_DELETE: "enquiries.delete",

  // ── Broadcast — In-App ────────────────────────────────────────
  BROADCAST_INAPP_SEND: "broadcast_inapp.send",
  BROADCAST_INAPP_UPLOAD: "broadcast_inapp.upload",
  BROADCAST_INAPP_MANAGE_DRAFTS: "broadcast_inapp.manage_drafts",
  BROADCAST_INAPP_SCHEDULE: "broadcast_inapp.schedule",
  BROADCAST_INAPP_VIEW_HISTORY: "broadcast_inapp.view_history",
  BROADCAST_INAPP_MANAGE_SEGMENTS: "broadcast_inapp.manage_segments",
  BROADCAST_INAPP_MANAGE_TEMPLATES: "broadcast_inapp.manage_templates",

  // ── Broadcast — Email ─────────────────────────────────────────
  BROADCAST_EMAIL_SEND: "broadcast_email.send",
  BROADCAST_EMAIL_UPLOAD: "broadcast_email.upload",
  BROADCAST_EMAIL_MANAGE_DRAFTS: "broadcast_email.manage_drafts",
  BROADCAST_EMAIL_SCHEDULE: "broadcast_email.schedule",
  BROADCAST_EMAIL_VIEW_HISTORY: "broadcast_email.view_history",
  BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES: "broadcast_email.manage_unsubscribes",

  // ── Broadcast — Mobile ────────────────────────────────────────
  BROADCAST_MOBILE_SEND: "broadcast_mobile.send",
  BROADCAST_MOBILE_VIEW_HISTORY: "broadcast_mobile.view_history",
  BROADCAST_MOBILE_MANAGE_DRAFTS: "broadcast_mobile.manage_drafts",
  BROADCAST_MOBILE_SCHEDULE: "broadcast_mobile.schedule",

  // ── Settings ──────────────────────────────────────────────────
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT_IDENTITY: "settings.edit_identity",
  SETTINGS_EDIT_CONTACT: "settings.edit_contact",
  SETTINGS_EDIT_PASSWORD: "settings.edit_password",

  // ── App Config ────────────────────────────────────────────────
  APP_CONFIG_VIEW: "app_config.view",
  APP_CONFIG_MANAGE_CATEGORY_IMAGES: "app_config.manage_category_images",
  APP_CONFIG_MANAGE_LAYOUT: "app_config.manage_layout",
  APP_CONFIG_MANAGE_LOYALTY: "app_config.manage_loyalty",

  // ── Coupons & Promotions ──────────────────────────────────────
  COUPONS_VIEW: "coupons.view",
  COUPONS_CREATE: "coupons.create",
  COUPONS_EDIT: "coupons.edit",
  COUPONS_TOGGLE_ACTIVE: "coupons.toggle_active",
  COUPONS_DELETE: "coupons.delete",

  // ── Fleet — Riders ────────────────────────────────────────────
  FLEET_RIDERS_VIEW: "fleet.riders_view",
  FLEET_RIDERS_VIEW_DETAIL: "fleet.riders_view_detail",
  FLEET_RIDERS_CREATE_TEAM: "fleet.riders_create_team",
  FLEET_RIDERS_SUSPEND: "fleet.riders_suspend",
  FLEET_RIDERS_REACTIVATE: "fleet.riders_reactivate",
  FLEET_RIDERS_BLOCK: "fleet.riders_block",

  // ── Fleet — Verification ──────────────────────────────────────
  FLEET_VERIFICATION_VIEW: "fleet.verification_view",
  FLEET_VERIFICATION_APPROVE: "fleet.verification_approve",
  FLEET_VERIFICATION_REJECT: "fleet.verification_reject",

  // ── Fleet — Dashboard & Communications ────────────────────────
  FLEET_DASHBOARD_VIEW: "fleet.dashboard_view",
  FLEET_COMMUNICATIONS_VIEW: "fleet.communications_view",

  // ── Fleet — Pricing & Incentives ──────────────────────────────
  FLEET_PRICING_VIEW: "fleet_pricing.view",
  FLEET_PRICING_MANAGE_BASE: "fleet_pricing.manage_base",
  FLEET_PRICING_MANAGE_SURGE: "fleet_pricing.manage_surge",
  FLEET_INCENTIVES_VIEW: "fleet_incentives.view",
  FLEET_INCENTIVES_MANAGE: "fleet_incentives.manage",
};

export const CADMIN_PERMISSION_GROUPS = [
  {
    module: "Admin Management",
    key: "admins",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.ADMINS_VIEW,
        label: "View Admins",
        description: "List all admin accounts",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_VIEW_DETAIL,
        label: "View Admin Detail",
        description: "Open individual admin profiles",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_VIEW_ACTIVITY,
        label: "View Admin Activity",
        description: "See per-admin activity logs",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_CREATE,
        label: "Create Admin",
        description: "Add new admin accounts",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_EDIT,
        label: "Edit Admin & Roles",
        description: "Update admin profile and manage role assignments",
      },
      {
        key: CADMIN_PERMISSIONS.ADMINS_TOGGLE_ACCESS,
        label: "Disable / Enable Admin",
        description: "Activate or deactivate admin accounts",
      },
    ],
  },
  {
    module: "User Management",
    key: "users",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.USERS_VIEW,
        label: "View Users",
        description: "List all ERP users",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_VIEW_DETAIL,
        label: "View User Detail",
        description: "Open individual user profiles",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_EDIT,
        label: "Edit User",
        description: "Update user profile fields",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_TOGGLE_ACCESS,
        label: "Disable / Enable User",
        description: "Activate or deactivate user accounts",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_RESET_PASSWORD,
        label: "Reset User Password",
        description: "Send password reset link to user",
      },
      {
        key: CADMIN_PERMISSIONS.USERS_DELETE,
        label: "Delete User",
        description:
          "Permanently anonymise a user account. Frees email/username for reuse. Cannot be undone.",
      },
    ],
  },
  {
    module: "Shop Management",
    key: "shops",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.SHOPS_VIEW,
        label: "View Shops",
        description: "List all registered shops",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_VIEW_DETAIL,
        label: "View Shop Detail",
        description: "Open full shop profile",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_VIEW_STATS,
        label: "View Shop Stats",
        description: "View aggregate shop statistics",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_EDIT,
        label: "Edit Shop",
        description: "Modify shop details",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_TOGGLE_ACTIVE,
        label: "Suspend / Activate Shop",
        description: "Control shop access to the platform",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_UPDATE_SUBSCRIPTION,
        label: "Update Subscription",
        description: "Modify a shop's subscription details",
      },
      {
        key: CADMIN_PERMISSIONS.SHOPS_UPLOAD_DOCUMENTS,
        label: "Upload Documents",
        description: "Upload documents on behalf of a shop",
      },
    ],
  },
  {
    module: "Plan Management",
    key: "plans",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.PLANS_VIEW,
        label: "View Plans",
        description: "List all subscription plans",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_VIEW_DETAIL,
        label: "View Plan Detail",
        description: "Open individual plan details",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_VIEW_STATS,
        label: "View Plan Stats",
        description: "See subscriber counts and plan metrics",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_CREATE,
        label: "Create Plan",
        description: "Create a new plan (starts as Draft)",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_EDIT,
        label: "Edit Plan",
        description: "Edit Draft plan fields",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_ACTIVATE,
        label: "Activate Plan",
        description: "Make a Draft plan live",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_SUSPEND,
        label: "Suspend Plan",
        description: "Stop new subscriptions to a plan",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_REACTIVATE,
        label: "Reactivate Plan",
        description: "Re-enable a suspended plan",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_CLONE,
        label: "Clone Plan",
        description: "Duplicate any plan into a new Draft",
      },
      {
        key: CADMIN_PERMISSIONS.PLANS_DELETE,
        label: "Delete Plan",
        description: "Permanently remove a Draft plan",
      },
    ],
  },
  {
    module: "Subscription Management",
    key: "subscriptions",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK,
        label: "View At-Risk Subscriptions",
        description: "See expiring, grace period, and suspended subscriptions",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL,
        label: "View Subscription Detail",
        description: "Open individual subscription details",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_SEND_REMINDER,
        label: "Send Payment Reminder",
        description: "Trigger reminder email/SMS to shop",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_EXTEND_GRACE,
        label: "Extend Grace Period",
        description: "Give a shop more time before suspension",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_FORCE_SUSPEND,
        label: "Force Suspend",
        description: "Immediately suspend a subscription",
      },
      {
        key: CADMIN_PERMISSIONS.SUBSCRIPTIONS_REACTIVATE,
        label: "Reactivate Subscription",
        description: "Restore a suspended subscription",
      },
    ],
  },
  {
    module: "Tickets",
    key: "tickets",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW,
        label: "View Tickets",
        description: "List all support tickets",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW_DETAIL,
        label: "View Ticket Detail",
        description: "Open individual ticket",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW_STATS,
        label: "View Ticket Stats",
        description: "See ticket counts and status breakdown",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_VIEW_HISTORY,
        label: "View Ticket History",
        description: "See status change history for a ticket",
      },
      {
        key: CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS,
        label: "Update Ticket Status",
        description: "Resolve, close, or reopen tickets",
      },
    ],
  },
  {
    module: "Customer Support Tickets",
    key: "customer_tickets",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW,
        label: "View Customer Tickets",
        description: "List all support tickets submitted by mobile customers",
      },
      {
        key: CADMIN_PERMISSIONS.CUSTOMER_TICKETS_VIEW_DETAIL,
        label: "View Customer Ticket Detail",
        description:
          "Open customer ticket details, order context, and conversation timeline",
      },
      {
        key: CADMIN_PERMISSIONS.CUSTOMER_TICKETS_UPDATE_STATUS,
        label: "Update Customer Ticket Status",
        description: "Change status (In Progress, Resolved, Closed)",
      },
      {
        key: CADMIN_PERMISSIONS.CUSTOMER_TICKETS_REPLY,
        label: "Reply to Customer Ticket",
        description: "Send customer-facing responses and add internal notes",
      },
    ],
  },
  {
    module: "Master Medicines",
    key: "master_medicines",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW,
        label: "View Catalog",
        description:
          "Browse master medicine catalog, variants, and linked medicines",
      },
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_CREATE,
        label: "Create Medicine",
        description: "Add new entries to the master catalog",
      },
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING,
        label: "Manage Mapping",
        description:
          "Accept, reject, match, ignore, and unlink medicine mappings",
      },
      {
        key: CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_IMAGES,
        label: "Manage Images",
        description: "Upload and delete medicine images",
      },
    ],
  },
  {
    module: "Dashboard",
    key: "dashboard",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.DASHBOARD_VIEW,
        label: "View Dashboard",
        description:
          "Access platform overview, KPIs, charts, and activity feed",
      },
    ],
  },
  {
    module: "Document Verification",
    key: "documents",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VIEW,
        label: "View Verification Queue",
        description: "List shops pending document verification",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VIEW_SHOP_DETAIL,
        label: "View Shop Documents",
        description: "See all documents for a specific shop",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VIEW_FILE,
        label: "View File",
        description: "Open and preview individual document files",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_VERIFY,
        label: "Verify Document",
        description: "Mark a document as verified",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_REJECT,
        label: "Reject Document",
        description: "Reject a document with a reason",
      },
      {
        key: CADMIN_PERMISSIONS.DOCUMENTS_BATCH_UPDATE,
        label: "Batch Update",
        description: "Verify or reject multiple documents at once",
      },
    ],
  },
  {
    module: "Audit Logs",
    key: "audit",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.AUDIT_VIEW,
        label: "View Audit Logs",
        description: "Browse the system audit trail",
      },
      {
        key: CADMIN_PERMISSIONS.AUDIT_VIEW_DETAIL,
        label: "View Log Detail",
        description: "Open individual audit log entries",
      },
      {
        key: CADMIN_PERMISSIONS.AUDIT_VIEW_STATS,
        label: "View Audit Stats",
        description: "See audit activity statistics",
      },
      {
        key: CADMIN_PERMISSIONS.AUDIT_EXPORT,
        label: "Export Audit Logs",
        description: "Download audit logs as CSV",
      },
    ],
  },
  {
    module: "Enquiries",
    key: "enquiries",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
        label: "View Enquiries",
        description: "List all contact/enquiry submissions",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_VIEW_STATS,
        label: "View Enquiry Stats",
        description: "See enquiry counts and status breakdown",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_VIEW_DETAIL,
        label: "View Enquiry Detail",
        description: "Open an individual enquiry submission",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_REPLY,
        label: "Reply to Enquiry",
        description: "Send a reply to a submitted enquiry",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_UPDATE_STATUS,
        label: "Update Enquiry Status",
        description: "Change the status of an enquiry (open, closed, etc.)",
      },
      {
        key: CADMIN_PERMISSIONS.ENQUIRIES_DELETE,
        label: "Delete Enquiry",
        description: "Permanently delete an enquiry record",
      },
    ],
  },
  {
    module: "Broadcast — In-App",
    key: "broadcast_inapp",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        label: "Send In-App Broadcast",
        description:
          "Preview recipient count and send in-app notifications immediately",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_UPLOAD,
        label: "Upload Broadcast Attachments",
        description:
          "Upload and delete attachments for in-app broadcast messages",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        label: "Manage In-App Drafts",
        description: "Create, view, update, and delete in-app broadcast drafts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
        label: "Schedule In-App Broadcasts",
        description:
          "Schedule broadcasts for future delivery, view scheduled list, and cancel pending broadcasts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        label: "View In-App Broadcast History",
        description:
          "Browse sent broadcast history and open individual broadcast details",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_SEGMENTS,
        label: "Manage Audience Segments",
        description:
          "Create, view, and delete saved audience segments for targeting",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_TEMPLATES,
        label: "Manage Broadcast Templates",
        description:
          "Create, view, and apply reusable in-app broadcast message templates",
      },
    ],
  },
  {
    module: "Broadcast — Email",
    key: "broadcast_email",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        label: "Send Email Broadcast",
        description:
          "Preview recipient count, check sending quota, send immediately, and send test emails",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_UPLOAD,
        label: "Upload Email Attachments",
        description:
          "Upload and delete inline images and file attachments for email campaigns",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        label: "Manage Email Drafts",
        description: "Create, view, update, and delete email campaign drafts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
        label: "Schedule Email Campaigns",
        description:
          "Schedule campaigns for future delivery, view scheduled list, and cancel pending campaigns",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        label: "View Email History",
        description:
          "Browse sent campaign history and open individual campaign details",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_UNSUBSCRIBES,
        label: "Manage Unsubscribe List",
        description:
          "View, export, add, bulk-add, and remove entries from the email suppression list",
      },
    ],
  },
  {
    module: "Broadcast — Mobile",
    key: "broadcast_mobile",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.BROADCAST_MOBILE_SEND,
        label: "Send Mobile Broadcast",
        description:
          "Preview recipient count, check sending limits, and dispatch mobile/SMS broadcasts immediately",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_MOBILE_VIEW_HISTORY,
        label: "View Mobile Broadcast History",
        description:
          "Browse sent mobile broadcast history and open individual broadcast details",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_MOBILE_MANAGE_DRAFTS,
        label: "Manage Mobile Drafts",
        description: "Create, view, update, and delete mobile broadcast drafts",
      },
      {
        key: CADMIN_PERMISSIONS.BROADCAST_MOBILE_SCHEDULE,
        label: "Schedule Mobile Broadcasts",
        description:
          "Schedule mobile broadcasts for future delivery and cancel pending ones",
      },
    ],
  },
  {
    module: "App Config",
    key: "app_config",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.APP_CONFIG_VIEW,
        label: "View App Config",
        description: "Access the App Config section and view settings",
      },
      {
        key: CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES,
        label: "Manage Category Images",
        description:
          "Upload, replace, and remove category images shown in the mobile app",
      },
      {
        key: CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LAYOUT,
        label: "Manage Layout",
        description: "Reorder feed sections and toggle display components",
      },
      {
        key: CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_LOYALTY,
        label: "Manage Loyalty Program",
        description:
          "Configure point earning rates, redemption values, minimums, and expiry rules",
      },
    ],
  },
  {
    module: "Coupons & Promotions",
    key: "coupons",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.COUPONS_VIEW,
        label: "View Coupons",
        description:
          "List all promotional discount codes and view usage metrics",
      },
      {
        key: CADMIN_PERMISSIONS.COUPONS_CREATE,
        label: "Create Coupon",
        description: "Create new flat or percentage promotional discount codes",
      },
      {
        key: CADMIN_PERMISSIONS.COUPONS_EDIT,
        label: "Edit Coupon",
        description: "Modify existing coupon details and limits",
      },
      {
        key: CADMIN_PERMISSIONS.COUPONS_TOGGLE_ACTIVE,
        label: "Activate / Deactivate Coupon",
        description: "Enable or pause promo codes immediately",
      },
      {
        key: CADMIN_PERMISSIONS.COUPONS_DELETE,
        label: "Delete Coupon",
        description: "Deactivate and archive coupons",
      },
    ],
  },
  {
    module: "Fleet Management",
    key: "fleet",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW,
        label: "View Riders",
        description: "List all delivery partners",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW_DETAIL,
        label: "View Rider Detail",
        description: "Open rider profiles and documents",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_RIDERS_CREATE_TEAM,
        label: "Create Team Rider",
        description: "Onboard team riders directly",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_RIDERS_SUSPEND,
        label: "Suspend Rider",
        description: "Temporarily disable a rider",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_RIDERS_REACTIVATE,
        label: "Reactivate Rider",
        description: "Re-enable a suspended rider",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_RIDERS_BLOCK,
        label: "Block Rider",
        description: "Permanently block a rider",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_VERIFICATION_VIEW,
        label: "View Verification Queue",
        description: "See riders pending document review",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_VERIFICATION_APPROVE,
        label: "Approve Documents",
        description: "Approve rider documents and applications",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_VERIFICATION_REJECT,
        label: "Reject Documents",
        description: "Reject rider documents with reason",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_DASHBOARD_VIEW,
        label: "View Fleet Dashboard",
        description: "Access fleet KPIs and stats",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_COMMUNICATIONS_VIEW,
        label: "View Fleet Communications",
        description: "Manage rider tickets and broadcasts",
      },
    ],
  },
  {
    module: "Fleet Pricing & Incentives",
    key: "fleet_pricing",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.FLEET_PRICING_VIEW,
        label: "View Fleet Pricing",
        description: "View active base pay, distance slabs, and surge settings",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_PRICING_MANAGE_BASE,
        label: "Manage Base Pay & Slabs",
        description:
          "Create, schedule, and update delivery base pay and distance slabs",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_PRICING_MANAGE_SURGE,
        label: "Manage Surge Rules",
        description:
          "Create and toggle manual rain, festival, or peak surge multipliers",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_INCENTIVES_VIEW,
        label: "View Incentives",
        description: "View incentive templates, quests, and calendar schedules",
      },
      {
        key: CADMIN_PERMISSIONS.FLEET_INCENTIVES_MANAGE,
        label: "Manage Incentives",
        description:
          "Create incentive templates, configure tiers, and assign to calendar",
      },
    ],
  },
  {
    module: "Settings",
    key: "settings",
    permissions: [
      {
        key: CADMIN_PERMISSIONS.SETTINGS_VIEW,
        label: "View Settings",
        description: "Access and view personal account settings",
      },
      {
        key: CADMIN_PERMISSIONS.SETTINGS_EDIT_IDENTITY,
        label: "Edit Identity",
        description: "Update name and username",
      },
      {
        key: CADMIN_PERMISSIONS.SETTINGS_EDIT_CONTACT,
        label: "Edit Contact Details",
        description: "Update email address and phone number",
      },
      {
        key: CADMIN_PERMISSIONS.SETTINGS_EDIT_PASSWORD,
        label: "Change Password",
        description: "Update account password",
      },
    ],
  },
];

export const CADMIN_ROUTE_PERMISSIONS = {
  "/dashboard": [CADMIN_PERMISSIONS.DASHBOARD_VIEW],
  "/shops": [CADMIN_PERMISSIONS.SHOPS_VIEW],
  "/users": [CADMIN_PERMISSIONS.USERS_VIEW],

  "/subscriptions": [
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK,
    CADMIN_PERMISSIONS.PLANS_VIEW,
  ],
  "/subscriptions/list": [CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK],
  "/subscriptions/plans": [CADMIN_PERMISSIONS.PLANS_VIEW],
  "/subscriptions/risk": [CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK],

  "/verifications": [CADMIN_PERMISSIONS.DOCUMENTS_VIEW],

  "/communications": [
    CADMIN_PERMISSIONS.TICKETS_VIEW,
    CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  ],
  "/communications/tickets": [CADMIN_PERMISSIONS.TICKETS_VIEW],
  "/communications/enquiries": [CADMIN_PERMISSIONS.ENQUIRIES_VIEW],
  "/communications/broadcast": [
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  ],
  "/communications/broadcast/email": [
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
  ],
  "/communications/broadcast/in-app": [
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
    CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
  ],

  "/admins": [CADMIN_PERMISSIONS.ADMINS_VIEW],
  "/audit": [CADMIN_PERMISSIONS.AUDIT_VIEW],
  "/master-medicines": [CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW],
  "/settings": [CADMIN_PERMISSIONS.SETTINGS_VIEW],
  "/coupons": [CADMIN_PERMISSIONS.COUPONS_VIEW],

  "/fleet": [
    CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW,
    CADMIN_PERMISSIONS.FLEET_VERIFICATION_VIEW,
    CADMIN_PERMISSIONS.FLEET_DASHBOARD_VIEW,
  ],
  "/fleet/riders": [CADMIN_PERMISSIONS.FLEET_RIDERS_VIEW],
  "/fleet/verification": [CADMIN_PERMISSIONS.FLEET_VERIFICATION_VIEW],
  "/fleet/pricing": [CADMIN_PERMISSIONS.FLEET_PRICING_VIEW],
  "/fleet/incentives": [CADMIN_PERMISSIONS.FLEET_INCENTIVES_VIEW],
};

export const ALL_CADMIN_PERMISSION_KEYS = Object.values(CADMIN_PERMISSIONS);