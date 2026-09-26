// pharmacy-web/src/pages/plan-selection/comps/CustomPlanCard.jsx (do not remove this comment)
// pharmacy-web/src/pages/plan-selection/comps/CustomPlanCard.jsx

import { motion } from "framer-motion";
import { Users, Building2, Check, Sparkles, Mail } from "lucide-react";
import { CARD_THEMES } from "../../../config/planConfig";

export default function CustomPlanCard() {
  const theme = CARD_THEMES.custom;

  const features = [
    "Unlimited Users & Branches",
    "Priority 24/7 Support",
    "Custom Integrations",
    "Dedicated Account Manager",
  ];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col rounded-2xl
                 w-[260px] min-h-[380px] flex-shrink-0"
    >
      {/* ── Base ── */}
      <div
        className={`absolute inset-0 rounded-2xl bg-white border-2 shadow-md
                    transition-shadow duration-300 group-hover:shadow-xl
                    ${theme.borderAccent}`}
      />

      {/* ── Hover overlay ── */}
      <div
        className={`absolute inset-0 rounded-2xl overflow-hidden
                    bg-gradient-to-b ${theme.hoverGradient}
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300 ease-out pointer-events-none`}
      />

      {/* ── Badge ── */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
        <div
          className={`whitespace-nowrap flex items-center gap-1.5
                      px-3 py-1 text-white text-[10px] font-bold
                      rounded-full shadow-lg uppercase tracking-wider
                      ${theme.badgeBg}`}
        >
          <Sparkles size={10} />
          TAILORED FOR YOU
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col p-5 pt-7">
        <h2
          className="text-lg font-bold text-center text-gray-800
                       group-hover:text-white transition-colors duration-300 mb-1"
        >
          Custom Plan
        </h2>

        <p
          className="text-xs text-center text-gray-600 group-hover:text-white/80
                      transition-colors duration-300 min-h-[32px] mb-3"
        >
          Need something specific? We'll tailor a plan for your business.
        </p>

        <div className="flex flex-col items-center mb-3">
          <span
            className="text-3xl font-extrabold tracking-tight text-amber-600
                           group-hover:text-white transition-colors duration-300"
          >
            Custom
          </span>
          <p
            className="text-[11px] text-gray-400 group-hover:text-white/50
                        transition-colors duration-300 mt-1"
          >
            Based on your requirements
          </p>
        </div>

        <div
          className="flex justify-center gap-6 mb-3 text-xs text-gray-600
                        group-hover:text-white/80 transition-colors duration-300"
        >
          <div className="flex items-center gap-1.5">
            <Users
              size={14}
              className="text-gray-400 group-hover:text-white/50
                                        transition-colors duration-300"
            />
            <span>Flexible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2
              size={14}
              className="text-gray-400 group-hover:text-white/50
                                            transition-colors duration-300"
            />
            <span>Flexible</span>
          </div>
        </div>

        <div
          className="h-px w-full bg-gray-200 group-hover:bg-white/20
                        transition-colors duration-300 mb-3"
        />

        <ul className="space-y-2 flex-1 mb-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <Check
                size={13}
                strokeWidth={2.5}
                className="flex-shrink-0 mt-0.5 text-amber-500
                           group-hover:text-amber-300 transition-colors duration-300"
              />
              <span
                className="leading-tight text-gray-700 group-hover:text-white/90
                               transition-colors duration-300"
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* ── CTA Button ── */}
        {/*
          Default:    amber bg + white text
          Card hover: white bg + amber text
          Self-hover: scale only
        */}
        <a
          href="mailto:info@cureliofficial.com?subject=Custom%20Plan%20Inquiry"
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-center
                     transition-colors duration-300
                     hover:scale-[1.03] active:scale-[0.98]
                     shadow-sm flex items-center justify-center gap-2
                     bg-amber-600 text-white
                     group-hover:bg-white group-hover:text-amber-600"
        >
          <Mail size={14} />
          Contact Sales
        </a>
      </div>
    </motion.div>
  );
}
