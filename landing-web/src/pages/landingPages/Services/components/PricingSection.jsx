// landing-web/src/pages/landingPages/Services/components/PricingSection.jsx (do not remove this comment)

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { CircleCheck } from "lucide-react";

import { fetchPublicPlans } from "../../../../api/plans";
import PlanCard from "./PlanCard";
import CustomPlanCard from "./CustomPlanCard";

// ============================================
// SKELETON CARD
// ============================================

const SkeletonCard = ({ index }) => (
  <div
    data-aos="fade-up"
    data-aos-delay={index * 75}
    className="rounded-2xl bg-white border-2 border-gray-200 p-5 sm:p-6 animate-pulse"
  >
    <div className="h-4 w-24 bg-gray-200 rounded-full mx-auto mb-5" />
    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
    <div className="h-3 w-full bg-gray-100 rounded mb-1" />
    <div className="h-3 w-2/3 bg-gray-100 rounded mb-5" />
    <div className="h-10 w-1/2 bg-gray-200 rounded mb-1" />
    <div className="h-3 w-1/3 bg-gray-100 rounded mb-5" />
    <div className="flex gap-4 mb-4">
      <div className="h-3 w-16 bg-gray-100 rounded" />
      <div className="h-3 w-16 bg-gray-100 rounded" />
    </div>
    <div className="h-px bg-gray-100 mb-4" />
    <div className="space-y-2.5 mb-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 bg-gray-100 rounded w-full" />
      ))}
    </div>
    <div className="h-10 bg-gray-200 rounded-xl" />
  </div>
);

// ============================================
// ERROR STATE CARD
// ============================================

const ErrorStateCard = ({ index }) => (
  <div
    data-aos="fade-up"
    data-aos-delay={index * 75}
    className="rounded-2xl bg-white border-2 border-dashed border-gray-300
               p-5 sm:p-6 flex flex-col items-center justify-center
               min-h-[320px] text-center gap-2"
  >
    <span className="text-3xl">😬</span>
    <p className="text-sm font-medium text-gray-500">Uh oh!</p>
    <p className="text-xs text-gray-400">Couldn't load this plan right now.</p>
  </div>
);

// ============================================
// PERKS DATA
// ============================================

const PERKS = [
  "Switch plans at any time",
  "No credit card needed to start",
  "Cancel at any time without penalty",
];

const PLACEHOLDER_COUNT = 3;

// ============================================
// GRID CLASS HELPER
// ============================================

const getGridClass = (totalCards) => {
  if (totalCards >= 4)
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6";

  if (totalCards === 3)
    return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 lg:max-w-5xl lg:mx-auto";

  if (totalCards === 2)
    return "grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6 max-w-2xl mx-auto";

  return "grid grid-cols-1 gap-5 max-w-sm mx-auto";
};

// ============================================
// MAIN SECTION
// ============================================

const PricingSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: "ease-out-cubic" });
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchPublicPlans()
      .then((data) => {
        if (!cancelled) {
          setPlans(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalCards = plans.length + 1;

  return (
    <section className="w-full bg-[#F5F7FA] py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ======================================== */}
        {/* HEADER */}
        {/* ======================================== */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h2
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold
           text-[#05015A] max-w-4xl mx-auto leading-tight"
            data-aos="fade-up"
          >
            Transparent Pricing for Every Stage of Your Pharmacy's Growth
          </h2>

          <p
            className="mt-4 text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="50"
          >
            From a single branch starting out to a multi-branch chain — all
            plans include full access to our core features.
          </p>

          {/* Perks */}
          <div
            className="flex flex-col sm:flex-row justify-center items-center
                       gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {PERKS.map((perk, i) => (
              <div
                key={i}
                className="group/perk flex items-center gap-2 px-4 py-2
           rounded-full bg-white hover:bg-gray-50
           border border-gray-200 hover:border-[#05015A]/20
           transition-all duration-300 cursor-default"
              >
                <CircleCheck
                  size={16}
                  className="text-emerald-500 flex-shrink-0
                             group-hover/perk:scale-110 transition-transform duration-300"
                />
                <span
                  className="text-xs sm:text-sm font-medium text-gray-600
           group-hover/perk:text-[#05015A] transition-colors duration-300"
                >
                  {perk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================== */}
        {/* CARDS */}
        {/* ======================================== */}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
            <SkeletonCard key="custom-skel" index={PLACEHOLDER_COUNT} />
          </div>
        )}

        {/* Error */}
        {!loading && failed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
              <ErrorStateCard key={i} index={i} />
            ))}
            <CustomPlanCard index={PLACEHOLDER_COUNT} />
          </div>
        )}

        {/* Live */}
        {!loading && !failed && (
          <div className={getGridClass(totalCards)}>
            {plans.map((plan, i) => (
              <PlanCard key={plan.plan_id} plan={plan} index={i} />
            ))}
            <CustomPlanCard index={plans.length} />
          </div>
        )}

        {/* ======================================== */}
        {/* BOTTOM NOTE */}
        {/* ======================================== */}
        <p
          className="text-center text-xs text-gray-500 mt-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          All plans include a 14-day free trial.{" "}
          <a
            href="/contact"
            className="text-[#05015A] font-medium  hover:underline"
          >
            Need help choosing?
          </a>
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
