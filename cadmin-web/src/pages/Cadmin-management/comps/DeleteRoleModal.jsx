// cadmin-web/src/pages/Cadmin-management/comps/DeleteRoleModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/DeleteRoleModal.jsx

import { useState } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  Users,
  Loader2,
  Ban,
  CheckCircle,
} from "lucide-react";

/**
 * Shown when a role is about to be deleted.
 *
 * Two states:
 * 1. can_delete = true  → simple confirm dialog
 * 2. can_delete = false → shows list of active admins that need to be reassigned first
 */
const DeleteRoleModal = ({ isOpen, impact, roleName, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !impact) return null;

  const canDelete = impact.can_delete;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden
                   animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-start justify-between gap-3
          ${
            canDelete
              ? "bg-red-50 border-b border-red-100"
              : "bg-amber-50 border-b border-amber-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${canDelete ? "bg-red-100" : "bg-amber-100"}`}
            >
              {canDelete ? (
                <Trash2 size={20} className="text-red-600" />
              ) : (
                <AlertTriangle size={20} className="text-amber-600" />
              )}
            </div>
            <div>
              <h2
                className={`font-semibold ${canDelete ? "text-red-900" : "text-amber-900"}`}
              >
                {canDelete ? "Delete Role" : "Cannot Delete Yet"}
              </h2>
              <p
                className={`text-sm mt-0.5 ${canDelete ? "text-red-600" : "text-amber-700"}`}
              >
                {canDelete
                  ? `"${roleName}" will be permanently removed`
                  : `"${roleName}" still has active admins`}
              </p>
            </div>
          </div>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-black/5 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {canDelete ? (
            /* ── Simple confirm ──────────────────────────────── */
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the role{" "}
                <strong>"{roleName}"</strong>?
              </p>
              {impact.inactive_admins?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    <Users size={12} className="inline mr-1" />
                    Inactive admins with this role (will lose assignment):
                  </p>
                  <div className="space-y-1.5">
                    {impact.inactive_admins.map((a) => (
                      <div
                        key={a.cadmin_id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Ban size={13} className="text-gray-400" />
                        {a.name}{" "}
                        <span className="text-gray-400">@{a.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          ) : (
            /* ── Reassign required ───────────────────────────── */
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                The following{" "}
                <strong>
                  {impact.active_admins.length} active admin
                  {impact.active_admins.length !== 1 ? "s" : ""}
                </strong>{" "}
                are currently assigned to <strong>"{roleName}"</strong>.
                Reassign or deactivate them before deleting this role.
              </p>

              <div className="bg-amber-50 rounded-xl border border-amber-200 divide-y divide-amber-100 overflow-hidden">
                {impact.active_admins.map((admin) => (
                  <div
                    key={admin.cadmin_id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center
                                    text-amber-700 font-semibold text-sm flex-shrink-0"
                    >
                      {admin.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {admin.name}
                      </p>
                      <p className="text-xs text-gray-500">@{admin.username}</p>
                    </div>
                    <CheckCircle
                      size={14}
                      className="text-emerald-500 flex-shrink-0"
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Go to each admin's profile → Roles tab to reassign or remove
                this role assignment.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg
                       disabled:opacity-50 transition-colors"
          >
            {canDelete ? "Cancel" : "Close"}
          </button>
          {canDelete && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium
                         hover:bg-red-700 disabled:opacity-50 transition-colors
                         flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={15} /> Delete Role
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
