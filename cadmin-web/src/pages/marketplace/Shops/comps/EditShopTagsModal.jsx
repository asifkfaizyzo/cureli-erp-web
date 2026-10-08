// cadmin-web/src/pages/marketplace/Shops/comps/EditShopTagsModal.jsx (do not remove this comment)

import { useState, useEffect } from "react";
import { X, Loader2, Search, Check } from "lucide-react";
import { listShopTags, updateShopTags } from "../../../../api/cadminMarketplaceShops";

const CIRCLED = ["①", "②", "③", "④", "⑤"];

export default function EditShopTagsModal({ shop, onClose, onSaved }) {
  const mp = shop.marketplaceProfile;
  const currentTags = mp?.shop_tags || [];

  const [allTags, setAllTags] = useState([]);
  const [selected, setSelected] = useState([...currentTags]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listShopTags();
        if (!cancelled) setAllTags(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load tags:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const tagMap = new Map(allTags.map((t) => [t.slug, t]));
  const selectedSet = new Set(selected);
  const maxed = selected.length >= 5;

  const filtered = allTags.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.label.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
  });

  const handleToggle = (slug) => {
    if (selectedSet.has(slug)) {
      setSelected(selected.filter((s) => s !== slug));
    } else if (!maxed) {
      setSelected([...selected, slug]);
    }
  };

  const handleSave = async () => {
    setError(null);
    try {
      setSaving(true);
      await updateShopTags(shop.shop_id, selected);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save tags");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Edit Shop Tags</h2>
            <p className="text-xs text-gray-500 mt-0.5">{shop.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Selected pills */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Selected Tags ({selected.length}/5)
            </p>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {selected.length === 0 && (
                <p className="text-xs text-gray-400 py-1">No tags selected</p>
              )}
              {selected.map((slug, i) => {
                const tag = tagMap.get(slug);
                const label = tag?.label || slug;
                const color = tag?.color_hex || "#6366F1";
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: `${color}15`,
                      borderColor: `${color}40`,
                      color: color,
                    }}
                    onClick={() => handleToggle(slug)}
                    title="Click to remove"
                  >
                    <span className="text-[10px] opacity-60">{CIRCLED[i]}</span>
                    {label}
                    <X size={10} />
                  </span>
                );
              })}
            </div>
          </div>

          {/* Search + list */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">All Tags</p>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No tags found</p>
                ) : (
                  filtered.map((tag) => {
                    const isSelected = selectedSet.has(tag.slug);
                    return (
                      <button
                        key={tag.slug}
                        onClick={() => handleToggle(tag.slug)}
                        disabled={!isSelected && maxed}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left
                          border-b border-gray-50 last:border-0 transition-colors
                          ${isSelected ? "bg-gray-50" : "hover:bg-gray-50"}
                          ${!isSelected && maxed ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: tag.color_hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{tag.label}</p>
                          {tag.description && (
                            <p className="text-[11px] text-gray-400 truncate">{tag.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600
              text-sm font-medium hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-2.5 bg-[#05015A] text-white rounded-xl
              text-sm font-bold hover:bg-[#05015A]/90 disabled:opacity-50
              transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Tags"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}