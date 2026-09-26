// cadmin-web/src/pages/Cadmin-management/comps/CreateRoleModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/CreateRoleModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { createRole, updateRole } from "../../../api/cadminAdmins";
import { CADMIN_PERMISSION_GROUPS } from "../../../config/cadminPermissions";
import RolePermissionsChecklist from "./RolePermissionsChecklist";
import SelectedPermissionsSummary from "./SelectedPermissionsSummary";

const EMPTY_FORM = {
  name: "",
  description: "",
  permissions: [],
};

const CreateRoleModal = ({ isOpen, onClose, onSuccess, roleToEdit = null }) => {
  const isEditing = !!roleToEdit;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  const totalPermissions = CADMIN_PERMISSION_GROUPS.reduce(
    (acc, g) => acc + g.permissions.length,
    0,
  );

  useEffect(() => {
    if (isOpen && roleToEdit) {
      setForm({
        name: roleToEdit.name ?? "",
        description: roleToEdit.description ?? "",
        permissions: roleToEdit.permissions ?? [],
      });
    } else if (isOpen) {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setApiError(null);
  }, [isOpen, roleToEdit]);

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

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Role name is required";
    else if (form.name.trim().length < 2) e.name = "At least 2 characters";
    if (form.permissions.length === 0)
      e.permissions = "Select at least one permission";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      permissions: form.permissions,
    };

    try {
      let res;
      if (isEditing) {
        res = await updateRole(roleToEdit.id, payload);
      } else {
        res = await createRole(payload);
      }
      onSuccess(res.data.data.role);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
    if (apiError) setApiError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl
                   flex flex-col overflow-hidden animate-in zoom-in-95 duration-200
                   h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Shield size={20} />
              <div>
                <h2 className="font-semibold text-lg">
                  {isEditing ? `Edit Role — ${roleToEdit.name}` : "Create Role"}
                </h2>
                <p className="text-white/60 text-xs mt-0.5">
                  {isEditing
                    ? "Changes take effect immediately for all assigned admins"
                    : "Define a name and select the permissions this role grants"}
                </p>
              </div>
            </div>
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25
                         disabled:opacity-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-5">
          {/* API error */}
          {apiError && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3
                            rounded-xl flex items-center gap-2 text-sm"
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              {apiError}
            </div>
          )}

          {/* ── 1. Role Details ───────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Role Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Operations, Finance, Support"
                  maxLength={50}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white
                              focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                              focus:border-indigo-500 transition-all placeholder:text-gray-400
                              ${
                                errors.name
                                  ? "border-red-300 bg-red-50/50"
                                  : "border-gray-200"
                              }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Description{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Brief description of what this role does"
                  maxLength={200}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                             focus:border-indigo-500 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* ── 2. Selected Permissions Summary (comes FIRST) ─────────────── */}
          <SelectedPermissionsSummary
            selectedPermissions={form.permissions}
            totalPermissions={totalPermissions}
            onRemove={(key) =>
              setField(
                "permissions",
                form.permissions.filter((p) => p !== key),
              )
            }
            error={errors.permissions}
          />

          {/* ── 3. Permission Checklist ───────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                All Permissions
              </h3>
              <span
                className={`text-sm font-medium ${
                  errors.permissions ? "text-red-600" : "text-gray-500"
                }`}
              >
                {form.permissions.length} / {totalPermissions} selected
              </span>
            </div>

            <RolePermissionsChecklist
              selectedPermissions={form.permissions}
              onChange={(perms) => setField("permissions", perms)}
            />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100
                        flex items-center justify-between"
        >
          <p className="text-xs text-gray-400">
            {isEditing
              ? "Permission changes take effect on the admin's next request."
              : "You can assign this role to admins after creating it."}
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
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-[#05015A] text-white rounded-xl text-sm font-medium
                         hover:bg-[#1a10a0] disabled:opacity-50 transition-colors
                         flex items-center gap-2 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={15} />{" "}
                  {isEditing ? "Save Changes" : "Create Role"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;
