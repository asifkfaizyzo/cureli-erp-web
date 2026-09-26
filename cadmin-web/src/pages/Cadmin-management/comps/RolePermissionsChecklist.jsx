// cadmin-web/src/pages/Cadmin-management/comps/RolePermissionsChecklist.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/RolePermissionsChecklist.jsx

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { CADMIN_PERMISSION_GROUPS } from "../../../config/cadminPermissions";

const RolePermissionsChecklist = ({ selectedPermissions = [], onChange }) => {
  const [expanded, setExpanded] = useState(
    CADMIN_PERMISSION_GROUPS.reduce(
      (acc, g) => ({ ...acc, [g.key]: true }),
      {},
    ),
  );

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const handlePerm = (key) => {
    onChange(
      selectedPermissions.includes(key)
        ? selectedPermissions.filter((p) => p !== key)
        : [...selectedPermissions, key],
    );
  };

  const handleGroup = (group, selectAll) => {
    const keys = group.permissions.map((p) => p.key);
    onChange(
      selectAll
        ? [...new Set([...selectedPermissions, ...keys])]
        : selectedPermissions.filter((p) => !keys.includes(p)),
    );
  };

  // ── Sort: groups with any selected permission float to top ──────────────
  const sortedGroups = [...CADMIN_PERMISSION_GROUPS].sort((a, b) => {
    const aHasSelected = a.permissions.some((p) =>
      selectedPermissions.includes(p.key),
    );
    const bHasSelected = b.permissions.some((p) =>
      selectedPermissions.includes(p.key),
    );

    if (aHasSelected && !bHasSelected) return -1;
    if (!aHasSelected && bHasSelected) return 1;
    return 0; // preserve original order within each tier
  });

  return (
    <div className="space-y-3">
      {sortedGroups.map((group) => {
        const keys = group.permissions.map((p) => p.key);
        const selected = keys.filter((k) => selectedPermissions.includes(k));
        const isAll = selected.length === keys.length;
        const isPartial = selected.length > 0 && !isAll;
        const isOpen = expanded[group.key];
        const hasAny = selected.length > 0;

        return (
          <div
            key={group.key}
            className={`border rounded-xl overflow-hidden transition-colors
                        ${hasAny ? "border-indigo-200" : "border-gray-200"}`}
          >
            {/* Group header */}
            <div
              className={`flex items-center justify-between px-4 py-3
                             border-b transition-colors
                             ${
                               hasAny
                                 ? "bg-indigo-50/60 border-indigo-200"
                                 : "bg-gray-50 border-gray-200"
                             }`}
            >
              <button
                type="button"
                onClick={() => toggle(group.key)}
                className="flex items-center gap-2 text-left flex-1 min-w-0"
              >
                {isOpen ? (
                  <ChevronDown
                    size={16}
                    className="text-gray-400 flex-shrink-0"
                  />
                ) : (
                  <ChevronRight
                    size={16}
                    className="text-gray-400 flex-shrink-0"
                  />
                )}
                <span
                  className={`font-semibold text-sm
                                  ${hasAny ? "text-indigo-800" : "text-gray-700"}`}
                >
                  {group.module}
                </span>
                <span
                  className={`text-xs font-normal ml-1 flex-shrink-0
                                  ${hasAny ? "text-indigo-500" : "text-gray-400"}`}
                >
                  {selected.length}/{keys.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGroup(group, !isAll)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600
                           hover:text-indigo-800 transition-colors flex-shrink-0 ml-2"
              >
                {isAll ? (
                  <CheckSquare size={15} />
                ) : isPartial ? (
                  <MinusSquare size={15} className="text-indigo-400" />
                ) : (
                  <Square size={15} />
                )}
                {isAll ? "Deselect all" : "Select all"}
              </button>
            </div>

            {/* Permissions grid */}
            {isOpen && (
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white">
                {group.permissions.map((perm) => {
                  const checked = selectedPermissions.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                                  transition-all select-none
                                  ${
                                    checked
                                      ? "border-indigo-200 bg-indigo-50/40"
                                      : "border-transparent hover:bg-gray-50"
                                  }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                        checked={checked}
                        onChange={() => handlePerm(perm.key)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {perm.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {perm.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RolePermissionsChecklist;
