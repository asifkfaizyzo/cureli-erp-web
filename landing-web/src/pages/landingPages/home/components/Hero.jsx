// landing-web/src/pages/landingPages/home/components/Hero.jsx (do not remove this comment)

import { useEffect, memo } from "react";
import AOS from "aos";
import heroBg from "../../../../assets/images/Background.svg";
import phones from "../../../../assets/images/phones.svg";

// ============================================
// FOG PARTICLES DATA
// ============================================
const FOG_PARTICLES = [
  {
    id: 1,
    className:
      "w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] 2xl:w-[32rem] 2xl:h-[32rem]",
    style: {
      background:
        "radial-gradient(circle, rgba(255,0,255,0.25) 0%, rgba(255,0,255,0.1) 40%, transparent 70%)",
      top: "20%",
      left: "30%",
      filter: "blur(60px)",
    },
    animation: "animate-float-slow",
  },
  {
    id: 2,
    className:
      "w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] 2xl:w-[36rem] 2xl:h-[36rem]",
    style: {
      background:
        "radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(167,139,250,0.1) 40%, transparent 70%)",
      top: "40%",
      left: "45%",
      filter: "blur(70px)",
    },
    animation: "animate-float-medium",
  },
  {
    id: 3,
    className:
      "w-44 h-44 xs:w-52 xs:h-52 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 2xl:w-[28rem] 2xl:h-[28rem]",
    style: {
      background:
        "radial-gradient(circle, rgba(129,140,248,0.25) 0%, rgba(129,140,248,0.08) 40%, transparent 70%)",
      top: "50%",
      left: "38%",
      filter: "blur(50px)",
    },
    animation: "animate-float-fast",
  },
];

// ============================================
// FOG PARTICLE COMPONENT
// ============================================
const FogParticle = memo(({ particle }) => (
  <div
    className={`absolute rounded-full ${particle.className} ${particle.animation}`}
    style={particle.style}
    aria-hidden="true"
  />
));
FogParticle.displayName = "FogParticle";

// ============================================
// HERO CONTENT COMPONENT
// ============================================
const HeroContent = memo(() => (
  <div className="text-center lg:text-left" data-aos="fade-right">
    {/* <div className="inline-block px-3 py-1 xs:px-4 xs:py-1.5 mb-4 sm:mb-5 md:mb-6 text-xs xs:text-sm sm:text-base bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
      Decentralized App &amp; Platform
    </div> */}

    <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-semibold leading-tight mb-4 sm:mb-5 md:mb-6">
      Medicine. Management. <br className="hidden xs:block" />
      One Smart Platform.
    </h1>

    <p className="text-sm xs:text-base sm:text-lg md:text-lg lg:text-xl xl:text-xl text-white/80 mb-6 sm:mb-7 md:mb-8 max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto lg:mx-0 leading-relaxed">
      Our patient medicine-ordering app syncs with our pharmacy ERP to deliver
      fast, reliable access to medicines. Manage orders, inventory, billing, and
      operations in one unified platform, with real-time updates and less manual
      work.
    </p>

    <a
      href="/contact"
      className="inline-flex items-center gap-2 px-5 py-2.5 xs:px-6 xs:py-3 sm:px-7 sm:py-3.5 md:px-8 md:py-4 text-sm xs:text-base sm:text-lg border border-white rounded-lg hover:bg-white hover:text-[#05015A] transition-all duration-300 font-medium"
    >
      Get Started
      <span aria-hidden="true">→</span>
    </a>
  </div>
));
HeroContent.displayName = "HeroContent";

// ============================================
// HERO IMAGE COMPONENT
// ============================================
const HeroImage = memo(() => (
  <div
    className="relative flex justify-center lg:justify-end xl:justify-center mt-0 lg:mt-0"
    data-aos="fade-left"
  >
    <img
      src={phones}
      alt="Cureli App Screens showing medicine ordering interface"
      className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[520px] xl:max-w-[580px] 2xl:max-w-[650px] object-contain drop-shadow-2xl"
      loading="eager"
    />
  </div>
));
HeroImage.displayName = "HeroImage";

// ============================================
// MAIN HERO COMPONENT
// ============================================
const Hero = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="home"
      className="relative w-full min-h-screen flex items-center text-white overflow-visible pt-20 pb-24 xs:pt-22 xs:pb-26 sm:pt-24 sm:pb-28 md:pt-28 md:pb-32 lg:pt-24 lg:pb-28 xl:pt-28 xl:pb-32 2xl:pt-32 2xl:pb-36"
      aria-label="Hero section"
    >
      {/* Background */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden="true"
      />

      {/* Fog Particles */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {FOG_PARTICLES.map((particle) => (
          <FogParticle key={particle.id} particle={particle} />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20 items-center">
          {/*  Image — order-1 on mobile (top), order-2 on lg (right) */}
          <div className="order-1 lg:order-2">
            <HeroImage />
          </div>

          {/*  Content — order-2 on mobile (bottom), order-1 on lg (left) */}
          <div className="order-2 lg:order-1">
            <HeroContent />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
