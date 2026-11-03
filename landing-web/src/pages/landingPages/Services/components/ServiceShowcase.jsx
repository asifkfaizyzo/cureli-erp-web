// landing-web/src/pages/landingPages/Services/components/ServiceShowcase.jsx (do not remove this comment)

import { useEffect, memo } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import {
  Package,
  Zap,
  ShoppingCart,
  FileText,
  Clock,
  Users,
} from "lucide-react";
import Carousel from "../../../../components/ui/Carousel";

import erpDashboard from "../../../../assets/images/dashoard_result.webp";
import erpBilling from "../../../../assets/images/purchase_result.webp";
import erpInventory from "../../../../assets/images/sales_result.webp";
import erpReports from "../../../../assets/images/inventory_result.webp";

// ============================================
// CAROUSEL ITEMS
// ============================================
const CAROUSEL_ITEMS = [
  {
    id: "dashboard",
    image: erpDashboard,
    label: "Dashboard",
    labelGradient: "from-purple-600 to-indigo-600",
    labelPosition: "left",
  },
  {
    id: "billing",
    image: erpBilling,
    label: "Billing",
    labelGradient: "from-emerald-500 to-teal-500",
    labelPosition: "right",
  },
  {
    id: "sales",
    image: erpInventory,
    label: "Sales",
    labelGradient: "from-amber-500 to-orange-500",
    labelPosition: "left",
  },
  {
    id: "inventory",
    image: erpReports,
    label: "Inventory",
    labelGradient: "from-blue-500 to-cyan-500",
    labelPosition: "right",
  },
];

// ============================================
// FEATURES DATA
// ============================================
const FEATURES_DATA = [
  { id: 1, icon: Package, text: "Smart Inventory Management" },
  { id: 2, icon: Zap, text: "The Fast & Accurate Billing" },
  { id: 3, icon: ShoppingCart, text: "Purchase & Supplier Management" },
  { id: 4, icon: FileText, text: "Integrated Accounting & Reports" },
  { id: 5, icon: Clock, text: "Expiry & Batch Management" },
  { id: 6, icon: Users, text: "User Roles & Staff Management" },
];

// ============================================
// FEATURE CARD COMPONENT
// ============================================
const FeatureCard = memo(({ feature, index }) => {
  const IconComponent = feature.icon;

  return (
    <div
      className="group flex flex-col items-center text-center gap-2 xs:gap-3  border border-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 hover:bg-white/15 hover:border-white/30 hover:scale-105 transition-all duration-300 cursor-pointer"
      data-aos="fade-up"
      data-aos-delay={index * 80}
    >
      <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
        <IconComponent className="w-5 h-5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
      </div>

      <span className="text-[10px] xs:text-xs sm:text-sm text-white/90 leading-snug font-medium">
        {feature.text}
      </span>
    </div>
  );
});

FeatureCard.displayName = "FeatureCard";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <div className="mb-6 xs:mb-8 sm:mb-10">
   

    {/* Title */}
    <h2
      className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 xs:mb-5 sm:mb-6 leading-tight"
      data-aos="fade-up"
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
        Cureli PharmaERP
      </span>
      {" "}- A Complete Back Office for Your Pharmacy
    </h2>

    {/* Description */}
    <p
      className="text-sm xs:text-base sm:text-lg text-white/70 max-w-xs xs:max-w-sm sm:max-w-lg leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      Cureli PharmaERP is designed specifically for pharmacy business needs. Procurement, stock management, sales, and accounting can all be managed in one place. Every aspect of our ERP is connected and works in harmony with all the others. For example, every sale is connected to stock levels and every purchase is connected to your accounts.
    </p>
  </div>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// FLOATING DECORATIONS
// ============================================
const FloatingDecorations = memo(() => (
  <div
    className="absolute inset-0 overflow-hidden pointer-events-none"
    aria-hidden="true"
  >
    {/* Violet Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#2b0b59]/80 via-[#1b0d73]/50 to-transparent" />

    {/* Floating Orbs */}
    <div
      className="absolute w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full animate-float-slow"
      style={{
        background:
          "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
        top: "-10%",
        left: "-5%",
        filter: "blur(40px)",
      }}
    />

    <div
      className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full animate-float-medium"
      style={{
        background:
          "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
        bottom: "-5%",
        right: "10%",
        filter: "blur(50px)",
      }}
    />
  </div>
));

FloatingDecorations.displayName = "FloatingDecorations";

// ============================================
// MAIN SERVICE SHOWCASE COMPONENT
// ============================================
const ServiceShowcase = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="services"
      className="relative py-12 xs:py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden"
    >
      {/* Floating Decorations */}
      <FloatingDecorations />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl xl:max-w-[1400px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-10 sm:gap-12 md:gap-14 lg:gap-16 items-center">
          {/* LEFT SIDE - Content */}
          <div className="text-white order-2 lg:order-1">
            {/* Section Header */}
            <SectionHeader />

            {/* Feature Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-8 xs:mb-10 sm:mb-12">
              {FEATURES_DATA.map((feature, index) => (
                <FeatureCard key={feature.id} feature={feature} index={index} />
              ))}
            </div>

            {/* CTA Button */}
            <div data-aos="fade-up" data-aos-delay="500">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 xs:gap-3 bg-white text-[#2a0a68] px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 rounded-xl font-semibold text-sm xs:text-base hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300"
              >
                <span>Request ERP Demo</span>
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE - Carousel */}
          <div
  className="relative order-1 lg:order-2"
  data-aos="fade-left"
  data-aos-delay="200"
>
  {/* Glow Effect */}
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="w-[80%] h-[80%] bg-purple-600/30 blur-[80px] sm:blur-[100px] lg:blur-[120px] rounded-full" />
  </div>

  {/* Carousel */}
  <div className="relative z-10">
    <Carousel
  items={CAROUSEL_ITEMS}
  autoPlay={true}
  autoPlayInterval={4000}
  showArrows={true}
  showDots={true}
  pauseOnHover={true}
  imageFit="contain"
  className="w-full max-w-[320px] xs:max-w-[380px] sm:max-w-[480px] md:max-w-[540px] lg:max-w-full mx-auto"
/>
  </div>
</div>
        </div>
      </div>
    </section>
  );
};

export default ServiceShowcase;