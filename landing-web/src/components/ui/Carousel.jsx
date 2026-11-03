// landing-web/src/components/ui/Carousel.jsx (do not remove this comment)
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Carousel = ({
  items = [],
  autoPlay = true,
  autoPlayInterval = 4000,
  showArrows = true,
  showDots = true,
  pauseOnHover = true,
  imageFit = "contain",
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalItems = items.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goToSlide = (index) => setCurrentIndex(index);

  useEffect(() => {
    if (!autoPlay || isPaused || totalItems <= 1) return;
    const id = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(id);
  }, [autoPlay, autoPlayInterval, goToNext, isPaused, totalItems]);

  const touchStartX = useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) goToNext();
    else if (diff < -50) goToPrev();
  };

  const fitClass =
    imageFit === "cover"
      ? "object-cover"
      : imageFit === "fill"
      ? "object-fill"
      : "object-contain";

  if (!items.length) return null;

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Slide Area ── */}
      {/* pt-5 = breathing room so labels aren't cut at the very top */}
      <div className="relative pt-5">
        <div className="relative">

          {/* ★ GHOST IMAGE — sets container height from ACTUAL image dims */}
          <div className="invisible pointer-events-none select-none p-2 sm:p-3" aria-hidden="true">
            <img
              src={items[0]?.image}
              alt=""
              className="w-full h-auto"
            />
          </div>

          {/* ★ ACTUAL SLIDES — absolutely stacked on top of ghost */}
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className={`absolute inset-0 transition-all duration-700 ease-out
                ${index === currentIndex
                  ? "opacity-100 scale-100 z-20"
                  : "opacity-0 scale-95 z-10 pointer-events-none"
                }`}
            >
              {/* ★ LABEL — lives OUTSIDE the card, never clipped */}
              {item.label && (
                <div
                  className={`absolute -top-3 z-40
                    ${item.labelPosition === "left" ? "left-4 sm:left-5" : "right-4 sm:right-5"}
                    px-4 py-1.5 bg-gradient-to-r ${item.labelGradient}
                    text-white text-[11px] sm:text-xs font-semibold rounded-full shadow-lg`}
                >
                  {item.label}
                </div>
              )}

              {/* ★ CARD — glass border container (NO overflow-hidden here) */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl">

                {/* ★ IMAGE WRAPPER — overflow-hidden ONLY here */}
                <div className="w-full h-full p-2 sm:p-3">
                  <div className="w-full h-full overflow-hidden rounded-lg sm:rounded-xl bg-black/10">
                    <img
                      src={item.image}
                      alt={item.label || ""}
                      draggable={false}
                      loading="lazy"
                      className={`w-full h-full ${fitClass}`}
                    />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Arrows ── */}
      {showArrows && totalItems > 1 && (
        <>
          <button
            onClick={goToPrev}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30
              w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-md
              border border-white/20 text-white flex items-center justify-center
              hover:bg-white/25 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30
              w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-md
              border border-white/20 text-white flex items-center justify-center
              hover:bg-white/25 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* ── Dots ── */}
      {showDots && totalItems > 1 && (
        <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-5">
          {items.map((item, index) => (
            <button
              key={item.id || index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3
                py-1 sm:py-1.5 rounded-full backdrop-blur-md border transition-all
                ${index === currentIndex
                  ? "bg-white/20 border-white/40"
                  : "bg-white/5 border-white/10 hover:bg-white/15"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all
                  ${index === currentIndex
                    ? "bg-white shadow-[0_0_6px_white]"
                    : "bg-white/40 group-hover:bg-white/70"
                  }`}
              />
              <span
                className={`hidden sm:inline text-xs font-medium
                  ${index === currentIndex ? "text-white" : "text-white/50"}`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;