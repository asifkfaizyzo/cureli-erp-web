// landing-web/src/pages/landingPages/home/components/PlatformOptions.jsx (do not remove this comment)

import { useEffect, useState, memo } from "react";
import AOS from "aos";
import { Truck, Home, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

// ============================================
// CONSTANTS
// ============================================
const PLATFORMS_DATA = [
  {
    id: 1,
    icon: Truck,
    title: "Cureli Mobile",
    subtitle: "Medicine Delivery Marketplace Platform",
    description:
      "Create and operate a multi-vendor-based medicine delivery marketplace. Cureli Mobile empowers you with complete control and visibility of pharmacy partners, delivery staff, and the customer experience.",
    features: [
      "Geo-based discovery of pharmacies for customers",
      "Live stock availability, pricing, and alternative medicine suggestions",
      "Pharmacy partner promotions and exclusive deals management",
      "Intelligent delivery zone routing for efficient order fulfilment",
    ],
    gradient: "from-indigo-500 to-blue-600",
    lightGradient: "from-indigo-50 to-blue-50",
    borderColor: "border-indigo-200",
    hoverBorderColor: "group-hover:border-indigo-400",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    checkColor: "text-indigo-500",
    hoverShadow: "hover:shadow-indigo-200/50",
  },
  {
    id: 2,
    icon: Home,
    title: "Cureli PharmaERP",
    subtitle: "Your Pharmacy Management Partner",
    description:
      "A dedicated ERP solution that manages all aspects of your pharmacy operations, from procurement to the billing counter.",
    features: [
      "Batch tracking, expiry dates, and intelligent re-ordering.",
      "Compliant billing for both in-store and online sales.",
      "Complete end-to-end management.",
      "Dashboards that provide you with real-time information on your operations.",
      "Bi-directional data sync with the Cureli delivery app.",
    ],
    gradient: "from-indigo-500 to-blue-600",
    lightGradient: "from-indigo-50 to-blue-50",
    borderColor: "border-indigo-200",
    hoverBorderColor: "group-hover:border-indigo-400",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    checkColor: "text-indigo-500",
    hoverShadow: "hover:shadow-indigo-200/50",
  },
];

const INITIAL_FEATURES_SHOWN = 3;
const AOS_BASE_DELAY = 150;

// ============================================
// FEATURE ITEM COMPONENT
// ============================================
const FeatureItem = memo(({ feature, checkColor }) => (
  <li className="flex items-start gap-3 text-gray-700 group/item">
    <CheckCircle
      className={`w-4 h-4 xs:w-5 xs:h-5 ${checkColor} flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover/item:scale-110`}
    />
    <span className="text-sm xs:text-base leading-relaxed transition-colors duration-300 group-hover/item:text-gray-900">
      {feature}
    </span>
  </li>
));

FeatureItem.displayName = "FeatureItem";

// ============================================
// PLATFORM CARD COMPONENT - BALANCED HOVER
// ============================================
// ============================================
// PLATFORM CARD COMPONENT - SLOW SMOOTH HOVER
// ============================================
const PlatformCard = memo(({ platform, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = platform.icon;

  const visibleFeatures = isExpanded
    ? platform.features
    : platform.features.slice(0, INITIAL_FEATURES_SHOWN);

  const hasMoreFeatures = platform.features.length > INITIAL_FEATURES_SHOWN;

  return (
    <div
      className={`group relative rounded-2xl xs:rounded-3xl border-2 ${platform.borderColor} ${platform.hoverBorderColor} bg-gradient-to-br ${platform.lightGradient} p-5 xs:p-6 sm:p-8 md:p-10 shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl ${platform.hoverShadow}`}
      data-aos="fade-up"
      data-aos-delay={index * AOS_BASE_DELAY}
      style={{
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02) translateY(-8px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) translateY(0)";
      }}
    >
      {/* Background Decoration - Animated on hover */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 xs:w-48 xs:h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br ${platform.gradient} opacity-5 group-hover:opacity-15 group-hover:scale-125 group-hover:rotate-12`}
        style={{
          transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden="true"
      />
      <div
        className={`absolute -bottom-16 -left-16 w-32 h-32 xs:w-40 xs:h-40 rounded-full bg-gradient-to-br ${platform.gradient} opacity-5 group-hover:opacity-15 group-hover:scale-125 group-hover:-rotate-12`}
        style={{
          transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden="true"
      />

      {/* Subtle Glow Overlay on Hover */}
      <div
        className={`absolute inset-0 rounded-2xl xs:rounded-3xl bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-[0.03] pointer-events-none`}
        style={{
          transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div
          className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl ${platform.iconBg} mb-4 xs:mb-5 sm:mb-6 shadow-md group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`}
          style={{
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <IconComponent
            className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 ${platform.iconColor} group-hover:scale-110`}
            style={{
              transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* Subtitle Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 xs:px-4 py-1 xs:py-1.5 mb-3 xs:mb-4 rounded-full bg-gradient-to-r ${platform.gradient} shadow-md group-hover:shadow-lg group-hover:translate-x-1`}
          style={{
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <span
            className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-white/80 group-hover:scale-125"
            style={{
              transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <span className="text-xs xs:text-sm font-medium text-white">
            {platform.subtitle}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 xs:mb-3 group-hover:translate-x-0.5"
          style={{
            transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {platform.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm xs:text-base sm:text-base md:text-lg text-gray-600 mb-5 xs:mb-6 sm:mb-8 leading-relaxed group-hover:text-gray-700"
          style={{
            transition: "color 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {platform.description}
        </p>

        {/* Features List */}
        <ul className="space-y-3 xs:space-y-4">
          {visibleFeatures.map((feature, i) => (
            <FeatureItem
              key={i}
              feature={feature}
              checkColor={platform.checkColor}
            />
          ))}
        </ul>

        {/* Read More / Read Less Button - Only on Mobile/Tablet */}
        {hasMoreFeatures && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`mt-4 xs:mt-5 sm:mt-6 inline-flex items-center gap-2 text-sm xs:text-base font-medium ${platform.iconColor} transition-all duration-300 hover:gap-3 lg:hidden`}
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? "Show Less" : "Read More"}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300" />
            ) : (
              <ChevronDown className="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300" />
            )}
          </button>
        )}

        {/* All Features Visible on Large Screens */}
        <ul className="hidden lg:block space-y-4 mt-4">
          {platform.features.slice(INITIAL_FEATURES_SHOWN).map((feature, i) => (
            <FeatureItem
              key={i + INITIAL_FEATURES_SHOWN}
              feature={feature}
              checkColor={platform.checkColor}
            />
          ))}
        </ul>

        {/* CTA Button */}
        <div className="mt-6 xs:mt-8 sm:mt-10">
          <a
            href="contact"
            className={`group/btn inline-flex items-center gap-2 px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-xl bg-gradient-to-r ${platform.gradient} text-white text-sm xs:text-base font-semibold shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5`}
          >
            <span>Get Started</span>
            <svg
              className="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300 group-hover/btn:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
});

PlatformCard.displayName = "PlatformCard";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <header className="text-center mb-10 xs:mb-12 sm:mb-14 md:mb-16 lg:mb-20">
    {/* Badge */}
    {/* <div
      className="inline-flex items-center gap-2 px-4 py-2 mb-4 xs:mb-5 sm:mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-md transition-all duration-500 hover:shadow-lg hover:scale-105"
      data-aos="fade-down"
    >
      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
      <span className="text-sm xs:text-base text-white font-medium">
        Our Platforms
      </span>
    </div> */}

    {/* Title */}
    <h2
      className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-gray-900 mb-3 xs:mb-4 sm:mb-5 px-4 leading-tight"
      data-aos="fade-up"
    >
      Build for Both{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
        Delivery Platform
      </span>
      <br className="hidden xs:block" />
      <span className="xs:hidden"> </span>& Pharmacies Brands
    </h2>

    {/* Subtitle */}
    <p
      className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl mx-auto px-4 xs:px-0 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="100"
    >
     Choose your path and launch your medicines delivery business in weeks, not months.
    </p>
  </header>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// DECORATIVE ELEMENTS
// ============================================
const DecorativeElements = memo(() => (
  <div
    className="absolute inset-0 overflow-hidden pointer-events-none"
    aria-hidden="true"
  >
    {/* Top Left Pattern */}
    <div
      className="absolute w-64 h-64 xs:w-80 xs:h-80 sm:w-96 sm:h-96 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)",
        top: "-10%",
        left: "-5%",
        filter: "blur(40px)",
      }}
    />

    {/* Bottom Right Pattern */}
    <div
      className="absolute w-56 h-56 xs:w-72 xs:h-72 sm:w-80 sm:h-80 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
        bottom: "-5%",
        right: "-5%",
        filter: "blur(40px)",
      }}
    />
  </div>
));

DecorativeElements.displayName = "DecorativeElements";

// ============================================
// MAIN PLATFORM OPTIONS COMPONENT
// ============================================
const PlatformOptions = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="platforms"
      className="relative py-16 xs:py-20 sm:py-24 md:py-28 lg:py-32 bg-white overflow-hidden"
      aria-labelledby="platforms-heading"
    >
      {/* Decorative Elements */}
      <DecorativeElements />

      <div className="relative z-10 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {/* Section Header */}
        <SectionHeader />

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-8 sm:gap-10 md:gap-12">
          {PLATFORMS_DATA.map((platform, index) => (
            <PlatformCard key={platform.id} platform={platform} index={index} />
          ))}
        </div>

        {/* Bottom Connector Visual */}
        <div
          className="mt-12 xs:mt-14 sm:mt-16 md:mt-20 flex justify-center"
          data-aos="fade-up"
          data-aos-delay="400"
        ></div>
      </div>
    </section>
  );
};

export default PlatformOptions;