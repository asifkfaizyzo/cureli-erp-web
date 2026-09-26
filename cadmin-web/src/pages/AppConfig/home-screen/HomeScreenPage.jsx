// cadmin-web/src/pages/AppConfig/home-screen/HomeScreenPage.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/home-screen/HomeScreenPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  Save,
  Loader2,
  AlertCircle,
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  CheckCircle2,
  X,
  Monitor,
} from "lucide-react";
import {
  getHomeScreenConfig,
  updateHomeScreenConfig,
  getFeedSections,
  reorderFeedSections,
  updateFeedSection,
} from "../../../api/cadminHomeScreen";

// ════════════════════════════════════════════════════════════════════════════
// SMALL SHARED HELPERS
// ════════════════════════════════════════════════════════════════════════════

function InlineFeedback({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${
        isError ? "text-red-500" : "text-green-600"
      }`}
    >
      {isError ? (
        <AlertCircle size={12} className="shrink-0" />
      ) : (
        <CheckCircle2 size={12} className="shrink-0" />
      )}
      {message}
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — SCREEN LAYOUT CONFIG
// ════════════════════════════════════════════════════════════════════════════

// Maps raw DB key → human label + type
const CONFIG_META = {
  hero_carousel_visible:       { label: "Hero Carousel",          type: "toggle", hint: "The main sliding banner at the top" },
  strip_banners_visible:       { label: "Strip Banners",          type: "toggle", hint: "Promotional strips below the carousel" },
  category_section_visible:    { label: "Category Grid",          type: "toggle", hint: "The 'Everything for your well-being' section + grid" },
  category_section_title:      { label: "Category Section Title", type: "text",   hint: "Heading above the category grid" },
  category_section_hint:       { label: "Category Hint Text",     type: "text",   hint: "Link text to the right of the heading" },
  prescription_banner_visible: { label: "Prescription Banner",    type: "toggle", hint: "The 'Upload prescription' pill" },
  prescription_banner_text:    { label: "Prescription Banner Text",type: "text",  hint: "Label shown on the pill" },
  product_feed_visible:        { label: "Product Feed",           type: "toggle", hint: "All horizontal product sections" },
};

// Ordered for display — toggles first grouped by section, text fields inline
const CONFIG_DISPLAY_ORDER = [
  "hero_carousel_visible",
  "strip_banners_visible",
  "category_section_visible",
  "category_section_title",
  "category_section_hint",
  "prescription_banner_visible",
  "prescription_banner_text",
  "product_feed_visible",
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-[#05015A]" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ScreenLayoutSection({ initialConfig, onSaved }) {
  // local form state — keys match DB exactly, values are strings
  const [form,    setForm]    = useState(initialConfig);
  const [saving,  setSaving]  = useState(false);
  const [feedback,setFeedback]= useState({ type: null, message: null });

  // Keep form in sync if parent reloads config
  useEffect(() => { setForm(initialConfig); }, [initialConfig]);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  }, []);

  const setKey = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateHomeScreenConfig(form);
      const saved = res.data?.data?.config ?? form;
      setForm(saved);
      onSaved?.(saved);
      showFeedback("success", "Layout settings saved");
    } catch (err) {
      showFeedback("error", err.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Screen Layout</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Toggle sections on or off and customise visible text.
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {CONFIG_DISPLAY_ORDER.map((key) => {
          const meta  = CONFIG_META[key];
          const value = form[key] ?? "";

          if (meta.type === "toggle") {
            const checked = value === "true";
            return (
              <div
                key={key}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-6">
                  <p className="text-sm font-medium text-gray-800">
                    {meta.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.hint}</p>
                </div>
                <Toggle
                  checked={checked}
                  onChange={(next) => setKey(key, next ? "true" : "false")}
                  disabled={saving}
                />
              </div>
            );
          }

          // text field
          return (
            <div key={key} className="px-6 py-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700">
                  {meta.label}
                </label>
                <span className="text-[10px] text-gray-400">{meta.hint}</span>
              </div>
              <input
                type="text"
                value={value}
                onChange={(e) => setKey(key, e.target.value)}
                maxLength={300}
                disabled={saving}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A] disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <InlineFeedback type={feedback.type} message={feedback.message} />
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-xl transition-colors disabled:opacity-50 ml-auto"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save Layout
        </button>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — FEED SECTIONS
// ════════════════════════════════════════════════════════════════════════════

// ── Edit label modal ──────────────────────────────────────────────────────────

function EditLabelModal({ section, onClose, onSaved }) {
  const [label,   setLabel]   = useState(section.label);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const isDefault = label.trim() === section.defaultLabel;

  const handleSave = async () => {
    const trimmed = label.trim();
    if (!trimmed) { setError("Label cannot be empty"); return; }
    if (trimmed.length > 100) { setError("Max 100 characters"); return; }

    setSaving(true);
    setError(null);
    try {
      await updateFeedSection(section.key, { label: trimmed });
      onSaved({ ...section, label: trimmed });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save");
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    try {
      // null clears the override, falling back to registry default
      await updateFeedSection(section.key, { label: null });
      onSaved({ ...section, label: section.defaultLabel });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to reset");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Edit Section Label
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Changes the title shown on mobile for this feed section.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Category key badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
              {section.key}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
              section.type === "DRUG"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-green-50 text-green-600 border-green-100"
            }`}>
              {section.type}
            </span>
          </div>

          {/* Label input */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">
                Display Label
              </label>
              <span className="text-[10px] text-gray-400">
                {label.length}/100
              </span>
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
              autoFocus
              placeholder={section.defaultLabel}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
            />
            {!isDefault && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                Default:{" "}
                <span className="font-medium text-gray-500">
                  {section.defaultLabel}
                </span>
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          {!isDefault && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-3 py-2.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset to Default
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !label.trim()}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-[#05015A] rounded-xl hover:bg-[#06018a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single feed section row ───────────────────────────────────────────────────

function FeedSectionRow({
  section,
  index,
  total,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragOver,
  onToggleVisibility,
  onEditLabel,
  isTogglingKey,
}) {
  const isHidden   = section.isHidden;
  const isToggling = isTogglingKey === section.key;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`
        flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border
        transition-all duration-150 cursor-grab active:cursor-grabbing
        ${isHidden
          ? "border-gray-100 opacity-50"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
        ${isDragging ? "opacity-30 scale-[0.98]" : ""}
      `}
    >
      {/* Drag handle */}
      <GripVertical size={16} className="text-gray-300 shrink-0" />

      {/* Position */}
      <span className="w-5 text-center text-xs font-bold text-gray-300 shrink-0">
        {isHidden ? "—" : index + 1}
      </span>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800 truncate">
            {section.label}
          </span>
          {section.label !== section.defaultLabel && (
            <span className="text-[10px] text-gray-400 italic truncate hidden sm:inline">
              (default: {section.defaultLabel})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-gray-400 truncate">
            {section.key}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border shrink-0 ${
            section.type === "DRUG"
              ? "bg-blue-50 text-blue-500 border-blue-100"
              : "bg-green-50 text-green-500 border-green-100"
          }`}>
            {section.type}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Edit label */}
        <button
          onClick={onEditLabel}
          title="Edit label"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Edit2 size={13} />
        </button>

        {/* Show / Hide */}
        <button
          onClick={onToggleVisibility}
          disabled={isToggling}
          title={isHidden ? "Show on mobile" : "Hide from mobile"}
          className={`
            flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg
            border transition-colors disabled:opacity-40 disabled:cursor-not-allowed
            ${isHidden
              ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
              : "text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100"
            }
          `}
        >
          {isToggling ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isHidden ? (
            <Eye size={12} />
          ) : (
            <EyeOff size={12} />
          )}
          <span className="hidden sm:inline">
            {isHidden ? "Show" : "Hide"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Feed sections section ─────────────────────────────────────────────────────

function FeedSectionsSection({ initialSections }) {
  const [sections,     setSections]     = useState(initialSections);
  const [editingSection, setEditing]    = useState(null); // section obj or null
  const [isTogglingKey,setTogglingKey]  = useState(null); // key string or null
  const [reordering,   setReordering]   = useState(false);
  const [reorderFeedback, setRFeedback] = useState({ type: null, message: null });

  const dragIndex = useRef(null);
  const dragOver  = useRef(null);

  // Keep in sync if parent refetches
  useEffect(() => { setSections(initialSections); }, [initialSections]);

  const showReorderFeedback = useCallback((type, message) => {
    setRFeedback({ type, message });
    setTimeout(() => setRFeedback({ type: null, message: null }), 3000);
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────

  const handleDragStart = useCallback((index) => {
    dragIndex.current = index;
  }, []);

  const handleDragEnter = useCallback((index) => {
    dragOver.current = index;
  }, []);

  const handleDragEnd = useCallback(async () => {
    if (
      dragIndex.current === null ||
      dragOver.current  === null ||
      dragIndex.current === dragOver.current
    ) {
      dragIndex.current = null;
      dragOver.current  = null;
      return;
    }

    const reordered = [...sections];
    const [moved]   = reordered.splice(dragIndex.current, 1);
    reordered.splice(dragOver.current, 0, moved);

    dragIndex.current = null;
    dragOver.current  = null;

    // Optimistic update
    setSections(reordered);
    setReordering(true);

    try {
      await reorderFeedSections(reordered.map((s) => s.key));
      showReorderFeedback("success", "Order saved");
    } catch (err) {
      showReorderFeedback("error", err.response?.data?.message ?? "Reorder failed");
      setSections(sections); // revert
    } finally {
      setReordering(false);
    }
  }, [sections, showReorderFeedback]);

  // ── Visibility toggle ─────────────────────────────────────────

  const handleToggleVisibility = useCallback(async (section) => {
    const nextHidden = !section.isHidden;
    setTogglingKey(section.key);

    try {
      await updateFeedSection(section.key, { isHidden: nextHidden });
      setSections((prev) =>
        prev.map((s) =>
          s.key === section.key ? { ...s, isHidden: nextHidden } : s
        )
      );
    } catch (err) {
      showReorderFeedback(
        "error",
        err.response?.data?.message ?? "Failed to update visibility"
      );
    } finally {
      setTogglingKey(null);
    }
  }, [showReorderFeedback]);

  // ── Label saved ───────────────────────────────────────────────

  const handleLabelSaved = useCallback((updated) => {
    setSections((prev) =>
      prev.map((s) => (s.key === updated.key ? updated : s))
    );
  }, []);

  // Visible sections for position numbering
  const visibleCount = sections.filter((s) => !s.isHidden).length;

  // Running visible index for position display
  let visibleIdx = 0;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            Home Feed Sections
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Drag to reorder. Hide sections to remove them from the mobile feed.
            {" "}{visibleCount} of {sections.length} visible.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reordering && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <RefreshCw size={11} className="animate-spin" />
              Saving…
            </span>
          )}
          <InlineFeedback
            type={reorderFeedback.type}
            message={reorderFeedback.message}
          />
        </div>
      </div>

      {/* Rows */}
      <div className="p-4 flex flex-col gap-2">
        {sections.map((section, index) => {
          const positionIdx = section.isHidden ? null : visibleIdx++;
          return (
            <FeedSectionRow
              key={section.key}
              section={section}
              index={positionIdx ?? index}
              total={sections.length}
              isDragging={false}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onToggleVisibility={() => handleToggleVisibility(section)}
              onEditLabel={() => setEditing(section)}
              isTogglingKey={isTogglingKey}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
        <p className="text-[11px] text-gray-400">
          Hidden sections are greyed out and excluded from the mobile app. Drag
          to change the display order of visible sections.
        </p>
      </div>

      {/* Edit label modal */}
      {editingSection && (
        <EditLabelModal
          section={editingSection}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            handleLabelSaved(updated);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ════════════════════════════════════════════════════════════════════════════

function SkeletonBlock({ rows = 4 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="h-3.5 bg-gray-200 rounded w-40 mb-1.5" />
        <div className="h-2.5 bg-gray-100 rounded w-64" />
      </div>
      <div className="p-6 flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5 flex-1 pr-8">
              <div className="h-3 bg-gray-200 rounded w-32" />
              <div className="h-2.5 bg-gray-100 rounded w-48" />
            </div>
            <div className="h-6 w-11 bg-gray-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreenPage() {
  const [configData,   setConfigData]   = useState(null);
  const [sectionsData, setSectionsData] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, sectionsRes] = await Promise.all([
        getHomeScreenConfig(),
        getFeedSections(),
      ]);
      setConfigData(configRes.data?.data?.config ?? {});
      setSectionsData(sectionsRes.data?.data?.sections ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Failed to load home screen configuration."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Home Screen Layout</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Control section visibility, text labels, and the product feed order
            on the Cureli mobile home screen.
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-8 py-8 flex flex-col gap-8 max-w-4xl w-full">

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Failed to load</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
              <button
                onClick={fetchAll}
                className="text-sm font-medium text-red-700 underline mt-1 hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <>
            <SkeletonBlock rows={8} />
            <SkeletonBlock rows={9} />
          </>
        )}

        {/* Loaded */}
        {!loading && !error && configData && sectionsData && (
          <>
            <SectionDivider label="Section Visibility & Text" />
            <ScreenLayoutSection
              initialConfig={configData}
              onSaved={setConfigData}
            />

            <SectionDivider label="Product Feed Sections" />
            <FeedSectionsSection initialSections={sectionsData} />

            {/* Info callout */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <Monitor size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Changes take effect immediately on the mobile app. Users may need
                to pull-to-refresh the home screen to see updates (cached for 30 minutes).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}