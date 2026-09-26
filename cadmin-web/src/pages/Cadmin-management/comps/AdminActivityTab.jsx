// cadmin-web/src/pages/Cadmin-management/comps/AdminActivityTab.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/AdminActivityTab.jsx

import {
  LogIn,
  LogOut,
  KeyRound,
  UserCog,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  UserPlus,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
  Ban,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActivityIcon = (action) => {
  switch (action) {
    case "login":
    case "CADMIN_LOGIN_SUCCESS":
      return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" };
    case "CADMIN_LOGOUT":
      return { icon: LogOut, color: "text-slate-500", bg: "bg-slate-50" };
    case "password_change":
    case "CHANGE_PASSWORD":
    case "CADMIN_PASSWORD_RESET_COMPLETED":
      return { icon: KeyRound, color: "text-amber-500", bg: "bg-amber-50" };
    case "profile_updated":
    case "profile_update":
    case "UPDATE_CONTACT":
    case "UPDATE_IDENTITY":
    case "CADMIN_PROFILE_UPDATED":
      return { icon: UserCog, color: "text-indigo-500", bg: "bg-indigo-50" };
    case "status_changed":
    case "status_change":
    case "super_admin_status_changed":
      return {
        icon: AlertTriangle,
        color: "text-orange-500",
        bg: "bg-orange-50",
      };
    case "CADMIN_ACTIVATED":
      return {
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
      };
    case "CADMIN_SUSPENDED":
      return { icon: Ban, color: "text-red-500", bg: "bg-red-50" };
    case "role_updated":
    case "role_change":
    case "CADMIN_ROLE_CHANGED":
      return { icon: Shield, color: "text-purple-500", bg: "bg-purple-50" };
    case "roles_assigned":
      return {
        icon: ShieldCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
      };
    case "all_roles_removed":
      return { icon: ShieldOff, color: "text-rose-500", bg: "bg-rose-50" };
    case "admin_created":
    case "super_admin_created":
    case "CADMIN_CREATED":
      return { icon: UserPlus, color: "text-green-500", bg: "bg-green-50" };
    default:
      return { icon: Calendar, color: "text-gray-500", bg: "bg-gray-50" };
  }
};

const getActionLabel = (action) => {
  const labels = {
    login: "Login",
    password_change: "Password Changed",
    CHANGE_PASSWORD: "Password Changed",
    profile_updated: "Profile Updated",
    profile_update: "Profile Updated",
    UPDATE_CONTACT: "Contact Info Updated",
    UPDATE_IDENTITY: "Identity Updated",
    status_changed: "Status Changed",
    status_change: "Status Changed",
    super_admin_status_changed: "Super Admin Status Changed",
    role_updated: "Role Updated",
    role_change: "Role Changed",
    admin_created: "Account Created",
    super_admin_created: "Super Admin Created",
    CADMIN_LOGIN_SUCCESS: "Login",
    CADMIN_LOGOUT: "Logged Out",
    CADMIN_CREATED: "Account Created",
    CADMIN_PROFILE_UPDATED: "Profile Updated",
    CADMIN_ROLE_CHANGED: "Role Updated",
    CADMIN_ACTIVATED: "Account Activated",
    CADMIN_SUSPENDED: "Account Suspended",
    CADMIN_PASSWORD_RESET_COMPLETED: "Password Reset",
    roles_assigned: "Roles Assigned",
    all_roles_removed: "All Roles Removed",
    role_created: "Role Created",
    role_deleted: "Role Deleted",
  };
  return labels[action] || action || "Activity";
};

// ─────────────────────────────────────────────────────────────────────────────
// METADATA RENDERERS
// Each action type has its own renderer that knows what fields to show
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a single labelled field value
 */
const Field = ({ label, value }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="text-xs text-gray-500">
      <span className="font-medium text-gray-600">{label}:</span>{" "}
      <span className="text-gray-700">{String(value)}</span>
    </div>
  );
};

/**
 * Render a before → after diff for a single field
 */
const Diff = ({ label, from, to }) => {
  if (from === undefined && to === undefined) return null;
  return (
    <div className="text-xs text-gray-500">
      <span className="font-medium text-gray-600">{label}:</span>{" "}
      <span className="text-gray-400 line-through">{String(from ?? "—")}</span>
      <span className="mx-1.5 text-gray-300">→</span>
      <span className="text-gray-700 font-medium">{String(to ?? "—")}</span>
    </div>
  );
};

/**
 * Convert camelCase or snake_case field name to readable label
 */
const fieldLabel = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();

/**
 * Render metadata based on the action type.
 * Each action knows what its metadata contains.
 */
const renderMeta = (action, meta) => {
  if (!meta || typeof meta !== "object") return null;

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (action === "CADMIN_LOGIN_SUCCESS" || action === "login") {
    return (
      <div className="space-y-0.5">
        <Field label="Username" value={meta.username} />
        <Field label="Login Method" value={meta.login_method} />
        <Field label="Session Type" value={meta.session_type} />
      </div>
    );
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  if (action === "CADMIN_LOGOUT") {
    return (
      <div className="space-y-0.5">
        <Field label="Username" value={meta.username} />
        <Field label="Logout Type" value={meta.logout_type} />
      </div>
    );
  }

  // ── ACCOUNT CREATED ───────────────────────────────────────────────────────
  if (
    action === "CADMIN_CREATED" ||
    action === "admin_created" ||
    action === "super_admin_created"
  ) {
    return (
      <div className="space-y-0.5">
        <Field label="Username" value={meta.username} />
        <Field label="Email" value={meta.email} />
        <Field
          label="Super Admin"
          value={meta.is_super_cadmin ? "Yes" : undefined}
        />
        <Field
          label="Roles Assigned"
          value={
            meta.role_ids_assigned?.length > 0
              ? `${meta.role_ids_assigned.length} role(s)`
              : undefined
          }
        />
        <Field label="Created By" value={meta.created_by_cadmin_id} />
      </div>
    );
  }

  // ── PROFILE UPDATED ───────────────────────────────────────────────────────
  if (
    action === "CADMIN_PROFILE_UPDATED" ||
    action === "profile_updated" ||
    action === "profile_update" ||
    action === "UPDATE_CONTACT" ||
    action === "UPDATE_IDENTITY"
  ) {
    // Has before/after diffs
    if (meta.before && meta.after) {
      const fields = meta.changed_fields || Object.keys(meta.before);
      return (
        <div className="space-y-0.5">
          {fields.map((f) => (
            <Diff
              key={f}
              label={fieldLabel(f)}
              from={meta.before[f]}
              to={meta.after[f]}
            />
          ))}
        </div>
      );
    }
    // Has changes as { field: { from, to } }
    if (meta.changes) {
      return (
        <div className="space-y-0.5">
          {Object.entries(meta.changes).map(([f, v]) => (
            <Diff key={f} label={fieldLabel(f)} from={v?.from} to={v?.to} />
          ))}
        </div>
      );
    }
    // Flat changed_fields list only
    if (meta.changed_fields) {
      return (
        <Field label="Changed Fields" value={meta.changed_fields.join(", ")} />
      );
    }
    return null;
  }

  // ── ROLE CHANGED (CADMIN_ROLE_CHANGED) ────────────────────────────────────
  if (
    action === "CADMIN_ROLE_CHANGED" ||
    action === "role_updated" ||
    action === "role_change"
  ) {
    const event = meta.event;

    // roles_assigned event
    if (event === "roles_assigned") {
      return (
        <div className="space-y-1">
          <Field label="Admin" value={meta.admin_name} />
          {meta.role_names?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {meta.role_names.map((name) => (
                <span
                  key={name}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700
                             rounded-full text-[11px] font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          <Field label="Primary Role" value={meta.primary_role_id} />
        </div>
      );
    }

    // role_created event
    if (event === "role_created") {
      return (
        <div className="space-y-0.5">
          <Field label="Role Name" value={meta.role_name} />
          <Field
            label="Permissions"
            value={`${meta.permissions?.length ?? 0} permission(s)`}
          />
        </div>
      );
    }

    // role_updated event
    if (event === "role_updated") {
      return (
        <div className="space-y-0.5">
          <Field label="Role Name" value={meta.role_name} />
          <Field
            label="Changed Fields"
            value={meta.changed_fields?.join(", ")}
          />
          {meta.changes?.name && (
            <Diff
              label="Name"
              from={meta.changes.name.from}
              to={meta.changes.name.to}
            />
          )}
          {meta.changes?.permissions && (
            <Field label="Permissions Updated" value="Yes" />
          )}
        </div>
      );
    }

    // role_deleted event
    if (event === "role_deleted") {
      return <Field label="Role Name" value={meta.role_name} />;
    }

    // all_roles_removed event
    if (event === "all_roles_removed") {
      return null;
    }

    // Generic fallback — show event and role_name if present
    return (
      <div className="space-y-0.5">
        {meta.event && <Field label="Event" value={meta.event} />}
        {meta.role_name && <Field label="Role Name" value={meta.role_name} />}
      </div>
    );
  }

  // ── ACTIVATED / SUSPENDED ─────────────────────────────────────────────────
  if (
    action === "CADMIN_ACTIVATED" ||
    action === "CADMIN_SUSPENDED" ||
    action === "status_changed" ||
    action === "status_change" ||
    action === "super_admin_status_changed"
  ) {
    return (
      <div className="space-y-0.5">
        <Field label="Username" value={meta.username} />
        <Field label="Reason" value={meta.reason} />
        <Field label="Changed By" value={meta.changed_by_cadmin_id} />
      </div>
    );
  }

  // ── PASSWORD RESET ────────────────────────────────────────────────────────
  if (
    action === "CADMIN_PASSWORD_RESET_COMPLETED" ||
    action === "password_change" ||
    action === "CHANGE_PASSWORD"
  ) {
    return (
      <div className="space-y-0.5">
        <Field label="Method" value={meta.reset_method} />
      </div>
    );
  }

  // ── FALLBACK — show all flat string/number fields ─────────────────────────
  // For any action not explicitly handled above
  const flatFields = Object.entries(meta).filter(
    ([, v]) =>
      typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );
  if (flatFields.length === 0) return null;
  return (
    <div className="space-y-0.5">
      {flatFields.map(([k, v]) => (
        <Field key={k} label={fieldLabel(k)} value={String(v)} />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AdminActivityTab = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <Clock size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Recent Activity ({activities.length})
      </h3>

      <div className="space-y-2.5">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.action);

          // Determine which action key to use for rendering
          // AuditLog events store the sub-event in metadata.event
          // e.g. CADMIN_ROLE_CHANGED with metadata.event = "roles_assigned"
          const renderAction = activity.meta?.event || activity.action;

          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-gray-100 p-4
                         hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-lg ${bg} flex items-center
                                 justify-center flex-shrink-0`}
                >
                  <Icon size={18} className={color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Action label + raw action key */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm">
                          {getActionLabel(renderAction)}
                        </p>
                        <span
                          className="text-[10px] font-mono text-gray-400
                                         bg-gray-100 px-1.5 py-0.5 rounded"
                        >
                          {activity.action}
                        </span>
                      </div>

                      {/* Description — skip if it's just the action name */}
                      {activity.description &&
                        activity.description !== activity.action && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {activity.description}
                          </p>
                        )}

                      {/* Metadata rendered per action type */}
                      {(activity.meta || activity.changes) && (
                        <div
                          className="mt-2 px-3 py-2 bg-gray-50 rounded-lg
                                        border border-gray-100 space-y-0.5"
                        >
                          {renderMeta(
                            activity.action,
                            activity.meta || activity.changes,
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDateTime(
                        activity.createdAt || activity.created_at,
                      )}
                    </span>
                  </div>

                  {/* IP + User Agent */}
                  {(activity.ipAddress || activity.userAgent) && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {activity.ipAddress && (
                        <span className="font-mono">
                          IP: {activity.ipAddress}
                        </span>
                      )}
                      {activity.ipAddress && activity.userAgent && (
                        <span className="text-gray-200">•</span>
                      )}
                      {activity.userAgent && (
                        <span
                          className="truncate max-w-[260px]"
                          title={activity.userAgent}
                        >
                          {activity.userAgent}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActivityTab;
