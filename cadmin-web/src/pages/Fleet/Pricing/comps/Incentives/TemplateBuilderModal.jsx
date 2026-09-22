// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/TemplateBuilderModal.jsx
import { useState, useEffect } from "react";
import { X, Plus, Trophy } from "lucide-react";
import StyledSelect from "../../../../../components/common/StyledSelect";
import TierStepperRow from "./TierStepperRow";
import GatingConditionsSection from "./GatingConditionsSection";

const PERIOD_OPTIONS = [
  { value: "DAILY", label: "Daily Quest" },
  { value: "WEEKLY", label: "Weekly Quest" },
  { value: "CUSTOM_PERIOD", label: "Custom Multi-Day Quest" },
];

const METRIC_OPTIONS = [
  { value: "ORDER_COUNT", label: "Number of Completed Orders" },
  { value: "BASE_EARNINGS", label: "Total Base Earnings (₹)" },
];

const EMPTY = {
  title: "", description: "",
  period_type: "DAILY", metric_type: "ORDER_COUNT",
  min_online_hours: null, max_denial_count: null,
  max_cancellation_count: null,
  min_acceptance_rate: null, min_completion_rate: null,
  tiers: [{ target_value: 5, reward_amount: 30 }],
};

export default function TemplateBuilderModal({ open, editing, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && editing) {
      setForm({
        title: editing.title,
        description: editing.description || "",
        period_type: editing.period_type,
        metric_type: editing.metric_type,
        min_online_hours: editing.gating_conditions?.min_online_hours ?? null,
        max_denial_count: editing.gating_conditions?.max_denial_count ?? null,
        max_cancellation_count: editing.gating_conditions?.max_cancellation_count ?? null,
        min_acceptance_rate: editing.gating_conditions?.min_acceptance_rate ?? null,
        min_completion_rate: editing.gating_conditions?.min_completion_rate ?? null,
        tiers: editing.tiers?.length ? editing.tiers.map(t => ({
          target_value: t.target_value,
          reward_amount: t.reward_amount,
        })) : EMPTY.tiers,
      });
    } else if (open) {
      setForm(EMPTY);
    }
    setError("");
  }, [open, editing]);

  if (!open) return null;

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateTier = (idx, key, value) => {
    const next = [...form.tiers];
    next[idx] = { ...next[idx], [key]: value };
    setField("tiers", next);
  };

  const addTier = () => {
    if (form.tiers.length >= 6) return;
    const last = form.tiers[form.tiers.length - 1];
    const step = form.metric_type === "ORDER_COUNT" ? 5 : 250;
    setField("tiers", [
      ...form.tiers,
      { target_value: (last?.target_value || 0) + step, reward_amount: (last?.reward_amount || 0) + 50 },
    ]);
  };

  const removeTier = (idx) => {
    if (form.tiers.length === 1) return;
    setField("tiers", form.tiers.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required");
    if (form.tiers.length === 0) return setError("At least one tier is required");

    // Validate ascending order
    for (let i = 1; i < form.tiers.length; i++) {
      if (Number(form.tiers[i].target_value) <= Number(form.tiers[i-1].target_value))
        return setError(`Tier ${i+1} target must be greater than Tier ${i}`);
      if (Number(form.tiers[i].reward_amount) <= Number(form.tiers[i-1].reward_amount))
        return setError(`Tier ${i+1} reward must be greater than Tier ${i}`);
    }

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#05015A]/8 flex items-center justify-center">
              <Trophy size={15} className="text-[#05015A]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {editing ? "Edit Incentive Template" : "Create Incentive Template"}
              </h3>
              <p className="text-[10px] text-gray-500">Reusable blueprint for daily / weekly / holiday quests</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Title *</label>
              <input
                type="text" value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Standard Weekday Quest"
                maxLength={150}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Description</label>
              <textarea
                rows={2} value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                maxLength={500}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none
                           focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StyledSelect label="Period Type" value={form.period_type}
                onChange={(v) => setField("period_type", v)} options={PERIOD_OPTIONS} />
              <StyledSelect label="Metric Type" value={form.metric_type}
                onChange={(v) => setField("metric_type", v)} options={METRIC_OPTIONS} />
            </div>
          </div>

          {/* Tiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-600">
                Reward Tiers (Steppers) <span className="text-gray-400 font-normal">{form.tiers.length}/6</span>
              </p>
              <button type="button" onClick={addTier}
                disabled={form.tiers.length >= 6}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                           text-[#05015A] bg-[#05015A]/8 hover:bg-[#05015A]/12 rounded-lg
                           disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus size={12} /> Add Tier
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
              Targets and rewards must increase with each tier. The highest achieved tier is credited to the rider.
            </p>
            <div className="space-y-2">
              {form.tiers.map((tier, i) => (
                <TierStepperRow key={i} tier={tier} index={i} metricType={form.metric_type}
                  onChange={updateTier} onRemove={removeTier} />
              ))}
            </div>
          </div>

          {/* Gating */}
          <GatingConditionsSection
            conditions={form}
            onChange={setField}
          />

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200
                       hover:bg-gray-50 rounded-lg disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.title.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#05015A] hover:bg-[#05015A]/90
                       rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Saving..." : editing ? "Update Template" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}