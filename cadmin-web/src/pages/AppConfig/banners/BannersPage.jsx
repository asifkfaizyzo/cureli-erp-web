// cadmin-web/src/pages/AppConfig/banners/BannersPage.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/banners/BannersPage.jsx

import { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw, Plus, AlertCircle } from "lucide-react";
import {
  getBannerSlides,
  reorderBannerSlides,
  createBannerSlide,
  updateBannerSlide,
} from "../../../api/cadminBanners";
import SlideCard from "./comps/SlideCard";
import SlideFormModal from "./comps/SlideFormModal";
import StripBannerSection from "./comps/StripBannerSection";

const MAX_SLIDES = 8;

function SkeletonSlide() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-gray-100" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-100 rounded-lg flex-1" />
          <div className="h-8 bg-gray-100 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const [slides,     setSlides]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [modalSlide, setModalSlide] = useState(null); // null = closed, false = new, slide obj = edit
  const [reordering, setReordering] = useState(false);

  // Drag state
  const dragIndex = useRef(null);
  const dragOver  = useRef(null);

  const fetchSlides = useCallback(async () => {
    try {
      setError(null);
      const res = await getBannerSlides();
      setSlides(res.data?.data?.slides ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  // ── Drag to reorder ───────────────────────────────────────────────────────

  const handleDragStart = (index) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index) => {
    dragOver.current = index;
  };

  const handleDragEnd = async () => {
    if (
      dragIndex.current === null ||
      dragOver.current  === null ||
      dragIndex.current === dragOver.current
    ) {
      dragIndex.current = null;
      dragOver.current  = null;
      return;
    }

    const reordered = [...slides];
    const [moved]   = reordered.splice(dragIndex.current, 1);
    reordered.splice(dragOver.current, 0, moved);

    dragIndex.current = null;
    dragOver.current  = null;

    // Optimistic update
    setSlides(reordered);
    setReordering(true);

    try {
      await reorderBannerSlides(reordered.map((s) => s.slideId));
      await fetchSlides(); // sync final positions from server
    } catch (err) {
      console.error("Reorder failed:", err);
      await fetchSlides(); // revert
    } finally {
      setReordering(false);
    }
  };

  // ── Modal save handler ────────────────────────────────────────────────────
  // Returns the created slide for new slides so SlideFormModal
  // can immediately upload any pending image using the real slideId.

  const handleModalSave = async (payload) => {
    if (modalSlide && modalSlide !== false) {
      // Edit — update existing slide
      await updateBannerSlide(modalSlide.slideId, payload);
      await fetchSlides();
    } else {
      // Create — return the new slide so the modal can upload the pending image
      const res          = await createBannerSlide(payload);
      const createdSlide = res.data?.data?.slide;
      await fetchSlides();
      return createdSlide; // ← modal needs this to upload the pending image
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Home Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the hero carousel and strip banner on the mobile home screen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reordering && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" />
              Saving order…
            </span>
          )}
          <button
            onClick={fetchSlides}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-8 py-8 flex flex-col gap-10">
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Failed to load</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
              <button
                onClick={fetchSlides}
                className="text-sm font-medium text-red-700 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Hero Carousel Slides ────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Hero Carousel Slides
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag to reorder. Max {MAX_SLIDES} slides. Only active slides
                appear in the app.
              </p>
            </div>
            <button
              onClick={() => setModalSlide(false)}
              disabled={slides.length >= MAX_SLIDES}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#05015A] hover:bg-[#06018a] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Add Slide
              {slides.length >= MAX_SLIDES && ` (max ${MAX_SLIDES})`}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonSlide key={i} />)
            ) : slides.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Plus size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  No slides yet
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Create your first hero carousel slide
                </p>
                <button
                  onClick={() => setModalSlide(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#05015A] rounded-lg"
                >
                  Add First Slide
                </button>
              </div>
            ) : (
              slides.map((slide, index) => (
                <div
                  key={slide.slideId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <SlideCard
                    slide={slide}
                    onRefetch={fetchSlides}
                    onEdit={(s) => setModalSlide(s)}
                    dragHandleProps={{}}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Strip Banner ──────────────────────────────────────────────────── */}
        <StripBannerSection />
      </div>

      {/* Modal */}
      {modalSlide !== null && (
        <SlideFormModal
          slide={modalSlide === false ? null : modalSlide}
          onClose={() => setModalSlide(null)}
          onSave={handleModalSave}
          onRefetch={fetchSlides}
        />
      )}
    </div>
  );
}