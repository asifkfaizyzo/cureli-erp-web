// landing-web/src/pages/landingPages/Services/components/Features.jsx (do not remove this comment)

import { useEffect, memo } from "react";
import AOS from "aos";
import {
  ShoppingCart,
  Package,
  FileText,
  CreditCard,
  Star,
  MapPin,
} from "lucide-react";
import SpotlightCard from "../../../../components/ui/SpotlightCard";

// ============================================
// CONSTANTS
// ============================================
const FEATURES_DATA = [
  {
    id: 1,
    icon: ShoppingCart,
    title: "Order Management",
    desc: "Manage, place, and track medicine orders in real time. Pharmacy staff can manage the entire process on one screen.",
    spotlightColor: "rgba(139, 92, 246, 0.3)",
    iconBg: "from-violet-500 to-purple-600",
  },
  {
    id: 2,
    icon: Package,
    title: "Inventory Management",
    desc: "Get real-time updates on the stock levels of all products. Receive automated alerts before the stock runs out.",
    spotlightColor: "rgba(59, 130, 246, 0.3)",
    iconBg: "from-blue-500 to-indigo-600",
  },
  {
    id: 3,
    icon: FileText,
    title: "Real-Time Order Status",
    desc: "Customers will be updated on the status of their orders, such as accepted, being prepared, dispatched, and delivered. This will save on calls and ensure satisfaction.",
    spotlightColor: "rgba(16, 185, 129, 0.3)",
    iconBg: "from-emerald-500 to-teal-600",
  },
  {
    id: 4,
    icon: CreditCard,
    title: "Flexible Payment Options",
    desc: "Process payments through various payment gateways with security and encryption. Each transaction will be traceable.",
    spotlightColor: "rgba(245, 158, 11, 0.3)",
    iconBg: "from-amber-500 to-orange-600",
  },
  {
    id: 5,
    icon: Star,
    title: "Ratings & Reviews",
    desc: "Collect structured reviews from the customer after each order. Identify gaps in the service and enhance the delivery process with the data obtained.",
    spotlightColor: "rgba(236, 72, 153, 0.3)",
    iconBg: "from-pink-500 to-rose-600",
  },
  {
    id: 6,
    icon: MapPin,
    title: "Delivery Zone Management",
    desc: "Set up delivery zones and allocate drivers to these zones. Optimize routes to minimize delivery time and cost.",
    spotlightColor: "rgba(6, 182, 212, 0.3)",
    iconBg: "from-cyan-500 to-blue-600",
  },
];

const AOS_BASE_DELAY = 100;

// ============================================
// FEATURE CARD COMPONENT
// ============================================
const FeatureCard = memo(({ feature, index }) => {
  const IconComponent = feature.icon;

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * AOS_BASE_DELAY}
      className="h-full"
    >
      <SpotlightCard
        className="h-full bg-white/5 backdrop-blur-md p-6 xs:p-7 sm:p-8 group cursor-pointer"
        spotlightColor={feature.spotlightColor}
        borderColor="rgba(255, 255, 255, 0.08)"
        hoverBorderColor="rgba(255, 255, 255, 0.25)"
      >
        {/* Icon Container */}
        <div
          className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-4 xs:mb-5 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          <IconComponent className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-lg xs:text-xl sm:text-xl md:text-2xl font-semibold text-white mb-2 xs:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all duration-300">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-sm xs:text-base sm:text-base text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
          {feature.desc}
        </p>
      </SpotlightCard>
    </div>
  );
});

FeatureCard.displayName = "FeatureCard";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <header className="text-center mb-12 xs:mb-14 sm:mb-16 md:mb-20">
    {/* Title */}
    <h2
      className="text-3xl xs:text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 xs:mb-5 sm:mb-6"
      data-aos="fade-up"
    >
      Key Features of the{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
        Cureli
      </span>
      <br className="hidden sm:block" />
      <span className="sm:hidden"> </span>
      Medicine Ordering App
    </h2>

    {/* Subtitle */}
    <p
      className="text-base xs:text-lg sm:text-lg md:text-xl text-white/70 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 xs:px-0 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      Each and every feature of the app has been designed with the requirements of the pharmacy in mind, making the process smoother for the customer as well as the staff. These are the key features of the app.
    </p>
  </header>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// FLOATING DECORATIONS COMPONENT
// ============================================
const FloatingDecorations = memo(() => (
  <div
    className="absolute inset-0 overflow-hidden pointer-events-none"
    aria-hidden="true"
  >
    {/* Top Right Glow */}
    <div
      className="absolute w-72 h-72 xs:w-80 xs:h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] rounded-full animate-float-slow"
      style={{
        background:
          "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
        top: "-10%",
        right: "-5%",
        filter: "blur(60px)",
      }}
    />

    {/* Bottom Left Glow */}
    <div
      className="absolute w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 lg:w-[400px] lg:h-[400px] rounded-full animate-float-medium"
      style={{
        background:
          "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
        bottom: "-5%",
        left: "-5%",
        filter: "blur(60px)",
      }}
    />

    {/* Center Accent */}
    <div
      className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full animate-float-fast"
      style={{
        background:
          "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        filter: "blur(50px)",
      }}
    />
  </div>
));

FloatingDecorations.displayName = "FloatingDecorations";

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
      className="relative py-16 xs:py-20 sm:py-24 md:py-28 lg:py-32 bg-transparent overflow-hidden"
      aria-labelledby="features-heading"
    >
      {/* Floating Decorations */}
      <FloatingDecorations />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {/* Section Header */}
        <SectionHeader />

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
          {FEATURES_DATA.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-12 xs:mt-14 sm:mt-16 md:mt-20 text-center"
          data-aos="fade-up"
          data-aos-delay="600"
        >
          <a
            href="/contact"
            className="inline-flex items-center gap-2 xs:gap-3 px-6 xs:px-8 py-3 xs:py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm xs:text-base sm:text-lg font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-violet-500/25"
          >
            <span>Explore All Features</span>
            <svg
              className="w-4 h-4 xs:w-5 xs:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;