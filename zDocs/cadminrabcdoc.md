<!-- zDocs/cadminrabcdoc.md (do not remove this comment) -->
# Documentation: Adding a New Permission to the CAdmin RBAC System

**Save this as `docs/cadmin-rbac-guide.md` in your project root.**

---

```markdown
# CAdmin RBAC — Adding a New Permission

## Overview

The CAdmin permission system is **code-owned**. Permissions are defined in
source files, not the database. The database only stores which permission
strings are assigned to which custom roles.

When you add a new feature that needs access control, follow every step
in this guide in order. Skipping any step will result in either the backend
not enforcing the permission or the pharmacy-web not showing/hiding correctly.

---

## Architecture Summary
```

┌─────────────────────────────────────────────────────────────┐
│ PERMISSION FLOW │
│ │
│ 1. Code defines permission string │
│ backend/src/config/cadminPermissions.js │
│ pharmacy-web/src/config/cadminPermissions.js │
│ │
│ 2. Backend enforces it on the route │
│ requireCAdminPermission(CADMIN_PERMISSIONS.YOUR_KEY) │
│ │
│ 3. DB stores which roles have it │
│ cadmin_custom_roles.permissions = String[] │
│ │
│ 4. At login, requireCAdmin loads permissions from DB │
│ and attaches them to req.cadmin.permissions[] │
│ │
│ 5. pharmacy-web reads admin.permissions[] from AuthContext │
│ via useCAdminPermission().hasPermission(...) │
│ │
│ 6. UI hides/shows based on permission │
└─────────────────────────────────────────────────────────────┘

````

---

## Naming Convention

| Part        | Format                  | Example                        |
|-------------|-------------------------|--------------------------------|
| Constant key | `MODULE_ACTION`         | `REPORTS_VIEW_SALES`           |
| String value | `"module.action"`       | `"reports.view_sales"`         |
| Module      | lowercase snake_case    | `reports`                      |
| Action      | snake_case verb phrase  | `view_sales`, `export`, `delete` |

**Rules:**
- Never use generic actions like `manage` or `admin` — be explicit
- Always use dot notation in the string value (not colon, not slash)
- Keep module names singular: `shop` not `shops`, `plan` not `plans`
  — Exception: existing modules already use plural, stay consistent

---

## Step-by-Step Guide

### STEP 1 — Add to Backend Permission Registry

**File:** `backend/src/config/cadminPermissions.js`

Find the correct module section and add your constant:

```js
// ── REPORTS (example new module) ──────────────────────────────────────────
REPORTS_VIEW:         "reports.view",
REPORTS_VIEW_DETAIL:  "reports.view_detail",
REPORTS_EXPORT:       "reports.export",       // ← your new permission
````

Then add it to `CADMIN_PERMISSION_GROUPS` in the same file.
Find the correct group or create a new one:

```js
{
  module: "Reports",          // Displayed in role creation UI
  key: "reports",             // Unique key for the group
  permissions: [
    {
      key:         CADMIN_PERMISSIONS.REPORTS_VIEW,
      label:       "View Reports",
      description: "Browse all system reports",
    },
    {
      key:         CADMIN_PERMISSIONS.REPORTS_VIEW_DETAIL,
      label:       "View Report Detail",
      description: "Open individual report entries",
    },
    {
      key:         CADMIN_PERMISSIONS.REPORTS_EXPORT,
      label:       "Export Reports",         // ← your new permission
      description: "Download reports as CSV",
    },
  ],
},
```

**Why both places?**

- `CADMIN_PERMISSIONS` → used in routes and middleware for enforcement
- `CADMIN_PERMISSION_GROUPS` → used in the role creation UI checklist

---

### STEP 2 — Add to pharmacy-web Permission Registry

**File:** `pharmacy-web/src/config/cadminPermissions.js`

The string value MUST be **byte-for-byte identical** to the backend.

```js
// ── REPORTS ───────────────────────────────────────────────────────────────
REPORTS_VIEW:         "reports.view",
REPORTS_VIEW_DETAIL:  "reports.view_detail",
REPORTS_EXPORT:       "reports.export",       // ← add here
```

Then add to `CADMIN_PERMISSION_GROUPS` in the same file (mirror of backend):

```js
{
  module: "Reports",
  key: "reports",
  permissions: [
    {
      key:         CADMIN_PERMISSIONS.REPORTS_VIEW,
      label:       "View Reports",
      description: "Browse all system reports",
    },
    {
      key:         CADMIN_PERMISSIONS.REPORTS_EXPORT,
      label:       "Export Reports",
      description: "Download reports as CSV",
    },
  ],
},
```

**Important:** The pharmacy-web `CADMIN_PERMISSION_GROUPS` drives the
role creation checklist UI. If you skip this, the permission will exist
but admins cannot assign it via the UI.

---

### STEP 3 — Enforce on the Backend Route

**File:** whichever route file handles your new feature.

```js
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";

// Single permission:
router.get(
  "/reports/export",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.REPORTS_EXPORT),
  exportReportsController,
);

// Any of multiple permissions (if route is accessible by different roles):
router.get(
  "/reports",
  requireCAdmin,
  requireAnyCAdminPermission(
    CADMIN_PERMISSIONS.REPORTS_VIEW,
    CADMIN_PERMISSIONS.REPORTS_EXPORT,
  ),
  listReportsController,
);
```

**Rule:** Every protected route needs BOTH `requireCAdmin` (auth)
AND `requireCAdminPermission` (authorization). Auth alone is not enough.

**Exception:** Self-referential routes like `/me` and `/pending-counts`
only need `requireCAdmin` — they are not gated by permissions because
every authenticated admin must access them.

---

### STEP 4 — Add UI Gate in pharmacy-web Component (if needed)

In any component that renders the feature, gate the UI element:

```jsx
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions";

const MyComponent = () => {
  const { hasPermission } = useCAdminPermission();

  return (
    <div>
      {/* Show export button only if admin has permission */}
      {hasPermission(CADMIN_PERMISSIONS.REPORTS_EXPORT) && (
        <button onClick={handleExport}>Export CSV</button>
      )}
    </div>
  );
};
```

**Note:** UI gating is cosmetic — it hides elements from unauthorized
admins. The backend enforcement in Step 3 is what actually protects
the data. Always do both.

---

### STEP 5 — Add to Sidebar Visibility (if it gates a menu item)

**File:** `pharmacy-web/src/hooks/useCAdminPermission.js`

If your new feature has a sidebar menu item, add it to
`useCAdminMenuPermissions`:

```js
// Inside the return object of useCAdminMenuPermissions():
reports: show(CADMIN_PERMISSIONS.REPORTS_VIEW),
```

Then in `AdminSidebar.jsx`, add the menu item:

```js
const MENU_ITEMS = [
  // ... existing items ...
  {
    id: "reports",
    label: "Reports",
    icon: BarChart,
    path: "/reports",
    breadcrumbs: ["Reports"],
    permissionKey: "reports", // ← must match key in useCAdminMenuPermissions
  },
];
```

And add the route to `CADMIN_ROUTE_PERMISSIONS` in
`pharmacy-web/src/config/cadminPermissions.js`:

```js
"/reports": [CADMIN_PERMISSIONS.REPORTS_VIEW],
```

---

### STEP 6 — Add Route Guard in App.jsx

```jsx
<Route
  path="/reports"
  element={
    <PermissionGuard permission={CADMIN_PERMISSIONS.REPORTS_VIEW}>
      <ReportsPage />
    </PermissionGuard>
  }
/>
```

---

### STEP 7 — Assign the Permission to Roles via UI

After deploying:

1. Log in as SUPER_CADMIN
2. Go to **Admin Management → Roles tab**
3. Open the role that should have this permission
4. Click **Edit Role**
5. Find your new permission in the checklist (it will appear in the group you defined)
6. Check it and save

The permission takes effect on the admin's **next request** — no token
re-issue needed because `requireCAdmin` loads permissions fresh from DB
on every request.

---

## Quick Checklist

Copy this when adding any new permission:

```
[ ] Step 1: Added to CADMIN_PERMISSIONS in backend/src/config/cadminPermissions.js
[ ] Step 1: Added to CADMIN_PERMISSION_GROUPS in backend/src/config/cadminPermissions.js
[ ] Step 2: Added to CADMIN_PERMISSIONS in pharmacy-web/src/config/cadminPermissions.js
[ ] Step 2: Added to CADMIN_PERMISSION_GROUPS in pharmacy-web/src/config/cadminPermissions.js
[ ] Step 3: requireCAdminPermission() added to backend route(s)
[ ] Step 4: hasPermission() gate added in pharmacy-web component (if UI element)
[ ] Step 5: Added to useCAdminMenuPermissions() (if sidebar item)
[ ] Step 5: Added to MENU_ITEMS in AdminSidebar.jsx (if sidebar item)
[ ] Step 5: Added to CADMIN_ROUTE_PERMISSIONS (if sidebar item)
[ ] Step 6: Added PermissionGuard to route in App.jsx (if new page)
[ ] Step 7: Assigned to roles via the Roles UI
```

---

## Common Mistakes

### Mistake 1 — String mismatch between pharmacy-web and backend

**Wrong:**

```js
// backend
REPORTS_EXPORT: "reports.export";

// pharmacy-web (typo)
REPORTS_EXPORT: "report.export"; // ← missing 's'
```

**Result:** Permission is enforced on backend but pharmacy-web always shows
the element (because `hasPermission("report.export")` never matches
`"reports.export"` in the admin's permissions array).

**Fix:** Always copy-paste the string value. Never retype it.

---

### Mistake 2 — Using colon notation instead of dot notation

**Wrong:**

```js
REPORTS_EXPORT: "reports:export"; // ← old system used colons
```

**Correct:**

```js
REPORTS_EXPORT: "reports.export"; // ← new system uses dots
```

The old CAdmin system (ANALYST, ACCOUNTANT, SALESMAN enum roles) used
colon notation like `"shops:view"`. The new system uses dot notation
like `"shops.view"`. Do not mix them.

---

### Mistake 3 — Adding to permission constants but not to groups

If you add a permission to `CADMIN_PERMISSIONS` but forget
`CADMIN_PERMISSION_GROUPS`, it will be enforced on the backend and
work for existing roles that already have it — but it will not appear
in the role creation checklist, so nobody can assign it to new roles
via the UI.

---

### Mistake 4 — Forgetting requireCAdmin before requireCAdminPermission

**Wrong:**

```js
router.get(
  "/reports",
  requireCAdminPermission(CADMIN_PERMISSIONS.REPORTS_VIEW),
  handler,
);
```

**Correct:**

```js
router.get(
  "/reports",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.REPORTS_VIEW),
  handler,
);
```

`requireCAdminPermission` reads from `req.cadmin.permissions[]` which is
populated by `requireCAdmin`. Without `requireCAdmin` running first,
`req.cadmin` does not exist and the permission check will throw.

---

### Mistake 5 — Gating UI but not the API

Only adding `hasPermission()` in the pharmacy-web component without adding
`requireCAdminPermission()` to the backend route means the UI hides
the button but the API is still wide open. Anyone who knows the endpoint
can call it directly.

**Always enforce on both layers.**

---

## Files Reference

| Purpose                                        | File                                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| Backend permission constants + groups          | `backend/src/config/cadminPermissions.js`                                     |
| Backend auth middleware                        | `backend/src/middleware/requireCAdmin.js`                                     |
| Backend permission enforcement middleware      | `backend/src/middleware/requireCAdminPermission.js`                           |
| pharmacy-web permission constants + groups     | `pharmacy-web/src/config/cadminPermissions.js`                                |
| pharmacy-web permission hook                   | `pharmacy-web/src/hooks/useCAdminPermission.js`                               |
| pharmacy-web route guards                      | `pharmacy-web/src/App.jsx`                                                    |
| Sidebar menu items                             | `pharmacy-web/src/components/layout/AdminSidebar.jsx`                         |
| Role creation UI (checklist reads from groups) | `pharmacy-web/src/pages/Cadmin-management/comps/RolePermissionsChecklist.jsx` |

---

## How Permissions Flow at Runtime

```
Admin logs in
     ↓
requireCAdmin runs on every protected request
     ↓
Fetches CAdmin from DB including roleAssignments → role.permissions[]
     ↓
Computes union of all role permissions → req.cadmin.permissions[]
     ↓
requireCAdminPermission checks req.cadmin.permissions.includes(permission)
     ↓
If SUPER_CADMIN → bypasses all checks (is_super_cadmin = true)
     ↓
Handler runs
```

On the pharmacy-web:

```
AuthProvider mounts → calls GET /cadmin/me
     ↓
Profile response includes admin.permissions[] (same union computed above)
     ↓
Stored in AuthContext
     ↓
useCAdminPermission().hasPermission("reports.export")
checks admin.permissions.includes("reports.export")
     ↓
If SUPER_CADMIN (admin.is_super_cadmin = true) → always returns true
```

```

---

This document covers every file that needs to change, every common mistake, and the exact runtime flow. Any developer or LLM starting fresh from this doc can add a permission correctly without needing to read the source code.
```
