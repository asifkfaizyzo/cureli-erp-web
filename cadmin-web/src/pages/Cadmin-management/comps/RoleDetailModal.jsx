// cadmin-web/src/pages/Cadmin-management/comps/RoleDetailModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/RoleDetailModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Shield,
  Users,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Check,
  Minus,
  CheckCircle,
  Ban,
} from "lucide-react";
import { getRoleById } from "../../../api/cadminAdmins";
import { CADMIN_PERMISSION_GROUPS } from "../../../config/cadminPermissions";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions";

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────

function PermissionsView({ permissions = [] }) {
  // Groups with any granted permission float to top, rest follow in original order
  const sortedGroups = [...CADMIN_PERMISSION_GROUPS].sort((a, b) => {
    const aHasAny = a.permissions.some((p) => permissions.includes(p.key));
    const bHasAny = b.permissions.some((p) => permissions.includes(p.key));
    if (aHasAny && !bHasAny) return -1;
    if (!aHasAny && bHasAny) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {sortedGroups.map((group) => {
        const granted = group.permissions.filter((p) =>
          permissions.includes(p.key),
        );
        const hasAny = granted.length > 0;
        return (
          <div
            key={group.key}
            className={`rounded-xl border overflow-hidden
              ${hasAny ? "border-gray-200" : "border-gray-100 opacity-60"}`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">
                {group.module}
              </span>
              <span className="text-xs text-gray-400">
                {granted.length} / {group.permissions.length}
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white">
              {group.permissions.map((perm) => {
                const isGranted = permissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                      ${isGranted ? "bg-emerald-50/50 text-gray-800" : "text-gray-400"}`}
                  >
                    {isGranted ? (
                      <Check
                        size={14}
                        className="text-emerald-500 flex-shrink-0"
                      />
                    ) : (
                      <Minus
                        size={14}
                        className="text-gray-300 flex-shrink-0"
                      />
                    )}
                    <span className={isGranted ? "font-medium" : ""}>
                      {perm.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMINS VIEW
// ─────────────────────────────────────────────────────────────────────────────

function AdminsView({ admins = [] }) {
  if (admins.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No admins assigned to this role</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {admins.map((admin) => (
        <div
          key={admin.cadmin_id}
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
        >
          <div
            className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center
                          text-indigo-700 font-semibold text-sm flex-shrink-0"
          >
            {admin.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {admin.name}
            </p>
            <p className="text-xs text-gray-500 truncate">@{admin.username}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {admin.is_primary && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 bg-indigo-100
                               text-indigo-700 rounded-full border border-indigo-200"
              >
                Primary
              </span>
            )}
            {admin.is_active ? (
              <CheckCircle size={14} className="text-emerald-500" />
            ) : (
              <Ban size={14} className="text-red-400" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────

const RoleDetailModal = ({
  isOpen,
  roleId,
  onClose,
  onEdit,
  onDelete,
  onRoleUpdated,
}) => {
  // ── Permission check ───────────────────────────────────────────────────────
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canEdit =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_EDIT);

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("permissions");

  useEffect(() => {
    if (!isOpen || !roleId) return;
    setTab("permissions");
    setLoading(true);
    setError(null);

    getRoleById(roleId)
      .then((res) => setRole(res.data.data.role))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load role"),
      )
      .finally(() => setLoading(false));
  }, [isOpen, roleId]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl
                   flex flex-col overflow-hidden animate-in zoom-in-95 duration-200
                   h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 pt-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 text-white min-w-0">
              <Shield size={20} className="flex-shrink-0" />
              <div className="min-w-0">
                {loading ? (
                  <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                ) : (
                  <>
                    <h2 className="font-semibold text-lg truncate">
                      {role?.name ?? "Role Detail"}
                    </h2>
                    {role?.description && (
                      <p className="text-white/60 text-xs mt-0.5 truncate">
                        {role.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Edit & Delete buttons — only if user has edit permission */}
              {!loading && !error && role && canEdit && (
                <>
                  <button
                    onClick={() => onEdit(role)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                               bg-white/15 text-white hover:bg-white/25 transition-colors"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(role)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                               bg-red-500/20 text-white hover:bg-red-500/40 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          {!loading && !error && (
            <div className="flex gap-1 mt-4">
              {[
                {
                  key: "permissions",
                  label: `Permissions (${role?.permissions?.length ?? 0})`,
                },
                {
                  key: "admins",
                  label: `Admins (${role?.admins?.length ?? 0})`,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                    ${
                      tab === t.key
                        ? "bg-white text-indigo-700"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="text-sm text-gray-500 underline"
              >
                Close
              </button>
            </div>
          ) : tab === "permissions" ? (
            <PermissionsView permissions={role?.permissions ?? []} />
          ) : (
            <AdminsView admins={role?.admins ?? []} />
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div
            className="flex-shrink-0 px-6 py-3 bg-white border-t border-gray-100
                          flex items-center justify-between text-xs text-gray-400"
          >
            <span>Role ID: {role?.id}</span>
            <span>
              Created{" "}
              {role?.created_at
                ? new Date(role.created_at).toLocaleDateString("en-IN")
                : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDetailModal;
