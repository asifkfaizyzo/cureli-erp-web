// cadmin-web/src/pages/marketplace/Pricing/comps/commission/Modals.jsx (do not remove this comment)

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Loader2, Pause, Plus } from "lucide-react";

import {
  toNum,
  COMMISSION_TYPES,
  Field,
  TypeCard,
} from "./FormInputs";
import { InfoTooltip } from "./InfoTooltip";
import StyledDateFilter from "../../../../../components/common/StyledDateFilter";
import StyledSelect from "../../../../../components/common/StyledSelect";

// ─────────────────────────────────────────────
// CONSTANTS & SELECT OPTIONS
// ─────────────────────────────────────────────

const COMMISSION_BASE_OPTIONS = [
  { value: "SUBTOTAL", label: "Medicine Subtotal Only" },
  { value: "SUBTOTAL_PLUS_SERVICE", label: "Subtotal + Service Charge" },
  { value: "GRAND_TOTAL", label: "Grand Total" },
];

const SETTLEMENT_FREQ_OPTIONS = [
  { value: "PER_ORDER", label: "Per Order" },
  { value: "WEEKLY", label: "Weekly Batch" },
];

const DEFAULT_RULE_FORM = {
  name: "",
  description: "",
  commission_type: "FLAT_PERCENT",
  flat_percent: 18,
  flat_amount: 15,
  hybrid_percent: 12,
  hybrid_flat_amount: 5,
  capped_percent: 15,
  capped_max_amount: 150,
  commission_base: "SUBTOTAL",
  settlement_frequency: "PER_ORDER",
};

// ─────────────────────────────────────────────
// CREATE / EDIT RULE MODAL
// ─────────────────────────────────────────────

export const RuleModal = ({ rule, onClose, onSave, saving }) => {
  const isEdit = !!rule;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: rule.name || "",
          description: rule.description || "",
          commission_type: rule.commission_type || "FLAT_PERCENT",
          flat_percent: rule.flat_percent ? Number(rule.flat_percent) : 18,
          flat_amount: rule.flat_amount ? Number(rule.flat_amount) : 15,
          hybrid_percent: rule.hybrid_percent
            ? Number(rule.hybrid_percent)
            : 12,
          hybrid_flat_amount: rule.hybrid_flat_amount
            ? Number(rule.hybrid_flat_amount)
            : 5,
          capped_percent: rule.capped_percent
            ? Number(rule.capped_percent)
            : 15,
          capped_max_amount: rule.capped_max_amount
            ? Number(rule.capped_max_amount)
            : 150,
          commission_base: rule.commission_base || "SUBTOTAL",
          settlement_frequency: rule.settlement_frequency || "PER_ORDER",
        }
      : { ...DEFAULT_RULE_FORM }
  );

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Compute preview
  const computePreview = (subtotal) => {
    let commission = 0;
    switch (form.commission_type) {
      case "FLAT_PERCENT":
        commission = (subtotal * toNum(form.flat_percent)) / 100;
        break;
      case "FLAT_AMOUNT":
        commission = toNum(form.flat_amount);
        break;
      case "HYBRID":
        commission =
          (subtotal * toNum(form.hybrid_percent)) / 100 +
          toNum(form.hybrid_flat_amount);
        break;
      case "CAPPED_PERCENT": {
        const raw = (subtotal * toNum(form.capped_percent)) / 100;
        commission = Math.min(raw, toNum(form.capped_max_amount));
        break;
      }
    }
    commission = parseFloat(commission.toFixed(2));
    return {
      subtotal,
      commission,
      receives: parseFloat((subtotal - commission).toFixed(2)),
    };
  };

  const previews = [200, 500, 1500].map(computePreview);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "Edit Commission Rule" : "Create New Commission Rule"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Configure how the platform collects fees on marketplace transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Rule Name
              </label>
              <InfoTooltip
                content="Choose a clear internal name to identify this profile. For example: Standard 18% or Strategic Account Plan."
                position="right"
              />
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Standard Plan"
              maxLength={120}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                         focus:border-[#05015A]"
            />
          </div>

          {/* Type Selection */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="block text-xs font-medium text-gray-600">
                Commission Type
              </label>
              <InfoTooltip
                content="Select the calculation formula for this rule. Choose between fixed percent, fixed flat rate, combined hybrid, or a capped percentage model."
                position="right"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMMISSION_TYPES.map((t) => (
                <TypeCard
                  key={t.value}
                  type={t}
                  selected={form.commission_type === t.value}
                  onClick={(val) => handleChange("commission_type", val)}
                />
              ))}
            </div>
          </div>

          {/* Rate Fields (dynamic) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Rate Configuration
            </label>

            {form.commission_type === "FLAT_PERCENT" && (
              <Field
                label="Commission Percentage"
                fieldKey="flat_percent"
                form={form}
                onChange={handleChange}
                suffix="%"
              />
            )}

            {form.commission_type === "FLAT_AMOUNT" && (
              <Field
                label="Fixed Amount Per Order"
                fieldKey="flat_amount"
                form={form}
                onChange={handleChange}
                prefix="₹"
              />
            )}

            {form.commission_type === "HYBRID" && (
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Percentage"
                  fieldKey="hybrid_percent"
                  form={form}
                  onChange={handleChange}
                  suffix="%"
                />
                <Field
                  label="Plus Fixed Amount"
                  fieldKey="hybrid_flat_amount"
                  form={form}
                  onChange={handleChange}
                  prefix="₹"
                />
              </div>
            )}

            {form.commission_type === "CAPPED_PERCENT" && (
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Commission Percentage"
                  fieldKey="capped_percent"
                  form={form}
                  onChange={handleChange}
                  suffix="%"
                />
                <Field
                  label="Maximum Cap Limit"
                  fieldKey="capped_max_amount"
                  form={form}
                  onChange={handleChange}
                  prefix="₹"
                />
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-xs font-medium text-gray-600">
                  Commission Applies To
                </label>
                <InfoTooltip
                  content="Define what portion of the checkout total is used as the base for the commission percentage calculation."
                  position="top"
                />
              </div>
              <StyledSelect
                value={form.commission_base}
                onChange={(val) => handleChange("commission_base", val)}
                options={COMMISSION_BASE_OPTIONS}
                placeholder="Select base..."
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-xs font-medium text-gray-600">
                  Settlement Frequency
                </label>
                <InfoTooltip
                  content="Choose when the calculated fees will be reconciled and deducted from the partner settlements."
                  position="top"
                />
              </div>
              <StyledSelect
                value={form.settlement_frequency}
                onChange={(val) => handleChange("settlement_frequency", val)}
                options={SETTLEMENT_FREQ_OPTIONS}
                placeholder="Select frequency..."
              />
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="block text-xs font-medium text-gray-600">
                Reconciliation Matrix Preview
              </label>
              <InfoTooltip
                content="Real-time mathematical preview of the resulting payout breakdowns across varying hypothetical checkout totals."
                position="top"
              />
            </div>
            <div className="space-y-2">
              {previews.map((p) => (
                <div
                  key={p.subtotal}
                  className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="text-xs text-gray-500">
                    Order value: ₹{p.subtotal}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-red-500 font-medium">
                      Platform Share: ₹{p.commission}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">
                      Merchant Receives: ₹{p.receives}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving…" : isEdit ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SUSPEND MODAL
// ─────────────────────────────────────────────

export const SuspendModal = ({ onClose, onSuspend, saving }) => {
  const [mode, setMode] = useState("indefinite");
  const [untilDate, setUntilDate] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-gray-900">
              Disable Commission
            </h2>
            <InfoTooltip
              content="Temporarily suspend all platform collections. Commission rate is overridden to 0% global-wide for all active vendors immediately."
              position="right"
              width="w-72"
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Set platform service charge to 0% across all vendors
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="suspend-mode"
                checked={mode === "indefinite"}
                onChange={() => setMode("indefinite")}
                className="accent-[#05015A] h-4 w-4"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Manual resume model
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Commission stays at 0% until manually re-enabled
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="suspend-mode"
                checked={mode === "timed"}
                onChange={() => setMode("timed")}
                className="accent-[#05015A] h-4 w-4"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  Automated calendar resume
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Commission schedules back to baseline after selected date
                </p>
                {mode === "timed" && (
                  <div className="mt-3">
                    <StyledDateFilter
                      label="Select auto-resume date"
                      date={untilDate}
                      setDate={setUntilDate}
                    />
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSuspend(mode === "timed" && untilDate ? untilDate : null)
            }
            disabled={saving || (mode === "timed" && !untilDate)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Pause size={14} />
            )}
            Disable Commission
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// OVERRIDE ASSIGN MODAL
// ─────────────────────────────────────────────

export const OverrideModal = ({ rules, onClose, onAssign, saving }) => {
  const [shopId, setShopId] = useState("");
  const [ruleId, setRuleId] = useState("");

  const ruleOptions = rules
    .filter((r) => r.is_active && !r.is_default)
    .map((r) => ({
      value: r.rule_id,
      label: `${r.name} — ${r.description_text}`,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-gray-900">
              Assign Custom Commission
            </h2>
            <InfoTooltip
              content="Assign a localized pricing rule to override the global standard baseline for a selected affiliate partner profile."
              position="right"
              width="w-72"
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Set unique commission exceptions for specific stores
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Shop Identifier (ID)
              </label>
              <InfoTooltip
                content="Unique internal database UUID matching the system record of the partner's outlet."
                position="top"
              />
            </div>
            <input
              type="text"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Target Rate Profile
              </label>
              <InfoTooltip
                content="Choose from any registered non-default custom commission models you configured earlier."
                position="top"
              />
            </div>
            <StyledSelect
              value={ruleId}
              onChange={setRuleId}
              options={ruleOptions}
              placeholder="Select custom rule profile…"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onAssign(shopId, ruleId)}
            disabled={saving || !shopId.trim() || !ruleId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Assign Override
          </button>
        </div>
      </motion.div>
    </div>
  );
};