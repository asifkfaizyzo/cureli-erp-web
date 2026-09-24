// cadmin-web/src/pages/Cadmin-management/comps/AdminDetailsModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/AdminDetailsModal.jsx

import { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  Pencil,
  Save,
  User,
  History,
  Ban,
  CheckCircle,
  Loader2,
  AlertCircle,
  Shield,
  Plus,
  MoreVertical,
  Star,
  Trash2,
  Crown,
  Mail,
  Phone,
  AtSign,
  Calendar,
  Clock,
  Activity,
} from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import AdminActivityTab from "./AdminActivityTab";
import AssignRolesModal from "./AssignRolesModal";
import NoPermission from "../../../components/common/NoPermission";
import SuperAdminSecretDialog from "./SuperAdminSecretDialog";
import {
  getAdminById,
  updateAdmin,
  toggleAdminAccess,
  getAdminRoles,
  assignAdminRoles,
  toggleSuperAdminAccess,
} from "../../../api/cadminAdmins";
import { getRoleBadgeStyle } from "../../../config/tableConfig";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions";

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE FIELD
// ─────────────────────────────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  icon: Icon,
  isEditing,
  onChange,
  type = "text",
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={11} />}
        {label}
      </p>
      {isEditing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 border-2 border-indigo-300 rounded-lg text-sm font-medium
                     text-gray-800 focus:outline-none focus:border-indigo-500
                     focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all bg-indigo-50/30"
        />
      ) : (
        <p className="text-sm font-semibold text-gray-800 truncate min-h-[20px]">
          {value || <span className="text-gray-300 font-normal">—</span>}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border
      ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-400"}`}
      />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE ASSIGNMENT ROW
// ─────────────────────────────────────────────────────────────────────────────
function RoleAssignmentRow({
  assignment,
  isSuperAdmin,
  onSetPrimary,
  onRemove,
  canEdit,
  disabled,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-gray-100
                    hover:border-indigo-200 hover:shadow-sm transition-all group
                    ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      <span className={getRoleBadgeStyle(assignment.name)}>
        {assignment.name}
      </span>

      {assignment.is_primary && (
        <span
          className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5
                         bg-amber-50 text-amber-700 rounded-lg border border-amber-200"
        >
          <Star size={10} fill="currentColor" /> Primary
        </span>
      )}

      <div className="flex-1" />

      {!isSuperAdmin && canEdit && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((p) => !p);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-9 z-20 w-44 bg-white rounded-xl
                              border border-gray-200 shadow-xl overflow-hidden"
              >
                {!assignment.is_primary && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onSetPrimary(assignment.role_id);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                               text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <Star size={14} /> Set as Primary
                  </button>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(assignment.role_id);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                             text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Remove Role
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROLES TAB — fixed
// ─────────────────────────────────────────────────────────────────────────────
function AdminRolesTab({ admin, onRolesChanged, canEdit }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null); // ✅ separate error for mutations
  const [actionLoading, setActionLoading] = useState(false); // ✅ track mutation loading
  const [assignOpen, setAssignOpen] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!admin?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminRoles(admin.id);
      setRoles(res.data.data.roles ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [admin?.id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // ✅ Single source of truth for all role mutations
  const applyRoleChange = useCallback(
    async (roleIds, primaryRoleId) => {
      const apiPayload = {
        role_ids: roleIds,
        primary_role_id: primaryRoleId ?? null,
      };

      setActionError(null);
      setActionLoading(true);
      try {
        await assignAdminRoles(admin.id, apiPayload);
        await fetchRoles();
        onRolesChanged?.();
      } catch (err) {
        console.error("🔴 [AdminRolesTab] assignAdminRoles threw:", err);
        console.error(
          "🔴 [AdminRolesTab] err.response?.status:",
          err.response?.status,
        );
        console.error(
          "🔴 [AdminRolesTab] err.response?.data:",
          JSON.stringify(err.response?.data, null, 2),
        );
        setActionError(
          err.response?.data?.message ||
            "Failed to update roles. Please try again.",
        );
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [admin?.id, fetchRoles, onRolesChanged],
  );

  // ✅ Used by AssignRolesModal — receives [{role_id}] array + primaryId
  const saveAssignments = useCallback(
    async (newRoles, primaryId) => {
      await applyRoleChange(
        newRoles.map((r) => r.role_id),
        primaryId,
      );
    },
    [applyRoleChange],
  );

  // ✅ Set a different role as primary
  const handleSetPrimary = useCallback(
    async (roleId) => {
      const roleIds = roles.map((r) => r.role_id);
      await applyRoleChange(roleIds, roleId);
    },
    [roles, applyRoleChange],
  );

  // ✅ Remove a role — including removing the LAST role (empty array is valid)
  const handleRemove = useCallback(
    async (roleId) => {
      const newRoles = roles.filter((r) => r.role_id !== roleId);

      if (newRoles.length === 0) {
        // Removing the last role — send empty array, no primary
        await applyRoleChange([], null);
        return;
      }

      // If we removed the current primary, promote the first remaining role
      const removedWasPrimary = roles.find(
        (r) => r.role_id === roleId,
      )?.is_primary;
      const newPrimaryId = removedWasPrimary
        ? newRoles[0].role_id
        : (roles.find((r) => r.is_primary)?.role_id ?? newRoles[0].role_id);

      await applyRoleChange(
        newRoles.map((r) => r.role_id),
        newPrimaryId,
      );
    },
    [roles, applyRoleChange],
  );

  if (admin?.is_super_cadmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <Crown size={26} className="text-purple-600" />
        </div>
        <p className="text-sm font-bold text-gray-700">Super Admin Account</p>
        <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
          Super Admins have full unrestricted access. Custom role assignments
          don't apply.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {loading ? (
            "Loading…"
          ) : (
            <span>
              <span className="font-bold text-gray-800">{roles.length}</span>{" "}
              role{roles.length !== 1 ? "s" : ""} assigned
            </span>
          )}
        </p>
        {canEdit ? (
          <button
            onClick={() => setAssignOpen(true)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-600
                       bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:bg-indigo-100
                       hover:border-indigo-300 transition-all disabled:opacity-50"
          >
            <Plus size={13} /> Manage Roles
          </button>
        ) : (
          <NoPermission variant="pill" title="View only" icon="eye" />
        )}
      </div>

      {/* ✅ Mutation error banner */}
      {actionError && (
        <div
          className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 px-4 py-3
                        rounded-xl border border-red-200"
        >
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ✅ Mutation loading overlay hint */}
      {actionLoading && (
        <div
          className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50
                        px-4 py-2.5 rounded-xl border border-indigo-100"
        >
          <Loader2 size={14} className="animate-spin flex-shrink-0" />
          Updating roles…
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={22} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">Loading roles…</p>
        </div>
      ) : error ? (
        <div
          className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 px-4 py-3
                        rounded-xl border border-red-100"
        >
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Shield size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">
            No roles assigned
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This admin has no role permissions yet.
          </p>
          {canEdit && (
            <button
              onClick={() => setAssignOpen(true)}
              className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700
                         px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Assign a role
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {!canEdit && (
            <NoPermission
              variant="inline"
              icon="eye"
              title="Read-only view"
              description="You can see assigned roles but cannot make changes."
              className="mb-2"
            />
          )}
          {roles.map((r) => (
            <RoleAssignmentRow
              key={r.role_id}
              assignment={r}
              isSuperAdmin={admin?.is_super_cadmin}
              onSetPrimary={handleSetPrimary}
              onRemove={handleRemove}
              canEdit={canEdit}
              // ✅ Disable interactions while a mutation is in flight
              disabled={actionLoading}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <AssignRolesModal
          isOpen={assignOpen}
          adminId={admin?.id}
          currentRoles={roles}
          onClose={() => setAssignOpen(false)}
          onSave={saveAssignments}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
const AdminDetailsModal = ({
  adminId,
  isOpen,
  onClose,
  mode,
  onAdminUpdate,
}) => {
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canEdit =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_EDIT);
  const canToggleAccess =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_TOGGLE_ACCESS);
  const canViewActivity =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_ACTIVITY);

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [secretDialogError, setSecretDialogError] = useState(null);
  const [secretLoading, setSecretLoading] = useState(false);

  // ✅ Track whether ANY mutation happened so onClose(true) triggers a refetch
  const wasUpdatedRef = useRef(false);

  // Reset tracking ref each time modal opens
  useEffect(() => {
    if (isOpen) wasUpdatedRef.current = false;
  }, [isOpen]);

  // Helper — marks updated AND notifies parent's local state immediately
  const markUpdated = useCallback(
    (updates = {}) => {
      wasUpdatedRef.current = true;
      if (Object.keys(updates).length > 0) {
        onAdminUpdate?.(adminId, updates);
      }
    },
    [adminId, onAdminUpdate],
  );

  // Safe close — always passes the correct wasUpdated flag
  const handleClose = useCallback(() => {
    onClose(wasUpdatedRef.current);
  }, [onClose]);

  useEffect(() => {
    if (activeTab === "activity" && !canViewActivity) setActiveTab("profile");
  }, [activeTab, canViewActivity]);

  useEffect(() => {
    if (!isOpen || !adminId) return;
    setLoading(true);
    setFetchError(null);
    setActiveTab("profile");
    setIsEditing(false);

    getAdminById(adminId)
      .then((res) => {
        const data = res.data.data;
        setAdmin(data);
        setFormData({
          name: data.name ?? "",
          username: data.username ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
        });
      })
      .catch((err) => {
        setFetchError({
          status: err.response?.status ?? 0,
          message: err.response?.data?.message || "Failed to load admin",
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, adminId]);

  useEffect(() => {
    if (!loading && admin) setIsEditing(mode === "edit");
  }, [mode, loading, admin]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        e.key === "Escape" &&
        !saveLoading &&
        !statusLoading &&
        !secretLoading
      )
        handleClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose, saveLoading, statusLoading, secretLoading]);

  if (!isOpen) return null;

  // ── Save profile edits ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const payload = {};
      if (formData.name !== admin.name) payload.name = formData.name;
      if (formData.username !== admin.username)
        payload.username = formData.username;
      if (formData.phone !== admin.phone) payload.phone = formData.phone;
      if (formData.email !== admin.email) payload.email = formData.email;

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const res = await updateAdmin(adminId, payload);
      const updated = res.data.data;

      // Update local modal state
      setAdmin((p) => ({ ...p, ...updated }));
      setIsEditing(false);

      // ✅ Mark updated — table will refetch on close
      markUpdated(updated);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: admin.name ?? "",
      username: admin.username ?? "",
      phone: admin.phone ?? "",
      email: admin.email ?? "",
    });
    setSaveError(null);
    setIsEditing(false);
  };

  // ── Toggle status (normal admin) ───────────────────────────────────────────
  const handleToggleStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const newActive = admin.status !== "Active";
      await toggleAdminAccess(adminId, newActive);
      const newStatus = newActive ? "Active" : "Inactive";

      setAdmin((p) => ({ ...p, status: newStatus, isActive: newActive }));
      setShowStatusConfirm(false);

      // ✅ Mark updated
      markUpdated({ status: newStatus });
    } catch (err) {
      setStatusError(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Toggle status (super admin — requires secret) ──────────────────────────
  const handleSuperAdminToggle = async (secret) => {
    setSecretLoading(true);
    setSecretDialogError(null);
    try {
      const newActive = admin.status !== "Active";
      await toggleSuperAdminAccess(adminId, newActive, secret);
      const newStatus = newActive ? "Active" : "Inactive";

      setAdmin((p) => ({ ...p, status: newStatus, isActive: newActive }));
      setShowSecretDialog(false);

      // ✅ Mark updated
      markUpdated({ status: newStatus });
    } catch (err) {
      setSecretDialogError(
        err.response?.data?.message || "Failed to update Super Admin status",
      );
    } finally {
      setSecretLoading(false);
    }
  };

  // ── Roles changed callback ─────────────────────────────────────────────────
  const handleRolesChanged = useCallback(() => {
    // ✅ Mark updated so table refetches (role badge in table row needs refresh)
    markUpdated({});
  }, [markUpdated]);

  // ── Profile tab render ─────────────────────────────────────────────────────
  const renderProfile = () => (
    <div className="space-y-4">
      {saveError && (
        <div
          className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl
                        flex items-center gap-2.5 text-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={14} />
          </div>
          {saveError}
        </div>
      )}

      {admin?.is_super_cadmin && (
        <div
          className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-violet-50
                        border-2 border-purple-200 rounded-xl px-4 py-3"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Crown size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-800">Super Admin</p>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-purple-600/80 mt-0.5">
              Full unrestricted platform access
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border-2 border-gray-100 p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-700">
              Account Information
            </h3>
            {isEditing && (
              <span
                className="ml-auto text-[11px] font-bold px-2.5 py-1 bg-indigo-50
                               text-indigo-600 rounded-lg border border-indigo-200"
              >
                Editing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <EditableField
              label="Full Name"
              icon={User}
              value={formData.name}
              isEditing={isEditing}
              onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
            />
            <EditableField
              label="Username"
              icon={AtSign}
              value={formData.username}
              isEditing={isEditing}
              onChange={(v) =>
                setFormData((p) => ({ ...p, username: v.toLowerCase() }))
              }
            />
            <EditableField
              label="Phone"
              icon={Phone}
              value={formData.phone}
              isEditing={isEditing}
              type="tel"
              onChange={(v) =>
                setFormData((p) => ({
                  ...p,
                  phone: v.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
            <EditableField
              label="Email"
              icon={Mail}
              value={formData.email}
              isEditing={isEditing}
              type="email"
              onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
            />
          </div>

          <div className="bg-white space-y-1.5">
            <p
              className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider
                          flex items-center gap-1.5"
            >
              <Activity size={11} /> Status
            </p>
            <StatusBadge status={admin?.status ?? "—"} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-xl border-2 border-gray-100 p-4 space-y-1.5">
            <p
              className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider
                          flex items-center gap-1.5"
            >
              <Shield size={11} /> Primary Role
            </p>
            {admin?.role ? (
              <span className={getRoleBadgeStyle(admin.role)}>
                {admin.role}
              </span>
            ) : (
              <p className="text-sm text-gray-300 font-medium">
                No role assigned
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-100 p-4 space-y-3">
            <div className="space-y-1">
              <p
                className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider
                            flex items-center gap-1.5"
              >
                <Clock size={11} /> Last Login
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {admin?.lastLogin || (
                  <span className="text-gray-300 font-normal">Never</span>
                )}
              </p>
            </div>
            <div className="w-full h-px bg-gray-100" />
            <div className="space-y-1">
              <p
                className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider
                            flex items-center gap-1.5"
              >
                <Calendar size={11} /> Created
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {admin?.createdAt || (
                  <span className="text-gray-300 font-normal">—</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "profile") return renderProfile();
    if (activeTab === "roles") {
      return (
        <AdminRolesTab
          admin={admin}
          canEdit={canEdit}
          onRolesChanged={handleRolesChanged}
        />
      );
    }
    if (activeTab === "activity") {
      if (!canViewActivity) {
        return (
          <NoPermission
            variant="block"
            icon="lock"
            title="Activity Logs Restricted"
            description="You don't have permission to view this admin's activity history."
          />
        );
      }
      return <AdminActivityTab activities={admin?.activityLogs ?? []} />;
    }
    return null;
  };

  const renderFetchError = () => {
    if (fetchError.status === 403) {
      return (
        <NoPermission
          variant="block"
          icon="lock"
          title="Access Restricted"
          description="You don't have permission to view this admin's details."
        />
      );
    }
    if (fetchError.status === 404) {
      return (
        <NoPermission
          variant="block"
          icon="shield"
          title="Admin Not Found"
          description="This admin account no longer exists or has been removed."
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-red-600 text-sm font-bold">Something went wrong</p>
        <p className="text-gray-400 text-xs text-center max-w-xs">
          {fetchError.message}
        </p>
        <button
          onClick={handleClose}
          className="mt-2 px-5 py-2 text-sm font-medium text-gray-600 border-2 border-gray-200
                     rounded-xl hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    );
  };

  const TABS = ["profile", "roles", ...(canViewActivity ? ["activity"] : [])];
  const tabLabel = { profile: "Profile", roles: "Roles", activity: "Activity" };
  const tabIcon = { profile: User, roles: Shield, activity: History };
  const hasAdmin = !loading && !fetchError && admin;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() =>
          !saveLoading && !statusLoading && !secretLoading && handleClose()
        }
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col
                     overflow-hidden animate-in zoom-in-95 duration-200 h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ────────────────────────────────────────────────────── */}
          <div
            className={`px-6 pt-5 flex-shrink-0 transition-all duration-300
            ${
              admin?.is_super_cadmin
                ? "bg-gradient-to-r from-purple-800 via-purple-700 to-violet-600"
                : "bg-gradient-to-r from-[#05015A] to-[#0a0280]"
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                  ${admin?.is_super_cadmin ? "bg-purple-900/40" : "bg-white/10"}`}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin text-white/60" />
                  ) : admin?.is_super_cadmin ? (
                    <Crown size={22} className="text-white" />
                  ) : (
                    <User size={22} className="text-white" />
                  )}
                </div>

                <div className="min-w-0">
                  {loading && (
                    <div className="h-5 w-36 bg-white/20 rounded-lg animate-pulse mb-1.5" />
                  )}
                  {!loading && fetchError?.status === 403 && (
                    <p className="font-bold text-white">Access Restricted</p>
                  )}
                  {!loading && fetchError && fetchError.status !== 403 && (
                    <p className="font-bold text-white">Error</p>
                  )}
                  {hasAdmin && (
                    <>
                      <h2 className="text-white text-xl font-bold truncate leading-tight">
                        {admin.name}
                      </h2>
                      <p className="text-white/50 text-sm mt-0.5">
                        @{admin.username}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasAdmin &&
                  activeTab === "profile" &&
                  canEdit &&
                  (isEditing ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saveLoading}
                        className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-white/10
                                   text-white hover:bg-white/20 disabled:opacity-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saveLoading}
                        className="px-3.5 py-2 rounded-xl text-sm font-bold bg-emerald-500
                                   text-white flex items-center gap-1.5 hover:bg-emerald-600
                                   disabled:opacity-50 shadow-lg shadow-emerald-500/30 transition-all"
                      >
                        {saveLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 rounded-xl text-sm font-bold bg-white/10
                                 text-white flex items-center gap-1.5 hover:bg-white/20 transition-all"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  ))}
                <button
                  onClick={() =>
                    !saveLoading &&
                    !statusLoading &&
                    !secretLoading &&
                    handleClose()
                  }
                  disabled={saveLoading || statusLoading || secretLoading}
                  className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20
                             disabled:opacity-50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            {hasAdmin && (
              <div className="flex gap-1 mt-5">
                {TABS.map((t) => {
                  const Icon = tabIcon[t];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setActiveTab(t);
                        if (isEditing) handleCancelEdit();
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                                  rounded-t-xl transition-all
                                  ${
                                    activeTab === t
                                      ? "bg-white text-indigo-700"
                                      : "text-white/60 hover:text-white hover:bg-white/10"
                                  }`}
                    >
                      <Icon size={14} />
                      {tabLabel[t]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Content ───────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
                <p className="text-sm text-gray-400">Loading admin details…</p>
              </div>
            ) : fetchError ? (
              renderFetchError()
            ) : (
              renderTabContent()
            )}
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          {hasAdmin && (
            <div
              className="px-6 py-3.5 bg-white border-t border-gray-100
                            flex justify-between items-center flex-shrink-0"
            >
              <p className="text-xs text-gray-400 font-mono">
                ID:{" "}
                <span className="font-semibold text-gray-500">{admin.id}</span>
              </p>

              {canToggleAccess ? (
                <button
                  onClick={() => {
                    setStatusError(null);
                    if (admin.is_super_cadmin) {
                      setSecretDialogError(null);
                      setShowSecretDialog(true);
                    } else {
                      setShowStatusConfirm(true);
                    }
                  }}
                  disabled={isEditing}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2
                              border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                admin.status === "Active"
                                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                              }`}
                >
                  {admin.status === "Active" ? (
                    <>
                      <Ban size={15} /> Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} /> Activate
                    </>
                  )}
                </button>
              ) : (
                <NoPermission variant="pill" icon="eye" title="View only" />
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => {
          setShowStatusConfirm(false);
          setStatusError(null);
        }}
        onConfirm={handleToggleStatus}
        loading={statusLoading}
        title={
          admin?.status === "Active" ? "Suspend Admin?" : "Activate Admin?"
        }
        message={
          statusError ? (
            <span className="text-red-600">{statusError}</span>
          ) : (
            `Are you sure you want to ${admin?.status === "Active" ? "suspend" : "activate"} "${admin?.name}"?`
          )
        }
        confirmText={admin?.status === "Active" ? "Suspend" : "Activate"}
        type={admin?.status === "Active" ? "warning" : "success"}
      />

      <SuperAdminSecretDialog
        isOpen={showSecretDialog}
        onClose={() => {
          setShowSecretDialog(false);
          setSecretDialogError(null);
        }}
        onConfirm={handleSuperAdminToggle}
        loading={secretLoading}
        apiError={secretDialogError}
        targetName={admin?.name ?? ""}
        action={admin?.status === "Active" ? "suspend" : "activate"}
      />
    </>
  );
};

export default AdminDetailsModal;
