// cadmin-web/src/config/modules/userConfig.js (do not remove this comment)
// ═══════════════════════════════════════════════════════════════════
// USER MODULE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export const userConfig = {
  // ─────────────────────────────────────────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────────────────────────────────────────
  columns: [
    {
      key: "slNo",
      label: "#",
      type: "index", // Auto-generates row number
      width: 60,
      sortable: false,
      resizable: false,
    },
    {
      key: "name",
      label: "Full Name",
      width: 160,
      sortable: true,
      resizable: true,
    },
    {
      key: "username",
      label: "Username",
      width: 130,
      sortable: true,
      resizable: true,
      render: (value) => `@${value}`, // Custom render
    },
    {
      key: "email",
      label: "Email",
      width: 200,
      sortable: false,
      resizable: true,
    },
    {
      key: "role",
      label: "Role",
      width: 110,
      sortable: false,
      resizable: false,
      type: "badge",
      align: "center",
      badgeColors: {
        "Super Admin": "bg-purple-100 text-purple-700 border border-purple-200",
        "Branch Admin": "bg-blue-100 text-blue-700 border border-blue-200",
        "Staff": "bg-slate-100 text-slate-700 border border-slate-200",
      },
    },
    {
      key: "status",
      label: "Status",
      width: 100,
      sortable: false,
      resizable: false,
      type: "status",
      align: "center",
      statusColors: {
        Active: "bg-emerald-100 text-emerald-700",
        Inactive: "bg-orange-100 text-orange-700",
      },
    },
    {
      key: "lastLogin",
      label: "Last Login",
      width: 110,
      sortable: true,
      resizable: true,
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // FILTERS
  // ─────────────────────────────────────────────────────────────────
  filters: [
    {
      key: "status",
      label: "Status",
      type: "select",
      placeholder: "All Status",
      options: [
        { value: "", label: "All Status" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    {
      key: "role",
      label: "Role",
      type: "select",
      placeholder: "All Roles",
      options: [
        { value: "", label: "All Roles" },
        { value: "Super Admin", label: "Super Admin" },
        { value: "Branch Admin", label: "Branch Admin" },
        { value: "Staff", label: "Staff" },
      ],
    },
    {
      key: "lastLogin",
      label: "Last Login",
      type: "date",
      dateField: "lastLogin", // Which field to filter by
    },
  ],

  // ─────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────
  search: {
    placeholder: "Name, username or email...",
    fields: ["name", "username", "email"], // Fields to search in
  },

  // ─────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────
  actions: {
    add: {
      label: "Add User",
      enabled: true,
    },
    export: {
      enabled: true,
      filename: "users",
      fields: ["id", "name", "username", "email", "role", "status", "lastLogin"],
    },
    rowActions: ["view", "edit", "delete"], // Which actions to show per row
  },

  // ─────────────────────────────────────────────────────────────────
  // MODAL CONFIGURATION
  // ─────────────────────────────────────────────────────────────────
  modal: {
    title: (item) => item.name,
    subtitle: (item) => `@${item.username}`,
    tabs: [
      {
        id: "profile",
        label: "Profile",
        icon: "User",
        component: "ProfileDetails",
      },
      {
        id: "shop",
        label: "Shop Details",
        icon: "Store",
        component: "ShopDetails",
      },
      {
        id: "documents",
        label: "Documents",
        icon: "FileText",
        component: "DocumentsTab",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // DETAIL FIELDS (for Profile tab)
  // ─────────────────────────────────────────────────────────────────
  detailFields: [
    { key: "name", label: "Full Name", editable: true },
    { key: "username", label: "Username", editable: true },
    { key: "email", label: "Email", editable: true },
    { key: "phone", label: "Phone", editable: true, default: "7035261820" },
    { key: "role", label: "Role", editable: true },
    { key: "userId", label: "User ID", editable: false, default: "6728291037" },
    { key: "accCreated", label: "Created", editable: false, default: "14/08/2024" },
    { key: "lastLogin", label: "Last Login", editable: false },
  ],

  // ─────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────────────────────────────
  emptyState: {
    icon: "Users",
    title: "No users found",
    subtitle: "Try adjusting your search or filters",
  },
};