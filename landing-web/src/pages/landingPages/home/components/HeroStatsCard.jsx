// landing-web/src/pages/landingPages/home/components/HeroStatsCard.jsx (do not remove this comment)

import { memo, useMemo } from "react";
import { Star } from "lucide-react";

// ============================================
// CONSTANTS
// ============================================
const RATING = 4.6;
const TOTAL_STARS = 5;

// ============================================
// STAR RATING COMPONENT
// ============================================
const StarRating = memo(({ rating }) => {
  const stars = useMemo(() => {
    return Array.from({ length: TOTAL_STARS }, (_, index) => {
      const starNumber = index + 1;
      const fillPercent = Math.max(0, Math.min(1, rating - starNumber + 1));
      return { starNumber, fillPercent };
    });
  }, [rating]);

  return (
    <div className="flex items-center gap-0.5 xs:gap-1" role="img" aria-label={`Rating: ${rating} out of 5 stars`}>
      {stars.map(({ starNumber, fillPercent }) => (
        <div key={starNumber} className="relative">
          {/* Empty Star */}
          <Star
            className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400"
            aria-hidden="true"
          />
          {/* Filled Star Overlay */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fillPercent * 100}%` }}
          >
            <Star
              className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 fill-white text-white"
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
});

StarRating.displayName = "StarRating";

// ============================================
// RATING SECTION COMPONENT
// ============================================
const RatingSection = memo(({ rating }) => (
  <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 whitespace-nowrap justify-center md:justify-start">
    <span className="text-xl xs:text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-white">
      {rating}
    </span>
    <StarRating rating={rating} />
  </div>
));

RatingSection.displayName = "RatingSection";

// ============================================
// DESCRIPTION SECTION COMPONENT
// ============================================
const DescriptionSection = memo(() => (
  <p className="text-xs xs:text-sm sm:text-sm md:text-base text-white/90 leading-relaxed text-center md:text-left">
    Cureli offers affordable software solutions trusted by{" "}
    <span className="bg-white text-[#2a0a68] px-1.5 py-0.5 xs:px-2 xs:py-1 rounded font-medium inline-block text-xs xs:text-sm sm:text-sm">
      10,000+ healthcare organizations
    </span>{" "}
    of all sizes
  </p>
));

DescriptionSection.displayName = "DescriptionSection";

// ============================================
// CTA BUTTON COMPONENT
// ============================================
const CTAButton = memo(() => (
  <a
    href="contact"
    className="inline-flex items-center justify-center border border-white text-white px-4 py-1.5 xs:px-5 xs:py-2 sm:px-6 sm:py-2.5 md:px-6 md:py-2.5 rounded-lg whitespace-nowrap hover:bg-white hover:text-[#2a0a68] transition-all duration-300 mx-auto md:mx-0 text-xs xs:text-sm sm:text-base font-medium"
  >
    Get Started
  </a>
));

CTAButton.displayName = "CTAButton";

// ============================================
// MAIN HERO STATS CARD COMPONENT
// ============================================
const HeroStatsCard = () => {
  return (
    <div className="bg-[#2a0a68] rounded-xl xs:rounded-2xl px-4 py-3 xs:px-5 xs:py-4 sm:px-6 sm:py-4 md:px-8 md:py-5 lg:px-10 lg:py-6 xl:px-12 xl:py-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10">
        {/* Rating */}
        <RatingSection rating={RATING} />

        {/* Description */}
        <DescriptionSection />

        {/* CTA Button */}
        <CTAButton />
      </div>
    </div>
  );
};

export default HeroStatsCard;