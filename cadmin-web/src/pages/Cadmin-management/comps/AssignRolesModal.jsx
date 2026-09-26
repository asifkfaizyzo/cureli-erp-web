// cadmin-web/src/pages/Cadmin-management/comps/AssignRolesModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/AssignRolesModal.jsx

import { useState, useEffect } from "react";
import { X, Shield, Save, Loader2, AlertCircle, Star } from "lucide-react";
import { getRoles } from "../../../api/cadminAdmins";
import { getRoleBadgeStyle } from "../../../config/tableConfig";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions";

const AssignRolesModal = ({
  isOpen,
  adminId,
  currentRoles = [],
  onClose,
  onSave,
}) => {
  // ── Permission check — render nothing if no edit permission ───────────────
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();
  const canEdit =
    isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.ADMINS_EDIT);

  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [primaryId, setPrimaryId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingRoles(true);
    setError(null);
    setSelectedIds(currentRoles.map((r) => r.role_id));
    const current_primary = currentRoles.find((r) => r.is_primary);
    setPrimaryId(current_primary?.role_id ?? null);

    getRoles()
      .then((res) => {
        console.log("🔍 role object shape:", res.data.data.roles[0]); // ADD THIS
        setAvailableRoles(res.data.data.roles ?? []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load roles"),
      )
      .finally(() => setLoadingRoles(false));
  }, [isOpen, currentRoles]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, saving, onClose]);

  // Guard — the button that opens this is already hidden, but belt-and-suspenders
  if (!canEdit) return null;
  if (!isOpen) return null;

  const toggleRole = (roleId) => {
    setError(null);
    setSelectedIds((prev) => {
      if (prev.includes(roleId)) {
        if (primaryId === roleId) setPrimaryId(null);
        return prev.filter((id) => id !== roleId);
      }
      const next = [...prev, roleId];
      if (!primaryId) setPrimaryId(roleId);
      return next;
    });
  };

  const handleSave = async () => {
    if (
      selectedIds.length > 0 &&
      (!primaryId || !selectedIds.includes(primaryId))
    ) {
      setError("Select which role is the primary display role.");
      return;
    }

    const payload = {
      roles: selectedIds.map((id) => ({ role_id: id })),
      primaryId: selectedIds.length === 0 ? null : primaryId,
    };

    setSaving(true);
    setError(null);
    try {
      await onSave(
        selectedIds.map((id) => ({ role_id: id })),
        selectedIds.length === 0 ? null : primaryId,
      );
      onClose();
    } catch (err) {
      console.error("🔴 [AssignRolesModal] onSave threw:", err);
      console.error(
        "🔴 [AssignRolesModal] err.response?.data:",
        err.response?.data,
      );
      setError(err.response?.data?.message || "Failed to save roles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col
                   overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-5 py-4 flex-shrink-0">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <div>
                <h2 className="font-semibold">Manage Role Assignments</h2>
                <p className="text-white/60 text-xs mt-0.5">
                  Select roles and mark one as primary
                </p>
              </div>
            </div>
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl
                            flex items-center gap-2 text-sm"
            >
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
            <strong>Tip:</strong> Check a role to assign it. Click the{" "}
            <Star size={11} className="inline" /> star to set it as the primary
            display role shown in the admin table and navbar.
          </div>

          {loadingRoles ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : availableRoles.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No roles available. Create roles in the Roles tab first.
            </div>
          ) : (
            <div className="space-y-2">
              {availableRoles.map((role) => {
                const isSelected = selectedIds.includes(role.id);
                const isPrimary = primaryId === role.id;
                return (
                  <div
                    key={role.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${
                        isSelected
                          ? "border-indigo-200 bg-white shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-indigo-600 cursor-pointer flex-shrink-0"
                      checked={isSelected}
                      onChange={() => toggleRole(role.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={getRoleBadgeStyle(role.name)}>
                          {role.name}
                        </span>
                        {isPrimary && (
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 bg-yellow-50
                                           text-yellow-700 rounded-full border border-yellow-200
                                           flex items-center gap-1"
                          >
                            <Star size={10} fill="currentColor" /> Primary
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {role.description}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {role.permissions.length} permissions
                      </p>
                    </div>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => setPrimaryId(role.id)}
                        title="Set as primary role"
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0
                          ${
                            isPrimary
                              ? "text-yellow-500 bg-yellow-50"
                              : "text-gray-300 hover:text-yellow-500 hover:bg-yellow-50"
                          }`}
                      >
                        <Star
                          size={16}
                          fill={isPrimary ? "currentColor" : "none"}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100
                        flex items-center justify-between"
        >
          <p className="text-xs text-gray-400">
            {selectedIds.length} role{selectedIds.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg
                         disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingRoles}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium
                         hover:bg-indigo-700 disabled:opacity-50 transition-colors
                         flex items-center gap-2 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignRolesModal;
