// cadmin-web/src/config/modules/shopConfig.js (do not remove this comment)
// ═══════════════════════════════════════════════════════════════════
// SHOP MODULE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export const shopConfig = {
  columns: [
    {
      key: "slNo",
      label: "#",
      type: "index",
      width: 60,
      sortable: false,
    },
    {
      key: "shopName",
      label: "Shop Name",
      width: 180,
      sortable: true,
      resizable: true,
    },
    {
      key: "ownerName",
      label: "Owner",
      width: 140,
      sortable: true,
      resizable: true,
    },
    {
      key: "branch",
      label: "Branch",
      width: 130,
      sortable: false,
      resizable: true,
    },
    {
      key: "gst",
      label: "GST Number",
      width: 150,
      sortable: false,
      resizable: true,
    },
    {
      key: "area",
      label: "Area",
      width: 100,
      sortable: true,
      resizable: true,
    },
    {
      key: "subscription",
      label: "Plan",
      width: 100,
      type: "badge",
      align: "center",
      badgeColors: {
        "Premium": "bg-emerald-100 text-emerald-700 border border-emerald-200",
        "Standard": "bg-blue-100 text-blue-700 border border-blue-200",
        "Trial": "bg-amber-100 text-amber-700 border border-amber-200",
        "Expired": "bg-red-100 text-red-700 border border-red-200",
      },
    },
    {
      key: "status",
      label: "Status",
      width: 110,
      type: "status",
      align: "center",
      statusColors: {
        Active: "bg-emerald-100 text-emerald-700",
        Pending: "bg-amber-100 text-amber-700",
        Suspended: "bg-red-100 text-red-700",
      },
    },
    {
      key: "registeredDate",
      label: "Registered",
      width: 110,
      sortable: true,
    },
  ],

  filters: [
    {
      key: "status",
      label: "Status",
      type: "select",
      placeholder: "All Status",
      options: [
        { value: "", label: "All Status" },
        { value: "Active", label: "Active" },
        { value: "Pending", label: "Pending" },
        { value: "Suspended", label: "Suspended" },
      ],
    },
    {
      key: "subscription",
      label: "Plan",
      type: "select",
      placeholder: "All Plans",
      options: [
        { value: "", label: "All Plans" },
        { value: "Premium", label: "Premium" },
        { value: "Standard", label: "Standard" },
        { value: "Trial", label: "Trial" },
        { value: "Expired", label: "Expired" },
      ],
    },
    {
      key: "area",
      label: "Area",
      type: "select",
      placeholder: "All Areas",
      options: [
        { value: "", label: "All Areas" },
        { value: "North", label: "North" },
        { value: "South", label: "South" },
        { value: "East", label: "East" },
        { value: "West", label: "West" },
      ],
    },
    {
      key: "registeredDate",
      label: "Registered",
      type: "date",
      dateField: "registeredDate",
    },
  ],

  search: {
    placeholder: "Shop name, owner, GST...",
    fields: ["shopName", "ownerName", "gst", "branch"],
  },

  actions: {
    add: {
      label: "Add Shop",
      enabled: true,
    },
    export: {
      enabled: true,
      filename: "shops",
      fields: ["id", "shopName", "ownerName", "branch", "gst", "area", "subscription", "status", "registeredDate"],
    },
    rowActions: ["view", "edit", "delete"],
  },

  modal: {
    title: (item) => item.shopName,
    subtitle: (item) => item.branch,
    tabs: [
      {
        id: "details",
        label: "Shop Details",
        icon: "Store",
        component: "ShopDetailsTab",
      },
      {
        id: "owner",
        label: "Owner Info",
        icon: "User",
        component: "OwnerDetailsTab",
      },
      {
        id: "documents",
        label: "Documents",
        icon: "FileText",
        component: "DocumentsTab",
      },
      {
        id: "subscription",
        label: "Subscription",
        icon: "CreditCard",
        component: "SubscriptionTab",
      },
    ],
  },

  detailFields: [
    { key: "shopName", label: "Shop Name", editable: true },
    { key: "branch", label: "Branch", editable: true },
    { key: "gst", label: "GST Number", editable: true },
    { key: "address", label: "Address", editable: true },
    { key: "area", label: "Area", editable: true },
    { key: "postalCode", label: "Postal Code", editable: true },
    { key: "phone", label: "Phone", editable: true },
    { key: "email", label: "Email", editable: true },
  ],

  emptyState: {
    icon: "Store",
    title: "No shops found",
    subtitle: "Try adjusting your search or filters",
  },
};