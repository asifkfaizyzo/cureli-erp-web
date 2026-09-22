// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/TemplateLibraryTab.jsx
import { useState, useEffect, useCallback } from "react";
import { Plus, Trophy, Edit3, Power, CalendarClock, Loader2 } from "lucide-react";

import {
  getIncentiveTemplates, createIncentiveTemplate,
  updateIncentiveTemplate, toggleIncentiveTemplate,
} from "../../../../../api/cadminFleetIncentives";
import { useToast } from "../../../../../components/common/Toast";
import ConfirmDialog from "../../../../../components/common/ConfirmDialog";
import TemplateBuilderModal from "./TemplateBuilderModal";

function TemplateCard({ template, onEdit, onToggle, busy }) {
  const totalRewardAtTop = template.tiers?.[template.tiers.length - 1]?.reward_amount || 0;
  const topTarget = template.tiers?.[template.tiers.length - 1]?.target_value || 0;

  const periodBadge = {
    DAILY: { label: "Daily", color: "bg-blue-100 text-blue-700" },
    WEEKLY: { label: "Weekly", color: "bg-purple-100 text-purple-700" },
    CUSTOM_PERIOD: { label: "Custom", color: "bg-pink-100 text-pink-700" },
  }[template.period_type];

  return (
    <div className={`p-4 bg-white border rounded-xl transition-all
      ${template.is_active ? "border-gray-200 hover:border-[#05015A]/30 hover:shadow-md" : "border-gray-200 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#05015A]/8 flex items-center justify-center flex-shrink-0">
            <Trophy size={15} className="text-[#05015A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{template.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${periodBadge.color}`}>
                {periodBadge.label}
              </span>
              <span className="text-[10px] text-gray-500">
                {template.metric_type === "ORDER_COUNT" ? "Order Count" : "Base Earnings"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(template)} disabled={busy}
            className="p-1.5 text-gray-400 hover:text-[#05015A] hover:bg-[#05015A]/8 rounded transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={() => onToggle(template)} disabled={busy}
            title={template.is_active ? "Deactivate" : "Activate"}
            className={`p-1.5 rounded transition-colors
              ${template.is_active
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-gray-400 hover:bg-gray-100"}`}>
            <Power size={13} />
          </button>
        </div>
      </div>

      {template.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.description}</p>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 flex items-center gap-1 flex-wrap">
          {template.tiers?.map((t) => (
            <div key={t.tier_id} className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px]">
              <span className="text-gray-500">T{t.tier_level}:</span>
              <span className="font-semibold text-gray-700">
                {template.metric_type === "ORDER_COUNT" ? t.target_value : `₹${t.target_value}`}
              </span>
              <span className="text-emerald-600 font-semibold">→ ₹{t.reward_amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <CalendarClock size={11} /> {template.usage_count} scheduled use{template.usage_count !== 1 ? "s" : ""}
        </span>
        <span>Max reward: <span className="font-semibold text-emerald-600">₹{totalRewardAtTop}</span> at {template.metric_type === "ORDER_COUNT" ? topTarget : `₹${topTarget}`}</span>
      </div>
    </div>
  );
}

export default function TemplateLibraryTab() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getIncentiveTemplates();
      setTemplates(res.data.data || []);
    } catch (err) {
      toast.error("Load Failed", err.response?.data?.message || "Could not load templates");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchTemplates(); }, []); // eslint-disable-line

  const handleSubmit = async (payload) => {
    try {
      setBusy(true);
      if (editing) await updateIncentiveTemplate(editing.template_id, payload);
      else await createIncentiveTemplate(payload);
      toast.success(editing ? "Updated" : "Created", `Template ${editing ? "updated" : "created"} successfully`);
      setShowModal(false);
      setEditing(null);
      await fetchTemplates();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;
    try {
      setBusy(true);
      await toggleIncentiveTemplate(confirmToggle.template_id, { is_active: !confirmToggle.is_active });
      toast.success("Updated", `Template ${!confirmToggle.is_active ? "activated" : "deactivated"}`);
      setConfirmToggle(null);
      await fetchTemplates();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not update template");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Reusable Templates</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Create templates once, then assign them to specific dates in the Calendar tab.
          </p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white
                     bg-[#05015A] hover:bg-[#05015A]/90 rounded-lg transition-colors">
          <Plus size={13} /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#05015A]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Trophy size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No templates yet</p>
          <p className="text-xs text-gray-500 mt-1">Create your first incentive template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t.template_id} template={t} busy={busy}
              onEdit={(t) => { setEditing(t); setShowModal(true); }}
              onToggle={(t) => setConfirmToggle(t)} />
          ))}
        </div>
      )}

      <TemplateBuilderModal
        open={showModal}
        editing={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSubmit={handleSubmit}
        saving={busy}
      />

      <ConfirmDialog
        open={Boolean(confirmToggle)}
        title={confirmToggle?.is_active ? "Deactivate Template?" : "Activate Template?"}
        message={confirmToggle
          ? `${confirmToggle.is_active ? "Deactivating" : "Activating"} "${confirmToggle.title}". ${confirmToggle.is_active ? "It cannot be assigned to new dates while inactive." : ""}`
          : ""}
        confirmText={confirmToggle?.is_active ? "Deactivate" : "Activate"}
        onConfirm={handleToggle}
        onCancel={() => setConfirmToggle(null)}
        loading={busy}
      />
    </div>
  );
}