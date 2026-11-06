// landing-web/src/pages/landingPages/home/components/Testimonials.jsx (do not remove this comment)

import { useEffect, memo, useRef, useState, useCallback } from "react";
import AOS from "aos";
import { Quote } from "lucide-react";

// ============================================
// CONSTANTS
// ============================================
const TESTIMONIALS_DATA = [
  {
    id: 1,
    name: "Arjun Nair",
    role: "Owner, Nair Medicals",
    image:
      "https://cureli-prod-assets.s3.ap-south-1.amazonaws.com/public-website/testimonial-avatr/testimonial-avatar-1.jpg",
    text:
      "Cureli helped us modernize our pharmacy operations completely. Billing, inventory, and customer management are now much faster and more organized.",
  },
  {
    id: 2,
    name: "Priya Menon",
    role: "Managing Partner, Medix Pharmacy",
    image:
      "https://cureli-prod-assets.s3.ap-south-1.amazonaws.com/public-website/testimonial-avatr/testimonial-avatar-2.jpg",
    text:
      "The ERP is extremely easy for our staff to use. We reduced manual errors significantly and now manage stock much more efficiently.",
  },
  {
    id: 3,
    name: "Rahul Krishnan",
    role: "Director, CarePlus Pharma",
    image:
      "https://cureli-prod-assets.s3.ap-south-1.amazonaws.com/public-website/testimonial-avatr/testimonial-avatar-3.jpg",
    text:
      "What stood out for us was the speed and simplicity. Cureli gave our pharmacy a proper digital workflow without making things complicated.",
  },
];

const AOS_BASE_DELAY = 120;

// ============================================
// TESTIMONIAL CARD COMPONENT WITH SPOTLIGHT
// ============================================
const TestimonialCard = memo(({ item, index }) => {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-white/5 backdrop-blur-md p-6 xs:p-7 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl flex flex-col cursor-pointer overflow-hidden transition-all duration-500 ease-out hover:shadow-[0_20px_50px_rgba(34,211,238,0.15)] hover:border-white/25 hover:-translate-y-3 hover:scale-[1.02]"
      data-aos="fade-up"
      data-aos-delay={index * AOS_BASE_DELAY}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${(mousePosition.y - 150) / 50}deg) rotateY(${(mousePosition.x - 150) / -50}deg) translateY(-12px) scale(1.02)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)",
        transition: "all 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
      }}
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 211, 238, 0.15), transparent 40%)`,
        }}
      />

      {/* Border Glow Effect */}
      <div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl transition-opacity duration-500 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 211, 238, 0.1), transparent 50%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Content */}
      <div className="relative z-20">
        {/* Quote Icon */}
        <div
          className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mb-5 xs:mb-6 sm:mb-7 shadow-lg shadow-cyan-500/20 transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-cyan-400/40"
        >
          <Quote
            className="text-white transition-all duration-500 group-hover:scale-90"
            size={18}
            fill="white"
          />
        </div>

        {/* Testimonial Text */}
        <p className="font-manrope text-white/75 text-sm xs:text-base sm:text-base md:text-lg leading-relaxed mb-6 xs:mb-7 sm:mb-8 flex-grow transition-all duration-500 group-hover:text-white">
          "{item.text}"
        </p>

        {/* Profile */}
        <div className="flex items-center gap-3 xs:gap-4 mt-auto">
          <div className="relative">
            {/* Image Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 opacity-0 group-hover:opacity-50 blur-md transition-all duration-500" />
            <img
              src={item.image}
              alt={item.name}
              className="relative w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/20 shadow-lg transition-all duration-500 group-hover:border-cyan-400/80 group-hover:scale-110"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-manrope text-sm xs:text-base sm:text-lg font-bold text-white transition-all duration-500 group-hover:text-cyan-300 truncate">
              {item.name}
            </h4>
            <p className="font-manrope text-xs xs:text-sm text-white/50 transition-all duration-500 group-hover:text-white/80 line-clamp-2">
              {item.role}
            </p>
          </div>
        </div>
      </div>

      {/* Background Gradient Effect */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-400/0 via-transparent to-teal-400/0 opacity-0 group-hover:opacity-100 group-hover:from-cyan-400/5 group-hover:to-teal-400/5 transition-all duration-700 pointer-events-none" />

      {/* Shine Effect */}
      <div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.03) 45%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.03) 55%, transparent 60%)",
          backgroundSize: "200% 100%",
          animation: isHovered ? "shine 1.5s ease-in-out" : "none",
        }}
      />
    </div>
  );
});

TestimonialCard.displayName = "TestimonialCard";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <header className="text-center mb-10 xs:mb-12 sm:mb-14 md:mb-16 lg:mb-20">
   
    {/* Title */}
    <h2
      className="font-manrope text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 xs:mb-4 sm:mb-5 px-4"
      data-aos="fade-up"
    >
      <span className="text-white">Words of Praise</span>{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
        from others
      </span>
      <br className="hidden sm:block" />
      <span className="text-white/70">about our presence.</span>
    </h2>

    {/* Subtitle */}
    <p
      className="text-sm xs:text-base sm:text-lg md:text-xl text-white/60 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl mx-auto px-4 xs:px-0 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      See what our clients have to say about their experience working with us.
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
      className="absolute w-64 h-64 xs:w-72 xs:h-72 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] rounded-full animate-float-slow"
      style={{
        background:
          "radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)",
        top: "-5%",
        right: "-5%",
        filter: "blur(60px)",
      }}
    />

    {/* Bottom Left Glow */}
    <div
      className="absolute w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 lg:w-[400px] lg:h-[400px] rounded-full animate-float-medium"
      style={{
        background:
          "radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)",
        bottom: "-5%",
        left: "-5%",
        filter: "blur(60px)",
      }}
    />
  </div>
));

FloatingDecorations.displayName = "FloatingDecorations";

// ============================================
// MAIN TESTIMONIALS COMPONENT
// ============================================
const Testimonials = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    // Add shine animation keyframes
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes shine {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <section
      id="testimonials"
      className="relative py-16 xs:py-20 sm:py-24 md:py-28 lg:py-32 bg-transparent overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      {/* Floating Decorations */}
      <FloatingDecorations />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {/* Section Header */}
        <SectionHeader />

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8">
          {TESTIMONIALS_DATA.map((item, index) => (
            <TestimonialCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;