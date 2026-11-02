// landing-web/src/pages/landingPages/about/components/AboutPartners.jsx (do not remove this comment)
import React, { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import Netmeds from "../../../../assets/images/Netmeds_result.webp";
import Apollo from "../../../../assets/images/Apollo_result.webp";
import CureliLogo from "../../../../assets/images/Cureli_result.webp";
import MedicalCross from "../../../../assets/images/Medical-cross_result.webp";
import SastaSundar from "../../../../assets/images/Sasta-sundar_result.webp";
import HealthcareIllustration from "../../../../assets/images/About-layout_result.webp";

const AboutPartners = () => {
  const trackRef = useRef(null);
  const [animationDuration, setAnimationDuration] = useState(30);

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  // Calculate proper animation duration based on content width
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const calculateDuration = () => {
      const children = track.children;
      const totalItems = children.length / 2; // half are duplicates
      let singleSetWidth = 0;

      for (let i = 0; i < totalItems; i++) {
        singleSetWidth += children[i].offsetWidth;
      }

      // Speed: ~50px per second for smooth feel
      const duration = singleSetWidth / 50;
      setAnimationDuration(Math.max(duration, 15));
    };

    calculateDuration();
    window.addEventListener("resize", calculateDuration);
    return () => window.removeEventListener("resize", calculateDuration);
  }, []);

  const logos = [
    { src: Netmeds, name: "Netmeds" },
    { src: MedicalCross, name: "Medical Cross" },
    { src: SastaSundar, name: "Sasta Sundar" },
    { src: Apollo, name: "Apollo" },
    { src: CureliLogo, name: "Cureli" },
    { src: Netmeds, name: "Netmeds" },
    { src: MedicalCross, name: "Medical Cross" },
    { src: SastaSundar, name: "Sasta Sundar" },
  ];

  // Triple the logos to guarantee no gaps on ultra-wide screens
  const tripleLogos = [...logos, ...logos, ...logos];

  return (
    <>
      {/* ─── SECTION 1: Infinite Logo Carousel ─── */}
      <section className="py-10 sm:py-12 md:py-16 bg-white overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#05015A] text-center mb-6 sm:mb-8 md:mb-12 font-manrope px-4"
            data-aos="fade-up"
          >
            Our Trusted leading healthcare partners.
          </h2>

          {/* Carousel Wrapper */}
          <div className="relative w-full overflow-hidden">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 md:w-28 lg:w-36 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 md:w-28 lg:w-36 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

            {/* Scrolling Track */}
            <div
              ref={trackRef}
              className="flex items-center will-change-transform hover:[animation-play-state:paused]"
              style={{
                animation: `seamlessScroll ${animationDuration}s linear infinite`,
                width: "fit-content",
              }}
            >
              {tripleLogos.map((logo, i) => (
                <div
                  key={`logo-${i}`}
                  className="flex-shrink-0 flex flex-col items-center justify-center px-5 sm:px-7 md:px-9 lg:px-12"
                  style={{ minWidth: "clamp(100px, 12vw, 180px)" }}
                >
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 select-none"
                    draggable={false}
                    loading="lazy"
                  />
                  <span className="text-[10px] sm:text-xs md:text-sm text-[#05015A]/70 mt-1.5 sm:mt-2 font-medium font-manrope whitespace-nowrap">
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Image + Text Layout (40:60) ─── */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-center">

            {/* Left: Illustration — 40% */}
            <div
              data-aos="fade-right"
              className="w-full lg:w-[40%] order-2 lg:order-1"
            >
              <div className="flex justify-center lg:justify-start">
                <img
                  src={HealthcareIllustration}
                  alt="Healthcare Solution"
                  className="w-full max-w-sm sm:max-w-md lg:max-w-full h-auto max-h-[250px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[500px] object-contain"
                />
              </div>
            </div>

            {/* Right: Content — 60% */}
            <div
              data-aos="fade-left"
              className="w-full lg:w-[60%] order-1 lg:order-2"
            >
              <h2 className="font-manrope text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#05015A] mb-3 sm:mb-4 md:mb-6 leading-tight">
                Health, Simplified Completely
              </h2>
              <p className="font-manrope text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed">
                Our vision at Cureli is to empower all pharmacies, from individual outlets to multi-chain pharmacy groups, with intelligent, seamless, and connected technology that helps to revolutionize the way healthcare is delivered. We are on a mission to develop a fully integrated ecosystem in which pharmacists are able to operate with real-time knowledge, operational precision, and absolute confidence in the data they are using. This helps to raise the standard of patient care, pharmacy performance, and the health of the communities they serve.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SEAMLESS SCROLL ANIMATION ─── */}
      <style>{`
        @keyframes seamlessScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-33.3333%, 0, 0);
          }
        }
      `}</style>
    </>
  );
};

export default AboutPartners;