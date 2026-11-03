// landing-web/src/pages/landingPages/home/components/WhyChooseUs.jsx (do not remove this comment)

import { useEffect, memo } from "react";
import AOS from "aos";
import {
  Layers,
  Workflow,
  Zap,
  ShieldCheck,
  HeartHandshake,
  TrendingUp,
} from "lucide-react";
import SpotlightCard from "../../../../components/ui/SpotlightCard";

// ============================================
// CONSTANTS
// ============================================
const ITEMS_DATA = [
  {
    id: 1,
    icon: Layers,
    title: "One Unified Platform",
    desc: "Manage your app, ERP, and pharmacy business with one solution. No third-party integrations, no duplicate data entry, no data silos.",
    spotlightColor: "rgba(99, 102, 241, 0.3)",
    iconBg: "from-indigo-500 to-purple-600",
  },
  {
    id: 2,
    icon: Workflow,
    title: "Live App-ERP Synchronisation",
    desc: "Each app order is reflected in our ERP in real-time. No manual intervention needed. No missed orders. No missed opportunities.",
    spotlightColor: "rgba(168, 85, 247, 0.3)",
    iconBg: "from-purple-500 to-pink-600",
  },
  {
    id: 3,
    icon: Zap,
    title: "Faster, More Accurate Operations",
    desc: "Automate bill generation, calculation, and report generation. Reduce errors. Focus on delivering better customer service.",
    spotlightColor: "rgba(236, 72, 153, 0.3)",
    iconBg: "from-pink-500 to-rose-600",
  },
  {
    id: 4,
    icon: ShieldCheck,
    title: "Enterprise-Grade Security & Reliability",
    desc: "Your data is safe with us. Our servers are up and running, ensuring our solution is available when you need it. Our solution is compliant with industry regulations.",
    spotlightColor: "rgba(34, 197, 94, 0.3)",
    iconBg: "from-emerald-500 to-teal-600",
  },
  {
    id: 5,
    icon: HeartHandshake,
    title: "Enhanced Patient Experience",
    desc: "The app allows patients to search for medicines, upload prescriptions, track orders, and receive updates on their orders in real-time.",
    spotlightColor: "rgba(251, 146, 60, 0.3)",
    iconBg: "from-orange-500 to-amber-600",
  },
  {
    id: 6,
    icon: TrendingUp,
    title: "Scalable by Design",
    desc: "From a single counter to a multiple-branch network with centralized reporting, Cureli can grow with your pharmacy or healthcare business.",
    spotlightColor: "rgba(59, 130, 246, 0.3)",
    iconBg: "from-blue-500 to-cyan-600",
  },
];

const AOS_BASE_DELAY = 100;

// ============================================
// FEATURE CARD COMPONENT
// ============================================
const FeatureCard = memo(({ item, index }) => {
  const IconComponent = item.icon;

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * AOS_BASE_DELAY}
      className="h-full"
    >
      <SpotlightCard
        className="h-full bg-white/5 backdrop-blur-md p-6 xs:p-7 sm:p-8 group cursor-pointer"
        spotlightColor={item.spotlightColor}
        borderColor="rgba(255, 255, 255, 0.08)"
        hoverBorderColor="rgba(255, 255, 255, 0.25)"
      >
        {/* Icon Container */}
        <div
          className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center mb-4 xs:mb-5 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          <IconComponent className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-lg xs:text-xl sm:text-xl md:text-2xl font-semibold text-white mb-2 xs:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all duration-300">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm xs:text-base sm:text-base text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
          {item.desc}
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
      Why Choose{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
        Us?
      </span>
    </h2>

    {/* Subtitle */}
    <p
      className="text-base xs:text-lg sm:text-lg md:text-xl text-white/70 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 xs:px-0 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      Cureli is designed exclusively for pharmacy businesses. It is not a generic solution like other retail management solutions. This is why over 10,000 businesses trust us to operate their businesses.
    </p>
  </header>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// FLOATING DECORATIONS COMPONENT
// ============================================
const FloatingDecorations = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {/* Top Left Glow */}
    <div
      className="absolute w-72 h-72 xs:w-80 xs:h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] rounded-full animate-float-slow"
      style={{
        background:
          "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)",
        top: "-10%",
        left: "-5%",
        filter: "blur(60px)",
      }}
    />

    {/* Bottom Right Glow */}
    <div
      className="absolute w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 lg:w-[400px] lg:h-[400px] rounded-full animate-float-medium"
      style={{
        background:
          "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
        bottom: "-5%",
        right: "-5%",
        filter: "blur(60px)",
      }}
    />

    {/* Center Accent */}
    <div
      className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full animate-float-fast"
      style={{
        background:
          "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
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
// MAIN WHY CHOOSE US COMPONENT
// ============================================
const WhyChooseUs = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="why-choose-us"
      className="relative py-16 xs:py-20 sm:py-24 md:py-28 lg:py-32 bg-transparent overflow-hidden"
      aria-labelledby="why-choose-us-heading"
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
          {ITEMS_DATA.map((item, index) => (
            <FeatureCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-12 xs:mt-14 sm:mt-16 md:mt-20 text-center"
          data-aos="fade-up"
          data-aos-delay="600"
        >
          <a
            href="\contact"
            className="inline-flex items-center gap-2 xs:gap-3 px-6 xs:px-8 py-3 xs:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm xs:text-base sm:text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            <span>Get Started Today</span>
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

export default WhyChooseUs;