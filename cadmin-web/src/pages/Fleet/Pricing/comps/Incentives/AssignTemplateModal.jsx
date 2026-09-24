// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/AssignTemplateModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/Incentives/AssignTemplateModal.jsx
import { useState, useEffect } from "react";
import { X, CalendarClock, Star, Trash2 } from "lucide-react";
import StyledSelect from "../../../../../components/common/StyledSelect";
import StyledDateFilter from "../../../../../components/common/StyledDateFilter";

export default function AssignTemplateModal({
  open, onClose, onSubmit, onDelete,
  templates = [], date, existingSchedules = [], saving,
}) {
  const [templateId, setTemplateId] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [customTag, setCustomTag] = useState("");

  useEffect(() => {
    if (open) {
      setTemplateId("");
      setEndDate(date || "");
      setIsFeatured(false);
      setCustomTag("");
    }
  }, [open, date]);

  if (!open) return null;

  const templateOptions = templates
    .filter((t) => t.is_active)
    .map((t) => ({ value: t.template_id, label: `${t.title} (${t.period_type.toLowerCase()})` }));

  const handleSubmit = () => {
    if (!templateId) return;
    onSubmit({
      template_id: templateId,
      start_date: date,
      end_date: endDate || date,
      is_featured: isFeatured,
      custom_tag: customTag.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#05015A]/8 flex items-center justify-center">
              <CalendarClock size={15} className="text-[#05015A]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Assign Template</h3>
              <p className="text-[10px] text-gray-500">{date && new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Existing assignments */}
          {existingSchedules.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Currently Assigned</p>
              <div className="space-y-2">
                {existingSchedules.map((s) => (
                  <div key={s.schedule_id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {s.is_featured && <Star size={11} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.template_title}</p>
                        <p className="text-[10px] text-gray-500">
                          {s.start_date === s.end_date ? "Single day" : `${s.start_date} → ${s.end_date}`}
                          {s.custom_tag && ` · ${s.custom_tag}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => onDelete(s)} disabled={saving}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="my-4 border-t border-gray-100" />
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-3">Add New Assignment</p>
            <div className="space-y-3">
              <StyledSelect
                label="Incentive Template *"
                value={templateId}
                onChange={setTemplateId}
                options={templateOptions}
                placeholder="Choose a template..."
              />

              <StyledDateFilter
                label="End Date (leave same as start for single day)"
                date={endDate}
                setDate={setEndDate}
              />

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-gray-300 text-[#05015A] focus:ring-[#05015A]/20" />
                  <Star size={12} className="text-amber-500" fill="currentColor" />
                  <span className="text-xs font-medium text-gray-700">Mark as Featured (Holiday/Special)</span>
                </label>
                <p className="text-[10px] text-gray-500 mt-1 ml-6">
                  Featured quests are highlighted on the calendar and take priority in anti-stacking resolution.
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Custom Tag (optional)</label>
                <input
                  type="text" value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="e.g. DIWALI_2026, WEEKEND"
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200
                       hover:bg-gray-50 rounded-lg disabled:opacity-50">
            Close
          </button>
          <button onClick={handleSubmit} disabled={saving || !templateId}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#05015A] hover:bg-[#05015A]/90
                       rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Assigning..." : "Assign Template"}
          </button>
        </div>
      </div>
    </div>
  );
}