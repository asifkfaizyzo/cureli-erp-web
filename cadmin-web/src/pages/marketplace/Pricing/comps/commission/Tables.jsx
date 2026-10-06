// cadmin-web/src/pages/marketplace/Pricing/comps/commission/Tables.jsx (do not remove this comment)

import {
  Percent,
  Star,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatType(type) {
  if (!type) return "";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ─────────────────────────────────────────────
// RULES TABLE
// ─────────────────────────────────────────────

export const RulesTable = ({
  rules,
  saving,
  onSetDefault,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  if (rules.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <Percent size={36} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-700">No commission rules configured</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Create your first pricing rule profile to begin charging marketplace commission fees.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
            <th className="pb-3 pr-4 font-medium">Rule Name</th>
            <th className="pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 pr-4 font-medium">Fee Rate</th>
            <th className="pb-3 pr-4 font-medium">
              <span className="flex items-center gap-1">
                Allocation
                <InfoTooltip
                  content="The number of partner stores governed by this specific rate profile."
                  position="top"
                />
              </span>
            </th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rules.map((rule) => (
            <tr
              key={rule.rule_id}
              className={`hover:bg-gray-50/50 transition-colors ${
                rule.is_default ? "bg-[#05015A]/[0.02]" : ""
              }`}
            >
              {/* Rule Name */}
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{rule.name}</span>
                  {rule.is_default && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#05015A] text-white tracking-wider">
                      <Star size={8} className="fill-white" />
                      DEFAULT
                    </span>
                  )}
                </div>
              </td>

              {/* Type */}
              <td className="py-3.5 pr-4 text-gray-500 text-xs">
                {formatType(rule.commission_type)}
              </td>

              {/* Rate */}
              <td className="py-3.5 pr-4 font-semibold text-[#05015A] text-xs">
                {rule.description_text}
              </td>

              {/* Allocation */}
              <td className="py-3.5 pr-4 text-gray-600 text-xs">
                {rule.is_default ? (
                  <span className="text-gray-500 font-medium">
                    Global baseline ({rule.override_count} overrides active)
                  </span>
                ) : (
                  <span>
                    {rule.override_count} {rule.override_count === 1 ? "store" : "stores"}
                  </span>
                )}
              </td>

              {/* Status Badge */}
              <td className="py-3.5 pr-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    rule.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : "bg-gray-50 text-gray-500 border-gray-200/80"
                  }`}
                >
                  {rule.is_active ? "Active" : "Inactive"}
                </span>
              </td>

              {/* Actions */}
              <td className="py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {!rule.is_default && rule.is_active && (
                    <button
                      onClick={() => onSetDefault(rule.rule_id)}
                      disabled={saving}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Promote to system default policy"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(rule)}
                    disabled={saving}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                    title="Edit ruleset settings"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onToggleActive(rule.rule_id)}
                    disabled={saving}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                    title={rule.is_active ? "Deactivate policy" : "Activate policy"}
                  >
                    {rule.is_active ? (
                      <ToggleRight size={16} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                  </button>
                  {!rule.is_default && (
                    <button
                      onClick={() => onDelete(rule)}
                      disabled={saving}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete rate profile"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────
// OVERRIDES TABLE
// ─────────────────────────────────────────────

export const OverridesTable = ({ overrides, saving, onRemove }) => {
  if (overrides.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <Users size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm font-medium text-gray-700">No active custom overrides</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          All system pharmacies are currently governed by the global default commission policy.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
            <th className="pb-3 pr-4 font-medium">Merchant Pharmacy</th>
            <th className="pb-3 pr-4 font-medium">Location</th>
            <th className="pb-3 pr-4 font-medium">Assigned Exception Profile</th>
            <th className="pb-3 pr-4 font-medium">Calculation Rule</th>
            <th className="pb-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {overrides.map((o) => (
            <tr key={o.override_id} className="hover:bg-gray-50/50 transition-colors">
              {/* Pharmacy */}
              <td className="py-3 pr-4 font-semibold text-gray-900">
                {o.shop?.business_name || o.shop_id}
              </td>

              {/* City */}
              <td className="py-3 pr-4 text-gray-500 text-xs">
                {o.shop?.city || "Unknown Location"}
              </td>

              {/* Custom Rule */}
              <td className="py-3 pr-4 text-xs text-[#05015A] font-semibold">
                {o.rule?.name}
              </td>

              {/* Rate Description */}
              <td className="py-3 pr-4 text-xs text-gray-600 font-medium">
                {o.rule_description}
              </td>

              {/* Action */}
              <td className="py-3 text-right">
                <button
                  onClick={() => onRemove(o.override_id)}
                  disabled={saving}
                  className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/40 rounded-lg transition-colors"
                >
                  Restore Default
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};