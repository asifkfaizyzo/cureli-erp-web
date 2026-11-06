// landing-web/src/pages/landingPages/Services/components/CustomPlanCard.jsx (do not remove this comment)

import { useNavigate } from "react-router-dom";
import {
  Check,
  Users,
  Building2,
  Sparkles,
  Mail,
} from "lucide-react";
import { CARD_THEMES } from "../../../../config/planConfig";

const CUSTOM_FEATURES = [
  "Unlimited Users & Branches",
  "Priority 24/7 Support",
  "Custom Integrations",
  "Dedicated Account Manager",
];

const CustomPlanCard = ({ index }) => {
  const navigate = useNavigate();
  const theme = CARD_THEMES.custom;

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 75}
      className={`
        group relative rounded-2xl text-left
        transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        hover:-translate-y-1.5
        ${theme.bg} border-2 ${theme.border}
        hover:shadow-xl hover:shadow-amber-100/50
      `}
    >
      {/* ── Hover overlay ── */}
      <div
        className={`
          absolute inset-0 rounded-[14px] overflow-hidden
          bg-gradient-to-b ${theme.hoverGradient}
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-out pointer-events-none
        `}
      />

      {/* ── Badge ── */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div
          className={`
            whitespace-nowrap flex items-center gap-1.5
            px-3 py-1 text-white text-[10px] font-bold
            rounded-full shadow-lg uppercase tracking-wider
            ${theme.badgeBg}
          `}
        >
          <Sparkles size={10} />
          TAILORED FOR YOU
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-full p-5 sm:p-6 pt-6">

        <h3 className="text-lg font-bold text-gray-900 group-hover:text-white
                       transition-colors duration-300 mb-1">
          Custom Plan
        </h3>

        <p className="text-xs text-gray-500 group-hover:text-white/70
                      transition-colors duration-300 mb-4 leading-relaxed">
          Need something specific? We'll build a plan around your pharmacy.
        </p>

        {/* Price */}
        <div className="mb-4">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight
                           text-amber-600 group-hover:text-white
                           transition-colors duration-300">
            Custom
          </span>
          <div className="mt-1 min-h-[16px]">
            <p className="text-[11px] text-gray-400 group-hover:text-white/50
                          transition-colors duration-300">
              Based on your requirements
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="flex gap-4 text-xs font-medium text-gray-600
                        group-hover:text-white/80 transition-colors duration-300 mb-4">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-gray-400 group-hover:text-white/50
                                        transition-colors duration-300" />
            <span>Flexible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-gray-400 group-hover:text-white/50
                                            transition-colors duration-300" />
            <span>Flexible</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-100 group-hover:bg-white/20
                        transition-colors duration-300 mb-4" />

        {/* Features */}
        <ul className="space-y-2.5 mb-5 flex-1">
          {CUSTOM_FEATURES.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs">
              <Check
                size={14}
                strokeWidth={2.5}
                className={`flex-shrink-0 mt-0.5 transition-colors duration-300
                            ${theme.checkColor} ${theme.checkHover}`}
              />
              <span className="text-gray-600 group-hover:text-white/80
                               leading-tight transition-colors duration-300">
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
        <button
          onClick={() => navigate("/contact")}
          className={`
            w-full py-2.5 rounded-xl text-sm font-semibold text-center
            transition-colors duration-300
            hover:scale-[1.03] active:scale-[0.98]
            shadow-sm flex items-center justify-center gap-2
            bg-amber-600 text-white
            group-hover:bg-white group-hover:text-amber-600
          `}
        >
          <Mail size={14} />
          Contact Sales
        </button>
      </div>
    </div>
  );
};

export default CustomPlanCard;