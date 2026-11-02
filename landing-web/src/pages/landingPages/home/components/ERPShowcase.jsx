// landing-web/src/pages/landingPages/home/components/ERPShowcase.jsx (do not remove this comment)

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import erpDashboard from "../../../../assets/images/dashoard_result.webp";
import erpBilling from "../../../../assets/images/purchase_result.webp";
import erpInventory from "../../../../assets/images/sales_result.webp";
import erpReports from "../../../../assets/images/inventory_result.webp";

const CARDS = [
  {
    id: "dashboard",
    image: erpDashboard,
    alt: "ERP Dashboard - Admin interface with summary cards, sidebar navigation, supplier lists and operational widgets",
    label: "Dashboard",
    labelGradient: "from-purple-600 to-indigo-600",
    labelPosition: "left",
  },
  {
    id: "billing",
    image: erpBilling,
    alt: "ERP Billing - Sales invoice screen with product table, customer details, and payment summary",
    label: "Billing",
    labelGradient: "from-emerald-500 to-teal-500",
    labelPosition: "right",
  },
  {
    id: "sales",
    image: erpInventory,
    alt: "ERP Inventory - Stock management with batch tracking, expiry alerts, and reorder levels",
    label: "Sales",
    labelGradient: "from-amber-500 to-orange-500",
    labelPosition: "left",
  },
  {
    id: "inventory",
    image: erpReports,
    alt: "ERP Reports - Analytics dashboard with sales charts, purchase trends, and financial summaries",
    label: "Inventory",
    labelGradient: "from-blue-500 to-cyan-500",
    labelPosition: "right",
  },
];

const SHUFFLE_INTERVAL = 4000;

const ERPShowcase = () => {
  const [frontIndex, setFrontIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const shuffleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setFrontIndex((prev) => (prev + 1) % CARDS.length);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating]);

  const goToCard = useCallback(
    (index) => {
      if (index === frontIndex || isAnimating) return;
      setIsAnimating(true);
      setFrontIndex(index);
      setTimeout(() => setIsAnimating(false), 800);
    },
    [frontIndex, isAnimating],
  );

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(shuffleNext, SHUFFLE_INTERVAL);
    return () => clearInterval(interval);
  }, [shuffleNext, isPaused]);

  const getCardStyle = (cardIndex) => {
    const totalCards = CARDS.length;
    let position = cardIndex - frontIndex;
    if (position < 0) position += totalCards;

    const configs = [
      {
        zIndex: 40,
        transform: "translateX(0px) translateY(0px) rotate(0deg) scale(1)",
        opacity: 1,
        filter: "none",
      },
      {
        zIndex: 30,
        transform: "translateX(20px) translateY(16px) rotate(2deg) scale(0.96)",
        opacity: 0.8,
        filter: "brightness(0.9)",
      },
      {
        zIndex: 20,
        transform: "translateX(40px) translateY(32px) rotate(4deg) scale(0.92)",
        opacity: 0.6,
        filter: "brightness(0.8)",
      },
      {
        zIndex: 10,
        transform: "translateX(60px) translateY(48px) rotate(6deg) scale(0.88)",
        opacity: 0.4,
        filter: "brightness(0.7)",
      },
    ];

    return configs[position] || configs[totalCards - 1];
  };

  return (
    <section className="relative py-14 sm:py-20 lg:py-28 overflow-hidden">
      {/* VIOLET OVERLAY SHADE */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#2b0b59]/70 via-[#1b0d73]/40 to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 items-center gap-10 lg:gap-16">
          {/* LEFT CONTENT */}
          <div className="text-white text-center lg:text-left">
            <div className="inline-block mb-6 px-4 py-1.5 text-sm rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
              Decentralized ERP
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 leading-tight">
              Run Your Pharmacy <br className="hidden sm:block" /> Smarter
            </h2>

            <p className="text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
              Cureli streamlines pharmacy operations by centralizing inventory,
              billing, purchases, suppliers, sales, and reporting into one
              efficient, reliable, and scalable pharmacy management system.
            </p>

            {/* UPDATED: Link to /contact */}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-[#2a0a68] px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              Request ERP Demo
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

          {/* RIGHT MOCKUPS - Shuffling Card Stack */}
          <div
            className="relative flex items-center justify-center 
                        min-h-[320px] sm:min-h-[400px] md:min-h-[460px] lg:min-h-[520px] xl:min-h-[580px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* ===== GLOW EFFECTS ===== */}
            <div
              className="absolute w-[350px] sm:w-[500px] lg:w-[650px] xl:w-[750px] 
                          h-[250px] sm:h-[350px] lg:h-[400px] xl:h-[450px] 
                          bg-purple-600/40 blur-[80px] sm:blur-[100px] lg:blur-[130px] xl:blur-[140px] rounded-full"
            ></div>
            <div className="absolute w-[200px] sm:w-[250px] lg:w-[300px] h-[200px] sm:h-[250px] lg:h-[300px] bg-blue-500/20 blur-[80px] lg:blur-[100px] rounded-full top-0 right-0"></div>
            <div className="absolute w-[180px] sm:w-[220px] lg:w-[250px] h-[180px] sm:h-[220px] lg:h-[250px] bg-violet-400/25 blur-[60px] lg:blur-[80px] rounded-full bottom-0 left-0"></div>

            {/* ===== CARD STACK CONTAINER ===== */}
            <div className="relative w-full max-w-[280px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[520px] xl:max-w-[580px]">
              {/* ===== RENDER ALL 4 CARDS ===== */}
              {CARDS.map((card, index) => (
                <div
                  key={card.id}
                  className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl 
                             p-1.5 sm:p-2 md:p-3 lg:p-4 
                             border border-white/20 shadow-2xl cursor-pointer
                             transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={getCardStyle(index)}
                  onClick={shuffleNext}
                >
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="w-full h-auto rounded-lg sm:rounded-xl shadow-lg"
                    draggable={false}
                  />

                  {/* Label Badge */}
                  <div
                    className={`absolute -top-2 sm:-top-3 
                                ${card.labelPosition === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5"}
                                px-2 sm:px-3 py-0.5 sm:py-1 
                                bg-gradient-to-r ${card.labelGradient} 
                                text-white text-[8px] sm:text-[10px] md:text-xs 
                                font-semibold rounded-full shadow-lg whitespace-nowrap
                                transition-all duration-700`}
                  >
                    {card.label}
                  </div>

                  {/* Front indicator dot */}
                  {frontIndex === index && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}

              {/* ===== INVISIBLE SPACER ===== */}
              <div className="invisible">
                <div className="p-1.5 sm:p-2 md:p-3 lg:p-4">
                  <img
                    src={CARDS[0].image}
                    alt=""
                    className="w-full h-auto"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* ===== CARD INDICATORS ===== */}
            <div className="absolute -bottom-4 sm:-bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 z-50">
              {CARDS.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => goToCard(idx)}
                  className={`group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full 
                             transition-all duration-500 backdrop-blur-md border
                             ${
                               idx === frontIndex
                                 ? "bg-white/25 border-white/40 shadow-lg scale-105"
                                 : "bg-white/10 border-white/15 hover:bg-white/20 hover:border-white/30"
                             }`}
                  aria-label={`Show ${card.label}`}
                >
                  <div
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500
                               ${
                                 idx === frontIndex
                                   ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                                   : "bg-white/40 group-hover:bg-white/70"
                               }`}
                  ></div>
                  <span
                    className={`hidden sm:inline text-[8px] sm:text-[10px] font-medium transition-all duration-500
                               ${
                                 idx === frontIndex
                                   ? "text-white"
                                   : "text-white/50 group-hover:text-white/80"
                               }`}
                  >
                    {card.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ERPShowcase;
