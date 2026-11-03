// landing-web/src/pages/landingPages/about/components/AboutMission.jsx (do not remove this comment)
// AboutMission.jsx

import { useState, useEffect, useRef } from "react";
import {
  HeartPulse,
  Users,
  ShieldCheck,
  Zap,
  Lightbulb,
} from "lucide-react";

const mission = [
  {
    icon: HeartPulse,
    title: "Empower Healthcare Providers",
    desc: "To empower pharmacies, clinics, diagnostic centers, and hospitals with the technology required to efficiently operate their day-to-day operations and provide quality healthcare services.",
  },
  {
    icon: Users,
    title: "Improve Patient Experiences",
    desc: "To improve the patient experience by streamlining all aspects of the patient journey, including medicine ordering and prescription management.",
  },
  {
    icon: ShieldCheck,
    title: "Ensure Quality & Compliance",
    desc: "To develop and maintain a platform that meets the security and compliance requirements of the healthcare industry.",
  },
  {
    icon: Zap,
    title: "Drive Operational Efficiency",
    desc: "To drive operational efficiency by automating all aspects of the pharmacy operation to reduce costs and allow healthcare providers to focus on more important aspects.",
  },
  {
    icon: Lightbulb,
    title: "Foster Continuous Innovation",
    desc: "To continually innovate our platform to remain relevant in the future.",
  },
];

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
};

// ============================================
// DESKTOP STEP CARD
// ============================================
const StepCard = ({ item, index, isEven, isVisible, delay = 0 }) => {
  const Icon = item.icon;

  return (
    <div
      className={`max-w-md transition-all duration-700 ease-out
                  ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                  ${isEven ? "ml-auto text-right" : "mr-auto text-left"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`relative bg-white rounded-2xl p-6 shadow-sm
                    border border-gray-200/80
                    hover:shadow-md hover:border-[#05015A]/20
                    transition-all duration-300 group
                    ${isEven ? "hover:-translate-x-1" : "hover:translate-x-1"}`}
      >
        {/* Icon + Title Row */}
        <div className={`flex items-center gap-3 mb-3 ${isEven ? "flex-row-reverse" : ""}`}>
          <div
            className="w-10 h-10 rounded-xl bg-[#05015A]/5 border border-[#05015A]/10
                        flex items-center justify-center flex-shrink-0
                        group-hover:bg-[#05015A]/10 group-hover:border-[#05015A]/20
                        transition-all duration-300"
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              className="text-[#05015A]/70 group-hover:text-[#05015A] transition-colors duration-300"
            />
          </div>

          <h3 className="font-manrope font-bold text-lg text-[#05015A]">
            {item.title}
          </h3>
        </div>

        <p
          className={`font-manrope text-sm text-gray-500 leading-relaxed
                      ${isEven ? "pl-0" : "pl-[52px]"}`}
        >
          {item.desc}
        </p>

        {/* Subtle accent line at bottom */}
        <div
          className={`absolute bottom-0 h-[2px] bg-gradient-to-r from-[#05015A]/30 to-transparent
                      rounded-full transition-all duration-300
                      ${isEven ? "right-6 left-6" : "left-6 right-6"}
                      w-0 group-hover:w-[calc(100%-48px)]`}
        />
      </div>
    </div>
  );
};

// ============================================
// CENTER NUMBER CIRCLE
// ============================================
const NumberCircle = ({ number, isVisible, delay = 0, isLast = false }) => (
  <div
    className={`flex-shrink-0 z-10 transition-all duration-500 ease-out
                ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <div className="relative">
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full bg-[#05015A]/10
                    scale-[1.35] animate-pulse"
        style={{ animationDuration: "3s" }}
      />

      {/* Main circle */}
      <div
        className="relative h-14 w-14 lg:h-16 lg:w-16 rounded-full
                    bg-gradient-to-br from-[#05015A] to-[#1a1082]
                    text-white flex items-center justify-center
                    font-bold text-xl lg:text-2xl
                    shadow-lg shadow-[#05015A]/25
                    ring-4 ring-[#EDF2F9]"
      >
        {number}
      </div>
    </div>
  </div>
);

// ============================================
// CONNECTOR LINE (Horizontal - Desktop)
// ============================================
const ConnectorLine = ({ direction = "right", isVisible, delay = 0 }) => (
  <div
    className={`absolute top-1/2 -translate-y-1/2 w-8 h-[2px]
                transition-all duration-500 ease-out
                ${isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
                ${direction === "right"
                  ? "right-1/2 mr-7 origin-right"
                  : "left-1/2 ml-7 origin-left"
                }`}
    style={{ transitionDelay: `${delay}ms` }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 32 2" className="w-full h-full text-[#05015A]/25" fill="none">
      <line
        x1="0" y1="1" x2="32" y2="1"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
    </svg>
  </div>
);

// ============================================
// MOBILE STEP CARD
// ============================================
const MobileStepCard = ({ item, index, isVisible, delay = 0 }) => {
  const Icon = item.icon;
  const isLast = index === mission.length - 1;

  return (
    <div
      className={`relative flex items-start gap-4
                  transition-all duration-700 ease-out
                  ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Timeline Rail */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Number Circle */}
        <div className="relative">
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-full bg-[#05015A]/10 scale-[1.3] animate-pulse"
            style={{ animationDuration: "3s", animationDelay: `${index * 500}ms` }}
          />

          <div
            className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full
                        bg-gradient-to-br from-[#05015A] to-[#1a1082]
                        text-white flex items-center justify-center
                        font-bold text-base sm:text-lg
                        shadow-lg shadow-[#05015A]/20
                        ring-4 ring-[#EDF2F9] z-10"
          >
            {index + 1}
          </div>
        </div>

        {/* Connecting Line */}
        {!isLast && (
          <div className="relative w-[2px] flex-1 min-h-[20px] my-1.5">
            <div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  to bottom,
                  rgba(5, 1, 90, 0.25) 0px,
                  rgba(5, 1, 90, 0.25) 4px,
                  transparent 4px,
                  transparent 8px
                )`,
              }}
            />
            {/* Arrow dot */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
              <svg width="8" height="6" viewBox="0 0 8 6">
                <polygon points="0,0 4,6 8,0" fill="rgba(5,1,90,0.3)" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-7">
        <div
          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5
                      border border-gray-200/80
                      hover:shadow-md hover:border-[#05015A]/15
                      transition-all duration-300 group"
        >
          {/* Icon + Title */}
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#05015A]/5 border border-[#05015A]/10
                          flex items-center justify-center flex-shrink-0
                          group-hover:bg-[#05015A]/10
                          transition-all duration-300"
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className="text-[#05015A]/70 group-hover:text-[#05015A] transition-colors duration-300"
              />
            </div>

            <h3 className="font-manrope font-bold text-[14px] sm:text-[15px] text-[#05015A]">
              {item.title}
            </h3>
          </div>

          <p className="font-manrope text-xs sm:text-[13px] text-gray-500 leading-relaxed pl-[42px] sm:pl-[46px]">
            {item.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AboutMission = () => {
  const [sectionRef, isVisible] = useInView(0.1);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-28 bg-[#EDF2F9]"
      aria-labelledby="mission-title"
    >
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ==================== HEADER ==================== */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          {/* Section Tag */}
          <div
            className={`inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full
                        bg-[#05015A]/5 border border-[#05015A]/10
                        transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="w-1.5 h-1.5 bg-[#05015A] rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#05015A] tracking-wide uppercase font-manrope">
              Our Purpose
            </span>
          </div>

          {/* Title */}
          <h2
            id="mission-title"
            className={`font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-[#05015A] mb-3 sm:mb-4
                        transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "100ms" }}
          >
            Our Mission
          </h2>

          {/* Subtitle */}
          <p
            className={`font-manrope text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed
                        transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "200ms" }}
          >
            Our mission is to continually enhance our platform to allow pharmacies, clinics, and healthcare providers to thrive now and in the future. To achieve our mission, we are dedicated to five core principles that drive our development process.
          </p>

          {/* Decorative Divider */}
          <div
            className={`mx-auto mt-5 flex items-center justify-center gap-1.5
                        transition-all duration-700
                        ${isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="w-8 h-0.5 rounded-full bg-[#05015A]/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#05015A]/30 border-2 border-[#05015A]/15" />
            <div className="w-8 h-0.5 rounded-full bg-[#05015A]/20" />
          </div>
        </div>

        {/* ==================================================
            DESKTOP LAYOUT (md and up) - Center Stepper
            ================================================== */}
        <div className="hidden md:block relative">
          {/* Center Vertical Dashed Line */}
          <div
            className={`absolute left-1/2 top-0 bottom-12 w-[2px] -translate-x-1/2
                        transition-all duration-1000 ease-out origin-top
                        ${isVisible ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"}`}
            style={{ transitionDelay: "350ms" }}
            aria-hidden="true"
          >
            <div
              className="h-full"
              style={{
                background: `repeating-linear-gradient(
                  to bottom,
                  rgba(5, 1, 90, 0.2) 0px,
                  rgba(5, 1, 90, 0.2) 6px,
                  transparent 6px,
                  transparent 12px
                )`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {mission.map((item, index) => {
              const isEven = index % 2 === 0;
              const baseDelay = 400 + index * 150;

              return (
                <div key={index} className="relative pb-12 lg:pb-16 last:pb-0">
                  <div className="flex items-center">
                    {/* Left Content */}
                    <div className="flex-1 pr-6 lg:pr-10">
                      {isEven && (
                        <StepCard
                          item={item}
                          index={index}
                          isEven={true}
                          isVisible={isVisible}
                          delay={baseDelay}
                        />
                      )}
                    </div>

                    {/* Connector - Left Side */}
                    {isEven && (
                      <ConnectorLine
                        direction="right"
                        isVisible={isVisible}
                        delay={baseDelay + 50}
                      />
                    )}

                    {/* Center Circle */}
                    <NumberCircle
                      number={index + 1}
                      isVisible={isVisible}
                      delay={baseDelay + 75}
                      isLast={index === mission.length - 1}
                    />

                    {/* Connector - Right Side */}
                    {!isEven && (
                      <ConnectorLine
                        direction="left"
                        isVisible={isVisible}
                        delay={baseDelay + 50}
                      />
                    )}

                    {/* Right Content */}
                    <div className="flex-1 pl-6 lg:pl-10">
                      {!isEven && (
                        <StepCard
                          item={item}
                          index={index}
                          isEven={false}
                          isVisible={isVisible}
                          delay={baseDelay}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End Marker */}
          <div className="flex justify-center mt-6">
            <div
              className={`transition-all duration-500
                          ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
              style={{ transitionDelay: "1200ms" }}
            >
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-[#05015A]/20 animate-ping absolute inset-0" />
                <div className="w-4 h-4 rounded-full bg-[#05015A]/40 relative" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            MOBILE LAYOUT (below md) - Left Timeline
            ================================================== */}
        <div className="md:hidden max-w-sm mx-auto">
          {mission.map((item, index) => (
            <MobileStepCard
              key={index}
              item={item}
              index={index}
              isVisible={isVisible}
              delay={300 + index * 150}
            />
          ))}

          {/* End Marker */}
          <div className="flex justify-start pl-[18px] sm:pl-[20px]">
            <div
              className={`transition-all duration-500
                          ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
              style={{ transitionDelay: "1100ms" }}
            >
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-[#05015A]/20 animate-ping absolute inset-0" />
                <div className="w-3 h-3 rounded-full bg-[#05015A]/40 relative" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMission;