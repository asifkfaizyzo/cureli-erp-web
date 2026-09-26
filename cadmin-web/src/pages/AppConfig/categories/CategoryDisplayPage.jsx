// cadmin-web/src/pages/AppConfig/categories/CategoryDisplayPage.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/categories/CategoryDisplayPage.jsx
//
// CAdmin page for managing category display overrides.
//
// Shows all 12 category cards in a responsive grid.
// Curated and top-level categories are shown in separate labelled sections.
//
// Each card supports:
//   - Image upload / replace
//   - Image removal (falls back to mobile icon)
//   - Show / Hide toggle
//
// Data is fetched fresh on mount and after every successful mutation.
// Individual cards manage optimistic local state for instant feedback
// without waiting for the refetch round trip.

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import CategoryDisplayCard from "./comps/CategoryDisplayCard";
import { getCategoryDisplayOverrides } from "../../../api/cadminAppConfig";

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ title, description, count }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-gray-400 font-medium">
        {count} categories
      </span>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
        <div className="h-8 bg-gray-100 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-100 rounded-lg flex-1" />
          <div className="h-8 bg-gray-100 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoryDisplayPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const res = await getCategoryDisplayOverrides();
      setCategories(res.data?.data?.categories ?? []);
    } catch (err) {
      console.error("[CategoryDisplayPage] fetch error:", err);
      setError(
        err.response?.data?.message ?? "Failed to load category config.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Split into sections
  const curated = categories.filter((c) => c.scope === "curated");
  const topLevel = categories.filter((c) => c.scope === "top_level");

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Category Display</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage images and visibility for marketplace category cards shown in
            the mobile app.
          </p>
        </div>

        <button
          onClick={fetchCategories}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-8 py-8 flex flex-col gap-10">
        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Failed to load</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
              <button
                onClick={fetchCategories}
                className="text-sm font-medium text-red-700 underline mt-1 hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Top-level section */}
        <section>
          <SectionLabel
            title="Top Level Categories"
            description="Hero cards shown at the top of the home screen. Ayurveda and Pet Care also appear as product feed rows — manage their feed visibility in Home Screen Layout."
            count={loading ? 3 : topLevel.length}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : topLevel.map((cat) => (
                  <CategoryDisplayCard
                    key={cat.key}
                    category={cat}
                    onRefetch={fetchCategories}
                  />
                ))}
          </div>
        </section>

        {/* Curated section */}
        <section>
          <SectionLabel
            title="Curated Categories"
            description="Categories shown in the Quick Categories rail and in All Categories. Also appear as product feed rows on the home screen."
            count={loading ? 9 : curated.length}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : curated.map((cat) => (
                  <CategoryDisplayCard
                    key={cat.key}
                    category={cat}
                    onRefetch={fetchCategories}
                  />
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}
