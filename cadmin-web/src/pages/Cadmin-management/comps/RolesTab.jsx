// cadmin-web/src/pages/Cadmin-management/comps/RolesTab.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/RolesTab.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  Shield,
  Users,
  AlertCircle,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  getRoles,
  getRoleDeletionImpact,
  deleteRole,
} from "../../../api/cadminAdmins";
import { useToast } from "../../../components/common/Toast";
import { getRoleBadgeStyle } from "../../../config/tableConfig";
import CreateRoleModal from "./CreateRoleModal";
import RoleDetailModal from "./RoleDetailModal";
import DeleteRoleModal from "./DeleteRoleModal";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getRoleDotColor(roleName) {
  if (!roleName) return "bg-gray-400";
  const normalized = roleName.trim().toLowerCase();
  if (normalized === "super admin" || normalized === "super_cadmin")
    return "bg-purple-500";
  const colors = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CARD KEBAB MENU
// ─────────────────────────────────────────────────────────────────────────────

function RoleCardMenu({ role, onEdit, onDelete, onViewDetail, canEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl
                          border border-gray-200 shadow-lg overflow-hidden"
          >
            {/* View Details — always visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onViewDetail(role);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700
                         hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <ChevronRight size={15} /> View Details
            </button>

            {/* Edit & Delete — only if user has edit permission */}
            {canEdit && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onEdit(role);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700
                             hover:bg-amber-50 hover:text-amber-700 transition-colors"
                >
                  <Pencil size={15} /> Edit Role
                </button>
                {/* Divider only shown when edit/delete are visible */}
                <div className="border-t border-gray-100" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onDelete(role);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600
                             hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} /> Delete Role
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CARD
// ─────────────────────────────────────────────────────────────────────────────

function RoleCard({ role, onEdit, onDelete, onViewDetail, canEdit }) {
  const dotColor = getRoleDotColor(role.name);
  const previewPerms = role.permissions.slice(0, 4);
  const remainingCount = role.permissions.length - previewPerms.length;

  return (
    <div
      onClick={() => onViewDetail(role)}
      className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4
                 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50
                 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor}`} />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
              {role.name}
            </h3>
            {role.description && (
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {role.description}
              </p>
            )}
          </div>
        </div>
        <RoleCardMenu
          role={role}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetail={onViewDetail}
          canEdit={canEdit}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {previewPerms.map((perm) => (
          <span
            key={perm}
            className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600
                       text-[11px] font-medium rounded-md border border-indigo-100"
          >
            {perm}
          </span>
        ))}
        {remainingCount > 0 && (
          <span
            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500
                           text-[11px] font-medium rounded-md"
          >
            +{remainingCount} more
          </span>
        )}
        {role.permissions.length === 0 && (
          <span className="text-xs text-gray-400 italic">
            No permissions assigned
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users size={14} />
          <span className="text-sm">
            {role.admin_count ?? 0}{" "}
            {(role.admin_count ?? 0) === 1 ? "admin" : "admins"}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {role.permissions.length} permissions
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyRoles({ onCreateClick, canEdit }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Shield size={32} className="text-indigo-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No roles yet</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        Create custom roles to define what each admin can access. Assign
        multiple roles to an admin and their permissions are combined.
      </p>
      {canEdit && (
        <button
          onClick={onCreateClick}
          className="px-5 py-2.5 bg-[#05015A] text-white rounded-xl text-sm font-medium
                     hover:bg-[#1a10a0] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Create First Role
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES TAB (main)
// ─────────────────────────────────────────────────────────────────────────────

const RolesTab = () => {
  const toast = useToast();

  // ── Permission check ───────────────────────────────────────────────────────
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canEdit =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_EDIT);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [detailRole, setDetailRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteImpactLoading, setDeleteImpactLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRoles();
      setRoles(res.data.data.roles ?? []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setError(err.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeleteClick = async (role) => {
    setDeleteImpactLoading(true);
    try {
      const res = await getRoleDeletionImpact(role.id);
      const impact = res.data.data.impact;
      setDeleteTarget({ role, impact });
    } catch (err) {
      toast.error(
        "Failed to check impact",
        err.response?.data?.message || "Something went wrong",
      );
    } finally {
      setDeleteImpactLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.role.id);
      toast.success(
        "Role Deleted",
        `"${deleteTarget.role.name}" has been removed.`,
      );
      setDeleteTarget(null);
      fetchRoles();
    } catch (err) {
      toast.error(
        "Delete Failed",
        err.response?.data?.message || "Failed to delete role",
      );
    }
  };

  const handleCreateSuccess = (newRole) => {
    setRoles((prev) => [newRole, ...prev]);
    setCreateOpen(false);
    toast.success("Role Created", `"${newRole.name}" is ready to assign.`);
  };

  const handleEditSuccess = (updatedRole) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)),
    );
    setEditRole(null);
    toast.success("Role Updated", `"${updatedRole.name}" has been updated.`);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Roles tab header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading
            ? "Loading…"
            : `${roles.length} custom role${roles.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRoles}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500
                       hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {/* Create Role button — only if user has edit permission */}
          {canEdit && (
            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 bg-[#05015A] text-white rounded-xl text-sm font-medium
                         hover:bg-[#1a10a0] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={15} /> Create Role
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 px-4 py-3
                        rounded-xl flex items-center gap-2 text-sm"
        >
          <AlertCircle size={16} /> {error}
          <button
            onClick={fetchRoles}
            className="ml-auto underline font-medium hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ) : roles.length === 0 ? (
          <EmptyRoles
            onCreateClick={() => setCreateOpen(true)}
            canEdit={canEdit}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={setEditRole}
                onDelete={handleDeleteClick}
                onViewDetail={setDetailRole}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete impact loading overlay */}
      {deleteImpactLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
            <Loader2 size={20} className="animate-spin text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">
              Checking impact…
            </span>
          </div>
        </div>
      )}

      {/* Modals — only mount create/edit modals if user has edit permission */}
      {canEdit && (
        <CreateRoleModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {canEdit && (
        <CreateRoleModal
          isOpen={!!editRole}
          roleToEdit={editRole}
          onClose={() => setEditRole(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {detailRole && (
        <RoleDetailModal
          isOpen={!!detailRole}
          roleId={detailRole.id}
          onClose={() => setDetailRole(null)}
          onEdit={(role) => {
            setDetailRole(null);
            setEditRole(role);
          }}
          onDelete={(role) => {
            setDetailRole(null);
            handleDeleteClick(role);
          }}
          onRoleUpdated={fetchRoles}
        />
      )}

      {/* DeleteRoleModal — only mount if user has edit permission */}
      {canEdit && deleteTarget && (
        <DeleteRoleModal
          isOpen={!!deleteTarget}
          impact={deleteTarget.impact}
          roleName={deleteTarget.role.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}
    </div>
  );
};

export default RolesTab;
