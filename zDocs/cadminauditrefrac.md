<!-- zDocs/cadminauditrefrac.md (do not remove this comment) -->
# CAdmin Audit Integration Guide — For Any Service File

**Save as `docs/cadmin-audit-integration-guide.md`**

---

## Purpose

This guide tells you exactly how to add audit logging to any CAdmin
backend service file — whether it's a brand new service or an existing
one that's missing audit calls.

The audit system writes immutable business events to the `AuditLog`
table via the centralized `audit.log()` function. Every mutating action
performed by a CAdmin (create, update, delete, toggle, assign, link,
send, etc.) MUST be recorded. Read-only actions (list, get, stats,
preview, search) MUST NOT be recorded.

---

## Architecture

```
Controller receives request
     ↓
Extracts auditContext from req via audit.extractRequestContext(req)
     ↓
Passes auditContext to service function as last parameter
     ↓
Service performs the mutation (prisma.create/update/delete)
     ↓
Service calls audit.log() with the correct action, entity, and metadata
     ↓
AuditLog row is written to DB
```

---

## Step-by-Step: Adding Audit to a Service File

### STEP 1 — Add the import

At the top of your service file, add:

```js
import * as audit from "../../audit/index.js";
```

If the service file is deeper in the folder tree (e.g. `broadcast/email/`),
adjust the relative path:

```js
import * as audit from "../../../../modules/audit/index.js";
```

The import gives you access to:

- `audit.log(payload, options)` — write a single audit entry
- `audit.logMany(payloads, options)` — write multiple entries in batch
- `audit.AuditAction.*` — all valid action constants
- `audit.EntityType.*` — all valid entity type constants
- `audit.AuditReasonCode.*` — all valid reason codes
- `audit.ActorType.*` — actor type constants (CADMIN, ERP_USER, SYSTEM)
- `audit.extractRequestContext(req)` — extract actor info from Express req
- `audit.buildSystemContext(jobName)` — build context for cron/system jobs

---

### STEP 2 — Add auditContext parameter to every mutating function

Every function that creates, updates, or deletes data needs `auditContext`
as its LAST parameter with a default of `{}`:

```js
// BEFORE
export async function createSomething(data, cadminId) {

// AFTER
export async function createSomething(data, cadminId, auditContext = {}) {
```

Read-only functions (list, getById, stats, search, preview) do NOT need this.

**How to identify mutating functions:**

- Uses `prisma.*.create()`, `prisma.*.update()`, `prisma.*.delete()`,
  `prisma.*.updateMany()`, `prisma.*.deleteMany()`, `prisma.*.createMany()`
- Changes state that affects users, shops, subscriptions, or admins
- Sends notifications (implies something happened worth recording)

---

### STEP 3 — Add audit.log() call after the mutation

Place the audit call AFTER the successful database mutation, inside the
same transaction if one exists.

#### Pattern A — Inside a $transaction (preferred for data consistency):

```js
const result = await prisma.$transaction(async (tx) => {
  const created = await tx.something.create({ data: { ... } });

  //  Audit inside the transaction — rolls back if transaction fails
  await audit.log({
    action:      audit.AuditAction.SOMETHING_CREATED,
    entity_type: audit.EntityType.SOMETHING,
    entity_id:   created.id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      name:                created.name,
      created_by_cadmin_id: cadminId,
    },
  }, { tx });   // ← pass { tx } as second argument

  return created;
});
```

#### Pattern B — Outside a transaction (when no transaction exists):

```js
const updated = await prisma.something.update({
  where: { id },
  data: { ... },
});

//  Audit after the mutation
await audit.log({
  action:      audit.AuditAction.SOMETHING_UPDATED,
  entity_type: audit.EntityType.SOMETHING,
  entity_id:   id,
  ...auditContext,
  reason_code: audit.AuditReasonCode.ADMIN_ACTION,
  metadata: { ... },
});
```

#### Pattern C — Non-blocking (for non-critical operations like broadcasts):

```js
//  Fire-and-forget — log failure does not fail the operation
audit.log({
  action:      audit.AuditAction.BROADCAST_SENT,
  entity_type: audit.EntityType.SYSTEM,
  entity_id:   campaign.id,
  ...auditContext,
  reason_code: audit.AuditReasonCode.ADMIN_ACTION,
  metadata: { ... },
}).catch(err => console.error("[AUDIT] Failed:", err.message));
```

#### Pattern D — Cron/system jobs (no request context):

```js
const systemContext = audit.buildSystemContext("my-cron-job-name");

await audit.log({
  action: audit.AuditAction.SOMETHING_AUTO_PROCESSED,
  entity_type: audit.EntityType.SOMETHING,
  entity_id: entityId,
  ...systemContext,
  reason_code: audit.AuditReasonCode.AUTOMATION,
  metadata: {
    triggered_by: "cron_scheduler",
    processed_count: 5,
  },
});
```

---

### STEP 4 — Update the controller to pass auditContext

In the controller file that calls your service:

```js
import * as audit from "../../audit/index.js";
// or: import { extractRequestContext } from "../../audit/index.js";

export async function createSomethingController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    const result = await createSomethingService(req.body, auditContext);
    return success(res, result, "Created", 201);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}
```

`extractRequestContext(req)` returns:

```js
{
  actor_type:  "cadmin",            // from req.cadmin
  actor_id:    "uuid-of-cadmin",    // from req.cadmin.cadmin_id
  actor_role:  "SUPER_CADMIN",      // or "CUSTOM_ROLE"
  shop_id:     null,                // cadmins have no shop context
  branch_id:   null,
  ip_address:  "1.2.3.4",
  user_agent:  "Mozilla/5.0 ...",
}
```

---

## Required Fields Reference

Every `audit.log()` call MUST have these fields:

| Field            | Type        | Required | Source                                    |
| ---------------- | ----------- | -------- | ----------------------------------------- |
| `action`         | string      | YES      | `audit.AuditAction.SOME_ACTION`           |
| `entity_type`    | string      | YES      | `audit.EntityType.SOME_TYPE`              |
| `entity_id`      | string/null | YES      | UUID of affected entity, or null for bulk |
| `actor_type`     | string      | YES      | From `...auditContext` spread             |
| `actor_id`       | string/null | YES      | From `...auditContext` spread             |
| `reason_code`    | string      | Optional | `audit.AuditReasonCode.SOME_CODE`         |
| `metadata`       | object/null | Optional | Plain object, no BigInt                   |
| `ip_address`     | string/null | Optional | From `...auditContext` spread             |
| `user_agent`     | string/null | Optional | From `...auditContext` spread             |
| `shop_id`        | string/null | Optional | UUID if action is shop-scoped             |
| `branch_id`      | string/null | Optional | UUID if action is branch-scoped           |
| `correlation_id` | string/null | Optional | For grouping related events               |

---

## Choosing the Right AuditAction

### Naming convention:

```
ENTITY_VERB                    e.g. SHOP_ACTIVATED
ENTITY_VERB_BY_ACTOR           e.g. USER_SUSPENDED_BY_ADMIN
ENTITY_VERB_QUALIFIER          e.g. SHOP_SUSPENDED_DUE_TO_NON_PAYMENT
```

### Decision tree:

```
Is it a CREATE?
  → use *_CREATED (e.g. CADMIN_CREATED, PLAN_CREATED, MASTER_MEDICINE_CREATED)

Is it an UPDATE to profile/details?
  → use *_UPDATED or *_PROFILE_UPDATED

Is it a STATUS CHANGE (activate/suspend/deactivate)?
  → use *_ACTIVATED or *_SUSPENDED

Is it a ROLE/PERMISSION change?
  → use *_ROLE_CHANGED

Is it a PASSWORD change?
  → use *_PASSWORD_RESET_COMPLETED or *_PASSWORD_CHANGED

Is it a DELETE (soft or hard)?
  → use *_DELETED

Is it a VERIFICATION action?
  → use SHOP_VERIFICATION_FILE_VERIFIED / SHOP_VERIFICATION_FILE_REJECTED

Is it a LOGIN/LOGOUT?
  → use *_LOGIN_SUCCESS / *_LOGOUT

Is it a BROADCAST?
  → use BROADCAST_CREATED / BROADCAST_SENT / BROADCAST_SCHEDULED / BROADCAST_CANCELLED
```

### If no action exists for your use case:

1. Add it to `backend/src/modules/audit/audit.actions.js`:

```js
// In the AuditAction object:
MY_NEW_ACTION: "MY_NEW_ACTION",
```

2. The VALID_ACTIONS set is auto-generated from the object values — no
   extra step needed.

3. If you also need a new EntityType, add it to
   `backend/src/modules/audit/audit.constants.js`:

```js
// In the EntityType object:
MY_NEW_ENTITY: "my_new_entity",
```

---

## Choosing the Right EntityType

| Entity                    | Use for                          |
| ------------------------- | -------------------------------- |
| `USER`                    | ERP user accounts                |
| `SHOP`                    | Shop accounts                    |
| `BRANCH`                  | Shop branches                    |
| `SUBSCRIPTION`            | Shop subscriptions               |
| `PLAN`                    | Subscription plans               |
| `TICKET`                  | Support tickets                  |
| `DOCUMENT`                | Shop verification files          |
| `ENQUIRY`                 | Enquiry responses                |
| `PAYMENT`                 | Payment transactions             |
| `CADMIN`                  | CAdmin accounts AND roles        |
| `SYSTEM`                  | Broadcasts, system events        |
| `MEDICINE`                | Shop medicines (linked/unlinked) |
| `MASTER_MEDICINE`         | Master medicine catalog entries  |
| `MASTER_MEDICINE_VARIANT` | Variants under a master          |
| `MASTER_MEDICINE_IMAGE`   | Images for master medicines      |
| `CUSTOMER`                | Shop customers                   |
| `SUPPLIER`                | Shop suppliers                   |
| `INVENTORY`               | Stock/inventory                  |
| `PURCHASE_INVOICE`        | Purchase invoices                |
| `SALES_INVOICE`           | Sales invoices                   |

---

## Choosing the Right ReasonCode

| Code                     | When to use                                     |
| ------------------------ | ----------------------------------------------- |
| `ADMIN_ACTION`           | CAdmin performed the action through the UI      |
| `USER_REQUEST`           | Admin acting on their OWN account (self-update) |
| `SECURITY_ACTION`        | Password changes, login, logout, account lock   |
| `PAYMENT_ISSUE`          | Suspension due to non-payment                   |
| `SYSTEM_ENFORCEMENT`     | Plan limit exceeded, policy violation           |
| `PLAN_LIMIT_ENFORCEMENT` | User/branch disabled due to plan downgrade      |
| `DATA_CORRECTION`        | Admin fixing incorrect data                     |
| `AUTOMATION`             | Cron jobs, scheduled tasks                      |
| `SUPER_ADMIN_OVERRIDE`   | Action that bypasses normal restrictions        |
| `UNKNOWN`                | Fallback (avoid using)                          |

---

## Metadata Best Practices

### Always include:

```js
metadata: {
  // WHO triggered it (if not obvious from actor_id)
  created_by_cadmin_id: cadminId,   // or updated_by, deleted_by, etc.

  // WHAT changed (for updates)
  changed_fields: ["name", "email"],
  before: { name: "Old", email: "old@x.com" },
  after:  { name: "New", email: "new@x.com" },

  // CONTEXT (why it matters)
  reason: "Admin corrected typo in shop name",
}
```

### Never include:

```js
//  NEVER LOG THESE
metadata: {
  password: "...",           // ← secret
  password_hash: "...",      // ← secret
  reset_token: "...",        // ← secret
  secret: "...",             // ← secret
  otp: "...",                // ← secret
  credit_card: "...",        // ← PII
}
```

### BigInt handling:

```js
//  WRONG — BigInt is not JSON-serializable
metadata: {
  price: plan.price;
}

//  CORRECT — convert to Number first
metadata: {
  price: Number(plan.price);
}
```

---

## When to Use Transaction vs Non-blocking

| Scenario                     | Pattern                   | Why                                             |
| ---------------------------- | ------------------------- | ----------------------------------------------- |
| User created/updated/deleted | Transaction (`{ tx }`)    | Data + audit must succeed together              |
| Role assigned/changed        | Transaction               | Security-critical                               |
| Password changed             | Transaction               | Security-critical (throws on failure)           |
| Login/logout                 | Transaction               | Security-critical                               |
| Shop suspended               | Transaction               | Important business event                        |
| Subscription changed         | Transaction               | Billing-critical                                |
| Broadcast sent               | Non-blocking (`.catch()`) | Broadcast already succeeded, audit is secondary |
| Notification sent            | Non-blocking              | Same reason                                     |
| Cron job processed           | Non-blocking              | Don't fail the batch                            |

---

## Common Patterns by Service Type

### CRUD Service (shops, users, plans, admins)

```js
// CREATE
await audit.log(
  {
    action: audit.AuditAction.ENTITY_CREATED,
    entity_type: audit.EntityType.ENTITY,
    entity_id: created.id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      name: created.name,
      created_by_cadmin_id: auditContext.actor_id,
    },
  },
  { tx },
);

// UPDATE
await audit.log(
  {
    action: audit.AuditAction.ENTITY_UPDATED,
    entity_type: audit.EntityType.ENTITY,
    entity_id: id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      changed_fields: Object.keys(changes),
      before: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.old]),
      ),
      after: Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.new]),
      ),
      updated_by_cadmin_id: auditContext.actor_id,
    },
  },
  { tx },
);

// TOGGLE STATUS
await audit.log(
  {
    action: isActive
      ? audit.AuditAction.ENTITY_ACTIVATED
      : audit.AuditAction.ENTITY_SUSPENDED,
    entity_type: audit.EntityType.ENTITY,
    entity_id: id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      previous_status: existing.is_active ? "active" : "suspended",
      reason: isActive ? "Activated by admin" : "Suspended by admin",
    },
  },
  { tx },
);

// SOFT DELETE
await audit.log(
  {
    action: audit.AuditAction.ENTITY_DELETED,
    entity_type: audit.EntityType.ENTITY,
    entity_id: id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      deleted_by_cadmin_id: auditContext.actor_id,
      name: existing.name,
    },
  },
  { tx },
);
```

### Broadcast/Notification Service

```js
// Always non-blocking
audit
  .log({
    action: audit.AuditAction.BROADCAST_SENT,
    entity_type: audit.EntityType.SYSTEM,
    entity_id: campaign.id,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      title: campaign.title,
      recipient_count: recipients.length,
      broadcast_type: "inapp", // or "email"
    },
  })
  .catch((err) =>
    console.error("[AUDIT] Broadcast audit failed:", err.message),
  );
```

### Self-Service (profile, password)

```js
// actor_id === entity_id (admin acting on themselves)
await audit.log({
  action: audit.AuditAction.CADMIN_PROFILE_UPDATED,
  entity_type: audit.EntityType.CADMIN,
  entity_id: cadminId,
  actor_type: "cadmin",
  actor_id: cadminId,
  reason_code: audit.AuditReasonCode.USER_REQUEST,
  ip_address: meta.ip ?? null,
  user_agent: meta.ua ?? null,
  metadata: {
    changed_fields: Object.keys(changes),
    self_update: true,
  },
});
```

### Bulk Operations

```js
// entity_id is null for bulk — list IDs in metadata instead
await audit.log(
  {
    action: audit.AuditAction.MEDICINES_MATCHED,
    entity_type: audit.EntityType.MEDICINE,
    entity_id: null,
    ...auditContext,
    reason_code: audit.AuditReasonCode.ADMIN_ACTION,
    metadata: {
      medicine_ids: medicineIds,
      count: result.count,
      matched_to: variant.name,
    },
  },
  { tx },
);
```

---

## Checklist — Apply to Every Mutating Function

```
[ ] Import added: import * as audit from "../../audit/index.js"
[ ] auditContext parameter added as last param with default {}
[ ] audit.log() called AFTER the successful mutation
[ ] Correct AuditAction used (check audit.actions.js)
[ ] Correct EntityType used (check audit.constants.js)
[ ] entity_id is a UUID string or null (not an array)
[ ] ...auditContext spread BEFORE any explicit fields
[ ] reason_code set appropriately
[ ] metadata has no BigInt values (use Number())
[ ] metadata has no secrets (passwords, tokens, OTPs)
[ ] If inside $transaction → passed { tx } as second arg
[ ] If non-critical → used .catch() for non-blocking
[ ] Controller updated to call audit.extractRequestContext(req)
[ ] Controller passes auditContext to the service function
```

---

## Checklist — For New Service Files

```
[ ] All steps above for each mutating function
[ ] Read-only functions have NO audit calls
[ ] Helper/internal functions have NO audit calls
[ ] Any new AuditAction added to audit.actions.js
[ ] Any new EntityType added to audit.constants.js
[ ] Controller extracts auditContext from req
[ ] Tested: create an entry → check audit_logs table → correct row exists
```

---

## Files Reference

| File                                            | Purpose                                   |
| ----------------------------------------------- | ----------------------------------------- |
| `backend/src/modules/audit/index.js`            | Public API — import this                  |
| `backend/src/modules/audit/audit.service.js`    | Core log() and logMany()                  |
| `backend/src/modules/audit/audit.actions.js`    | All valid AuditAction constants           |
| `backend/src/modules/audit/audit.constants.js`  | ActorType, EntityType, SecurityActions    |
| `backend/src/modules/audit/audit.reasons.js`    | All valid AuditReasonCode constants       |
| `backend/src/modules/audit/audit.validators.js` | Payload validation + normalization        |
| `backend/src/modules/audit/audit.utils.js`      | extractRequestContext, buildSystemContext |

---

## Anti-Patterns — What NOT to Do

### Don't audit reads

```js
// WRONG — listing is not a business event
export async function listUsers() {
  const users = await prisma.user.findMany();
  await audit.log({ action: "USERS_LISTED", ... });  // ← DON'T
  return users;
}
```

### Don't audit before the mutation

```js
// WRONG — if the DB operation fails, you have a false audit entry
await audit.log({ action: "USER_CREATED", ... });  // ← audit BEFORE create
const user = await prisma.user.create({ ... });     // ← this might fail
```

### Don't use uppercase actor_type

```js
// WRONG
actor_type: "CADMIN"; // ← validator rejects this

// CORRECT
actor_type: "cadmin"; // ← always lowercase
```

### Don't pass arrays as entity_id

```js
// WRONG
entity_id: medicineIds  // ← array, validator rejects

// CORRECT
entity_id: null,        // ← null for bulk ops
metadata: { medicine_ids: medicineIds }  // ← list in metadata
```

### Don't swallow audit errors for security actions

```js
// WRONG — security actions MUST throw on audit failure
await audit.log({
  action: audit.AuditAction.CADMIN_LOGIN_SUCCESS,
  ...
}).catch(() => {});  // ← NEVER for login/password/role changes

// CORRECT — let it throw (the audit service handles this internally
// for actions in SECURITY_ACTIONS set)
await audit.log({
  action: audit.AuditAction.CADMIN_LOGIN_SUCCESS,
  ...
}, { tx });
```

### Don't create new AuditAction constants with generic names

```js
// WRONG
MANAGE_USERS: "MANAGE_USERS"; // ← too vague
ADMIN_ACTION: "ADMIN_ACTION"; // ← meaningless

// CORRECT
USER_PROFILE_UPDATED_BY_ADMIN: "USER_PROFILE_UPDATED_BY_ADMIN";
SHOP_SUSPENDED_DUE_TO_NON_PAYMENT: "SHOP_SUSPENDED_DUE_TO_NON_PAYMENT";
```
