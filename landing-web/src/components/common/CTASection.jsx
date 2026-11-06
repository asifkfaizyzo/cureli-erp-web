// landing-web/src/components/common/CTASection.jsx (do not remove this comment)

import { Link } from "react-router-dom";
import ctaLogo from "../../assets/icons/curelinew copy.svg";

const CTASection = () => {
  return (
    <section className="py-16 xs:py-20 sm:py-24 bg-white px-4 xs:px-5 sm:px-6">
      {/* Gradient Card */}
      <div className="max-w-7xl mx-auto rounded-2xl xs:rounded-3xl px-6 xs:px-8 sm:px-10 md:px-12 py-10 xs:py-12 sm:py-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10 text-white relative overflow-hidden bg-gradient-to-l from-[#00004B] to-[#879AF0]">
        
        {/* LEFT CONTENT */}
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-2xl xs:text-3xl sm:text-3xl md:text-4xl font-semibold leading-snug mb-3 xs:mb-4">
            Ready to Transform Your Pharmacy Operations?
          </h2>

          <p className="text-white/80 mb-5 xs:mb-6 text-sm xs:text-base">
            Join over 100 pharmacies already running smarter with Cureli. Go live with your branded medicine ordering and ERP system in as little as 24 hours – no technical background required.
          </p>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 border border-white px-5 xs:px-6 py-2.5 xs:py-3 rounded-lg hover:bg-white hover:text-[#00004B] transition-all duration-300 text-sm xs:text-base font-medium"
          >
            Get Started
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

        {/* RIGHT LOGO */}
        <div className="hidden md:flex items-center justify-center">
          <img
            src={ctaLogo}
            alt="Medical Logo"
            className="w-[150px] lg:w-[200px] opacity-60"
          />
        </div>
      </div>
    </section>
  );
};

export default CTASection;