// landing-web/src/pages/landingPages/Services/components/HowItWorks.jsx (do not remove this comment)
// HowItWorks.jsx

import { useState, useEffect, useRef } from "react";
import {
  FileSearch,
  ClipboardList,
  CreditCard,
  PackageCheck,
  MapPin,
  Truck,
} from "lucide-react";

const steps = [
  { icon: FileSearch, title: "Browse & Search", description: "Search medicines by condition." },
  { icon: ClipboardList, title: "Place Order", description: "Add, upload, and order." },
  { icon: CreditCard, title: "Select Payment", description: "Pick your payment method." },
  { icon: PackageCheck, title: "Dispatch Update", description: "Order confirmed and dispatched." },
  { icon: MapPin, title: "Track in Real Time", description: "Live map order tracking." },
  { icon: Truck, title: "Receive & Pay", description: "Delivered and payment collected." },
];

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================
const useInView = (threshold = 0.2) => {
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
// STEP CARD COMPONENT
// ============================================
const StepCard = ({ step, stepNumber, isVisible, delay = 0 }) => {
  const Icon = step.icon;

  return (
    <div
      className={`flex flex-col items-center text-center px-1 sm:px-2
                  transition-all duration-700 ease-out
                  ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Step Label */}
      <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase mb-2">
        Step {stepNumber}
      </span>

      {/* Icon Circle */}
      <div
        className="relative w-[68px] h-[68px] lg:w-[76px] lg:h-[76px] rounded-full
                    border-2 border-gray-200 bg-white shadow-sm
                    flex items-center justify-center mb-3
                    hover:border-indigo-400 hover:shadow-lg hover:scale-110
                    transition-all duration-300 group cursor-pointer"
        role="img"
        aria-label={step.title}
      >
        <Icon
          size={26}
          strokeWidth={1.5}
          className="text-gray-600 group-hover:text-indigo-600 transition-colors duration-300"
        />

        {/* Hover ring effect */}
        <div
          className="absolute inset-0 rounded-full border-2 border-indigo-400/0
                      group-hover:border-indigo-400/20 group-hover:scale-[1.3]
                      transition-all duration-500 pointer-events-none"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm lg:text-[15px] font-semibold text-gray-900 mb-1">
        {step.title}
      </h3>

      {/* Description */}
      <p className="text-[11px] lg:text-xs text-gray-500 max-w-[170px] lg:max-w-[200px] leading-relaxed">
        {step.description}
      </p>
    </div>
  );
};

// ============================================
// HORIZONTAL ARROW CONNECTOR
// ============================================
const HorizontalArrow = ({ direction = "right", isVisible, delay = 0 }) => {
  return (
    <div
      className={`self-start flex items-center justify-center
                  w-10 sm:w-12 lg:w-16 xl:w-20
                  pt-[48px] lg:pt-[52px]
                  transition-all duration-500 ease-out
                  ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 60 16"
        className="w-full h-4 text-gray-300 overflow-visible"
        fill="none"
      >
        {direction === "right" ? (
          <>
            <line
              x1="0" y1="8" x2="46" y2="8"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 3"
              className={isVisible ? "animate-draw-line-right" : ""}
            />
            <polygon points="42,3 54,8 42,13" fill="currentColor" />
          </>
        ) : (
          <>
            <line
              x1="14" y1="8" x2="60" y2="8"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 3"
              className={isVisible ? "animate-draw-line-left" : ""}
            />
            <polygon points="18,3 6,8 18,13" fill="currentColor" />
          </>
        )}
      </svg>
    </div>
  );
};

// ============================================
// CURVED VERTICAL CONNECTOR (between rows)
// ============================================
const CurvedConnector = ({ isVisible }) => (
  <div
    className={`flex justify-center py-2 lg:py-3
                transition-all duration-700 ease-out
                ${isVisible ? "opacity-100" : "opacity-0"}`}
    style={{ transitionDelay: "500ms", transformOrigin: "top" }}
    aria-hidden="true"
  >
    <svg
      width="40"
      height="64"
      viewBox="0 0 40 64"
      className="text-gray-300"
      fill="none"
    >
      <path
        d="M20 0 C20 20, 30 24, 30 32 C30 40, 20 44, 20 64"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 3"
      />
      <polygon points="15,56 20,66 25,56" fill="currentColor" />
    </svg>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const HowItWorks = () => {
  const [sectionRef, isVisible] = useInView(0.1);

  return (
    <section
      ref={sectionRef}
      className="py-14 sm:py-20 lg:py-28 bg-[#f8f8fc]"
      aria-labelledby="how-it-works-title"
    >
      <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ==================== HEADER ==================== */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
          <h2
            id="how-it-works-title"
            className={`text-2xl sm:text-3xl md:text-[2.1rem] font-bold text-[#1e1b4b] mb-3
                        transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            Discover How Our Ordering Software Works
          </h2>
          <p
            className={`text-sm sm:text-base text-gray-500 max-w-lg mx-auto
                        transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "150ms" }}
          >
            Simplify medicine ordering with smart search, quick checkout, and delivery.
          </p>
        </div>

        {/* ==========================================
            DESKTOP / TABLET LAYOUT (md and up)
            ========================================== */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start">
          {/* ===== ROW 1: Step 1 → 2 → 3 ===== */}
          <StepCard step={steps[0]} stepNumber={1} isVisible={isVisible} delay={200} />
          <HorizontalArrow direction="right" isVisible={isVisible} delay={350} />
          <StepCard step={steps[1]} stepNumber={2} isVisible={isVisible} delay={400} />
          <HorizontalArrow direction="right" isVisible={isVisible} delay={550} />
          <StepCard step={steps[2]} stepNumber={3} isVisible={isVisible} delay={600} />

          {/* ===== ROW 2: Curved Connector ===== */}
          <div aria-hidden="true" />
          <div aria-hidden="true" />
          <div aria-hidden="true" />
          <div aria-hidden="true" />
          <CurvedConnector isVisible={isVisible} />

          {/* ===== ROW 3: Step 6 ← 5 ← 4 ===== */}
          <StepCard step={steps[5]} stepNumber={6} isVisible={isVisible} delay={900} />
          <HorizontalArrow direction="left" isVisible={isVisible} delay={850} />
          <StepCard step={steps[4]} stepNumber={5} isVisible={isVisible} delay={800} />
          <HorizontalArrow direction="left" isVisible={isVisible} delay={750} />
          <StepCard step={steps[3]} stepNumber={4} isVisible={isVisible} delay={700} />
        </div>

        {/* ==========================================
            MOBILE LAYOUT (below md)
            ========================================== */}
        <div className="md:hidden max-w-sm mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <div
                key={idx}
                className={`relative flex gap-4 transition-all duration-700
                            ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
                style={{ transitionDelay: `${idx * 150 + 200}ms` }}
              >
                {/* Timeline Rail */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full
                                border-2 border-gray-200 bg-white shadow-sm
                                flex items-center justify-center z-10
                                hover:border-indigo-400 hover:shadow-md
                                transition-all duration-300"
                    role="img"
                    aria-label={step.title}
                  >
                    <Icon size={20} strokeWidth={1.5} className="text-gray-600" />

                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white
                                   text-[9px] font-bold rounded-full flex items-center justify-center
                                   shadow-sm"
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className="relative w-0.5 flex-1 min-h-[28px] my-1">
                      <div
                        className="absolute inset-0 bg-repeat-y"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, #d1d5db 50%, transparent 50%)`,
                          backgroundSize: "2px 8px",
                        }}
                      />
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                        <svg width="8" height="6" viewBox="0 0 8 6" className="text-gray-300">
                          <polygon points="0,0 4,6 8,0" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="pt-2 pb-7">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;