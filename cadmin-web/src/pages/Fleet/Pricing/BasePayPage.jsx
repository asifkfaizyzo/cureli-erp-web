// cadmin-web/src/pages/Fleet/Pricing/BasePayPage.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/BasePayPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeIndianRupee, ArrowLeft, RefreshCw, Save, Loader2,
  Package, Truck, Shield, Zap, Plus, Info, AlertCircle, CheckCircle2,
} from "lucide-react";

import { useToast } from "../../../components/common/Toast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

import {
  getPricingConfig, createPricingConfig,
  getSurgeRules, createSurgeRule, toggleSurgeRule, deleteSurgeRule,
} from "../../../api/cadminFleetPricing";

import TeamRiderNotice from "./comps/TeamRiderNotice";
import SlabTable from "./comps/BasePay/SlabTable";
import LiveFarePreview from "./comps/BasePay/LiveFarePreview";
import EffectiveDateModal from "./comps/BasePay/EffectiveDateModal";
import SurgeRuleCard from "./comps/BasePay/SurgeRuleCard";
import SurgeRuleModal from "./comps/BasePay/SurgeRuleModal";

const Section = ({ title, icon: Icon, description, children, action }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#05015A]/8 flex items-center justify-center">
          <Icon size={16} className="text-[#05015A]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const InfoBanner = ({ children, variant = "blue" }) => {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 border rounded-xl ${styles[variant]}`}>
      <Info size={14} className="mt-0.5 flex-shrink-0" />
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
};

const SkeletonSection = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
      <div className="h-4 w-40 bg-gray-200 rounded" />
    </div>
    <div className="p-5 space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-9 bg-gray-100 rounded-lg" />)}
    </div>
  </div>
);

const DEFAULT_FORM = {
  min_floor_payout: 25,
  pickup_base_fee: 10,
  drop_base_fee: 15,
  pickup_slabs: [
    { from_km: 0, to_km: 2, rate_type: "FLAT_FIXED", rate: 5 },
    { from_km: 2, to_km: 5, rate_type: "PER_KM", rate: 4 },
    { from_km: 5, to_km: null, rate_type: "PER_KM", rate: 6 },
  ],
  drop_slabs: [
    { from_km: 0, to_km: 2, rate_type: "FLAT_FIXED", rate: 10 },
    { from_km: 2, to_km: 6, rate_type: "PER_KM", rate: 8 },
    { from_km: 6, to_km: null, rate_type: "PER_KM", rate: 12 },
  ],
};

export default function BasePayPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEffectiveModal, setShowEffectiveModal] = useState(false);

  const [activeConfig, setActiveConfig] = useState(null);
  const [scheduledConfigs, setScheduledConfigs] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [original, setOriginal] = useState(null);

  const [surgeRules, setSurgeRules] = useState([]);
  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [surgeBusy, setSurgeBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load both configs and surge rules
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [cfg, surge] = await Promise.all([getPricingConfig(), getSurgeRules()]);
      const active = cfg.data.data.active_config;
      const scheduled = cfg.data.data.scheduled_configs || [];

      setActiveConfig(active);
      setScheduledConfigs(scheduled);

      if (active) {
        const shaped = {
          min_floor_payout: active.min_floor_payout,
          pickup_base_fee: active.pickup_base_fee,
          drop_base_fee: active.drop_base_fee,
          pickup_slabs: active.pickup_slabs,
          drop_slabs: active.drop_slabs,
        };
        setForm(shaped);
        setOriginal(shaped);
      }

      setSurgeRules(surge.data.data || []);
    } catch (err) {
      toast.error("Load Failed", err.response?.data?.message || "Could not load pricing data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const handleSave = () => setShowEffectiveModal(true);

  const handleConfirmSave = async ({ is_immediate, effective_from, name }) => {
    try {
      setSaving(true);
      const payload = { ...form, is_immediate, effective_from, name };
      await createPricingConfig(payload);
      setShowEffectiveModal(false);
      toast.success("Saved", is_immediate ? "New pricing is now live" : "Pricing scheduled successfully");
      await fetchAll();
    } catch (err) {
      toast.error("Save Failed", err.response?.data?.message || "Could not save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (original) setForm(original);
  };

  // Surge handlers
  const handleCreateSurge = async (payload) => {
    try {
      setSurgeBusy(true);
      await createSurgeRule(payload);
      toast.success("Created", "Surge rule created");
      setShowSurgeModal(false);
      await fetchAll();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not create surge rule");
    } finally {
      setSurgeBusy(false);
    }
  };

  const handleToggleSurge = async (rule) => {
    try {
      setSurgeBusy(true);
      await toggleSurgeRule(rule.rule_id, { is_active: !rule.is_active });
      toast.success("Updated", `Surge ${!rule.is_active ? "activated" : "deactivated"}`);
      await fetchAll();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not update surge");
    } finally {
      setSurgeBusy(false);
    }
  };

  const handleDeleteSurge = async () => {
    if (!confirmDelete) return;
    try {
      setSurgeBusy(true);
      await deleteSurgeRule(confirmDelete.rule_id);
      toast.success("Deleted", "Surge rule removed");
      setConfirmDelete(null);
      await fetchAll();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not delete surge");
    } finally {
      setSurgeBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/fleet/pricing")}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center">
              <BadgeIndianRupee size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Base Pay & Surge Rules</h1>
              <p className="text-xs text-gray-500">Two-leg fare model with floor payout guarantee and manual surge presets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={fetchAll} disabled={saving}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50">
              <RefreshCw size={16} />
            </motion.button>

            <AnimatePresence>
              {isDirty && (
                <motion.button initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                  onClick={handleDiscard} disabled={saving}
                  className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  Discard
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave} disabled={saving || !isDirty}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg
                ${isDirty ? "bg-[#05015A] hover:bg-[#05015A]/90" : "bg-gray-300 cursor-not-allowed"}`}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save New Version
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-5">
          <TeamRiderNotice />

          {/* Active version banner */}
          {activeConfig && !loading && (
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Active: {activeConfig.name} (v{activeConfig.version})
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    Effective since {new Date(activeConfig.effective_from).toLocaleString()}
                  </p>
                </div>
              </div>
              {scheduledConfigs.length > 0 && (
                <p className="text-[10px] text-emerald-700">
                  {scheduledConfigs.length} scheduled version{scheduledConfigs.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 space-y-5">
                <SkeletonSection />
                <SkeletonSection />
                <SkeletonSection />
              </div>
              <div><SkeletonSection /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* LEFT: config sections */}
              <div className="xl:col-span-2 space-y-5">
                {/* Floor payout */}
                <Section title="Minimum Floor Payout" icon={Shield}
                  description="Every delivery must pay at least this amount to the rider">
                  <InfoBanner>
                    If the calculated fare (base + slabs + surge) is below this minimum, Cureli automatically tops up the difference to guarantee rider earnings.
                  </InfoBanner>
                  <div className="max-w-xs">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Floor Amount (₹)</label>
                    <input
                      type="number" min={0} step={1}
                      value={form.min_floor_payout}
                      onChange={(e) => handleChange("min_floor_payout", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                    />
                  </div>
                </Section>

                {/* Leg 1 */}
                <Section title="Leg 1: Pickup Fare (Rider → Pharmacy)" icon={Package}
                  description="Fare for the rider reaching and collecting the order from the pharmacy">
                  <div className="max-w-xs">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Base Pickup Fee (₹)</label>
                    <input
                      type="number" min={0} step={1}
                      value={form.pickup_base_fee}
                      onChange={(e) => handleChange("pickup_base_fee", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                    />
                  </div>
                  <SlabTable
                    slabs={form.pickup_slabs}
                    onChange={(next) => handleChange("pickup_slabs", next)}
                    legLabel="Rider → Pharmacy"
                  />
                </Section>

                {/* Leg 2 */}
                <Section title="Leg 2: Drop Fare (Pharmacy → Customer)" icon={Truck}
                  description="Fare for the last-mile delivery to the customer">
                  <div className="max-w-xs">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Base Drop Fee (₹)</label>
                    <input
                      type="number" min={0} step={1}
                      value={form.drop_base_fee}
                      onChange={(e) => handleChange("drop_base_fee", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                    />
                  </div>
                  <SlabTable
                    slabs={form.drop_slabs}
                    onChange={(next) => handleChange("drop_slabs", next)}
                    legLabel="Pharmacy → Customer"
                  />
                </Section>

                {/* Surge Rules */}
                <Section
                  title="Surge Rules"
                  icon={Zap}
                  description="Manually toggle surge multipliers for rain, festivals, or peak demand"
                  action={
                    <button
                      type="button"
                      onClick={() => setShowSurgeModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                 text-[#05015A] bg-[#05015A]/8 hover:bg-[#05015A]/12 rounded-lg"
                    >
                      <Plus size={12} /> Add Rule
                    </button>
                  }
                >
                  <InfoBanner variant="amber">
                    Only one surge rule can be active at a time. Toggling on a new rule automatically disables any currently active one.
                  </InfoBanner>
                  <div className="space-y-2">
                    {surgeRules.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400">
                        No surge rules configured. Click "Add Rule" to create your first one.
                      </div>
                    ) : (
                      surgeRules.map((rule) => (
                        <SurgeRuleCard
                          key={rule.rule_id}
                          rule={rule}
                          onToggle={handleToggleSurge}
                          onDelete={(r) => setConfirmDelete(r)}
                          disabled={surgeBusy}
                        />
                      ))
                    )}
                  </div>
                </Section>
              </div>

              {/* RIGHT: Live preview */}
              <div className="space-y-5">
                <LiveFarePreview form={form} />
                <InfoBanner variant="amber">
                  Preview uses the values currently in the form (unsaved). Save to persist and apply changes.
                </InfoBanner>
              </div>
            </div>
          )}
        </div>
      </div>

      <EffectiveDateModal
        open={showEffectiveModal}
        onClose={() => setShowEffectiveModal(false)}
        onConfirm={handleConfirmSave}
        saving={saving}
      />

      <SurgeRuleModal
        open={showSurgeModal}
        onClose={() => setShowSurgeModal(false)}
        onSubmit={handleCreateSurge}
        saving={surgeBusy}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Surge Rule?"
        message={confirmDelete ? `Delete "${confirmDelete.name}"? This cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteSurge}
        onCancel={() => setConfirmDelete(null)}
        loading={surgeBusy}
      />
    </div>
  );
}