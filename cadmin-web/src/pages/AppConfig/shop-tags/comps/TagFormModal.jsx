// cadmin-web/src/pages/AppConfig/shop-tags/comps/TagFormModal.jsx (do not remove this comment)

import { useState, useEffect } from "react";
import { X, Loader2, Check } from "lucide-react";
import { createShopTag, updateShopTag } from "../../../../api/cadminMarketplaceShops";

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#A855F7", // purple
  "#14B8A6", // teal
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#F97316", // orange
  "#F472B6", // light pink
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#0EA5E9", // sky
  "#06B6D4", // cyan
  "#64748B", // slate
  "#84CC16", // lime
  "#EAB308", // yellow
  "#4ADE80", // light green
  "#6B7280", // gray
  "#6366F1", // indigo
  "#D946EF", // fuchsia
];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputClass = `
  w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900
  placeholder-gray-400 text-sm focus:outline-none focus:ring-2
  focus:ring-[#05015A]/20 focus:border-[#05015A]/40 transition-all
`;

export default function TagFormModal({ tag, onClose, onSaved }) {
  const isEdit = !!tag;

  const [label, setLabel] = useState(tag?.label || "");
  const [slug, setSlug] = useState(tag?.slug || "");
  const [description, setDescription] = useState(tag?.description || "");
  const [colorHex, setColorHex] = useState(tag?.color_hex || "#6366F1");
  const [isActive, setIsActive] = useState(tag?.is_active ?? true);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Auto-generate slug from label (only for create mode)
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(label));
    }
  }, [label, slugManuallyEdited]);

  const handleSlugChange = (val) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
      setError("Enter a valid hex color (e.g. #3B82F6)");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        slug: slug.trim(),
        label: label.trim(),
        description: description.trim() || null,
        color_hex: colorHex.trim(),
        is_active: isActive,
      };

      if (isEdit) {
        await updateShopTag(tag.tag_id, payload);
      } else {
        await createShopTag(payload);
      }

      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit Tag" : "Create Tag"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Allopathic"
              maxLength={100}
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. allopathic"
              maxLength={100}
              className={`${inputClass} font-mono text-xs`}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Auto-generated from label. Used as the unique identifier.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Description
              <span className="text-gray-400 font-normal ml-1">optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this pharmacy type..."
              maxLength={300}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Pill Color
            </label>
            <div className="flex items-center gap-3 mb-2">
              {/* Preview circle */}
              <div
                className="w-10 h-10 rounded-xl border-2 border-gray-200 shadow-sm flex-shrink-0"
                style={{ backgroundColor: colorHex }}
              />
              {/* Hex input */}
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#6366F1"
                maxLength={7}
                className={`${inputClass} font-mono text-xs flex-1`}
              />
            </div>
            {/* Preset swatches */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorHex(color)}
                  className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110
                    ${colorHex === color
                      ? "border-gray-900 shadow-md scale-110"
                      : "border-transparent"
                    }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {colorHex === color && (
                    <Check size={12} className="text-white mx-auto drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle (edit mode only) */}
          {isEdit && (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Active</p>
                <p className="text-[11px] text-gray-400">
                  Inactive tags are hidden from the pharmacy tag picker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors
                  ${isActive ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${isActive ? "translate-x-[22px]" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600
                text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-2.5 bg-[#05015A] text-white rounded-xl
                text-sm font-bold hover:bg-[#05015A]/90 disabled:opacity-50
                disabled:cursor-not-allowed transition-colors flex items-center
                justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? "Update Tag" : "Create Tag"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}