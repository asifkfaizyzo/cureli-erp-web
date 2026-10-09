// pharmacy-web/src/pages/marketplace-onboarding/steps/ShopTagPicker.jsx (do not remove this comment)

import { useState, useEffect, useRef } from "react";
import { Plus, X, Search, Loader2, Tag } from "lucide-react";
import { fetchActiveShopTags } from "../../../api/marketplace";

const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤"];

const inputClass = `
  w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
  placeholder-white/20 text-sm focus:outline-none focus:ring-2
  focus:ring-white/20 focus:border-white/30 transition-all
`;

export default function ShopTagPicker({
  selectedSlugs = [],
  onAdd,
  onRemove,
  error,
}) {
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch active tags on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchActiveShopTags();
        if (!cancelled) setAllTags(res.data?.data || []);
      } catch (err) {
        console.error("[ShopTagPicker] Failed to load tags:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  const selectedSet = new Set(selectedSlugs);
  const maxed = selectedSlugs.length >= 5;

  const filteredTags = allTags.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.label.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
    );
  });

  const handleToggle = (slug) => {
    if (selectedSet.has(slug)) return; // already selected
    if (maxed) return;
    onAdd(slug);
    if (selectedSlugs.length + 1 >= 5) {
      setDropdownOpen(false);
      setSearch("");
    }
  };

  // Build a map for quick label/color lookup
  const tagMap = new Map(allTags.map((t) => [t.slug, t]));

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-1.5">
        <Tag size={12} className="text-white/25" />
        Pharmacy Type Tags <span className="text-red-400">*</span>
        <span className="text-white/20 font-normal text-[10px] ml-1">
          select up to 5 · click order = priority
        </span>
      </label>

      {/* Selected pills */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
        {selectedSlugs.length === 0 && (
          <p className="text-xs text-white/20 py-1">No tags selected yet</p>
        )}
        {selectedSlugs.map((slug, index) => {
          const tag = tagMap.get(slug);
          const label = tag?.label || slug;
          const color = tag?.color_hex || "#6366F1";
          return (
            <span
              key={slug}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                text-xs font-semibold border transition-all"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}50`,
                color: color,
              }}
            >
              <span className="text-[10px] opacity-70">
                {CIRCLED_NUMBERS[index]}
              </span>
              {label}
              <button
                type="button"
                onClick={() => onRemove(slug)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          );
        })}
      </div>

      {/* Add Tag button + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            if (!maxed && !loading) setDropdownOpen(!dropdownOpen);
          }}
          disabled={maxed || loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-xs font-medium border transition-all
            ${maxed
              ? "border-white/5 text-white/15 cursor-not-allowed"
              : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70 bg-white/[0.02]"
            }`}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          {maxed ? "Max 5 tags" : "Add Tag"}
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1a1a2e] border border-white/10
            rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-white/5">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10
                    text-white text-xs placeholder-white/20 focus:outline-none focus:ring-1
                    focus:ring-white/20"
                />
              </div>
            </div>

            {/* Tag list */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filteredTags.length === 0 ? (
                <p className="px-3 py-4 text-xs text-white/25 text-center">
                  No tags found
                </p>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = selectedSet.has(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => handleToggle(tag.slug)}
                      disabled={isSelected}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left
                        transition-colors
                        ${isSelected
                          ? "opacity-40 cursor-default"
                          : "hover:bg-white/5 cursor-pointer"
                        }`}
                    >
                      {/* Color dot */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10"
                        style={{ backgroundColor: tag.color_hex }}
                      />
                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {tag.label}
                        </p>
                        {tag.description && (
                          <p className="text-[10px] text-white/25 truncate">
                            {tag.description}
                          </p>
                        )}
                      </div>
                      {/* Checkmark */}
                      {isSelected && (
                        <span className="text-[10px] text-green-400 font-bold flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}