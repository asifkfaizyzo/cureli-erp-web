// cadmin-web/src/pages/Cadmin-management/comps/SelectedPermissionsSummary.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/SelectedPermissionsSummary.jsx

import { X, AlertCircle, CheckCircle2, Tag } from "lucide-react";
import { CADMIN_PERMISSION_GROUPS } from "../../../config/cadminPermissions";

/**
 * Builds a flat lookup: permissionKey → { label, module }
 * so we can display human-readable chips without prop-drilling.
 */
const buildPermissionMap = () => {
  const map = {};
  CADMIN_PERMISSION_GROUPS.forEach((group) => {
    group.permissions.forEach((perm) => {
      map[perm.key] = { label: perm.label, module: group.module };
    });
  });
  return map;
};

const PERMISSION_MAP = buildPermissionMap();

/**
 * Groups selected keys by their module name for organised display.
 */
const groupSelected = (selectedPermissions) => {
  const grouped = {}; // { moduleName: [{ key, label }] }

  selectedPermissions.forEach((key) => {
    const meta = PERMISSION_MAP[key];
    if (!meta) return;
    if (!grouped[meta.module]) grouped[meta.module] = [];
    grouped[meta.module].push({ key, label: meta.label });
  });

  return grouped;
};

// One soft colour per module index (cycles if > 8 modules selected)
const MODULE_COLORS = [
  "bg-indigo-50 border-indigo-200 text-indigo-700",
  "bg-violet-50 border-violet-200 text-violet-700",
  "bg-sky-50   border-sky-200   text-sky-700",
  "bg-teal-50  border-teal-200  text-teal-700",
  "bg-emerald-50 border-emerald-200 text-emerald-700",
  "bg-amber-50 border-amber-200 text-amber-700",
  "bg-rose-50  border-rose-200  text-rose-700",
  "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700",
];

const SelectedPermissionsSummary = ({
  selectedPermissions = [],
  totalPermissions,
  onRemove,
  error,
}) => {
  const grouped = groupSelected(selectedPermissions);
  const moduleNames = Object.keys(grouped);
  const hasAny = selectedPermissions.length > 0;

  return (
    <div
      className={`bg-white rounded-xl border p-5 space-y-4 transition-colors
                     ${error ? "border-red-300" : "border-gray-200"}`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Tag size={11} />
          Selected Permissions
        </h3>

        {hasAny ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium
                           text-emerald-700 bg-emerald-50 border border-emerald-200
                           px-2 py-0.5 rounded-full"
          >
            <CheckCircle2 size={11} />
            {selectedPermissions.length} / {totalPermissions} selected
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            0 / {totalPermissions} selected
          </span>
        )}
      </div>

      {/* Validation error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}

      {/* Empty state */}
      {!hasAny && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center
                          justify-center mb-2"
          >
            <Tag size={18} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            No permissions selected
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Use the checklist below to grant permissions to this role.
          </p>
        </div>
      )}

      {/* Grouped chips */}
      {hasAny && (
        <div className="space-y-3">
          {moduleNames.map((moduleName, idx) => {
            const colorClass = MODULE_COLORS[idx % MODULE_COLORS.length];
            const perms = grouped[moduleName];

            return (
              <div key={moduleName}>
                {/* Module label */}
                <p
                  className="text-[10px] font-semibold text-gray-400
                               uppercase tracking-wider mb-1.5"
                >
                  {moduleName}
                </p>

                {/* Permission chips */}
                <div className="flex flex-wrap gap-1.5">
                  {perms.map(({ key, label }) => (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 px-2 py-0.5
                                  rounded-full border text-xs font-medium
                                  ${colorClass}`}
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => onRemove(key)}
                        className="ml-0.5 rounded-full hover:bg-black/10
                                   transition-colors p-0.5"
                        title={`Remove ${label}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectedPermissionsSummary;
