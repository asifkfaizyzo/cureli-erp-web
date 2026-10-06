// cadmin-web/src/pages/marketplace/Pricing/CommissionPricingPage.jsx (do not remove this comment)

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Percent,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Plus,
  Pause,
  Play,
  ShieldOff,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getCommissionRules,
  getCommissionOverrides,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  setDefaultCommissionRule,
  toggleCommissionRuleActive,
  suspendCommission,
  resumeCommission,
  assignCommissionOverride,
  removeCommissionOverride,
} from "../../../api/cadminCommission";
import { useToast } from "../../../components/common/Toast";

import { fmtDate, Section } from "./comps/commission/FormInputs";
import {
  RuleModal,
  SuspendModal,
  OverrideModal,
} from "./comps/commission/Modals";
import { RulesTable, OverridesTable } from "./comps/commission/Tables";
import { InfoTooltip } from "./comps/commission/InfoTooltip";

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const CommissionPricingPage = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState([]);
  const [overrides, setOverrides] = useState([]);

  // Modals
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  // ── Fetch ──────────────────────────────────
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const [rulesRes, overridesRes] = await Promise.all([
        getCommissionRules(),
        getCommissionOverrides(),
      ]);
      setRules(rulesRes.data.data || []);
      setOverrides(overridesRes.data.data || []);
      if (showToast) toast.success("Refreshed", "Commission data reloaded");
    } catch (err) {
      toast.error(
        "Load Failed",
        err.response?.data?.message || "Failed to load commission data"
      );
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchData(false);
  }, []); // eslint-disable-line

  // ── Derived ────────────────────────────────
  const defaultRule = rules.find((r) => r.is_default);
  const isSuspended = defaultRule?.is_suspended || false;

  // ── Handlers ───────────────────────────────
  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleModalOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (formData) => {
    try {
      setSaving(true);
      if (editingRule) {
        await updateCommissionRule(editingRule.rule_id, formData);
        toast.success("Updated", "Commission rule updated successfully");
      } else {
        await createCommissionRule(formData);
        toast.success("Created", "Commission rule created successfully");
      }
      setRuleModalOpen(false);
      setEditingRule(null);
      fetchData(false);
    } catch (err) {
      toast.error(
        "Save Failed",
        err.response?.data?.message || "Failed to save rule"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${rule.name}"? This cannot be undone.`
      )
    )
      return;
    try {
      setSaving(true);
      await deleteCommissionRule(rule.rule_id);
      toast.success("Deleted", "Commission rule deleted");
      fetchData(false);
    } catch (err) {
      toast.error(
        "Delete Failed",
        err.response?.data?.message || "Failed to delete rule"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (ruleId) => {
    try {
      setSaving(true);
      await setDefaultCommissionRule(ruleId);
      toast.success("Default Updated", "New default commission rule set");
      fetchData(false);
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Failed to set default"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ruleId) => {
    try {
      setSaving(true);
      await toggleCommissionRuleActive(ruleId);
      fetchData(false);
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Failed to toggle rule"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (until) => {
    try {
      setSaving(true);
      await suspendCommission(until);
      toast.success(
        "Commission Disabled",
        until
          ? `Commission set to 0% until ${fmtDate(until)}`
          : "Commission set to 0% until manually re-enabled"
      );
      setSuspendModalOpen(false);
      fetchData(false);
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Failed to suspend");
    } finally {
      setSaving(false);
    }
  };

  const handleResume = async () => {
    try {
      setSaving(true);
      await resumeCommission();
      toast.success("Commission Resumed", "Standard commission rate is active");
      fetchData(false);
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Failed to resume");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignOverride = async (shopId, ruleId) => {
    try {
      setSaving(true);
      await assignCommissionOverride(shopId, ruleId);
      toast.success("Override Assigned", "Custom commission rate applied");
      setOverrideModalOpen(false);
      fetchData(false);
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Failed to assign override"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOverride = async (overrideId) => {
    if (
      !window.confirm(
        "Remove this custom commission? The pharmacy will revert to the default rate."
      )
    )
      return;
    try {
      setSaving(true);
      await removeCommissionOverride(overrideId);
      toast.success("Override Removed", "Pharmacy reverted to default rate");
      fetchData(false);
    } catch (err) {
      toast.error(
        "Failed",
        err.response?.data?.message || "Failed to remove override"
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-1 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05015A] flex items-center justify-center">
              <Percent size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-gray-900">
                  Commission Rules
                </h1>
                <InfoTooltip
                  size={14}
                  width="w-80"
                  content={
                    <>
                      <p className="font-semibold mb-1">
                        What is marketplace commission?
                      </p>
                      <p className="text-white/80">
                        Commission is the platform fee Cureli charges pharmacies
                        on every marketplace order they receive. This page lets
                        you create different commission styles, assign custom
                        rates to specific pharmacies, and temporarily waive
                        commission across the board.
                      </p>
                    </>
                  }
                />
              </div>
              <p className="text-xs text-gray-500">
                Manage the platform fee Cureli charges pharmacies on marketplace
                orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4 max-w-5xl">
          {/* ── Global Status ── */}
          <Section
            title={
              <span className="flex items-center gap-1.5">
                Commission Status
                <InfoTooltip
                  width="w-80"
                  content={
                    <>
                      <p className="font-semibold mb-1">
                        Master switch for all commission
                      </p>
                      <p className="text-white/80">
                        Disabling commission sets the platform fee to 0% for
                        ALL pharmacies immediately, regardless of their
                        individual rules or overrides. Use this for promotional
                        periods, new pharmacy onboarding campaigns, or temporary
                        waivers. You can set an auto-resume date or re-enable
                        manually.
                      </p>
                    </>
                  }
                />
              </span>
            }
            icon={isSuspended ? ShieldOff : ShieldCheck}
            description="Master switch for all marketplace commission"
            accent
          >
            {isSuspended ? (
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Pause size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      Commission is DISABLED (0%)
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {defaultRule?.suspended_until
                        ? `Auto-resumes on ${fmtDate(defaultRule.suspended_until)}`
                        : "Disabled until you manually re-enable it"}
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">
                      All pharmacies are currently keeping 100% of their
                      medicine sales.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResume}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  Re-enable Commission
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      Commission is ACTIVE
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Default rate:{" "}
                      {defaultRule
                        ? `${defaultRule.name} (${defaultRule.description_text})`
                        : "No default rule set — create one below"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSuspendModalOpen(true)}
                  disabled={saving || !defaultRule}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <Pause size={14} />
                  Disable Commission
                </button>
              </div>
            )}
          </Section>

          {/* ── Rules Table ── */}
          <Section
            title={
              <span className="flex items-center gap-1.5">
                All Commission Rules
                <InfoTooltip
                  width="w-80"
                  content={
                    <>
                      <p className="font-semibold mb-1">How rules work</p>
                      <p className="text-white/80 mb-2">
                        You can create multiple commission styles. The rule
                        marked with a star is the <strong>default</strong> — it
                        applies to all pharmacies that don't have a custom
                        override.
                      </p>
                      <p className="text-white/80">
                        Multiple rules can exist at the same time, but only one
                        can be the default. Inactive rules are hidden from
                        pharmacies but kept for historical reference.
                      </p>
                    </>
                  }
                />
              </span>
            }
            icon={Percent}
            description="Create different commission styles and set one as the default for all new pharmacies"
          >
            <div className="flex items-center justify-end">
              <button
                onClick={handleCreateRule}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 flex-shrink-0"
              >
                <Plus size={14} />
                New Rule
              </button>
            </div>

            <RulesTable
              rules={rules}
              saving={saving}
              onSetDefault={handleSetDefault}
              onEdit={handleEditRule}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteRule}
            />
          </Section>

          {/* ── Overrides ── */}
          <Section
            title={
              <span className="flex items-center gap-1.5">
                Pharmacy Overrides
                <InfoTooltip
                  width="w-80"
                  content={
                    <>
                      <p className="font-semibold mb-1">How overrides work</p>
                      <p className="text-white/80 mb-2">
                        An override lets you assign a custom commission rate to
                        a specific pharmacy. That pharmacy will use the custom
                        rate instead of the default.
                      </p>
                      <p className="text-white/80">
                        Removing an override puts the pharmacy back on the
                        default rate automatically. You can only assign
                        non-default active rules as overrides.
                      </p>
                    </>
                  }
                />
              </span>
            }
            icon={Users}
            description="Assign custom commission rates to specific pharmacies"
          >
            <div className="flex items-center justify-end">
              <button
                onClick={() => setOverrideModalOpen(true)}
                disabled={
                  rules.filter((r) => r.is_active && !r.is_default).length === 0
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 flex-shrink-0 disabled:opacity-50"
              >
                <Plus size={14} />
                Assign Override
              </button>
            </div>

            <OverridesTable
              overrides={overrides}
              saving={saving}
              onRemove={handleRemoveOverride}
            />
          </Section>

          {/* Footer info — collapsed to a tooltip trigger */}
          <div className="flex items-center justify-center gap-2 pt-2 pb-4">
            <span className="text-xs text-gray-400">
              How are pharmacies notified of changes?
            </span>
            <InfoTooltip
              size={14}
              position="top"
              width="w-80"
              content={
                <>
                  <p className="font-semibold mb-1">Automatic notifications</p>
                  <p className="text-white/80">
                    Any change to commission rates automatically notifies
                    affected pharmacies via in-app notification and email. The
                    new rate applies to orders placed after the change.
                    Existing in-progress orders keep the rate they were placed
                    with.
                  </p>
                </>
              }
            />
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {ruleModalOpen && (
          <RuleModal
            rule={editingRule}
            onClose={() => {
              setRuleModalOpen(false);
              setEditingRule(null);
            }}
            onSave={handleSaveRule}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {suspendModalOpen && (
          <SuspendModal
            onClose={() => setSuspendModalOpen(false)}
            onSuspend={handleSuspend}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overrideModalOpen && (
          <OverrideModal
            rules={rules}
            onClose={() => setOverrideModalOpen(false)}
            onAssign={handleAssignOverride}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommissionPricingPage;