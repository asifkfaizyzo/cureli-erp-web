// cadmin-web/src/pages/marketplace/Pricing/comps/delivery/SlashConfigSection.jsx
import React, { useCallback } from "react";
import { Sparkles, Trash2, Plus, ArrowRight } from "lucide-react";
import { Section, Toggle, InfoBanner } from "./FormInputs";

const MODES = [
  { value: "NONE", label: "No Slash", desc: "Show normal charges" },
  { value: "NEW", label: "Pure Marketing (New)", desc: "Show cosmetic markups without reducing earnings" },
  { value: "OLD", label: "Promotional Cut (Old)", desc: "Show anchor strikethroughs and actually charge less" },
];

export default function SlashConfigSection({ form, onChange }) {
  const { is_enabled, service_mode, service_pct, delivery_mode, delivery_tiers } = form;

  // ── Service handlers ─────────────────────────────────────
  const handleServiceModeChange = (mode) => {
    onChange("service_mode", mode);
    if (mode === "NONE") {
      onChange("service_pct", 0);
    } else if (mode === "NEW" && service_pct <= 0) {
      onChange("service_pct", 50); // Default positive placeholder
    } else if (mode === "OLD" && service_pct >= 0) {
      onChange("service_pct", -30); // Default negative placeholder
    }
  };

  const handleServicePctChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    onChange("service_pct", val);
  };

  // ── Delivery handlers ────────────────────────────────────
  const handleDeliveryModeChange = (mode) => {
    onChange("delivery_mode", mode);
    if (mode === "NONE") {
      onChange("delivery_tiers", []);
    } else if (delivery_tiers.length === 0) {
      // Create initial default tier if empty
      onChange("delivery_tiers", [
        {
          priority: 1,
          min_subtotal: null,
          max_distance_km: null,
          pct: mode === "NEW" ? 50 : -50,
        },
      ]);
    } else {
      // Force change polarity of existing tiers to fit new mode
      const updated = delivery_tiers.map((t) => ({
        ...t,
        pct: mode === "NEW" ? Math.abs(t.pct) : -Math.abs(t.pct),
      }));
      onChange("delivery_tiers", updated);
    }
  };

  const handleAddTier = () => {
    const nextPriority = delivery_tiers.reduce((max, t) => Math.max(max, t.priority), 0) + 1;
    const newTier = {
      priority: nextPriority,
      min_subtotal: null,
      max_distance_km: null,
      pct: delivery_mode === "NEW" ? 50 : -50,
    };
    onChange("delivery_tiers", [...delivery_tiers, newTier]);
  };

  const handleRemoveTier = (index) => {
    const updated = delivery_tiers.filter((_, i) => i !== index);
    onChange("delivery_tiers", updated);
  };

  const handleTierFieldChange = (index, field, value) => {
    const updated = [...delivery_tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange("delivery_tiers", updated);
  };

  return (
    <div className="space-y-4">
      {/* Master Toggle */}
      <Toggle
        label="Enable Platform Price Slashes"
        hint="Display strikethrough marketing anchor values across checkout and order screens"
        fieldKey="is_enabled"
        form={form}
        onChange={onChange}
      />

      {is_enabled && (
        <>
          {/* Service Charge Slash config */}
          <Section
            title="Service Charge Slash"
            icon={Sparkles}
            description="Display psychological strike-throughs on platform service charges"
          >
            <div className="space-y-4">
              {/* Service Mode Radio Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleServiceModeChange(m.value)}
                    className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all
                              ${
                                service_mode === m.value
                                  ? "border-[#05015A] bg-[#05015A]/5"
                                  : "border-gray-100 bg-white hover:border-gray-200"
                              }`}
                  >
                    <span className="text-xs font-semibold text-gray-800">{m.label}</span>
                    <span className="text-[10px] text-gray-400 mt-1 leading-relaxed">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Service Percentage Input */}
              {service_mode !== "NONE" && (
                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {service_mode === "NEW" ? "Markup Percentage" : "Discount Percentage"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">
                      {service_mode === "NEW" ? "+" : "-"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={service_mode === "NEW" ? 200 : 100}
                      value={Math.abs(service_pct)}
                      onChange={handleServicePctChange}
                      className="w-full pl-7 pr-8 py-2 text-sm border border-gray-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                    {service_mode === "NEW"
                      ? "A computed ₹20 service charge will show as strike-through ~~₹30~~ ₹20 (+50%)"
                      : "A computed ₹20 service charge will reduce by 30% and show as ~~₹20~~ ₹14 (-30%)"}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Delivery Fee Slash Config */}
          <Section
            title="Combined Delivery Charge Slash"
            icon={Sparkles}
            description="Configure targeted tiered slashes combining delivery fees and distance surcharges"
          >
            <div className="space-y-4">
              {/* Delivery Mode Radio Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleDeliveryModeChange(m.value)}
                    className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all
                              ${
                                delivery_mode === m.value
                                  ? "border-[#05015A] bg-[#05015A]/5"
                                  : "border-gray-100 bg-white hover:border-gray-200"
                              }`}
                  >
                    <span className="text-xs font-semibold text-gray-800">{m.label}</span>
                    <span className="text-[10px] text-gray-400 mt-1 leading-relaxed">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Delivery Tiers Editor */}
              {delivery_mode !== "NONE" && (
                <div className="space-y-3">
                  <InfoBanner>
                    Tiers evaluate deterministically from priority 1 downwards. The first tier where all non-null conditions (Min Subtotal, Max Distance) are satisfied applies to the order. An all-null tier acts as the default fallback.
                  </InfoBanner>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-100 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="p-3 w-16 text-center">Priority</th>
                          <th className="p-3">Min Subtotal</th>
                          <th className="p-3">Max Distance</th>
                          <th className="p-3 w-28">Rate (%)</th>
                          <th className="p-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {delivery_tiers.map((t, index) => (
                          <tr key={index} className="text-xs hover:bg-gray-50/50">
                            {/* Priority */}
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min={1}
                                value={t.priority}
                                onChange={(e) => handleTierFieldChange(index, "priority", parseInt(e.target.value) || 1)}
                                className="w-12 text-center py-1 border border-gray-200 rounded font-semibold text-gray-700 focus:outline-none"
                              />
                            </td>

                            {/* Min Subtotal condition */}
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={t.min_subtotal ?? ""}
                                  placeholder="Any subtotal"
                                  onChange={(e) => handleTierFieldChange(index, "min_subtotal", e.target.value === "" ? null : parseFloat(e.target.value))}
                                  className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded text-gray-700 focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* Max Distance condition */}
                            <td className="p-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  value={t.max_distance_km ?? ""}
                                  placeholder="Any distance"
                                  onChange={(e) => handleTierFieldChange(index, "max_distance_km", e.target.value === "" ? null : parseFloat(e.target.value))}
                                  className="w-full pl-2 pr-7 py-1.5 border border-gray-200 rounded text-gray-700 focus:outline-none"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">km</span>
                              </div>
                            </td>

                            {/* Tier rate (%) */}
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                  {delivery_mode === "NEW" ? "+" : "-"}
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={delivery_mode === "NEW" ? 200 : 100}
                                  value={Math.abs(t.pct)}
                                  onChange={(e) => handleTierFieldChange(index, "pct", delivery_mode === "NEW" ? Math.abs(parseFloat(e.target.value) || 0) : -Math.abs(parseFloat(e.target.value) || 0))}
                                  className="w-full pl-5 pr-5 py-1.5 border border-gray-200 rounded font-semibold text-gray-700 focus:outline-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                               text-[#05015A] hover:bg-[#05015A]/5 rounded-lg border border-dashed border-gray-300 transition-colors"
                  >
                    <Plus size={14} /> Add Tier
                  </button>
                </div>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}