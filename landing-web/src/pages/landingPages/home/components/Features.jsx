// landing-web/src/pages/landingPages/home/components/Features.jsx (do not remove this comment)

import { useEffect, memo } from "react";
import AOS from "aos";
import {
  Sparkles,
  Smile,
  Dumbbell,
  Pill,
  Baby,
  HeartPulse,
  Leaf,
  PawPrint,
} from "lucide-react";
import featuresImage from "../../../../assets/images/layout-left.svg";

// ============================================
// CONSTANTS
// ============================================
const FEATURES_DATA = [
  {
    id: 1,
    icon: Sparkles,
    title: "Look & Feel Good",
    desc: "Explore top beauty and personal care products for a confident, radiant you.",
  },
  {
    id: 2,
    icon: Smile,
    title: "Lifestyle Essentials",
    desc: "Everything you need to support a balanced, healthy, and fulfilling everyday lifestyle.",
  },
  {
    id: 3,
    icon: Dumbbell,
    title: "Stay Fit, Stay Healthy",
    desc: "Fitness and wellness products to keep your body active and performing well.",
  },
  {
    id: 4,
    icon: Pill,
    title: "Relief Essentials",
    desc: "Fast-acting remedies and comfort solutions to ease pain and everyday discomfort effectively.",
  },
  {
    id: 5,
    icon: Baby,
    title: "For All Your Baby's Needs",
    desc: "Gentle, trusted products carefully chosen to keep your little one safe and happy.",
  },
  {
    id: 6,
    icon: HeartPulse,
    title: "Health Essentials",
    desc: "Daily health must-haves to support your overall well-being and long-term vitality.",
  },
  {
    id: 7,
    icon: Leaf,
    title: "Ayurvedic Essentials",
    desc: "Ancient herbal wisdom meets modern wellness, natural products for holistic everyday health.",
  },
  {
    id: 8,
    icon: PawPrint,
    title: "Veterinary Care",
    desc: "Premium health and nutrition products to keep your pets happy and healthy.",
  },
];

const AOS_BASE_DELAY = 80;

// ============================================
// FEATURE CARD COMPONENT
// ============================================
const FeatureCard = memo(({ feature, index }) => {
  const IconComponent = feature.icon;

  return (
    <article
      className="flex gap-3 xs:gap-4 sm:gap-4 md:gap-5"
      data-aos="fade-left"
      data-aos-delay={index * AOS_BASE_DELAY}
    >
      {/* Icon */}
      <div
        className="text-[#2E3192] mt-0.5 xs:mt-1 flex-shrink-0"
        aria-hidden="true"
      >
        <IconComponent className="w-5 h-5 xs:w-6 xs:h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-7 lg:h-7" />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-base xs:text-lg sm:text-lg md:text-xl lg:text-xl font-semibold text-gray-800 mb-1 xs:mb-1.5 sm:mb-2">
          {feature.title}
        </h3>
        <p className="text-xs xs:text-sm sm:text-sm md:text-base text-gray-500 leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </article>
  );
});

FeatureCard.displayName = "FeatureCard";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <header className="text-center mb-10 xs:mb-12 sm:mb-14 md:mb-16 lg:mb-20">
    <h2
      className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-semibold text-[#2E3192] mb-3 xs:mb-4 sm:mb-5 leading-tight"
      data-aos="fade-up"
    >
      What You Can Order
    </h2>

    <p
      className="text-sm xs:text-base sm:text-base md:text-lg lg:text-xl text-gray-500 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 xs:px-4 sm:px-0 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="150"
    >
      Each component of Cureli has been designed to ensure a smooth experience
      for customers placing orders and to make it easy for you and your team to
      process them. Here's what the system can get you right out of the box.
    </p>
  </header>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// FEATURES IMAGE COMPONENT
// ============================================
const FeaturesImage = memo(() => (
  <div
    className="flex justify-center lg:justify-start order-2 lg:order-1"
    data-aos="fade-right"
  >
    <div className="h-[250px] xs:h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] xl:h-[480px] 2xl:h-[520px] flex items-center">
      <img
        src={featuresImage}
        alt="Cureli app interface showing product categories"
        className="h-full w-auto object-contain"
        loading="lazy"
      />
    </div>
  </div>
));

FeaturesImage.displayName = "FeaturesImage";

// ============================================
// FEATURES GRID COMPONENT
// ============================================
const FeaturesGrid = memo(() => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 gap-6 xs:gap-8 sm:gap-x-8 sm:gap-y-10 md:gap-x-10 md:gap-y-12 lg:gap-x-10 lg:gap-y-10 xl:gap-x-12 xl:gap-y-12 order-1 lg:order-2"
    role="list"
    aria-label="Product categories"
  >
    {FEATURES_DATA.map((feature, index) => (
      <FeatureCard key={feature.id} feature={feature} index={index} />
    ))}
  </div>
));

FeaturesGrid.displayName = "FeaturesGrid";

// ============================================
// MAIN FEATURES COMPONENT
// ============================================
const Features = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="features"
      className="pt-28 pb-12 xs:pt-32 xs:pb-16 sm:pt-28 sm:pb-20 md:pt-28 md:pb-24 lg:pt-28 lg:pb-24 xl:pt-32 xl:pb-28 2xl:pt-36 2xl:pb-32 bg-[#F4F5F7]"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {/* Section Header */}
        <SectionHeader />

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-10 sm:gap-12 md:gap-14 lg:gap-16 xl:gap-20 2xl:gap-24 items-start">
          {/* Left - Image */}
          <FeaturesImage />

          {/* Right - Features Grid */}
          <FeaturesGrid />
        </div>
      </div>
    </section>
  );
};

export default Features;