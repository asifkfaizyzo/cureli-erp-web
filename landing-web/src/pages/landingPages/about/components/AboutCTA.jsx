// landing-web/src/pages/landingPages/about/components/AboutCTA.jsx (do not remove this comment)
import React, { useEffect } from "react";
import AOS from "aos";
import { Link } from "react-router-dom";

import CommitIcon from "../../../../assets/icons/commited.png";
import TrustIcon from "../../../../assets/icons/trust.png";
import TransparentIcon from "../../../../assets/icons/transparent.png";
import QualityIcon from "../../../../assets/icons/quality.png";
import PeopleIllustration from "../../../../assets/images/people.png";

const values = [
  { img: CommitIcon, title: "Committed", desc: "we are commited to delivering seamless technology,responsive, support and improvements that help pharmacies operate efficiently." },
  { img: TrustIcon, title: "Trust", desc: "We earn trust through transparency, security, and reliability, empowering pharmacies to safeguard data and deliver accurate care." },
  { img: TransparentIcon, title: "Transparent", desc: "We provide transparent, clear processes and honest communication, empowering pharmacies with predictable solutions for confident, informed decisions." },
  { img: QualityIcon, title: "Quality", desc: "We deliver uncompromising quality through rigorous standards, reliable performance, and continuous improvement, enhancing pharmacy accuracy and workflows." },
];

const AboutSectionCombined = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <>
      {/* Core Values Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-7xl mx-auto">
    
    {/* Header */}
    <div className="text-center mb-10 sm:mb-12 md:mb-16">
      <h2 
        className="font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#05015A] mb-2 sm:mb-3" 
        data-aos="fade-up"
      >
        Our Core Values
      </h2>
      <p 
        className="font-manrope text-sm sm:text-base md:text-lg text-gray-500 mt-2 px-4" 
        data-aos="fade-up" 
        data-aos-delay="100"
      >
        Where Strong Values Create Stronger Solutions
      </p>
    </div>

    {/* Values Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="group bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 md:p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
          data-aos="fade-up"
          data-aos-delay={i * 100}
        >
          {/* Icon */}
          <div className="mb-4 sm:mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-start">
              <img 
                src={v.img} 
                alt={v.title}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" 
              />
            </div>
          </div>

          {/* Title */}
          <h3 className="font-manrope text-lg sm:text-xl md:text-2xl font-bold text-[#05015A] mb-2 sm:mb-3 leading-tight">
            {v.title}
          </h3>

          {/* Description */}
          <p className="font-manrope text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
            {v.desc}
          </p>
        </div>
      ))}
    </div>

  </div>
</section>


      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
  <div
    className="max-w-7xl mx-auto bg-white border-2 border-gray-200 rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden"
    data-aos="fade-up"
  >
    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-8 lg:gap-12">
      
      {/* Left: Content */}
      <div className="flex-1 text-center lg:text-left">
        <h2 className="font-manrope text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#05015A] mb-3 sm:mb-4 leading-tight">
          Get Started with Cureli Today !
        </h2>
        
        <p className="font-manrope text-sm sm:text-base md:text-lg text-gray-500 mb-4 sm:mb-5 md:mb-6 leading-relaxed max-w-2xl mx-auto lg:mx-0">
          Join us in our mission to revolutionize healthcare management. Contact our team 
          today to explore the Cureli suite and experience a new era of healthcare 
          efficiency and patient safety.
        </p>
        
        <p className="font-manrope text-sm sm:text-base md:text-lg text-gray-500 mb-6 sm:mb-7 md:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
          Contact us for a demo to streamline operations, improve patient care, and 
          support.
        </p>

        <Link
          to="/contact"
          className="inline-block px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 md:py-3.5 bg-[#05015A] text-white rounded-lg font-manrope font-semibold text-sm sm:text-base hover:bg-[#030139] transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Book a Demo
        </Link>
      </div>

      {/* Right: Illustration */}
      <div className="flex-shrink-0 w-full lg:w-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <img
          src={PeopleIllustration}
          alt="Team Illustration"
          className="w-full h-auto object-contain"
          data-aos="fade-left"
          data-aos-delay="200"
        />
      </div>

    </div>
  </div>
</section>
    </>
  );
};

export default AboutSectionCombined;
